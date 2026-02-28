import { useGame } from '../context/GameContext';
import './pages.css';
import './CompletedTasks.css';

const CompletedTasks = () => {
  const { navigateTo, completedQuests } = useGame();

  return (
    <div className="page-container">
      <button className="back-button" onClick={() => navigateTo('landing')}>
        <div className="back-icon">🐜</div>
        <span>Back</span>
      </button>

      <h1 className="page-title">Completed Tasks</h1>

      <div className="completed-tasks-content">
        {completedQuests.length === 0 ? (
          <div className="empty-state">
            <p>No completed tasks yet!</p>
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
                {quest.imageUrl && (
                  <div className="completed-task-image">
                    <img src={quest.imageUrl} alt="Quest completion proof" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompletedTasks;
