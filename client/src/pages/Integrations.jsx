import { formatDate } from '../dateFormat.js';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Instagram, CheckCircle2, AlertTriangle, ExternalLink, TestTube2, Trash2, RefreshCw, Link2, ShieldCheck, Megaphone } from 'lucide-react';
import { api } from '../api.js';

const emptyStatus = {
  demoMode: true, configured: false, connected: false, accountCount: 0, accounts: [],
  redirectUri: '', webhookUrl: '', graphVersion: '', scopes: [], webhookFields: [], configurationIssues: []
};

export default function Integrations() {
  const [status, setStatus] = useState(emptyStatus);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [testText, setTestText] = useState('PRICE');
  const [testSource, setTestSource] = useState('INSTAGRAM');
  const [media, setMedia] = useState({});
  const [mediaLoading, setMediaLoading] = useState('');
  const [checkingAccount, setCheckingAccount] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const r = await api('/api/integrations/meta/status');
      setStatus({ ...emptyStatus, ...r, accounts: Array.isArray(r.accounts) ? r.accounts : [], scopes: Array.isArray(r.scopes) ? r.scopes : [], webhookFields: Array.isArray(r.webhookFields) ? r.webhookFields : [], configurationIssues: Array.isArray(r.configurationIssues) ? r.configurationIssues : [] });
    } catch (e) {
      setMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const meta = params.get('meta');
    if (!meta) return;
    if (meta === 'connected') setMsg('Instagram account connected and webhook subscription completed.');
    else if (meta.startsWith('warning:')) setMsg(`Instagram connected, but webhook subscription needs attention: ${meta.slice(8)}`);
    else if (meta.startsWith('error:')) setMsg(`Instagram connection error: ${meta.slice(6)}`);
    else setMsg('Instagram callback returned: ' + meta);
    navigate('/dashboard/integrations', { replace: true });
    load();
  }, [location.search]);

  useEffect(() => {
    if (!loading && location.hash.startsWith('#account-')) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [loading, location.hash]);

  const connect = () => navigate('/dashboard/accounts/new');

  const disconnect = async (id) => {
    if (!window.confirm('Disconnect this Instagram account from PingCheck?')) return;
    try {
      await api(`/api/integrations/meta/accounts/${id}`, { method: 'DELETE' });
      setMsg('Instagram account disconnected locally.');
      await load();
    } catch (e) { setMsg(e.message); }
  };

  const checkAccount = async (id, repairWebhooks = false) => {
    if (checkingAccount) return;
    setCheckingAccount(id); setMsg('');
    try {
      const { account } = await api(`/api/integrations/meta/accounts/${id}/check`, { method: 'POST', body: JSON.stringify({ repairWebhooks }) });
      setStatus(current => ({ ...current, accounts: current.accounts.map(item => item.id === id ? account : item) }));
      setMsg(account.connectionError || account.webhookError || 'Instagram account and webhook subscription verified. Keep the public callback tunnel running to receive new events.');
    } catch (e) { setMsg(e.message); }
    finally { setCheckingAccount(''); }
  };

  const loadMedia = async (id) => {
    setMediaLoading(id);
    try {
      const r = await api(`/api/integrations/meta/accounts/${id}/media`);
      setMedia((current) => ({ ...current, [id]: Array.isArray(r.media) ? r.media : [] }));
    } catch (e) { setMsg(e.message); }
    finally { setMediaLoading(''); }
  };

  const simulate = async () => {
    try {
      const r = await api('/api/dev/simulate-comment', { method: 'POST', body: JSON.stringify({ text: testText, sourceType: testSource }) });
      setMsg(r.message || `Matched automations: ${r.matched?.join(', ') || r.result?.matched || 0}`);
    } catch (e) { setMsg(e.message); }
  };

  const ready = useMemo(() => !status.demoMode && status.configured && String(status.webhookUrl || '').startsWith('https://'), [status]);

  if (loading) return <div className="loading">Loading Instagram integration...</div>;

  return <div>
    <div className="page-heading"><div><span className="eyebrow">SYSTEM</span><h1>Instagram Connections</h1><p>Connect client Instagram Professional accounts. Each connected account appears below with its Instagram account ID, webhook status and automation readiness.</p></div><button className="btn primary" onClick={connect}><Instagram size={17}/> Connect Instagram<ExternalLink size={14}/></button></div>
    {msg && <div className={`alert ${msg.toLowerCase().includes('error') || msg.toLowerCase().includes('missing') || msg.toLowerCase().includes('placeholder') ? 'error' : 'info'}`}>{msg}</div>}
    {status.configurationIssues.length > 0 && <div className="alert error"><strong>Instagram connection is not ready:</strong> {status.configurationIssues.join(' ')}</div>}

    <div className="connection-overview">
      <div><span className="connection-kicker">CONNECTED ACCOUNTS</span><strong>{status.accountCount || status.accounts.length}</strong><small>Instagram Business / Creator accounts</small></div>
      <div><span className="connection-kicker">WEBHOOK</span><strong>{String(status.webhookUrl || '').startsWith('https://') ? 'HTTPS' : 'LOCAL'}</strong><small>{status.webhookUrl || 'Not configured'}</small></div>
      <div><span className="connection-kicker">META APP</span><strong>{status.configured ? 'READY' : 'MISSING'}</strong><small>Graph API {status.graphVersion || '—'}</small></div>
      <div><span className="connection-kicker">AUTOMATION</span><strong>{ready ? 'CONFIGURED' : 'SETUP NEEDED'}</strong><small>{ready ? 'Public callback must also be online' : 'Finish the checklist below'}</small></div>
    </div>

    <section className="panel account-list-panel">
      <div className="panel-title"><div><span className="eyebrow">CLIENT ACCOUNTS</span><h3>Connected Instagram IDs</h3></div><button className="btn ghost compact" onClick={connect}><Link2 size={15}/> Connect another</button></div>
      {status.accounts.length === 0 ? <div className="empty-account-state"><Instagram size={34}/><strong>No Instagram account connected</strong><span>When a client completes Instagram Login, their username and Instagram user ID will appear here like an account connection list.</span><button className="btn primary" onClick={connect}>Connect first Instagram account</button></div> :
      <div className="instagram-account-list">{status.accounts.map((account) => <div className="instagram-account-row" id={`account-${account.id}`} key={account.id}>
        <div className="ig-avatar">{account.profilePictureUrl ? <img src={account.profilePictureUrl} alt=""/> : <Instagram size={22}/>}</div>
        <div className="ig-account-main"><div className="ig-account-title"><strong>@{account.username || 'instagram_account'}</strong><span className="badge active">{account.accountType || 'PROFESSIONAL'}</span></div><div className="ig-id-line"><span>Instagram User ID</span><code>{account.instagramUserId || '—'}</code></div><div className="ig-account-meta"><span>{account.name || 'Instagram Professional account'}</span><span>Connected {account.connectedAt ? formatDate(account.connectedAt) : '—'}</span></div></div>
        <div className="ig-account-status"><div className={account.connectionStatus === 'CONNECTED' ? 'good-status' : 'warn-status'}>{account.connectionStatus === 'CONNECTED' ? <CheckCircle2 size={16}/> : <AlertTriangle size={16}/>} {({ CONNECTED: 'Account verified', EXPIRED: 'Reconnect required', ERROR: 'Connection check failed', WEBHOOK_WARNING: 'Webhook needs attention', UNCHECKED: 'Check connection' })[account.connectionStatus] || 'Check connection'}</div><small>{account.connectionError || account.webhookError || (account.lastCheckedAt ? 'Checked ' + formatDate(account.lastCheckedAt) : 'Saved account ? verify access with Instagram.')}</small>{account.tokenExpiresAt && <small>Access expires {formatDate(account.tokenExpiresAt)}</small>}</div>
        <div className="ig-account-actions"><button className="btn ghost compact" onClick={()=>checkAccount(account.id)} disabled={Boolean(checkingAccount)}>{checkingAccount===account.id ? 'Checking...' : 'Check connection'}</button>{!account.webhookSubscribed && !account.expired && <button className="btn ghost compact" onClick={()=>checkAccount(account.id, true)} disabled={Boolean(checkingAccount)}>Retry webhooks</button>}<button className="btn ghost compact" onClick={connect}>Reconnect</button><button className="btn ghost compact" onClick={()=>loadMedia(account.id)} disabled={mediaLoading===account.id}><RefreshCw size={14}/>{mediaLoading===account.id?' Loading...':' Media'}</button><button className="icon-btn danger" onClick={()=>disconnect(account.id)} title="Disconnect"><Trash2 size={16}/></button></div>
        {Array.isArray(media[account.id]) && <div className="ig-media-strip">{media[account.id].length === 0 ? <span>No media returned by Meta.</span> : media[account.id].slice(0,6).map((item)=><a key={item.id} href={item.permalink} target="_blank" rel="noreferrer"><strong>{item.media_product_type || item.media_type || 'MEDIA'}</strong><code>{item.id}</code><span>{String(item.caption || '').slice(0,56) || 'Instagram media'}</span></a>)}</div>}
      </div>)}</div>}
    </section>

    <div className="integration-grid connection-grid">
      <section className="panel setup-check"><span className="eyebrow">LIVE CONNECTION CHECK</span><h3>Before connecting a real client account</h3><div className="check-list"><div className={status.demoMode?'bad':'good'}>{status.demoMode?<AlertTriangle size={17}/>:<CheckCircle2 size={17}/>} DEMO_MODE = false</div><div className={status.configured?'good':'bad'}>{status.configured?<CheckCircle2 size={17}/>:<AlertTriangle size={17}/>} Meta App ID, App Secret, Verify Token and redirect URI</div><div className={String(status.webhookUrl||'').startsWith('https://')?'good':'bad'}>{String(status.webhookUrl||'').startsWith('https://')?<CheckCircle2 size={17}/>:<AlertTriangle size={17}/>} Public HTTPS webhook URL</div><div className={status.scopes.includes('instagram_business_manage_comments') && status.scopes.includes('instagram_business_manage_messages') ? 'good' : 'bad'}><ShieldCheck size={17}/> Comment + message permissions</div></div><div className="endpoint-box"><span>Webhook callback</span><code>{status.webhookUrl || '—'}</code><span>OAuth redirect</span><code>{status.redirectUri || '—'}</code></div></section>
      <section className="panel ads-ready-card"><span className="eyebrow">ADS + REELS</span><h3><Megaphone size={18}/> Comment → DM behavior</h3><p>PingCheck listens for Meta comment webhook events. If an active automation matches the comment keyword, it sends the private details message using the comment ID.</p><div className="mini-flow"><span>Reel / post / eligible ad comment</span><b>→</b><span>Meta webhook</span><b>→</b><span>Keyword match</span><b>→</b><span>Private DM</span></div><small>For ad comments, Meta must deliver the comment for the connected Instagram Professional account. Some ad-management/discovery workflows require additional Marketing API assets and permissions.</small></section>
    </div>

    <section className="panel simulator"><div><span className="eyebrow">SAFE TEST</span><h3>Simulate an incoming comment</h3><p>Test matching without waiting for a real comment. In demo mode no Meta message is sent.</p></div><div className="simulator-form"><select value={testSource} onChange={e=>setTestSource(e.target.value)}><option value="INSTAGRAM">Post / Reel</option><option value="AD">Ad comment</option></select><input value={testText} onChange={e=>setTestText(e.target.value)}/><button className="btn ghost" onClick={simulate}><TestTube2 size={16}/> Simulate Comment</button></div></section>
  </div>;
}
