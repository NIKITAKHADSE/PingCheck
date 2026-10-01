import React, { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Play, Pause, Pencil, Workflow, Shapes, ChevronsRight, Folder, ArrowLeft, RotateCcw, X } from 'lucide-react';
import { api } from '../api.js';
import useLiveData from '../hooks/useLiveData.js';
import './automations.css';
import TemplatePicker from '../components/TemplatePicker.jsx';

function AutomationArt() {
  const id = useId();
  return <svg className="automation-art" viewBox="0 0 220 190" aria-hidden="true">
    <defs><pattern id={id} width="64" height="64" patternUnits="userSpaceOnUse"><rect width="64" height="64" fill="#94dadd"/><path d="M0 0h32v32H0zM32 32h32v32H32z" fill="#4441c9"/></pattern></defs>
    <path d="M71 24C99 4 129 20 137 51C143 73 174 63 190 91C216 138 179 140 170 161C155 199 122 179 97 168C78 158 42 177 34 145C26 119 57 106 53 82C48 57 50 38 71 24Z" fill={`url(#${id})`}/>
    <g fill="#ffea00"><path d="m166 8 9 22 24-9-15 21 10 20-24-6-11 21-3-25-23-5 23-12z"/><path d="M164 40c-32 5-59 23-79 49l30-12-20 28c27-32 49-43 73-52z"/><path d="m63 70 8 16 17-5-10 15 7 17-18-6-12 13 1-19-18-4 18-10z"/><path d="M59 100C34 107 19 123 8 138l20-5-12 19c18-20 29-33 47-41z"/><path d="m153 100 13 15 19-9-9 20 11 16-23-3-10 19-2-23-21-7 21-9z"/><path d="M153 128c-27 4-50 24-70 40l19-4-8 18c24-29 41-35 63-43z"/></g>
  </svg>;
}

export default function Automations() {
  const { data, error, loading, refresh } = useLiveData('/api/automations');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('ALL');
  const [view, setView] = useState('all');
  const [folderId, setFolderId] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const items = data?.automations || [];
  const folders = data?.folders || [];
  const trash = view === 'trash';
  const activeFolder = folders.find(f => f.id === folderId);
  const visible = items.filter(a => Boolean(a.trashedAt) === trash && (!folderId || a.folderId === folderId));
  const filtered = visible.filter(a => (`${a.name || ''} ${a.keyword || ''}`).toLowerCase().includes(q.toLowerCase()) && (status === 'ALL' || a.status === status));
  const heading = trash ? 'Trash' : activeFolder?.name || 'My Automations';
  const act = async (path, body, method = 'POST') => {
    setErr(''); setBusy(true);
    try { await api(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) }); await refresh(); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };
  const organize = (id, action, extra = {}) => act(`/api/automations/${id}/organize`, { action, ...extra });
  const show = (next, folder = '') => { setView(next); setFolderId(folder); setQ(''); setStatus('ALL'); };
  const createFolder = async e => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      await api('/api/automation-folders', { method: 'POST', body: JSON.stringify({ name: folderName }) });
      await refresh(); setCreatingFolder(false); setFolderName('');
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  };
  const newButton = <button className="automation-primary" onClick={() => setTemplatesOpen(true)}><Plus size={18}/> New Automation</button>;
  return <div className="automation-library">
    {templatesOpen && <TemplatePicker onClose={() => setTemplatesOpen(false)}/>}
    <header className="automation-page-title"><h1>Automation</h1></header>
    <div className="automation-layout">
      <nav className="automation-subnav" aria-label="Automation navigation">
        <button className={!trash ? 'selected' : ''} onClick={() => show('all')}><Workflow size={16}/> My Automations</button>
        <Link to="/dashboard/templates"><Shapes size={16}/> Basic</Link>
        <button disabled title="Sequences are not available yet"><ChevronsRight size={16}/> Sequences <small>Soon</small></button>
      </nav>
      <section className="automation-main" aria-labelledby="automation-library-heading">
        <div className="automation-heading"><h2 id="automation-library-heading">{heading}</h2>{newButton}</div>
        {(error || err) && <div className="automation-error" role="alert">{err || error}{error && <button onClick={refresh}>Retry</button>}</div>}
        <div className="automation-controls">
          <label className="automation-search"><Search size={18}/><input aria-label="Search automations" placeholder="Search all Automations" value={q} onChange={e => setQ(e.target.value)}/>{q && <button aria-label="Clear search" onClick={() => setQ('')}><X size={14}/></button>}</label>
          {visible.length > 0 && <select aria-label="Filter by status" value={status} onChange={e => setStatus(e.target.value)}><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="DRAFT">Draft</option><option value="PAUSED">Paused</option></select>}
        </div>
        {!trash && <div className="automation-folders">
          {creatingFolder ? <form className="automation-folder-form" onSubmit={createFolder}><input autoFocus aria-label="Folder name" placeholder="Folder name" maxLength={80} required value={folderName} onChange={e => setFolderName(e.target.value)}/><button disabled={busy || !folderName.trim()} aria-label="Save folder"><Plus size={18}/></button><button type="button" aria-label="Cancel folder" onClick={() => setCreatingFolder(false)}><X size={18}/></button></form> : <button className="automation-new-folder" onClick={() => setCreatingFolder(true)} disabled={!data}><Plus size={19}/> New Folder</button>}
          {folders.map(f => <button key={f.id} className={`automation-folder ${f.id === folderId ? 'selected' : ''}`} onClick={() => show('all', f.id)}><Folder size={17}/><span>{f.name}</span><small>{items.filter(a => !a.trashedAt && a.folderId === f.id).length}</small></button>)}
        </div>}
        <div className="automation-utility">
          {(trash || folderId) && <button onClick={() => show('all')}><ArrowLeft size={15}/> All automations</button>}
          {!trash && <button className="automation-trash-link" onClick={() => show('trash')}><Trash2 size={14}/> Trash{items.some(a => a.trashedAt) && ` (${items.filter(a => a.trashedAt).length})`}</button>}
        </div>
        {loading ? <div className="automation-empty" role="status">Loading automations…</div> : !data ? <div className="automation-empty"><Workflow size={36}/><h3>Unable to load automations</h3><p>Check your connection and try again.</p><button className="automation-primary" onClick={refresh}>Try again</button></div> : filtered.length === 0 ? <div className="automation-empty">
          {trash ? <Trash2 size={48} strokeWidth={1}/> : <AutomationArt/>}
          <h3>{q || status !== 'ALL' ? 'No matching automations' : trash ? 'Your trash is empty' : activeFolder ? 'Add automations to this folder' : 'Create your first Automation'}</h3>
          <p>{q || status !== 'ALL' ? 'Try another keyword or clear your filters to see more automations.' : trash ? 'Automations you move to Trash will appear here. You can restore them at any time.' : activeFolder ? 'Use the folder menu on an automation to move it here.' : 'Automations are where you create chat automations in an easy and visual format. Try some automations we recommend based on your goals.'}</p>
          {q || status !== 'ALL' ? <button className="automation-text-button" onClick={() => { setQ(''); setStatus('ALL'); }}>Clear filters</button> : !trash && <><Link className="automation-learn" to="/dashboard/templates">Explore templates</Link>{newButton}</>}
        </div> : <div className="automation-list">
          <div className="automation-list-label"><span>{filtered.length} automation{filtered.length !== 1 ? 's' : ''}</span><span>{trash ? 'Restored automations stay paused until published' : 'Instagram comment → Private message'}</span></div>
          {filtered.map(a => <article className="automation-list-row" key={a.id}>
            <div className="automation-flow-icon"><Workflow size={23}/></div>
            <div className="automation-row-name">{trash ? <strong>{a.name || 'Untitled Automation'}</strong> : <Link to={`/dashboard/automations/${a.id}`}>{a.name || 'Untitled Automation'}</Link>}<small>Keyword: <b>{a.keyword || 'Any comment'}</b></small></div>
            <span className={`automation-status ${(a.status || 'DRAFT').toLowerCase()}`}>{a.status || 'DRAFT'}</span>
            <div className="automation-row-metrics"><strong>{Number(a.runs || 0).toLocaleString()}</strong><small>Successful runs</small></div>
            <div className="automation-row-actions">
              {trash ? <><button title="Restore as paused" aria-label={`Restore ${a.name}`} disabled={busy} onClick={() => organize(a.id, 'restore')}><RotateCcw size={17}/></button><button title="Delete permanently" aria-label={`Permanently delete ${a.name}`} disabled={busy} onClick={() => { if (window.confirm('Permanently delete this automation? This cannot be undone.')) act(`/api/automations/${a.id}`, null, 'DELETE'); }}><Trash2 size={17}/></button></> : <>
                {folders.length > 0 && <select aria-label={`Folder for ${a.name}`} value={a.folderId || ''} disabled={busy} onChange={e => organize(a.id, 'move', { folderId: e.target.value })}><option value="">No folder</option>{folders.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select>}
                <Link title="Edit automation" aria-label={`Edit ${a.name}`} to={`/dashboard/automations/${a.id}`}><Pencil size={16}/></Link>
                <button title={a.status === 'ACTIVE' ? 'Pause' : 'Publish'} aria-label={`${a.status === 'ACTIVE' ? 'Pause' : 'Publish'} ${a.name}`} disabled={busy} onClick={() => act(`/api/automations/${a.id}/${a.status === 'ACTIVE' ? 'pause' : 'publish'}`)}>{a.status === 'ACTIVE' ? <Pause size={17}/> : <Play size={17}/>}</button>
                <button title="Move to Trash and pause" aria-label={`Move ${a.name} to Trash`} disabled={busy} onClick={() => organize(a.id, 'trash')}><Trash2 size={16}/></button>
              </>}
            </div>
          </article>)}
        </div>}
      </section>
    </div>
  </div>;
}
