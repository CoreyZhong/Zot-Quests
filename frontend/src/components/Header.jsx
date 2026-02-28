import { useGame } from '../context/GameContext';
import petrLogo from '../assets/petr.png';
import './Header.css';

const Header = () => {
  const { navigateTo, currentPage, logout } = useGame();

  // Don't show header on landing page
  if (currentPage === 'landing') {
    return null;
  }

  const getBackDestination = () => {
    if (currentPage === 'proof') {
      return 'openTasks';
    }
    return 'landing';
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-title">
            <span className="header-zot">Zot</span>
            <span className="header-quests">Quests</span>
          </h1>
        </div>
        <div className="header-right">
          <button 
            className="header-back-button" 
            onClick={() => navigateTo(getBackDestination())}
          >
            <img src={petrLogo} alt="Back" className="header-back-icon" />
            <span>Back</span>
          </button>
          <button 
            className="header-logout-button" 
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
