import React, { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Instagram, Workflow, MessageSquare } from 'lucide-react';
import { api } from '../api.js';
import GoogleSignIn from '../components/GoogleSignIn.jsx';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const success = useCallback(() => navigate('/dashboard/integrations', { replace: true }), [navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await api('/api/auth/signup', { method: 'POST', body: JSON.stringify(form) });
      localStorage.setItem('flowvik_token', result.token);
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
      <div className="login-copy"><span className="eyebrow light">CREATE YOUR WORKSPACE</span><h1>Connect Instagram. Build the automation. Let PingCheck handle the comment.</h1><p>Each PingCheck account gets its own workspace and can connect one or more Instagram Professional accounts.</p></div>
      <div className="login-flow"><div><Instagram size={20}/> Connect IG</div><ArrowRight size={16}/><div><Workflow size={20}/> Build flow</div><ArrowRight size={16}/><div><MessageSquare size={20}/> Send DM</div></div>
    </div>
    <div className="login-form-wrap">
      <form className="login-card" onSubmit={submit}>
        <span className="eyebrow">GET STARTED</span><h2>Create PingCheck account</h2><p>Google sign-up is the fastest option.</p>
        <GoogleSignIn onSuccess={success} text="signup_with" />
        <div className="auth-divider"><span>or sign up with email</span></div>
        <label>Your name<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} autoComplete="name" /></label>
        <label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} autoComplete="email" /></label>
        <label>Password<input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} autoComplete="new-password" /></label>
        {error && <div className="alert error">{error}</div>}
        <button className="btn primary full" disabled={busy}>{busy ? 'Creating account...' : 'Create Workspace'}<ArrowRight size={17}/></button>
        <div className="auth-bottom">Already have an account? <Link to="/login">Sign in</Link></div>
      </form>
    </div>
  </div>;
}
