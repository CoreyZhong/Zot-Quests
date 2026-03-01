import { useGame } from '../context/GameContext';
import { useState, useEffect } from 'react';
import BackButton from '../components/BackButton';
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
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

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

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  const handleImageUpload = (e) => {
    const input = e.target;
    const file = input && input.files ? input.files[0] : null;

    if (!file) {
      return;
    }

    if (!file.type || !file.type.startsWith('image/')) {
      setFeedback('Please upload a valid image file.');
      input.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFeedback('Image is too large. Please upload an image smaller than 5 MB.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    // 1. Basic check
    if (!uploadedImage) {
      setFeedback('Please upload an image first!');
      return;
    }

    // 2. Start loading state
    setIsLoading(true);
    setDenialReason(''); 

    try {
      // 3. Grab the raw file from the hidden input field
      const fileInput = document.getElementById('image-upload');
      const file = fileInput.files[0];

      // 4. Pack the data to send to your FastAPI
      const formData = new FormData();
      formData.append('image', file);
      formData.append('quest_description', activeQuest.description);

      // 5. Send to your backend (FastAPI)
      const response = await fetch('/api/verify-quest', {
        method: 'POST',
        body: formData,
        // If your team uses Supabase Auth, we might need a header here later
      });

      if (!response.ok) {
        // try to surface any error details from the backend instead of the
        // generic "could not connect" message.
        const text = await response.text();
        throw new Error(`Backend error ${response.status}: ${text}`);
      }

      const data = await response.json();

      // 6. Handle the AI's decision
      if (data.verified) {
        setFeedback('AI Verified: ' + data.reason);
        completeQuest(); // This triggers the "Success" screen in your app
      } else {
        setDenialReason(data.reason); // Shows the "Why I failed" message on screen
      }
    } catch (error) {
      console.error('Error:', error);
      // show the actual error message if available, otherwise fall back
      const msg = error?.message || 'Could not connect to the AI server. Make sure your backend is running!';
      setFeedback(msg);
    } finally {
      setIsLoading(false); // Stop the loading spinner
    }
  };

  if (!activeQuest) {
    return (
      <div className="page-container">
        <BackButton destination="openTasks" />
        <p>No active quest. Please select a quest from Open Tasks.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <BackButton destination="openTasks" />
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
          {feedback && (
            <p className="feedback-message">{feedback}</p>
          )}
        </div>

        <button 
  className="submit-button"
  onClick={handleSubmit}
  disabled={isLoading}
>
  {isLoading ? 'AI is Checking...' : 'Submit Image'}
</button>
      </div>
    </div>
  );
};

export default ProofOfCompletion;
