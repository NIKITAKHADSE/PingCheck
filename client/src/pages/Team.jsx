import { formatDate } from '../dateFormat.js';
import React, { useEffect, useState } from 'react';
import { Mail, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { api } from '../api.js';

export default function Team() {
  const [data, setData] = useState({ members: [], invites: [] });
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('AGENT');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = async () => { try { const result = await api('/api/team'); setData({ members: Array.isArray(result.members) ? result.members : [], invites: Array.isArray(result.invites) ? result.invites : [] }); setError(''); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const invite = async () => { if (!email.trim()) { setError('Enter a teammate email address.'); return; } setBusy(true); setError(''); try { await api('/api/team/invite', { method: 'POST', body: JSON.stringify({ email, role }) }); setEmail(''); await load(); } catch (e) { setError(e.message); } finally { setBusy(false); } };
  if (loading) return <div className="loading">Loading team...</div>;
  return <div>
    <div className="page-heading"><div><span className="eyebrow">SYSTEM</span><h1>Team</h1><p>Manage workspace members and invitation records.</p></div></div>
    {error && <div className="alert error">{error}</div>}
    <div className="team-summary"><div><Users size={19}/><span><strong>{data.members.length}</strong> workspace members</span></div><div><Mail size={19}/><span><strong>{data.invites.length}</strong> pending invitations</span></div></div>
    <section className="panel team-invite"><div><UserPlus size={22}/><div><strong>Invite teammate</strong><span>Add someone to this workspace with the appropriate access.</span></div></div><div><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com"/><select value={role} onChange={(e) => setRole(e.target.value)}><option>ADMIN</option><option>MANAGER</option><option>AGENT</option><option>VIEWER</option></select><button className="btn primary" disabled={busy} onClick={invite}>{busy ? 'Inviting...' : 'Invite'}</button></div></section>
    <div className="settings-grid">
      <section className="panel"><span className="eyebrow">MEMBERS</span><h3>{data.members.length} members</h3>{data.members.length === 0 ? <div className="empty-mini">No workspace members found.</div> : <div className="team-list">{data.members.map((member) => <div key={member.id}><div className="avatar">{String(member.user?.name || member.user?.email || 'M').slice(0, 2).toUpperCase()}</div><div><strong>{member.user?.name || 'Member'}</strong><small>{member.user?.email || 'No email available'}</small></div><span className="badge active"><ShieldCheck size={12}/>{member.role}</span></div>)}</div>}</section>
      <section className="panel"><span className="eyebrow">PENDING</span><h3>{data.invites.length} invitations</h3>{data.invites.length === 0 ? <div className="empty-mini">No pending invitations. Invite a teammate using the form above.</div> : <div className="team-list">{data.invites.map((inviteItem) => <div key={inviteItem.id}><div className="avatar"><Mail size={15}/></div><div><strong>{inviteItem.email}</strong><small>{formatDate(inviteItem.createdAt)}</small></div><span className="badge draft">{inviteItem.role}</span></div>)}</div>}</section>
    </div>
  </div>;
}
