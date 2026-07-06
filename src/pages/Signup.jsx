import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoIndie from '../assets/logo-indie.png';
import SEO from '../components/SEO';
import './Auth.css';

export default function Signup() {
  const { signUp }  = useAuth();
  const navigate    = useNavigate();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    const { error: err } = await signUp(email, password, name);
    setLoading(false);
    if (err) { setError(err.message); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-bg" />
        <div className="auth-card">
          <Link to="/" className="auth-logo">
            <img src={logoIndie} alt="Indie Converters" className="auth-logo-img" />
            <span className="auth-logo-text">indie<strong>converters</strong></span>
          </Link>
          <h1 className="auth-heading">Check your email.</h1>
          <p className="auth-sub">
            We sent a confirmation link to <strong style={{ color: '#F0EBFF' }}>{email}</strong>.
            Click it to activate your account, then come back to sign in.
          </p>
          <Link to="/login" className="auth-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: 8 }}>
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <SEO title="Sign Up | IndieConverters" description="Create your free IndieConverters account to publish, browse, and hire freelancers." path="/signup" />
      <div className="auth-bg" />

      <div className="auth-card">
        <Link to="/" className="auth-logo">
          <img src={logoIndie} alt="Indie Converters" className="auth-logo-img" />
          <span className="auth-logo-text">indie<strong>converters</strong></span>
        </Link>

        <h1 className="auth-heading">Create your author account.</h1>
        <p className="auth-sub">Free to join. No exclusivity. Your books, your terms.</p>

        {error && <div className="auth-error">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label htmlFor="name">Your name</label>
            <input
              id="name"
              type="text"
              placeholder="How your name appears on your books"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

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
              placeholder="At least 8 characters"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
