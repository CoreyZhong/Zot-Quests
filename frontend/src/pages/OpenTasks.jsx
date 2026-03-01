import { useGame } from '../context/GameContext';
import { getRandomQuests, getFallbackQuests, refreshQuests } from '../data/quests';
import { useState, useEffect, useCallback, useRef } from 'react';
import BackButton from '../components/BackButton';
import './pages.css';
import './OpenTasks.css';

const OpenTasks = () => {
  const { acceptQuest, completedQuests } = useGame();
  const [availableQuests, setAvailableQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const completedQuestsRef = useRef(completedQuests);
  completedQuestsRef.current = completedQuests;

  const loadQuests = useCallback(async () => {
    setLoading(true);
    setError(null);
    const completedIds = (completedQuestsRef.current || []).map(q => q.id);
    try {
      await refreshQuests();
      setAvailableQuests(getRandomQuests(3, completedIds));
    } catch (err) {
      setError(err.message ?? 'Failed to load tasks');
      setAvailableQuests(getFallbackQuests(completedIds));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const completedIds = (completedQuestsRef.current || []).map(q => q.id);
    setAvailableQuests(getFallbackQuests(completedIds));
    setLoading(true);
    setError(null);
    refreshQuests()
      .then(() => {
        if (!cancelled) setAvailableQuests(getRandomQuests(3, completedIds));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message ?? 'Failed to load tasks');
          setAvailableQuests(getFallbackQuests(completedIds));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

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
          <button type="button" className="retry-button" onClick={loadQuests} disabled={loading}>
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
