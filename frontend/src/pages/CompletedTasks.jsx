import { useGame } from '../context/GameContext';
import BackButton from '../components/BackButton';
import './pages.css';
import './CompletedTasks.css';

const CompletedTasks = () => {
  const { completedQuests } = useGame();

  return (
    <div className="page-container">
      <BackButton destination="landing" />
      <h1 className="page-title">Completed Quests</h1>

      <div className="completed-tasks-content">
        {completedQuests.length === 0 ? (
          <div className="empty-state">
            <p>No completed quests yet!</p>
            <p>Complete quests to see them here.</p>
          </div>
        ) : (
          <div className="completed-tasks-list">
            {completedQuests.map((quest, index) => (
              <div key={`${quest.id}-${index}`} className="completed-task-card">
                <div className="completed-task-header">
                  <h3>{quest.description}</h3>
                  <span className="task-category">{quest.category}</span>
                </div>
                <div className="completed-task-info">
                  <p><strong>Reward Earned:</strong> {quest.coinReward} coins</p>
                  <p><strong>Completed:</strong> {new Date(quest.completedAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedTasks;
