import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Instagram, Download, X, Bell, Users, ScrollText, Monitor, CreditCard, MessageSquare, Bot, Tags, Plug, ChevronRight, CheckCircle2, Smartphone, Mail, Send, Music2 } from 'lucide-react';
import { api } from '../api.js';
import { formatDate, saveDatePreferences } from '../dateFormat.js';
import './settings.css';

function Row({ title, children, description }) {
  return <div className="workspace-setting-row"><div className="workspace-setting-label">{title}</div><div className="workspace-setting-control">{children}</div><div className="workspace-setting-help">{description}</div></div>;
}
export default function Settings() {
  const [search, setSearch] = useSearchParams();
  const tab = ['general', 'notifications', 'display', 'logs', 'subscriptions', 'instagram', 'whatsapp', 'messenger', 'tiktok', 'sms', 'email', 'telegram'].includes(search.get('section')) ? search.get('section') : 'general';
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
    <header className="workspace-settings-heading"><div><span>WORKSPACE</span><h1>Settings</h1></div><p>Manage your workspace, channels, and preferences.</p></header>
    <div className="workspace-settings-layout">
      <nav className="workspace-settings-nav" aria-label="Settings sections">
        <strong>Main</strong><button className={tab === 'general' ? 'selected' : ''} onClick={() => select('general')}><Plug size={15}/> General</button>
        <button className={tab === 'notifications' ? 'selected' : ''} onClick={() => select('notifications')}><Bell size={15}/> Notifications</button>
        <Link to="/dashboard/team"><Users size={15}/> Team Members</Link><button className={tab === 'logs' ? 'selected' : ''} onClick={() => select('logs')}><ScrollText size={15}/> Logs</button><button className={tab === 'display' ? 'selected' : ''} onClick={() => select('display')}><Monitor size={15}/> Display</button>
        <strong>Billing</strong><button className={tab === 'subscriptions' ? 'selected' : ''} onClick={() => select('subscriptions')}><CreditCard size={15}/> Subscriptions</button>
        <strong>Inbox</strong><Link to="/dashboard/inbox"><MessageSquare size={15}/> Inbox behavior</Link>
        <strong>Channels</strong><button className={tab === 'instagram' ? 'selected channel-link' : 'channel-link'} onClick={() => select('instagram')}><span className="settings-channel-nav-icon instagram"><Instagram size={13}/></span> Instagram</button>
        <button className={tab === 'whatsapp' ? 'selected channel-link' : 'channel-link'} onClick={() => select('whatsapp')}><span className="settings-channel-nav-icon whatsapp"><MessageSquare size={13}/></span> WhatsApp</button>
        <button className={tab === 'messenger' ? 'selected channel-link' : 'channel-link'} onClick={() => select('messenger')}><span className="settings-channel-nav-icon messenger"><Send size={13}/></span> Messenger</button>
        <button className={tab === 'tiktok' ? 'selected channel-link' : 'channel-link'} onClick={() => select('tiktok')}><span className="settings-channel-nav-icon tiktok"><Music2 size={13}/></span> TikTok</button>
        <button className={tab === 'sms' ? 'selected channel-link' : 'channel-link'} onClick={() => select('sms')}><span className="settings-channel-nav-icon sms"><Smartphone size={13}/></span> SMS</button>
        <button className={tab === 'email' ? 'selected channel-link' : 'channel-link'} onClick={() => select('email')}><span className="settings-channel-nav-icon email"><Mail size={13}/></span> Email</button>
        <button className={tab === 'telegram' ? 'selected channel-link' : 'channel-link'} onClick={() => select('telegram')}><span className="settings-channel-nav-icon telegram"><Send size={13}/></span> Telegram</button>
        <strong>Automation</strong><Link to="/dashboard/automations"><Bot size={15}/> Automations</Link><Link to="/dashboard/templates"><Tags size={15}/> Templates</Link>
      </nav>
      <div className="workspace-settings-content">
        {error && !modal && <div className="alert error" role="alert">{error}{!data && <button className="btn" onClick={() => perform(load)}>Retry</button>}</div>}
        {message && <div className="alert info" role="status">{message}</div>}
        {!data ? !error && <p role="status">Loading settings...</p> : <>
          {!data.canManage && <p>Only the workspace owner can change these settings.</p>}
          {tab === 'general' && <><div className="settings-content-heading"><div className="settings-heading-icon"><Plug size={20}/></div><div><span>MAIN SETTINGS</span><h2>General</h2><p>Control the essentials for your PingCheck workspace.</p></div></div><section className="workspace-settings-card" aria-label="General settings">
            <Row title="Workspace Name" description="The name shown in your account menu and workspace."><input aria-label="Workspace name" maxLength={100} disabled={!canEdit} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/></Row>
            <Row title="Card URL Shortener" description="Links are sent as entered. Click tracking and URL shortening are not available in this workspace."><select aria-label="URL shortener" disabled><option>Original URLs</option></select></Row>
            <Row title="Account Time Zone" description="Display workspace activity and connection dates in this time zone."><select aria-label="Account time zone" value={form.timeZone} disabled={!canEdit} onChange={e => setForm({ ...form, timeZone: e.target.value })}>{zones.map(zone => <option key={zone}>{zone}</option>)}</select></Row>
            <Row title="Save Preferences" description="Save your workspace name and display preferences."><button className="settings-blue-button" disabled={!canEdit || !form.name.trim()} onClick={save}>{busy ? 'Please wait...' : 'Save Changes'}</button></Row>
            <Row title="Clone to Another Account" description="Copy source automations as unpublished drafts for a connected Instagram account. Post targeting is cleared for review."><button className="settings-blue-button" disabled={!canEdit} onClick={() => { setError(''); setModal('clone'); }}>Clone Automations</button></Row>
            <Row title="Use as Template" description="Download a JSON snapshot of automation content. Connected accounts, contacts and message history are excluded."><button className="settings-blue-button" disabled={!canEdit} onClick={download}><Download size={15}/> Create Account Template</button></Row>
            <Row title="Leave Account" description="Ownership transfer and leaving a workspace are not available yet."><button className="settings-neutral-button" disabled>Leave</button></Row>
            <Row title="Delete Account" description="Permanently delete your login, this workspace and its local data. Your Instagram account itself is not deleted."><button className="settings-neutral-button danger" disabled={!canEdit} onClick={() => { setConfirmation(''); setError(''); setModal('delete'); }}>Delete</button></Row>
          </section></>}
          {tab === 'notifications' && <><div className="settings-content-heading"><div className="settings-heading-icon"><Bell size={20}/></div><div><span>PREFERENCES</span><h2>Notifications</h2><p>Choose how you hear about activity in your workspace.</p></div></div><section className="workspace-settings-card settings-coming-soon"><Bell size={30}/><h3>Notification controls are coming soon</h3><p>Inbox assignments, failed automations, and connection alerts will appear here.</p></section></>}
          {tab === 'display' && <><div className="settings-content-heading"><div className="settings-heading-icon"><Monitor size={20}/></div><div><span>PREFERENCES</span><h2>Display</h2><p>Choose how time and dates appear throughout PingCheck.</p></div></div><section className="workspace-settings-card" aria-label="Display settings">
            <Row title="Date Format" description="Choose how dates appear in workspace activity and connection details."><select aria-label="Date format" value={form.dateStyle} disabled={!canEdit} onChange={e => setForm({ ...form, dateStyle: e.target.value })}><option value="short">Short</option><option value="medium">Medium</option><option value="long">Long</option></select></Row>
            <Row title="Preview" description={`Time zone: ${form.timeZone}`}><span>{new Intl.DateTimeFormat(undefined, { timeZone: form.timeZone, dateStyle: form.dateStyle, timeStyle: 'short' }).format(new Date())}</span></Row>
            <Row title="Save Display" description="These preferences are saved for this workspace."><button className="settings-blue-button" disabled={!canEdit} onClick={save}>Save Changes</button></Row>
          </section></>}
          {tab === 'subscriptions' && <><div className="settings-content-heading"><div className="settings-heading-icon"><CreditCard size={20}/></div><div><span>BILLING</span><h2>Subscription</h2><p>Review your current workspace plan.</p></div></div><section className="workspace-settings-card"><Row title="Current Plan" description="Billing and payment management are not connected."><span className="settings-plan-badge">{data.workspace.plan || 'FREE'}</span></Row></section></>}
          {tab === 'logs' && <><div className="settings-content-heading"><div className="settings-heading-icon"><ScrollText size={20}/></div><div><span>WORKSPACE HISTORY</span><h2>Activity logs</h2><p>Review recent automation and account events.</p></div></div><section className="workspace-settings-card workspace-settings-logs"><div className="workspace-settings-log-heading"><h2>Recent activity</h2><button className="settings-neutral-button" disabled={busy} onClick={() => perform(async () => { const r = await api('/api/settings', { cache: 'no-store' }); setData(r); })}>Refresh</button></div>{!data.activity.length ? <p>No recorded activity yet.</p> : data.activity.map(item => <article key={item.id}><strong>{item.text}</strong><small>{formatDate(item.at)}</small></article>)}</section></>}
          {tab === 'instagram' && <><div className="settings-content-heading"><div className="settings-instagram-icon large"><Instagram size={20}/></div><div><span>CHANNELS</span><h2>Instagram</h2><p>Connect Instagram to receive comments, run automations, and manage conversations.</p></div></div><section className="workspace-settings-card settings-channel-card"><div className="settings-channel-art"><div className="channel-orbit one"/><div className="channel-orbit two"/><div className="channel-logo"><Instagram size={36}/></div><span className="channel-spark spark-one">✦</span><span className="channel-spark spark-two">✦</span></div><h3>Instagram for your business</h3><p>Turn comments into conversations, capture leads, and keep every customer message organized in PingCheck.</p>{data.accounts?.length ? <><div className="channel-connected"><CheckCircle2 size={17}/><span><strong>{data.accounts.length} account{data.accounts.length !== 1 ? 's' : ''} connected</strong><small>{data.accounts.map(a => `@${a.username}`).join(', ')}</small></span></div><Link className="settings-channel-button" to="/dashboard/integrations">Manage connection <ChevronRight size={15}/></Link></> : <Link className="settings-channel-button" to="/dashboard/accounts/new">Connect Instagram <ChevronRight size={15}/></Link>}</section></>}
          {['whatsapp', 'messenger', 'tiktok', 'sms', 'email', 'telegram'].includes(tab) && (() => {
            const channels = {
              whatsapp: { name: 'WhatsApp', Icon: MessageSquare, text: 'Reach customers with broadcasts, automations, and personal replies in one shared inbox.' },
              messenger: { name: 'Messenger', Icon: Send, text: 'Bring Facebook Messenger conversations and automated customer journeys into PingCheck.' },
              tiktok: { name: 'TikTok', Icon: Music2, text: 'Connect with your TikTok audience and manage engagement from your workspace.' },
              sms: { name: 'SMS', Icon: Smartphone, text: 'Send timely text updates, reminders, and automated follow-ups to opted-in contacts.' },
              email: { name: 'Email', Icon: Mail, text: 'Create email follow-ups that work alongside your social conversation automations.' },
              telegram: { name: 'Telegram', Icon: Send, text: 'Manage Telegram messages and automated conversations from one place.' }
            };
            const channel = channels[tab]; const ChannelIcon = channel.Icon;
            return <><div className="settings-content-heading"><div className={`settings-channel-nav-icon large ${tab}`}><ChannelIcon size={20}/></div><div><span>CHANNELS</span><h2>{channel.name}</h2><p>Expand your customer conversations across more channels.</p></div></div><section className={`workspace-settings-card settings-channel-card settings-channel-${tab}`}><div className="settings-channel-art"><div className="channel-orbit one"/><div className="channel-orbit two"/><div className="channel-logo"><ChannelIcon size={36}/></div><span className="channel-spark spark-one">✦</span><span className="channel-spark spark-two">✦</span></div><span className="channel-coming-badge">COMING SOON</span><h3>{channel.name} for your business</h3><p>{channel.text}</p><button className="settings-channel-button muted" disabled>Connection unavailable</button></section></>;
          })()}
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
