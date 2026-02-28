import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import petrLogo from '../assets/petr.png';
import './Login.css';

const ResetPassword = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setCheckingSession(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setSuccess(true);
      await supabase.auth.signOut();
      setTimeout(() => navigate('/', { replace: true }), 1500);
    } catch (err) {
      setError(err?.message ?? 'Could not update password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  const hasRecoverySession = user != null;

  // Check success first so we never show "invalid link" after a successful reset
  // (signOut() clears user, which would otherwise trigger the invalid-link view)
  if (success) {
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
          <p className="toggle-text" style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
            Your password was reset successfully.
          </p>
          <p className="toggle-text" style={{ textAlign: 'center', marginTop: 0 }}>
            Redirecting you to the login page…
          </p>
        </div>
      </div>
    );
  }

  if (checkingSession && !hasRecoverySession) {
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
          <p className="toggle-text" style={{ textAlign: 'center' }}>
            Confirming your link…
          </p>
        </div>
      </div>
    );
  }

  if (!hasRecoverySession) {
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
          <p className="toggle-text" style={{ textAlign: 'center', marginBottom: '1rem' }}>
            Invalid or expired reset link.
          </p>
          <p className="toggle-text" style={{ textAlign: 'center', marginTop: 0 }}>
            <Link to="/" className="toggle-button">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    );
  }

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

        <p className="toggle-text" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          Enter your new password.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reset-password">
              <span className="input-icon">🔒</span>
            </label>
            <input
              type="password"
              id="reset-password"
              placeholder="NEW PASSWORD"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="form-input"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reset-confirm">
              <span className="input-icon">🔒</span>
            </label>
            <input
              type="password"
              id="reset-confirm"
              placeholder="CONFIRM PASSWORD"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              className="form-input"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <div className="form-buttons">
            <button
              type="submit"
              className="auth-button login-button"
              disabled={loading}
            >
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </div>
        </form>

        {error && <div className="error-message">{error}</div>}

        <p className="toggle-text" style={{ marginTop: '1rem' }}>
          <Link to="/" className="toggle-button">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
