import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Instagram, Zap } from 'lucide-react';
import { api } from '../api.js';
import GoogleSignIn from '../components/GoogleSignIn.jsx';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('demo@flowvik.app');
  const [password, setPassword] = useState('demo12345');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const success = useCallback(() => navigate('/dashboard', { replace: true }), [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      localStorage.setItem('flowvik_token', r.token);
      success();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return <div className="login-page">
    <div className="login-art">
      <div className="login-brand"><div className="brand-mark large">P</div><strong>PingCheck</strong></div>
      <div className="login-copy"><span className="eyebrow light">INSTAGRAM-FIRST AUTOMATION</span><h1>Turn comments into conversations, leads and customers.</h1><p>Connect client Instagram Professional accounts and automate comment-to-DM workflows for posts, Reels and eligible ad-post comments.</p></div>
      <div className="login-flow"><div><Instagram size={20}/> Comment “PRICE”</div><ArrowRight size={16}/><div><Zap size={20}/> Auto DM</div><ArrowRight size={16}/><div>Lead captured</div></div>
    </div>
    <div className="login-form-wrap">
      <form className="login-card" onSubmit={submit}>
        <span className="eyebrow">WELCOME BACK</span><h2>Sign in to PingCheck</h2><p>Use Google or your email account.</p>
        <GoogleSignIn onSuccess={success} text="signin_with" />
        <div className="auth-divider"><span>or continue with email</span></div>
        <label>Email<input value={email} onChange={e=>setEmail(e.target.value)} type="email" autoComplete="email" /></label>
        <label>Password<input value={password} onChange={e=>setPassword(e.target.value)} type="password" autoComplete="current-password" /></label>
        {error && <div className="alert error">{error}</div>}
        <button className="btn primary full" disabled={busy}>{busy ? 'Signing in...' : 'Enter Workspace'}<ArrowRight size={17}/></button>
        <div className="auth-bottom">New to PingCheck? <Link to="/signup">Create an account</Link></div>
        <div className="demo-note"><strong>Demo Login</strong><span>demo@flowvik.app / demo12345</span></div>
      </form>
    </div>
  </div>;
}
