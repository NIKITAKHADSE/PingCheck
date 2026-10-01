import { formatDate } from '../dateFormat.js';
import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Users, Target, ShoppingBag, Plus, Zap, Instagram } from 'lucide-react';
import useLiveData from '../hooks/useLiveData.js';
import LiveDataStatus from '../components/LiveDataStatus.jsx';
import AiChat from '../components/AiChat.jsx';

const icons = [MessageSquare, Users, Target, ShoppingBag];
export default function Overview(){
  const { data, error, updatedAt, refresh } = useLiveData('/api/dashboard');
  if (!data) return <div><LiveDataStatus error={error} updatedAt={updatedAt} refresh={refresh}/>{!error && <div className="loading">Loading dashboard...</div>}</div>;
  const stats=Array.isArray(data.stats)?data.stats:[];
  const automations=Array.isArray(data.automations)?data.automations:[];
  const activity=Array.isArray(data.activity)?data.activity:[];
  return <div>
    <div className="page-heading"><div><span className="eyebrow">OVERVIEW</span><h1>Instagram automation workspace</h1><p>Monitor connected-account activity, comment automations and captured leads.</p></div><Link className="btn primary" to="/dashboard/automations/new"><Plus size={17}/> Create Automation</Link></div>
    <LiveDataStatus error={error} updatedAt={updatedAt} refresh={refresh}/>
    <div className="stat-grid">{stats.map((s,i)=>{const Icon=icons[i]||Instagram;return <div className="stat-card" key={s.label}><div className="stat-top"><span>{s.label}</span><Icon size={18}/></div><strong>{s.value == null ? '\u2014' : Number(s.value).toLocaleString()}</strong><small>{s.detail}</small></div>})}</div>
    <AiChat />
    <div className="two-col">
      <section className="panel"><div className="panel-title"><div><span className="eyebrow">PERFORMANCE</span><h3>Top automations</h3></div><Link to="/dashboard/automations">View all</Link></div>
        {automations.length===0?<div className="empty-mini">No automations yet. Create one to start.</div>:<div className="table-wrap"><table><thead><tr><th>Automation</th><th>Status</th><th>Successful runs</th><th>Unique leads</th></tr></thead><tbody>{automations.map(a=>{const status=String(a.status||'DRAFT');return <tr key={a.id}><td><Link className="row-link" to={`/dashboard/automations/${a.id}`}>{a.name||'Untitled'}</Link></td><td><span className={`badge ${status.toLowerCase()}`}>{status}</span></td><td>{Number(a.runs||0)}</td><td>{Number(a.leads||0)}</td></tr>})}</tbody></table></div>}
      </section>
      <section className="panel"><div className="panel-title"><div><span className="eyebrow">LIVE FEED</span><h3>Recent activity</h3></div></div><div className="activity-list">{activity.length===0?<div className="empty-mini">Webhook and automation events will appear here.</div>:activity.map(a=><div className="activity-item" key={a.id}><div className="activity-icon"><Zap size={15}/></div><div><strong>{a.text}</strong><small>{a.at?formatDate(a.at):'—'}</small></div></div>)}</div></section>
    </div>
  </div>;
}
