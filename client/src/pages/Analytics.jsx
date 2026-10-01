import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Bot, Target, Users } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { api } from '../api.js';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api('/api/analytics').then(setData).catch((e) => setError(e.message)); }, []);
  const points = Array.isArray(data?.points) ? data.points : [];
  const top = Array.isArray(data?.topAutomations) ? data.topAutomations : [];
  const totals = useMemo(() => {
    const runs = top.reduce((sum, item) => sum + Number(item.runs || 0), 0);
    const leads = top.reduce((sum, item) => sum + Number(item.leads || 0), 0);
    return { runs, leads, conversion: runs ? Math.round((leads / runs) * 100) : 0 };
  }, [top]);
  if (error) return <div className="alert error">Could not load analytics: {error}</div>;
  if (!data) return <div className="loading">Loading analytics...</div>;
  return <div>
    <div className="page-heading"><div><span className="eyebrow">INSIGHTS</span><h1>Analytics</h1><p>Track automation runs, leads and conversion performance.</p></div></div>
    <div className="stat-grid">
      <div className="stat-card"><div className="stat-top"><span>Automation runs</span><Activity size={17}/></div><strong>{totals.runs.toLocaleString()}</strong><small>Across tracked automations</small></div>
      <div className="stat-card"><div className="stat-top"><span>Leads generated</span><Users size={17}/></div><strong>{totals.leads.toLocaleString()}</strong><small>Captured by automations</small></div>
      <div className="stat-card"><div className="stat-top"><span>Conversion</span><Target size={17}/></div><strong>{totals.conversion}%</strong><small>Leads per automation run</small></div>
      <div className="stat-card"><div className="stat-top"><span>Automations</span><Bot size={17}/></div><strong>{top.length}</strong><small>Included in this report</small></div>
    </div>
    <div className="two-col analytics">
      <section className="panel chart-panel"><div className="panel-title"><div><span className="eyebrow">LAST 7 DAYS</span><h3>Automation activity</h3></div></div>{points.length === 0 ? <div className="empty-mini">No activity yet. Published automations will appear here.</div> : <div className="analytics-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={points}><defs><linearGradient id="fillRuns" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#13343C" stopOpacity={0.3}/><stop offset="95%" stopColor="#13343C" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="day"/><YAxis/><Tooltip/><Area type="monotone" dataKey="runs" stroke="#13343C" fill="url(#fillRuns)" strokeWidth={2}/></AreaChart></ResponsiveContainer></div>}</section>
      <section className="panel"><div className="panel-title"><div><span className="eyebrow">RANKING</span><h3>Top automations</h3></div></div>{top.length === 0 ? <div className="empty-mini">No automation data yet.</div> : <div className="rank-list">{top.map((item, index) => <div key={item.id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{item.name || 'Untitled'}</strong><small>{Number(item.leads || 0)} leads</small></div><b>{Number(item.runs || 0)}</b></div>)}</div>}</section>
    </div>
  </div>;
}
