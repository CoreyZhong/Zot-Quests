import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import petrLogo from '../assets/petr.png';
import './Login.css';

const ForgotPassword = () => {
  const location = useLocation();
  const prefillEmail = location.state?.email ?? '';
  const [email, setEmail] = useState(prefillEmail);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSent(false);

    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) throw err;
      setSent(true);
    } catch (err) {
      setError(err?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
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

        {sent ? (
          <>
            <p className="toggle-text" style={{ textAlign: 'center', marginBottom: '1rem' }}>
              Check your email for a reset link.
            </p>
            <p className="toggle-text" style={{ textAlign: 'center', marginTop: 0 }}>
              <Link to="/" className="toggle-button">
                Back to login
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="toggle-text" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              Enter your email and we’ll send you a link to reset your password.
            </p>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="forgot-email">
                  <span className="input-icon">✉️</span>
                </label>
                <input
                  type="email"
                  id="forgot-email"
                  placeholder="EMAIL"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="form-input"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="form-buttons">
                <button
                  type="submit"
                  className="auth-button login-button"
                  disabled={loading}
                >
                  {loading ? 'Sending…' : 'Send reset link'}
                </button>
              </div>
            </form>

            {error && <div className="error-message">{error}</div>}

            <p className="toggle-text" style={{ marginTop: '1rem' }}>
              <Link to="/" className="toggle-button">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
