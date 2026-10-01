import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Gift, Instagram, MessageCircle, Phone } from 'lucide-react';
import { api } from '../api.js';
import '../components/accounts.css';

const channels = [
  { name: 'Instagram', icon: Instagram, theme: 'instagram', description: 'Supercharge your social media marketing with Instagram Automation.', available: true },
  { name: 'WhatsApp', icon: Phone, theme: 'whatsapp', description: 'Reach your audience on their favorite messaging app.' },
  { name: 'Facebook Messenger', icon: MessageCircle, theme: 'messenger', description: 'Create Messenger automation to keep customers happy.' }
];

export default function NewAccount() {
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    api('/api/auth/me').then(() => { if (active) setChecking(false); }).catch(e => {
      if (!active) return;
      if (!localStorage.getItem('flowvik_token')) navigate('/login', { replace: true });
      else { setError(e.message); setChecking(false); }
    });
    return () => { active = false; };
  }, [navigate]);
  async function connect() {
    if (lock.current || checking) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const result = await api('/api/integrations/meta/connect', { cache: 'no-store' });
      window.location.assign(result.url);
    } catch (e) { setError(e.message); lock.current = false; setBusy(false); }
  }
  return <main className="new-account-page">
    <section className="new-account-intro">
      <Link to="/dashboard" className="new-account-brand">PingCheck</Link>
      <div className="new-account-welcome">
        <div className="new-account-art" aria-hidden="true"><span className="account-balloon one"/><span className="account-balloon two"/><span className="account-gift"><Gift size={68} strokeWidth={1.7}/></span></div>
        <h1>Where would you<br/>like to start?</h1>
        <p>Don’t worry, you can connect other channels later.</p>
      </div>
      <Link to="/dashboard" className="new-account-back"><ArrowLeft size={16}/> Back</Link>
    </section>
    <section className="new-account-channels" aria-label="Choose a channel">
      <div className="new-account-channel-list">
        {error && <div className="new-account-error" role="alert">{error}<Link to="/dashboard/integrations">View connection setup <ArrowRight size={14}/></Link></div>}
        {checking && <p role="status">Loading your workspace...</p>}
        {channels.map(({ name, icon: Icon, theme, description, available }) => <button type="button" key={name} className={`new-account-channel ${available ? '' : 'unavailable'}`} disabled={!available || busy || checking} onClick={available ? connect : undefined}>
          <span className={`new-account-channel-icon ${theme}`}><Icon size={27}/></span>
          <span className="new-account-channel-copy"><strong>{name}</strong><span>{description}</span>{!available && <small>Coming soon</small>}{available && busy && <small role="status">Opening Instagram...</small>}</span>
          {available && <ArrowRight className="new-account-channel-arrow" size={18}/>}
        </button>)}
      </div>
    </section>
  </main>;
}
