import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoIndie from '../assets/logo-indie.png';
import SEO from '../components/SEO';
import './Auth.css';

export default function Login() {
  const { signIn } = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from ?? '/dashboard';

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) { setError(err.message); return; }
    navigate(from, { replace: true });
  }

  return (
    <div className="auth-page">
      <SEO title="Sign In | IndieConverters" description="Sign in to your IndieConverters account." path="/login" />
      <div className="auth-bg" />

      <div className="auth-card">
        <Link to="/" className="auth-logo">
          <img src={logoIndie} alt="Indie Converters" className="auth-logo-img" />
          <span className="auth-logo-text">indie<strong>converters</strong></span>
        </Link>

        <h1 className="auth-heading">Welcome back.</h1>
        <p className="auth-sub">Sign in to manage your listings and publish new books.</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          No account yet?{' '}
          <Link to="/signup">Create one — it's free</Link>
        </p>
      </div>
    </div>
  );
}
