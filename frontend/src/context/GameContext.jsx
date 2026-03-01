import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getRandomQuests, refreshQuests, getFallbackQuests } from '../data/quests';
import { getRandomShopItems } from '../data/outfits';
import {
  fetchGameState,
  saveCompletedQuest,
  persistPurchaseOutfit,
  persistEquipOutfit,
  persistRerollShop,
} from '../lib/gameState';

const GameContext = createContext();

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

const getDefaultGameState = (ownedOutfits = []) => ({
  currentPage: 'landing',
  coins: 0,
  completedQuests: [],
  activeQuest: null,
  ownedOutfits: [...ownedOutfits],
  equippedOutfits: {},
  shopInventory: getRandomShopItems(3, ownedOutfits),
  questStartTime: null,
  uploadedImage: null,
  availableQuests: [],
  openTasksInitialized: false,
});

export const GameProvider = ({ children, supabaseUser = null, signOut: supabaseSignOut = null }) => {
  const loadAuthState = () => {
    if (supabaseUser) {
      return {
        isLoggedIn: true,
        currentUser: { email: supabaseUser.email, id: supabaseUser.id },
      };
    }
    return { isLoggedIn: false, currentUser: null };
  };

  const [auth, setAuth] = useState(loadAuthState);
  const [state, setState] = useState(() => ({
    ...getDefaultGameState(),
    gameStateLoading: true,
  }));
  const [toast, setToast] = useState(null);
  const fetchedUserIdRef = useRef(null);

  // Keep auth in sync when supabaseUser is passed
  useEffect(() => {
    if (supabaseUser) {
      setAuth({
        isLoggedIn: true,
        currentUser: { email: supabaseUser.email, id: supabaseUser.id },
      });
    }
  }, [supabaseUser?.id]);

  // Load game state from Supabase when user is present (single fetch per user; refetch when userId changes)
  useEffect(() => {
    const userId = supabaseUser?.id;
    if (!userId) {
      setState((prev) => ({ ...prev, gameStateLoading: false }));
      return;
    }
    if (fetchedUserIdRef.current === userId) return;
    fetchedUserIdRef.current = userId;



        setState((prev) => ({ ...prev, gameStateLoading: true }));

    fetchGameState(userId)
      .then(({ coins, ownedOutfits, equippedOutfits, completedQuests }) => {
        setState((prev) => ({
          ...prev,
          coins,
          ownedOutfits,
          equippedOutfits,
          completedQuests,
          shopInventory: getRandomShopItems(3, ownedOutfits),
          gameStateLoading: false,
        }));
      })
      .catch((err) => {
        console.error('Failed to load game state:', err);
        setState((prev) => ({
          ...getDefaultGameState(),
          ...prev,
          gameStateLoading: false,
        }));
      });
  }, [supabaseUser?.id]);

  // Reset fetched ref when user logs out so next login fetches again
  useEffect(() => {
    if (!supabaseUser) fetchedUserIdRef.current = null;
  }, [supabaseUser]);

  const logout = () => {
    if (supabaseSignOut) supabaseSignOut();
    setAuth({ isLoggedIn: false, currentUser: null });
    setState((prev) => ({ ...getDefaultGameState(), currentPage: 'landing', gameStateLoading: false }));
  };

  const navigateTo = (page) => {
    setState((prev) => ({ ...prev, currentPage: page }));
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const hideToast = () => setToast(null);

  const acceptQuest = (quest) => {
    setState((prev) => ({
      ...prev,
      activeQuest: quest,
      questStartTime: Date.now(),
      uploadedImage: null,
      currentPage: 'proof',
    }));
  };

  const refreshAvailableQuests = async () => {
    try {
      await refreshQuests();
      setState(prev => {
        const completedIds = (prev.completedQuests || []).map(q => q.id);
        const randomQuests = getRandomQuests(3, completedIds);
        return {
          ...prev,
          availableQuests: randomQuests,
          openTasksInitialized: true,
          activeQuest: null,
          questStartTime: null,
        };
      });
    } catch (error) {
      console.error('Error refreshing quests:', error);
      setState(prev => {
        const completedIds = (prev.completedQuests || []).map(q => q.id);
        const fallbackQuests = getFallbackQuests(completedIds);
        return {
          ...prev,
          availableQuests: fallbackQuests,
          openTasksInitialized: true,
          activeQuest: null,
          questStartTime: null,
        };
      });
    }
  };

  const completeQuest = async () => {
    const userId = auth.currentUser?.id;
    const activeQuest = state.activeQuest;
    if (!activeQuest) return;

    const coinsEarned = activeQuest.coinReward;
    const imageDataUrl = state.uploadedImage;

    if (userId) {
      try {
        const newRow = await saveCompletedQuest(
          userId,
          coinsEarned,
          {
            id: activeQuest.id,
            description: activeQuest.description,
            category: activeQuest.category,
            timeLimit: activeQuest.timeLimit,
            coinReward: activeQuest.coinReward,
          },
          null
        );
        setState((prev) => ({
          ...prev,
          coins: prev.coins + coinsEarned,
          completedQuests: [newRow, ...prev.completedQuests],
          activeQuest: null,
          questStartTime: null,
          uploadedImage: null,
          currentPage: 'landing',
        }));
        refreshAvailableQuests();
        setTimeout(() => showToast(`Side quest completed! +${coinsEarned} coins earned`, 'success'), 100);
      } catch (err) {
        console.error('Failed to save completed quest:', err);
        showToast(err?.message || 'Failed to save. Try again.', 'error');
      }
      return;
    }

    const newCompletedQuest = {
      ...activeQuest,
      id: crypto.randomUUID?.() ?? `local-${Date.now()}`,
      completedAt: new Date().toISOString(),
      imageUrl: imageDataUrl,
    };
    setState((prev) => ({
      ...prev,
      coins: prev.coins + coinsEarned,
      completedQuests: [newCompletedQuest, ...prev.completedQuests],
      activeQuest: null,
      questStartTime: null,
      uploadedImage: null,
      currentPage: 'landing',
    }));
    refreshAvailableQuests();
    setTimeout(() => showToast(`Side quest completed! +${coinsEarned} coins earned`, 'success'), 100);
  };

  const setUploadedImage = (imageDataUrl) => {
    setState((prev) => ({ ...prev, uploadedImage: imageDataUrl }));
  };

  const purchaseOutfit = (outfit) => {
    if (state.coins < outfit.cost) {
      alert('Not enough coins!');
      return false;
    }
    if (state.ownedOutfits.includes(outfit.id)) {
      alert('You already own this outfit!');
      return false;
    }

    const userId = auth.currentUser?.id;
    if (userId) {
      try {
        persistPurchaseOutfit(userId, outfit.id, outfit.cost, state.coins, state.ownedOutfits);
      } catch (err) {
        console.error('Failed to purchase outfit:', err);
        showToast(err?.message || 'Purchase failed. Try again.', 'error');
        return false;
      }
    }

    setState((prev) => ({
      ...prev,
      coins: prev.coins - outfit.cost,
      ownedOutfits: [...prev.ownedOutfits, outfit.id],
      shopInventory: prev.shopInventory.filter((item) => item.id !== outfit.id),
    }));
    return true;
  };

  const equipOutfit = (outfit) => {
    const userId = auth.currentUser?.id;
    const nextSelected = state.equippedOutfits?.selected === outfit.id ? null : outfit.id;

    if (userId) {
      try {
        persistEquipOutfit(userId, nextSelected);
      } catch (err) {
        console.error('Failed to equip outfit:', err);
        showToast(err?.message || 'Failed to equip.', 'error');
        return;
      }
    }

    setState((prev) => ({
      ...prev,
      equippedOutfits: nextSelected != null ? { selected: nextSelected } : {},
    }));
  };

  const rerollShop = () => {
    if (state.coins < 2) {
      alert('Not enough coins! Reroll costs 2 coins.');
      return false;
    }

    const userId = auth.currentUser?.id;
    if (userId) {
      try {
        persistRerollShop(userId, state.coins);
      } catch (err) {
        console.error('Failed to reroll shop:', err);
        showToast(err?.message || 'Reroll failed. Try again.', 'error');
        return false;
      }
    }

    const newInventory = getRandomShopItems(3, state.ownedOutfits);
    setState((prev) => ({
      ...prev,
      coins: prev.coins - 2,
      shopInventory: newInventory,
    }));
    return true;
  };

  const value = {
    isLoggedIn: auth.isLoggedIn,
    currentUser: auth.currentUser,
    currentPage: state.currentPage,
    coins: state.coins,
    completedQuests: state.completedQuests,
    activeQuest: state.activeQuest,
    ownedOutfits: state.ownedOutfits,
    equippedOutfits: state.equippedOutfits,
    shopInventory: state.shopInventory,
    questStartTime: state.questStartTime,
    uploadedImage: state.uploadedImage,
    gameStateLoading: state.gameStateLoading ?? false,
    availableQuests: state.availableQuests,
    openTasksInitialized: state.openTasksInitialized,
    toast,
    login: () => ({ success: false, error: 'Use the login page.' }),
    signup: () => ({ success: false, error: 'Use the signup page.' }),
    logout,
    navigateTo,
    acceptQuest,
    completeQuest,
    setUploadedImage,
    purchaseOutfit,
    equipOutfit,
    rerollShop,
    showToast,
    hideToast,
    refreshAvailableQuests,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
