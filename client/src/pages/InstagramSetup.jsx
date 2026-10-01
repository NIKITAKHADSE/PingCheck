import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Heart, MessageCircle, Send, Bookmark, Home, Search, PlusSquare, Film, UserCircle, MoreHorizontal, Image as ImageIcon } from 'lucide-react';
import { api } from '../api.js';
import './instagram-setup.css';

function MediaImage({ item, className = '' }) {
  const [failed, setFailed] = useState(false);
  const source = item?.thumbnail_url || item?.media_url;
  useEffect(() => setFailed(false), [source]);
  if (!source || failed) return <div className={`ig-image-fallback ${className}`}><ImageIcon size={28}/><span>Preview unavailable</span></div>;
  return item.media_type === 'VIDEO' && !item.thumbnail_url ? <video className={className} src={source} controls playsInline preload="metadata"/> : <img className={className} src={source} alt={item.caption || 'Instagram post'} onError={() => setFailed(true)}/>;
}

export default function InstagramSetup({ editing = false }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState('');
  const [media, setMedia] = useState([]);
  const [nextCursor, setNextCursor] = useState('');
  const [moreLoading, setMoreLoading] = useState(false);
  const [mediaId, setMediaId] = useState('');
  const [scope, setScope] = useState('specific');
  const [step, setStep] = useState(1);
  const [tab, setTab] = useState('Post');
  const [error, setError] = useState('');
  const [mediaError, setMediaError] = useState('');
  const [loading, setLoading] = useState(true);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [refresh, setRefresh] = useState(0);
  const request = useRef(0);
  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    Promise.all([api(`/api/automations/${id}`), api('/api/integrations/meta/status')]).then(([a, connected]) => {
      if (!active) return;
      setDraft(a.automation); setAccounts(connected.accounts || []);
      const selected = (connected.accounts || []).find(x => [String(x.id), String(x.instagramUserId)].includes(String(a.automation.instagramAccountId)));
      setAccountId(selected?.instagramUserId || (!a.automation.instagramAccountId && !editing && connected.accounts?.length === 1 ? connected.accounts[0].instagramUserId : ''));
      setMediaId(a.automation.mediaId || '');
      setScope(a.automation.mediaId || !editing ? 'specific' : 'any');
    }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, refresh, editing]);
  const [mediaRefresh, setMediaRefresh] = useState(0);
  useEffect(() => {
    const current = ++request.current;
    setMedia([]); setMediaError(''); setNextCursor(''); setMoreLoading(false);
    if (!accountId) { setMediaLoading(false); return; }
    setMediaLoading(true);
    api(`/api/integrations/meta/accounts/${encodeURIComponent(accountId)}/media`).then(r => {
      if (request.current === current) { setMedia(r.media || []); setNextCursor(r.nextCursor || ''); }
    }).catch(e => { if (request.current === current) setMediaError(e.message); }).finally(() => { if (request.current === current) setMediaLoading(false); });
    return () => { request.current++; };
  }, [accountId, mediaRefresh]);
  const loadMore = async () => {
    const current = request.current;
    setMoreLoading(true); setMediaError('');
    try {
      const result = await api(`/api/integrations/meta/accounts/${encodeURIComponent(accountId)}/media?after=${encodeURIComponent(nextCursor)}`);
      if (request.current !== current) return;
      setMedia(previous => Array.from(new Map([...previous, ...result.media].map(m => [m.id, m])).values()));
      setNextCursor(result.nextCursor || '');
    } catch(e) { if (request.current === current) setMediaError(e.message); }
    finally { if (request.current === current) setMoreLoading(false); }
  };
  const account = accounts.find(a => String(a.instagramUserId) === String(accountId));
  const post = media.find(m => String(m.id) === String(mediaId)) || (scope === 'any' ? media[0] : null);
  const change = (key, value) => { setDraft(d => ({ ...d, [key]: value })); setNotice(''); };
  const validSelection = Boolean(account && (scope === 'any' || media.some(m => String(m.id) === String(mediaId))));
  const save = async live => {
    setError(''); setNotice('');
    if (!validSelection) { setError('Select a connected account and a post, or choose any post or reel.'); setStep(1); return; }
    if (!draft.name?.trim() || !draft.privateReply?.trim()) { setError('Add an automation name and private message.'); setStep(2); return; }
    if (live && /\[add your[^\]]*\]/i.test(draft.privateReply)) { setError('Replace the template placeholders with your own details or link before going live.'); setStep(2); return; }
    setBusy(true);
    try {
      await api(`/api/automations/${id}`, { method: 'PUT', body: JSON.stringify({ name: draft.name, instagramAccountId: account.instagramUserId, mediaId: scope === 'any' ? '' : mediaId, triggerScope: draft.triggerScope || 'ALL', keyword: draft.keyword, matchType: draft.matchType || 'CONTAINS', privateReply: draft.privateReply, publicReply: draft.publicReply }) });
      if (live) { await api(`/api/automations/${id}/publish`, { method: 'POST' }); setDraft(d => ({ ...d, status: 'ACTIVE' })); }
      setNotice(live ? 'Your automation is live. New matching comments can trigger your reply.' : draft.status === 'ACTIVE' ? 'Changes saved to your active automation.' : 'Changes saved.');
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  if (loading) return <div className="loading">Loading Instagram setup…</div>;
  if (!draft) return <div className="alert error" role="alert">{error || 'Unable to load automation.'} <button onClick={() => setRefresh(v => v + 1)}>Retry</button></div>;
  return <div className="ig-setup">
    <aside className="ig-setup-controls">
      <Link className="ig-back" to="/dashboard/automations"><ArrowLeft size={16}/> Automations</Link>
      <div className="ig-editor-summary"><strong>{draft.name}</strong><span>{draft.status || 'DRAFT'}</span></div>
      <label className="ig-field">Instagram account<select disabled={busy} value={accountId} onChange={e => { setAccountId(e.target.value); setMediaId(''); setNotice(''); }}><option value="">Select a connected account</option>{accounts.map(a => <option key={a.id} value={a.instagramUserId}>@{a.username}</option>)}</select></label>
      {!accounts.length && <p className="ig-setup-note">Connect an Instagram account to load its posts and reels. <Link to="/dashboard/integrations">Connect Instagram</Link></p>}
      {draft.instagramAccountId && !accountId && <p className="ig-setup-note">The saved Instagram account is not currently available. Select a connected account to continue.</p>}
      <label className="ig-field">Comment source<select disabled={busy} value={draft.triggerScope || 'ALL'} onChange={e => change('triggerScope', e.target.value)}><option value="ALL">Posts, Reels &amp; eligible ad comments</option><option value="ORGANIC">Organic posts &amp; Reels</option><option value="ADS">Ads only</option></select></label>
      {step === 1 ? <>
        <h2>When someone comments on</h2>
        <section className="ig-choice"><label><input type="radio" name="postScope" checked={scope === 'specific'} onChange={() => setScope('specific')}/> a specific post or reel</label>
          {scope === 'specific' && <><div className="ig-media-toolbar"><span>Recent posts and reels</span><button aria-label="Refresh Instagram posts" disabled={!accountId || mediaLoading} onClick={() => setMediaRefresh(v => v + 1)}><RefreshCw size={15}/></button></div>
          {mediaLoading ? <p role="status">Loading posts from Instagram…</p> : mediaError ? <div role="alert" className="ig-setup-note">{mediaError}<button onClick={() => setMediaRefresh(v => v + 1)}>Try again</button></div> : !accountId ? <p>Select your Instagram account above.</p> : !media.length ? <p>No posts or reels were returned. Publish content on this account, then refresh.</p> : <div className="ig-post-grid">{media.map(m => <button key={m.id} className={String(mediaId) === String(m.id) ? 'selected' : ''} aria-label={`Select ${m.caption || m.media_type || 'post'}`} aria-pressed={String(mediaId) === String(m.id)} onClick={() => setMediaId(m.id)}><MediaImage item={m}/>{m.media_type === 'VIDEO' && <Film size={14} className="ig-reel-icon"/>}</button>)}</div>}
          {nextCursor && <button className="ig-button" disabled={moreLoading} onClick={loadMore}>{moreLoading ? 'Loading…' : 'Load more posts and reels'}</button>}
          {mediaId && !mediaLoading && !media.some(m => String(m.id) === String(mediaId)) && <p>The saved post is not loaded yet. Use Load more to find older posts, or refresh.</p>}</>}
        </section>
        <section className="ig-choice"><label><input type="radio" name="postScope" checked={scope === 'any'} onChange={() => setScope('any')}/> any post or reel</label></section>
        <button className="ig-button" disabled={!validSelection} onClick={() => { setStep(2); setTab('DM'); }}>Next</button>
      </> : <>
        <h2>Send them the details</h2>
        <label className="ig-field">Automation name<input value={draft.name} onChange={e => change('name', e.target.value)}/></label>
        <label className="ig-field">Comment keyword<input value={draft.keyword} onChange={e => change('keyword', e.target.value)} placeholder="Leave empty for any comment"/></label>
        <label className="ig-field">Match<select value={draft.matchType || 'CONTAINS'} onChange={e => change('matchType', e.target.value)}><option value="CONTAINS">Contains keyword</option><option value="EXACT">Exact keyword</option></select></label>
        <label className="ig-field">Public reply (optional)<textarea rows={2} value={draft.publicReply} onChange={e => change('publicReply', e.target.value)}/></label>
        <label className="ig-field">Private message<textarea rows={7} value={draft.privateReply} onChange={e => change('privateReply', e.target.value)}/></label>
        <p className="ig-setup-note">Add your real details or link. {'{{first_name}}'} is replaced with the commenter’s name.</p>
        <div className="ig-step-actions"><button className="ig-button" onClick={() => { setStep(1); setTab('Post'); }}>Back</button><button className="ig-button" disabled={busy} onClick={() => save(false)}>{draft.status === 'ACTIVE' ? 'Save changes' : 'Save draft'}</button></div>
      </>}
      {error && <div className="ig-setup-error" role="alert">{error}</div>}{notice && <div className="ig-setup-success" role="status">{notice}</div>}
      <Link className="ig-flow-editor-link" to={`/dashboard/automations/${id}/editor`}>Open visual flow editor</Link>
    </aside>
    <section className="ig-preview-area"><header><span>Preview</span><button className="ig-button" disabled={busy || !validSelection || step !== 2} onClick={() => save(true)}>{busy ? 'Saving…' : 'Go Live'}</button></header>
      <div className="ig-phone-wrap"><div className="ig-phone"><div className="ig-phone-status"><span>9:41</span><i/><span>▮▮▮ ▰</span></div><div className="ig-phone-title"><ArrowLeft size={17}/><div><small>{account?.username || 'Instagram account'}</small><strong>{tab === 'DM' ? 'Messages' : tab === 'Comments' ? 'Comments' : 'Posts'}</strong></div></div>
        <div className="ig-phone-scroll"><div className="ig-post-account">{account?.profilePictureUrl ? <img src={account.profilePictureUrl} alt=""/> : <UserCircle size={28}/>}<strong>{account?.username || 'Select an account'}</strong><MoreHorizontal size={17}/></div>
        {tab === 'Post' ? <>{post ? <><MediaImage item={post} className="ig-preview-image"/><div className="ig-post-icons"><Heart/><MessageCircle/><Send/><Bookmark/></div>{post.caption && <p className="ig-post-caption"><strong>{account?.username}</strong> {post.caption}</p>}{post.timestamp && <small className="ig-post-date">{new Date(post.timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</small>}{post.permalink && <a className="ig-original" href={post.permalink} target="_blank" rel="noreferrer">View on Instagram</a>}</> : <div className="ig-preview-placeholder"><ImageIcon size={42}/><p>{mediaLoading ? 'Loading your posts…' : 'Select a post to preview it here'}</p></div>}</> : <div className="ig-message-preview"><small>Example preview</small>{tab === 'Comments' ? <><p><b>Someone</b> {draft.keyword || 'Your audience’s comment'}</p>{draft.publicReply && <p><b>{account?.username || 'Your account'}</b> {draft.publicReply}</p>}</> : <div className="ig-dm-bubble">{String(draft.privateReply || '').replaceAll('{{first_name}}', 'Alex').replaceAll('{{username}}', 'alex')}</div>}</div>}
        </div><div className="ig-phone-nav"><Home/><Search/><PlusSquare/><Film/><UserCircle/></div></div>
        <div className="ig-preview-tabs" aria-label="Preview mode">{['Post', 'Comments', 'DM'].map(t => <button key={t} aria-pressed={tab === t} className={tab === t ? 'selected' : ''} onClick={() => setTab(t)}>{t}</button>)}</div>
        {scope === 'any' && <p className="ig-preview-hint">Preview of one recent post. This automation applies to any post or reel.</p>}
      </div>
    </section>
  </div>;
}
