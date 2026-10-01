import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ReactFlow, Background, Controls, MiniMap, addEdge, useEdgesState, useNodesState } from '@xyflow/react';
import { ArrowLeft, Save, Send, PlayCircle, Instagram, AlertTriangle, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { api } from '../api.js';
import PostGallery from '../components/PostGallery.jsx';

const starterNodes = [
  { id: 'trigger-1', position: { x: 80, y: 120 }, data: { label: '⚡ Instagram Comment\nKeyword: PRICE' }, style: { width: 220, border: '1px solid #dbe5e2', borderRadius: 14, padding: 12, whiteSpace: 'pre-line' } },
  { id: 'message-1', position: { x: 390, y: 120 }, data: { label: '💬 Private DM\nSend requested details' }, style: { width: 220, border: '1px solid #dbe5e2', borderRadius: 14, padding: 12, whiteSpace: 'pre-line' } }
];
const starterEdges = [{ id: 'e1', source: 'trigger-1', target: 'message-1' }];

function ensurePrimaryEdge(nodes, edges) {
  const items = Array.isArray(edges) ? edges : [];
  const ids = new Set((Array.isArray(nodes) ? nodes : []).map((node) => node.id));
  if (!ids.has('trigger-1') || !ids.has('message-1')) return items;
  if (items.some((edge) => edge.source === 'trigger-1' && edge.target === 'message-1')) return items;
  return [...items, { id: 'trigger-to-private-dm', source: 'trigger-1', target: 'message-1' }];
}

export default function AutomationEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id;
  const [name, setName] = useState('Comment → Product Details');
  const [instagramAccountId, setInstagramAccountId] = useState('');
  const [triggerScope, setTriggerScope] = useState('ALL');
  const [keyword, setKeyword] = useState('PRICE');
  const [matchType, setMatchType] = useState('CONTAINS');
  const [mediaId, setMediaId] = useState('');
  const [publicReply, setPublicReply] = useState('Sent you a DM! 🚀');
  const [privateReply, setPrivateReply] = useState('Hey {{first_name}} 👋 Thanks for commenting! Here are the details you requested.');
  const [status, setStatus] = useState('DRAFT');
  const [accounts, setAccounts] = useState([]);
  const [media, setMedia] = useState([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const [nodes, setNodes, onNodesChange] = useNodesState(starterNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(starterEdges);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(Boolean(id));
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const accountAutoSelected = useRef(false);
  const mediaRequestId = useRef(0);
  const selectedAccountId = instagramAccountId || (accounts.length === 1 ? accounts[0].instagramUserId : '');
  const selectedAccount = accounts.find((account) =>
    String(account.instagramUserId) === String(selectedAccountId) || String(account.id) === String(selectedAccountId)
  );
  const metaInstagramUserId = selectedAccount?.instagramUserId || selectedAccountId;

  useEffect(() => {
    api('/api/integrations/meta/status').then((r) => setAccounts(Array.isArray(r.accounts) ? r.accounts : [])).catch(() => setAccounts([]));
  }, []);

  const loadMedia = useCallback(async (accountId) => {
    const requestId = ++mediaRequestId.current;
    if (!accountId) { setMedia([]); setMediaError(''); setMediaLoading(false); return; }
    setMediaLoading(true); setMediaError('');
    try {
      const r = await api(`/api/integrations/meta/accounts/${accountId}/media`);
      if (requestId !== mediaRequestId.current) return;
      setMedia(Array.isArray(r.media) ? r.media : []);
    } catch (e) {
      if (requestId !== mediaRequestId.current) return;
      setMedia([]); setMediaError(e.message);
    } finally { if (requestId === mediaRequestId.current) setMediaLoading(false); }
  }, []);

  useEffect(() => { loadMedia(selectedAccountId); }, [selectedAccountId, loadMedia]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api(`/api/automations/${id}`).then((r) => {
      const a = r.automation || {};
      setName(a.name || 'Untitled Automation');
      setInstagramAccountId(a.instagramAccountId || '');
      setTriggerScope(a.triggerScope || 'ALL');
      setKeyword(a.keyword || '');
      setMatchType(a.matchType || 'CONTAINS');
      setMediaId(a.mediaId || '');
      setPublicReply(a.publicReply || '');
      setPrivateReply(a.privateReply || '');
      setStatus(a.status || 'DRAFT');
      const loadedNodes = Array.isArray(a.nodes) && a.nodes.length ? a.nodes : starterNodes;
      setNodes(loadedNodes);
      setEdges(ensurePrimaryEdge(loadedNodes, a.edges));
    }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [id, setNodes, setEdges]);

  useEffect(() => {
    if (accountAutoSelected.current || loading || accounts.length !== 1 || instagramAccountId) return;
    accountAutoSelected.current = true;
    setInstagramAccountId(accounts[0].instagramUserId);
  }, [accounts, instagramAccountId, loading]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
  const requiredEdges = useMemo(() => ensurePrimaryEdge(nodes, edges), [nodes, edges]);
  const payload = useMemo(() => ({ name, instagramAccountId: metaInstagramUserId, triggerScope, keyword, matchType, mediaId, publicReply, privateReply, nodes, edges: requiredEdges }), [name, metaInstagramUserId, triggerScope, keyword, matchType, mediaId, publicReply, privateReply, nodes, requiredEdges]);

  const save = async () => {
    if (!name.trim()) { setError('Enter an automation name.'); return; }
    if (!privateReply.trim()) { setError('Enter the details message to send by DM.'); return; }
    setBusy(true); setMessage(''); setError('');
    try {
      if (isNew) {
        const r = await api('/api/automations', { method: 'POST', body: JSON.stringify(payload) });
        setMessage('Automation created.');
        navigate(`/dashboard/automations/${r.automation.id}`, { replace: true });
      } else {
        await api(`/api/automations/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
        setMessage('Automation saved.');
      }
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const publish = async () => {
    if (!name.trim()) { setError('Enter an automation name.'); return; }
    if (!privateReply.trim()) { setError('Add a details message before publishing.'); return; }
    setBusy(true); setMessage(''); setError('');
    try {
      let automationId = id;
      if (isNew) {
        const created = await api('/api/automations', { method: 'POST', body: JSON.stringify(payload) });
        automationId = created.automation.id;
      } else {
        await api(`/api/automations/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      }
      await api(`/api/automations/${automationId}/publish`, { method: 'POST' });
      setStatus('ACTIVE'); setMessage('Published. New matching Instagram comments can now trigger this flow.');
      if (isNew) navigate(`/dashboard/automations/${automationId}`, { replace: true });
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const test = async () => {
    if (isNew) { setMessage('Save first, then test.'); return; }
    try {
      const r = await api(`/api/automations/${id}/test`, { method: 'POST', body: JSON.stringify({ text: keyword, instagramAccountId: metaInstagramUserId, mediaId, sourceType: triggerScope === 'ADS' ? 'AD' : 'INSTAGRAM' }) });
      setMessage(r.matched ? 'Test passed: trigger and keyword matched.' : 'Test did not match. Check the account, media ID, scope and keyword.');
    } catch (e) { setError(e.message); }
  };

  if (loading) return <div className="loading">Loading automation builder...</div>;

  return <div className="editor-page">
    <div className="editor-top">
      <button className="icon-btn" onClick={() => navigate('/dashboard/automations')}><ArrowLeft size={18} /></button>
      <div className="editor-name"><input value={name} onChange={e => setName(e.target.value)} /><span className={`badge ${String(status).toLowerCase()}`}>{status}</span></div>
      <div className="editor-actions"><button className="btn ghost" disabled={busy} onClick={test}><PlayCircle size={16} /> Test</button><button className="btn ghost" disabled={busy} onClick={save}><Save size={16} /> Save</button><button className="btn primary" disabled={busy} onClick={publish}><Send size={16} /> {busy ? 'Working...' : 'Publish'}</button></div>
    </div>
    {message && <div className="editor-message">{message}</div>}
    {error && <div className="alert error editor-alert">{error}</div>}
    <div className="builder-grid">
      <section className="flow-wrap"><ReactFlow nodes={nodes} edges={requiredEdges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} fitView><Background gap={20} /><Controls /><MiniMap pannable zoomable /></ReactFlow></section>
      <aside className="config-panel">
        <span className="eyebrow">TRIGGER</span><h3><Instagram size={17} /> Instagram Comment</h3>
        <label>Connected Instagram account<select value={selectedAccount?.instagramUserId || selectedAccountId} onChange={e => { setInstagramAccountId(e.target.value); setMediaId('') }}>{accounts.length > 1 && <option value="">Any connected account</option>}{accounts.length === 0 && <option value="">No connected Instagram account</option>}{accounts.map((a) => <option key={a.id} value={a.instagramUserId}>@{a.username || 'instagram_account'}</option>)}</select></label>
        {accounts.length === 0 && <div className="builder-warning"><AlertTriangle size={15} /> No real Instagram account connected yet. You can build and test the flow, then connect an account from Integrations.</div>}
        <label>Comment source<select value={triggerScope} onChange={e => setTriggerScope(e.target.value)}><option value="ALL">Posts, Reels & eligible ad comments</option><option value="ORGANIC">Organic posts & Reels</option><option value="ADS">Ads only (when Meta marks/delivers the ad comment)</option></select></label>
        <label>Post or Reel <span className="field-help">optional</span>
          <div className="media-select-row">
            <select value={mediaId} disabled={!selectedAccountId || mediaLoading} onChange={e => setMediaId(e.target.value)}>
              <option value="">{!selectedAccountId ? 'Select an account first' : mediaLoading ? 'Loading posts and Reels...' : 'Any post or Reel'}</option>
              {mediaId && !media.some((item) => String(item.id) === String(mediaId)) && <option value={mediaId}>Previously selected media ({mediaId})</option>}
              {media.map((item) => <option key={item.id} value={item.id}>{item.media_product_type || item.media_type || 'POST'} · {String(item.caption || 'Untitled media').replace(/\s+/g, ' ').slice(0, 65)}</option>)}
            </select>
            {selectedAccountId && <button className="icon-btn" type="button" title="Refresh posts and Reels" disabled={mediaLoading} onClick={() => loadMedia(selectedAccountId)}><RefreshCw size={15} /></button>}
          </div>
        </label>
        <PostGallery accountId={selectedAccountId} selectedId={mediaId} onSelect={setMediaId}/>
        {mediaError && <div className="builder-warning"><AlertTriangle size={15} /><span>{mediaError}</span></div>}
        {selectedAccountId && !mediaLoading && !mediaError && media.length === 0 && <div className="builder-warning"><AlertTriangle size={15} /> No posts or Reels were returned for this account. Choose any media or refresh after publishing content.</div>}
        <label>Comment keyword <span className="field-help">leave blank for every comment</span><input value={keyword} onChange={e => setKeyword(e.target.value)} placeholder="PRICE" /></label>
        <label>Match<select value={matchType} onChange={e => setMatchType(e.target.value)}><option value="CONTAINS">Contains</option><option value="EXACT">Exact</option></select></label>
        <label>Reply under the comment <span className="field-help">optional</span><input value={publicReply} onChange={e => setPublicReply(e.target.value)} placeholder="Sent you a DM! 🚀" /></label>
        <span className="eyebrow config-gap">PRIVATE DM</span>
        <label>Message to send privately<textarea rows="7" value={privateReply} onChange={e => setPrivateReply(e.target.value)} /></label>
        <div className="variable-row"><button type="button" onClick={() => setPrivateReply(v => v + ' {{first_name}}')}>{'{{first_name}}'}</button><button type="button" onClick={() => setPrivateReply(v => v + ' {{username}}')}>{'{{username}}'}</button><button type="button" onClick={() => setPrivateReply(v => `${v}${v && !v.endsWith('\n') ? '\n' : ''}https://example.com/details`)}><LinkIcon size={12} /> Add link</button></div>
      </aside>
    </div>
  </div>;
}
