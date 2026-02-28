import { useGame } from '../context/GameContext';
import { useState, useEffect } from 'react';
import './pages.css';
import './ProofOfCompletion.css';

const ProofOfCompletion = () => {
  const { 
    navigateTo, 
    activeQuest, 
    completeQuest, 
    setUploadedImage,
    uploadedImage,
    questStartTime 
  } = useGame();

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [denialReason, setDenialReason] = useState('');

  useEffect(() => {
    if (!activeQuest || !questStartTime) return;

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - questStartTime) / 1000); // seconds
      const totalSeconds = activeQuest.timeLimit * 60;
      const remaining = Math.max(0, totalSeconds - elapsed);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [activeQuest, questStartTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!uploadedImage) {
      alert('Please upload an image first!');
      return;
    }
    completeQuest();
  };

  if (!activeQuest) {
    return (
      <div className="page-container">
        <p>No active quest. Please select a quest from Open Tasks.</p>
        <button onClick={() => navigateTo('openTasks')}>Go to Open Tasks</button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Proof of Completion</h1>

      <div className="proof-content">
        <div className="quest-details-card">
          <h3>{activeQuest.description}</h3>
          <p><strong>Category:</strong> {activeQuest.category}</p>
          <p><strong>Time Remaining:</strong> {formatTime(timeRemaining)}</p>
          <p><strong>Reward:</strong> {activeQuest.coinReward} coins</p>
        </div>

        <div className="upload-section">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            id="image-upload"
            style={{ display: 'none' }}
          />
          
          <label htmlFor="image-upload" className="upload-area">
            {uploadedImage ? (
              <img src={uploadedImage} alt="Uploaded proof" className="preview-image" />
            ) : (
              <div className="upload-placeholder">
                <p>Upload Image</p>
                <p className="upload-hint">Click to select an image</p>
              </div>
            )}
          </label>

          {denialReason && (
            <p className="denial-reason">Reason for Denial: {denialReason}</p>
          )}
        </div>

        <button 
          className="submit-button"
          onClick={handleSubmit}
        >
          Submit Image
        </button>
      </div>
    </div>
  );
};

export default ProofOfCompletion;
