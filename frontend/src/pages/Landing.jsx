import { useGame } from '../context/GameContext';
import petrLogo from '../assets/petr.png';
import exitIcon from '../assets/exit_icon.png';
import './pages.css';
import './Landing.css';

const Landing = () => {
  const { navigateTo, logout } = useGame();

  return (
    <div className="landing-page">
      <div className="landing-content">
        <div className="landing-left">
          <div className="title-section">
            <h1 className="title-zot">Zot</h1>
            <h1 className="title-quests">Quests</h1>
          </div>
          <div className="anteater-mascot">
            <img src={petrLogo} alt="Petr the Anteater" className="petr-logo" />
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
            <img src={petrLogo} alt="" className="button-icon-img" />
            <span>Petr Collection</span>
          </button>

          <button
            className="nav-button logout-button"
            onClick={logout}
          >
            <img src={exitIcon} alt="Logout" className="button-icon-img" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
