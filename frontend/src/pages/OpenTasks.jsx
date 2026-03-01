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
          setError('Failed to load initial tasks');
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
      setError(err.message ?? 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptQuest = (quest) => {
    acceptQuest(quest);
  };

  return (
    <div className="page-container">
      <BackButton destination="landing" />
      <h1 className="page-title">Tasks</h1>

      {error && (
        <div className="tasks-error">
          <p>{error}</p>
          <p className="tasks-error-hint">Showing fallback tasks. You can retry for new AI-generated tasks.</p>
          <button type="button" className="retry-button" onClick={handleRetry} disabled={loading}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="tasks-loading">
          <p className="tasks-loading-text">Loading tasks</p>
          <span className="loading-dots" aria-hidden="true">
            <span className="loading-dot" />
            <span className="loading-dot" />
            <span className="loading-dot" />
          </span>
        </div>
      ) : (
      <div className="tasks-grid">
        {availableQuests.map((quest, index) => (
          <div key={quest.id} className="task-card">
            <div className="task-header">
              <h3>Task {index + 1}</h3>
              <span className="task-category">{quest.category}</span>
            </div>
            <button 
              className="accept-button"
              onClick={() => handleAcceptQuest(quest)}
            >
              Accept Task
            </button>
          </div>
        ))}
      </div>
      )}
    </div>
  );
};

export default OpenTasks;
