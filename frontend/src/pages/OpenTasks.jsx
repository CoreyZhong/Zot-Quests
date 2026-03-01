import { useGame } from '../context/GameContext';
import { useState, useEffect } from 'react';
import BackButton from '../components/BackButton';
import './pages.css';
import './OpenTasks.css';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const OpenTasks = () => {
  const { availableQuests, openTasksInitialized, refreshAvailableQuests, acceptQuest, activeQuest, questStartTime, navigateTo } = useGame();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);

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

  // Live timer for the accepted quest card (uses same start time as ProofOfCompletion so it never resets)
  useEffect(() => {
    if (!activeQuest || !questStartTime) {
      setTimeRemaining(null);
      return;
    }
    const update = () => {
      const elapsed = Math.floor((Date.now() - questStartTime) / 1000);
      const totalSeconds = activeQuest.timeLimit * 60;
      setTimeRemaining(Math.max(0, totalSeconds - elapsed));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [activeQuest, questStartTime]);

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

  // When user has an active quest, show only that one card (centered). Otherwise show all three.
  const sortedQuests = [...availableQuests].sort((a, b) => {
    const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
    return (difficultyOrder[a.category] || 99) - (difficultyOrder[b.category] || 99);
  });
  const displayQuests = activeQuest ? [activeQuest] : sortedQuests;

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
      <div className={`tasks-grid ${activeQuest ? 'tasks-grid-single' : ''}`}>
        {displayQuests.map((quest, index) => {
          const isAccepted = activeQuest && quest.id === activeQuest.id;
          return (
            <div key={quest.id} className={`task-card ${isAccepted ? 'task-card-accepted' : ''}`}>
              <div className="task-header">
                <h3>Task {displayQuests.length === 1 ? 1 : index + 1}</h3>
                <span className="task-category">{quest.category}</span>
              </div>
              {isAccepted ? (
                <>
                  <p className="task-description">{activeQuest.description}</p>
                  <div className="task-meta">
                    <span className="task-timer">Time: {timeRemaining != null ? formatTime(timeRemaining) : '--:--'}</span>
                    <span className="task-coins">{activeQuest.coinReward} coins</span>
                  </div>
                  <button
                    type="button"
                    className="continue-button"
                    onClick={() => navigateTo('proof')}
                  >
                    Continue
                  </button>
                </>
              ) : (
                <button
                  className="accept-button"
                  onClick={() => handleAcceptQuest(quest)}
                >
                  Accept Task
                </button>
              )}
            </div>
          );
        })}
      </div>
      )}

      <div className="refresh-tasks-wrap">
        <button
          type="button"
          className="refresh-tasks-button"
          onClick={handleRetry}
          disabled={loading}
          aria-label="Generate new tasks"
        >
          {loading ? 'Loading…' : 'Refresh tasks'}
        </button>
      </div>
    </div>
  );
};

export default OpenTasks;
