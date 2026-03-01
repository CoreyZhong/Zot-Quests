import { useGame } from '../context/GameContext';
import { useState, useEffect } from 'react';
import BackButton from '../components/BackButton';
import './pages.css';
import './OpenTasks.css';

const OpenTasks = () => {
  const { availableQuests, openTasksInitialized, refreshAvailableQuests, acceptQuest } = useGame();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize available quests on first mount
  useEffect(() => {
    if (!openTasksInitialized) {
      setLoading(true);
      setError(null);
      refreshAvailableQuests()
        .catch(() => {
          setError('Failed to load initial quests');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [openTasksInitialized, refreshAvailableQuests]);

  const handleRetry = async () => {
    setLoading(true);
    setError(null);
    try {
      await refreshAvailableQuests();
    } catch (err) {
      setError(err.message ?? 'Failed to load quests');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuest = (quest) => {
    acceptQuest(quest);
  };

  // Sort quests by difficulty: easy, medium, hard
  const sortedQuests = [...availableQuests].sort((a, b) => {
    const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
    return (difficultyOrder[a.category] || 99) - (difficultyOrder[b.category] || 99);
  });

  return (
    <div className="page-container">
      <BackButton destination="landing" />
      <h1 className="page-title">Quests</h1>

      {error && (
        <div className="tasks-error">
          <p>{error}</p>
          <p className="tasks-error-hint">Showing fallback quests. You can retry for new AI-generated quests.</p>
          <button type="button" className="retry-button" onClick={handleRetry} disabled={loading}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="tasks-loading">
          <p className="tasks-loading-text">Loading quests</p>
          <span className="loading-dots" aria-hidden="true">
            <span className="loading-dot" />
            <span className="loading-dot" />
            <span className="loading-dot" />
          </span>
        </div>
      ) : (
      <div className="tasks-grid">
        {sortedQuests.map((quest, index) => (
          <div key={quest.id} className="task-card">
            <div className="task-header">
              <h3>Quest {index + 1}</h3>
              <span className="task-category">{quest.category}</span>
            </div>
            <button 
              className="accept-button"
              onClick={() => handleAcceptQuest(quest)}
            >
              Accept Quest
            </button>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

export default OpenTasks;
