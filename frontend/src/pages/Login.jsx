import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import petrLogo from '../assets/petr.png';
import './Login.css';

const USERNAME_MIN = 3;
const USERNAME_MAX = 20;
const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

const Login = () => {
  const { signIn, signUp } = useAuth();
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignupMode) {
        const trimmed = username.trim();
        if (!trimmed) {
          setError('Username is required.');
          setLoading(false);
          return;
        }
        if (trimmed.length < USERNAME_MIN || trimmed.length > USERNAME_MAX) {
          setError(`Username must be ${USERNAME_MIN}-${USERNAME_MAX} characters.`);
          setLoading(false);
          return;
        }
        if (!USERNAME_REGEX.test(trimmed)) {
          setError('Username can only use letters, numbers, and underscore.');
          setLoading(false);
          return;
        }

        const data = await signUp(email, password);
        if (data?.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({ id: data.user.id, username: trimmed });
          if (profileError) {
            if (profileError.code === '23505' || /unique|duplicate/i.test(profileError.message)) {
              setError('Username already taken. Please choose another.');
            } else {
              setError(profileError.message || 'Could not save username.');
            }
            setLoading(false);
            return;
          }
        }
        setEmail('');
        setUsername('');
        setPassword('');
      } else {
        await signIn(email, password);
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      setError(err?.message ?? 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignupMode(!isSignupMode);
    setError('');
    setEmail('');
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
            <label htmlFor="email">
              <span className="input-icon">✉️</span>
            </label>
            <input
              type="email"
              id="email"
              placeholder="EMAIL"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className="form-input"
              autoComplete="email"
            />
          </div>

          {isSignupMode && (
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
                autoComplete="username"
                minLength={USERNAME_MIN}
                maxLength={USERNAME_MAX}
              />
            </div>
          )}

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
