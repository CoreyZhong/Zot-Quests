import { useState } from 'react';
import { useGame } from '../context/GameContext';
import petrLogo from '../assets/petr.png';
import './Login.css';

const Login = () => {
  const { login, signup, navigateTo } = useGame();
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isSignupMode) {
        result = signup(username, password);
      } else {
        result = login(username, password);
      }

      if (result.success) {
        setUsername('');
        setPassword('');
        navigateTo('landing');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }

    setLoading(false);
  };

  const toggleMode = () => {
    setIsSignupMode(!isSignupMode);
    setError('');
    setUsername('');
    setPassword('');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <img src={petrLogo} alt="Petr" className="login-petr-logo" />
          <div className="login-title">
            <span className="zot">Zot</span>
            <span className="quests">Quests</span>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">
              <span className="input-icon">👤</span>
            </label>
            <input
              type="text"
              id="username"
              placeholder="USERNAME"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <span className="input-icon">🔒</span>
            </label>
            <input
              type="password"
              id="password"
              placeholder="PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="form-input"
            />
          </div>

          <div className="form-buttons">
            <button
              type="submit"
              className="auth-button login-button"
              disabled={loading}
            >
              {isSignupMode ? 'SIGNUP' : 'LOGIN'}
            </button>
          </div>
        </form>

        {error && <div className="error-message">{error}</div>}

        <p className="toggle-text">
          {isSignupMode
            ? 'Already have an account? '
            : "Don't have an account? "}
          <button
            type="button"
            className="toggle-button"
            onClick={toggleMode}
            disabled={loading}
          >
            {isSignupMode ? 'Login here' : 'Sign up here'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
