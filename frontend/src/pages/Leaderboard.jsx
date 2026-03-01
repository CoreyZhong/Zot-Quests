import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { fetchLeaderboard } from '../lib/gameState';
import BackButton from '../components/BackButton';
import './pages.css';
import './Leaderboard.css';

const Leaderboard = () => {
  const { showToast } = useGame();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        const data = await fetchLeaderboard(100);
        setLeaderboard(data);
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        showToast('Failed to load leaderboard', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [showToast]);

  return (
    <div className="page-container">
      <BackButton destination="landing" />
      <h1 className="page-title">Zot Quests Leaderboard</h1>

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
          <div className="leaderboard-table">
            <div className="leaderboard-header">
              <div className="leaderboard-rank">Rank</div>
              <div className="leaderboard-username">Player</div>
              <div className="leaderboard-coins">Coins</div>
              <div className="leaderboard-completed">Quests Completed</div>
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
                  <div className="leaderboard-coins">{entry.coins.toLocaleString()}</div>
                  <div className="leaderboard-completed">{entry.completed_count}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
