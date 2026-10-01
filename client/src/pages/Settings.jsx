import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Instagram, Download, X } from 'lucide-react';
import { api } from '../api.js';
import { formatDate, saveDatePreferences } from '../dateFormat.js';
import './settings.css';

function Row({ title, children, description }) {
  return <div className="workspace-setting-row"><div className="workspace-setting-label">{title}</div><div className="workspace-setting-control">{children}</div><div className="workspace-setting-help">{description}</div></div>;
}
export default function Settings() {
  const [search, setSearch] = useSearchParams();
  const tab = ['general', 'display', 'logs', 'subscriptions'].includes(search.get('section')) ? search.get('section') : 'general';
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ name: '', timeZone: 'Asia/Calcutta', dateStyle: 'medium' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState('');
  const [target, setTarget] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const dialog = useRef(null);
  const lock = useRef(false);
  const navigate = useNavigate();
  const load = async () => {
    const result = await api('/api/settings', { cache: 'no-store' });
    setData(result); setForm({ name: result.workspace.name, timeZone: result.workspace.timeZone, dateStyle: result.workspace.dateStyle });
    saveDatePreferences(result.workspace);
  };
  useEffect(() => { load().catch(e => setError(e.message)); }, []);
  useEffect(() => { if (modal) dialog.current?.showModal(); else dialog.current?.close(); }, [modal]);
  async function perform(action) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try { await action(); } catch (e) { setError(e.message); }
    finally { lock.current = false; setBusy(false); }
  }
  const save = () => perform(async () => {
    const result = await api('/api/settings', { method: 'PUT', body: JSON.stringify(form) });
    setData(current => ({ ...current, workspace: result.workspace }));
    saveDatePreferences(result.workspace); window.dispatchEvent(new Event('flowvik-workspace-updated')); setMessage('Settings saved.');
  });
  const download = () => perform(async () => {
    const template = await api('/api/settings/template');
    const url = URL.createObjectURL(new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'pingcheck-automation-template.json';
    document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('Automation template downloaded. Contacts and account credentials are excluded.');
  });
  const clone = () => perform(async () => {
    const result = await api('/api/settings/clone', { method: 'POST', body: JSON.stringify({ accountId: target }) });
    setModal(''); setMessage(`${result.count} automation draft(s) created. Existing copies were skipped. Review post targeting in the builder before publishing.`);
  });
  const remove = () => perform(async () => {
    await api('/api/settings', { method: 'DELETE', body: JSON.stringify({ confirmation }) });
    localStorage.removeItem('flowvik_token'); localStorage.removeItem('flowvik_date_preferences'); navigate('/signup', { replace: true });
  });
  const select = section => { setSearch({ section }); setMessage(''); setError(''); };
  const canEdit = data?.canManage && !busy;
  const zones = Array.from(new Set([form.timeZone, 'Asia/Calcutta', 'UTC', ...(Intl.supportedValuesOf ? Intl.supportedValuesOf('timeZone') : ['America/New_York', 'Europe/London', 'Asia/Dubai', 'Asia/Singapore', 'Australia/Sydney'])]));
  return <div className="workspace-settings">
    <header className="workspace-settings-heading"><h1>Settings</h1></header>
    <div className="workspace-settings-layout">
      <nav className="workspace-settings-nav" aria-label="Settings sections">
        <strong>Main</strong><button className={tab === 'general' ? 'selected' : ''} onClick={() => select('general')}>General</button>
        <Link to="/dashboard/team">Team Members</Link><button className={tab === 'logs' ? 'selected' : ''} onClick={() => select('logs')}>Logs</button><button className={tab === 'display' ? 'selected' : ''} onClick={() => select('display')}>Display</button>
        <strong>Billing</strong><button className={tab === 'subscriptions' ? 'selected' : ''} onClick={() => select('subscriptions')}>Subscriptions</button>
        <strong>Inbox</strong><Link to="/dashboard/inbox">Conversations</Link>
        <strong>Channels</strong><Link to="/dashboard/integrations"><Instagram size={16} color="#f3337d"/> Instagram</Link>
        <strong>Automation</strong><Link to="/dashboard/automations">Manage Automations</Link><Link to="/dashboard/templates">Templates</Link>
      </nav>
      <div className="workspace-settings-content">
        {error && !modal && <div className="alert error" role="alert">{error}{!data && <button className="btn" onClick={() => perform(load)}>Retry</button>}</div>}
        {message && <div className="alert info" role="status">{message}</div>}
        {!data ? !error && <p role="status">Loading settings...</p> : <>
          {!data.canManage && <p>Only the workspace owner can change these settings.</p>}
          {tab === 'general' && <section className="workspace-settings-card" aria-label="General settings">
            <Row title="Workspace Name" description="The name shown in your account menu and workspace."><input aria-label="Workspace name" maxLength={100} disabled={!canEdit} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></Row>
            <Row title="Card URL Shortener" description="Links are sent as entered. Click tracking and URL shortening are not available in this workspace."><select aria-label="URL shortener" disabled><option>Original URLs</option></select></Row>
            <Row title="Account Time Zone" description="Display workspace activity and connection dates in this time zone."><select aria-label="Account time zone" value={form.timeZone} disabled={!canEdit} onChange={e => setForm({ ...form, timeZone: e.target.value })}>{zones.map(zone => <option key={zone}>{zone}</option>)}</select></Row>
            <Row title="Save Preferences" description="Save your workspace name and display preferences."><button className="settings-blue-button" disabled={!canEdit || !form.name.trim()} onClick={save}>{busy ? 'Please wait...' : 'Save Changes'}</button></Row>
            <Row title="Clone to Another Account" description="Copy source automations as unpublished drafts for a connected Instagram account. Post targeting is cleared for review."><button className="settings-blue-button" disabled={!canEdit} onClick={() => { setError(''); setModal('clone'); }}>Clone Automations</button></Row>
            <Row title="Use as Template" description="Download a JSON snapshot of automation content. Connected accounts, contacts and message history are excluded."><button className="settings-blue-button" disabled={!canEdit} onClick={download}><Download size={15}/> Create Account Template</button></Row>
            <Row title="Leave Account" description="Ownership transfer and leaving a workspace are not available yet."><button className="settings-neutral-button" disabled>Leave</button></Row>
            <Row title="Delete Account" description="Permanently delete your login, this workspace and its local data. Your Instagram account itself is not deleted."><button className="settings-neutral-button danger" disabled={!canEdit} onClick={() => { setConfirmation(''); setError(''); setModal('delete'); }}>Delete</button></Row>
          </section>}
          {tab === 'display' && <section className="workspace-settings-card" aria-label="Display settings">
            <Row title="Date Format" description="Choose how dates appear in workspace activity and connection details."><select aria-label="Date format" value={form.dateStyle} disabled={!canEdit} onChange={e => setForm({ ...form, dateStyle: e.target.value })}><option value="short">Short</option><option value="medium">Medium</option><option value="long">Long</option></select></Row>
            <Row title="Preview" description={`Time zone: ${form.timeZone}`}><span>{new Intl.DateTimeFormat(undefined, { timeZone: form.timeZone, dateStyle: form.dateStyle, timeStyle: 'short' }).format(new Date())}</span></Row>
            <Row title="Save Display" description="These preferences are saved for this workspace."><button className="settings-blue-button" disabled={!canEdit} onClick={save}>Save Changes</button></Row>
          </section>}
          {tab === 'subscriptions' && <section className="workspace-settings-card"><Row title="Current Plan" description="Billing and payment management are not connected."><strong>{data.workspace.plan || 'FREE'}</strong></Row></section>}
          {tab === 'logs' && <section className="workspace-settings-card workspace-settings-logs"><div className="workspace-settings-log-heading"><h2>Recent activity</h2><button className="settings-neutral-button" disabled={busy} onClick={() => perform(async () => { const r = await api('/api/settings', { cache: 'no-store' }); setData(r); })}>Refresh</button></div>{!data.activity.length ? <p>No recorded activity yet.</p> : data.activity.map(item => <article key={item.id}><strong>{item.text}</strong><small>{formatDate(item.at)}</small></article>)}</section>}
        </>}
      </div>
    </div>
    <dialog className="workspace-settings-dialog" ref={dialog} onCancel={e => { if (busy) e.preventDefault(); else setModal(''); }} onClose={() => setModal('')}>
      <button className="settings-dialog-close" aria-label="Close" disabled={busy} onClick={() => setModal('')}><X size={20}/></button><h2>{modal === 'delete' ? 'Delete your account?' : 'Clone automations'}</h2>
      {error && <div className="alert error" role="alert">{error}</div>}
      {modal === 'clone' ? <><p>Choose the Instagram account for your new drafts.</p><label htmlFor="clone-account">Destination account</label><select id="clone-account" value={target} onChange={e => setTarget(e.target.value)} disabled={busy}><option value="">Select an account</option>{data?.accounts.map(a => <option value={a.id} key={a.id}>@{a.username}</option>)}</select>{!data?.accounts.length && <p><Link to="/dashboard/accounts/new">Connect an Instagram account first.</Link></p>}<button className="settings-blue-button" disabled={!target || busy} onClick={clone}>{busy ? 'Cloning...' : 'Create Draft Copies'}</button></> : <><p>This permanently removes your login, workspace, contacts, automations and stored messages. This cannot be undone. Available only for workspaces with one member.</p><label htmlFor="delete-workspace">Type <strong>{data?.workspace.name}</strong> to confirm</label><input id="delete-workspace" autoComplete="off" value={confirmation} onChange={e => setConfirmation(e.target.value)} disabled={busy}/><button className="settings-delete-button" disabled={busy || confirmation !== data?.workspace.name} onClick={remove}>{busy ? 'Deleting...' : 'Permanently Delete Account'}</button></>}
    </dialog>
  </div>;
}
