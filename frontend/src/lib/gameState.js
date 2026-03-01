/**
 * Supabase persistence for per-user game state.
 * Used by GameContext when a Supabase user is logged in.
 *
 * Leaderboards: query public.leaderboard_view (username, coins, completed_count).
 * Image verification: pass proof_image_path to saveCompletedQuest after uploading
 * the proof image to Supabase Storage and getting the public URL.
 */
import { supabase } from './supabase';

const VALID_OUTFIT_IDS = [1, 2, 3, 4, 5];

function mapRowToGameState(row) {
  if (!row) return null;
  const ownedOutfitIds = Array.isArray(row.owned_outfit_ids) ? row.owned_outfit_ids : [];
  const owned = ownedOutfitIds.filter((id) => typeof id === 'number' && VALID_OUTFIT_IDS.includes(id));
  const rawEquipped = row.equipped_outfit_id != null && VALID_OUTFIT_IDS.includes(row.equipped_outfit_id) ? row.equipped_outfit_id : null;
  const equippedId = rawEquipped != null && owned.includes(rawEquipped) ? rawEquipped : null;
  return {
    coins: typeof row.coins === 'number' ? row.coins : 0,
    ownedOutfits: owned,
    equippedOutfits: equippedId != null ? { selected: equippedId } : {},
  };
}

function mapCompletedRowToQuest(row) {
  return {
    id: row.id,
    quest_id: row.quest_id,
    description: row.description,
    category: row.category,
    timeLimit: row.time_limit,
    coinReward: row.coin_reward,
    completedAt: row.completed_at,
    imageUrl: row.proof_image_path || undefined,
  };
}

/**
 * Fetch game state and completed quests for a user. Upserts default user_game_state if missing.
 * @param {string} userId - auth.users id (uuid)
 * @returns {Promise<{ coins: number, ownedOutfits: number[], equippedOutfits: object, completedQuests: array }>}
 */
export async function fetchGameState(userId) {
  if (!userId) throw new Error('userId is required');

  const [{ data: stateRow, error: stateError }, { data: questRows, error: questError }] = await Promise.all([
    supabase.from('user_game_state').select('coins, coins_earned_lifetime, equipped_outfit_id, owned_outfit_ids').eq('user_id', userId).maybeSingle(),
    supabase.from('completed_quests').select('id, quest_id, description, category, time_limit, coin_reward, completed_at, proof_image_path').eq('user_id', userId).order('completed_at', { ascending: false }),
  ]);

  if (stateError) throw new Error(stateError.message || 'Failed to load game state');
  if (questError) throw new Error(questError.message || 'Failed to load completed quests');

  const partial = mapRowToGameState(stateRow);
  if (!partial) {
    await supabase.from('user_game_state').upsert({ user_id: userId }, { onConflict: 'user_id' });
    const { data: newRow, error: selectErr } = await supabase.from('user_game_state').select('coins, coins_earned_lifetime, equipped_outfit_id, owned_outfit_ids').eq('user_id', userId).single();
    if (selectErr) throw new Error(selectErr.message || 'Failed to load game state');
    const mapped = mapRowToGameState(newRow);
    return {
      ...mapped,
      completedQuests: (questRows || []).map(mapCompletedRowToQuest),
    };
  }

  return {
    ...partial,
    completedQuests: (questRows || []).map(mapCompletedRowToQuest),
  };
}

/**
 * Record a completed quest and add coins. Optionally pass proof_image_path for image verification later.
 * @returns {Promise<object>} the new completed quest in UI shape (id, description, category, timeLimit, coinReward, completedAt, imageUrl)
 */
export async function saveCompletedQuest(userId, coinsToAdd, quest, proofImagePath = null) {
  if (!userId) throw new Error('userId is required');

  const completedAt = new Date().toISOString();
  const { data: inserted, error: insertError } = await supabase
    .from('completed_quests')
    .insert({
      user_id: userId,
      quest_id: quest.id,
      description: quest.description,
      category: quest.category,
      time_limit: quest.timeLimit,
      coin_reward: quest.coinReward,
      completed_at: completedAt,
      proof_image_path: proofImagePath,
    })
    .select('id, quest_id, description, category, time_limit, coin_reward, completed_at, proof_image_path')
    .single();

  if (insertError) throw new Error(insertError.message || 'Failed to save completed quest');

  await addCoins(userId, coinsToAdd);

  return {
    id: inserted.id,
    quest_id: inserted.quest_id,
    description: inserted.description,
    category: inserted.category,
    timeLimit: inserted.time_limit,
    coinReward: inserted.coin_reward,
    completedAt: inserted.completed_at,
    imageUrl: inserted.proof_image_path || undefined,
  };
}

/**
 * Update coins and coins_earned_lifetime after completing a quest.
 * Leaderboard ranks by coins_earned_lifetime so spending doesn't lower rank.
 */
export async function addCoins(userId, coinsToAdd) {
  if (!userId) throw new Error('userId is required');
  const { data: row } = await supabase
    .from('user_game_state')
    .select('coins, coins_earned_lifetime')
    .eq('user_id', userId)
    .single();
  const current = row?.coins ?? 0;
  const currentLifetime = row?.coins_earned_lifetime ?? 0;
  const newCoins = current + coinsToAdd;
  const newLifetime = currentLifetime + coinsToAdd;
  const { error } = await supabase
    .from('user_game_state')
    .update({
      coins: newCoins,
      coins_earned_lifetime: newLifetime,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);
  if (error) throw new Error(error.message || 'Failed to update coins');
}

/**
 * Purchase an outfit: deduct cost and add outfit_id to owned_outfit_ids.
 * @param {string} userId
 * @param {number} outfitId - valid 1-5
 * @param {number} cost
 * @param {number} currentCoins
 * @param {number[]} currentOwnedIds
 */
export async function persistPurchaseOutfit(userId, outfitId, cost, currentCoins, currentOwnedIds) {
  if (!userId) throw new Error('userId is required');
  if (!VALID_OUTFIT_IDS.includes(outfitId)) throw new Error('Invalid outfit id');
  if (currentCoins < cost) throw new Error('Not enough coins');
  if (currentOwnedIds.includes(outfitId)) throw new Error('Already own this outfit');

  const newCoins = currentCoins - cost;
  const newOwned = [...currentOwnedIds, outfitId];

  const { error } = await supabase
    .from('user_game_state')
    .update({ coins: newCoins, owned_outfit_ids: newOwned, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) throw new Error(error.message || 'Failed to purchase outfit');
}

/**
 * Set equipped outfit (or unequip if null).
 * @param {string} userId
 * @param {number|null} outfitId
 */
export async function persistEquipOutfit(userId, outfitId) {
  if (!userId) throw new Error('userId is required');
  if (outfitId != null && !VALID_OUTFIT_IDS.includes(outfitId)) throw new Error('Invalid outfit id');

  const { error } = await supabase
    .from('user_game_state')
    .update({ equipped_outfit_id: outfitId, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) throw new Error(error.message || 'Failed to equip outfit');
}

/**
 * Deduct 2 coins for shop reroll.
 * @param {string} userId
 * @param {number} currentCoins
 */
export async function persistRerollShop(userId, currentCoins) {
  if (!userId) throw new Error('userId is required');
  if (currentCoins < 2) throw new Error('Not enough coins for reroll');

  const { error } = await supabase
    .from('user_game_state')
    .update({ coins: currentCoins - 2, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) throw new Error(error.message || 'Failed to reroll shop');
}

/**
 * Fetch leaderboard with optional sort.
 * @param {number} limit
 * @param {'coins_earned_lifetime'|'completed_count'} sortBy - rank by coins earned (lifetime) or quests completed
 */
export async function fetchLeaderboard(limit = 50, sortBy = 'coins_earned_lifetime') {
  const orderColumn = sortBy === 'completed_count' ? 'completed_count' : 'coins_earned_lifetime';
  const { data, error } = await supabase
    .from('leaderboard_view')
    .select('id, username, coins, coins_earned_lifetime, completed_count')
    .order(orderColumn, { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message || 'Failed to load leaderboard');
  return data ?? [];
}
