import { useGame } from '../context/GameContext';
import petrLogo from '../assets/petr.png';
import './BackButton.css';

const BackButton = ({ destination = 'landing' }) => {
  const { navigateTo } = useGame();

  return (
    <button 
      className="back-button" 
      onClick={() => navigateTo(destination)}
    >
      <img src={petrLogo} alt="Back" className="back-icon" />
      <span>Back</span>
    </button>
  );
};

export default BackButton;
