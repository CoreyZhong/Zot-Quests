import { useGame } from '../context/GameContext';
import './pages.css';
import './Landing.css';

const Landing = () => {
  const { navigateTo } = useGame();

  return (
    <div className="landing-page">
      <div className="landing-content">
        <div className="landing-left">
          <div className="title-section">
            <h1 className="title-zot">Zot</h1>
            <h1 className="title-quests">Quests</h1>
          </div>
          <div className="anteater-mascot">
            <div className="anteater-placeholder">
              {/* Placeholder for anteater illustration */}
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle cx="100" cy="100" r="80" fill="#7B9CB5" />
                <circle cx="80" cy="80" r="10" fill="#333" />
                <circle cx="120" cy="80" r="10" fill="#333" />
                <ellipse cx="100" cy="120" rx="20" ry="10" fill="#555" />
              </svg>
            </div>
          </div>
        </div>

        <div className="landing-right">
          <button 
            className="nav-button"
            onClick={() => navigateTo('openTasks')}
          >
            <div className="button-icon">📦</div>
            <span>Open Tasks</span>
          </button>

          <button 
            className="nav-button"
            onClick={() => navigateTo('completedTasks')}
          >
            <div className="button-icon">✓</div>
            <span>Completed Tasks</span>
          </button>

          <button 
            className="nav-button"
            onClick={() => navigateTo('petrCollection')}
          >
            <div className="button-icon">🐾</div>
            <span>Petr Collection</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
