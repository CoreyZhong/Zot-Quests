import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { fetchLeaderboard } from '../lib/gameState';
import BackButton from '../components/BackButton';
import './pages.css';
import './Leaderboard.css';

const SORT_COINS = 'coins_earned_lifetime';
const SORT_QUESTS = 'completed_count';

const Leaderboard = () => {
  const { showToast } = useGame();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState(SORT_COINS);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await fetchLeaderboard(100, sortBy);
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        showToast('Failed to load leaderboard', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [sortBy, showToast]);

  const isCoins = sortBy === SORT_COINS;
  const valueHeader = isCoins ? 'Coins earned' : 'Quests completed';
  const getValue = (entry) =>
    isCoins ? (entry.coins_earned_lifetime ?? entry.coins ?? 0) : (entry.completed_count ?? 0);
  const formatValue = (v) => (isCoins ? Number(v).toLocaleString() : String(v));

  return (
    <div className="page-container">
      <BackButton destination="landing" />
      <h1 className="page-title">Zot Quests Leaderboard</h1>

      <div className="leaderboard-tabs">
        <button
          type="button"
          className={`leaderboard-tab ${isCoins ? 'leaderboard-tab-active' : ''}`}
          onClick={() => setSortBy(SORT_COINS)}
        >
          Sort by Coins
        </button>
        <button
          type="button"
          className={`leaderboard-tab ${!isCoins ? 'leaderboard-tab-active' : ''}`}
          onClick={() => setSortBy(SORT_QUESTS)}
        >
          Sort by Quests
        </button>
      </div>

      <div className="leaderboard-content">
        {loading ? (
          <div className="loading-state">
            <p>Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="empty-state">
            <p>No players yet!</p>
            <p>Complete quests to appear on the leaderboard.</p>
          </div>
        ) : (
          <div key={sortBy} className="leaderboard-table-fade">
            <div className={`leaderboard-table ${!isCoins ? 'leaderboard-table-quests' : ''}`}>
            <div className="leaderboard-header">
              <div className="leaderboard-rank">Rank</div>
              <div className="leaderboard-username">Player</div>
              <div className="leaderboard-value">{valueHeader}</div>
            </div>
            <div className="leaderboard-rows">
              {leaderboard.map((entry, index) => (
                <div key={entry.id} className="leaderboard-row">
                  <div className="leaderboard-rank">
                    <span className={`rank-badge rank-${index + 1}`}>
                      {index === 0 && '🥇'}
                      {index === 1 && '🥈'}
                      {index === 2 && '🥉'}
                      {index >= 3 && `#${index + 1}`}
                    </span>
                  </div>
                  <div className="leaderboard-username">{entry.username}</div>
                  <div className="leaderboard-value">{formatValue(getValue(entry))}</div>
                </div>
              ))}
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
