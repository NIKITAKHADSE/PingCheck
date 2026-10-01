import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Instagram, Plus, UserRound } from 'lucide-react';
import { api } from '../api.js';
import './accounts.css';

export default function AccountMenu({ profile, onNavigate }) {
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const location = useLocation();
  useEffect(() => { setOpen(false); }, [location.key]);
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true); setError('');
    api('/api/integrations/meta/status').then(result => {
      if (active) setAccounts(Array.isArray(result.accounts) ? result.accounts : []);
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    const dismiss = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    const escape = event => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => { active = false; document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape); };
  }, [open]);
  const close = () => { setOpen(false); onNavigate?.(); };
  return <div className="account-picker" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button className="account-picker-trigger" ref={trigger} onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="account-picker-panel">
      <span className="account-picker-avatar"><UserRound size={22}/></span>
      <span className="account-picker-name">{profile?.workspace?.name || 'My accounts'}<small>Instagram accounts</small></span>
      <ChevronDown size={15}/>
    </button>
    {open && <div className="account-picker-panel" id="account-picker-panel">
      <div className="account-picker-caption">Connected accounts</div>
      <div className="account-picker-list">
        {loading ? <p role="status">Loading accounts...</p> : error ? <p role="alert">{error}</p> : accounts.length ? accounts.map(account =>
          <Link key={account.id} className="account-picker-item" onClick={close} to={`/dashboard/integrations#account-${account.id}`}>
            <span className="account-picker-avatar"><Instagram size={21}/></span><span>@{account.username || 'instagram_account'}<small>Manage connection</small></span>
          </Link>) : <p>No Instagram accounts connected yet.</p>}
      </div>
      <Link className="account-picker-add" to="/dashboard/accounts/new" onClick={close}><Plus size={16}/> Add Account</Link>
    </div>}
  </div>;
}
