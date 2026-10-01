import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Workflow, LayoutTemplate, Inbox, Users, BarChart3,
  Sparkles, BookOpen, PlugZap, UserRoundCog, Settings, LogOut, Menu, X
} from 'lucide-react';
import { api } from '../api.js';
import AccountMenu from './AccountMenu.jsx';
import { saveDatePreferences } from '../dateFormat.js';

const groups = [
  { label: '', items: [['Overview', '/dashboard', LayoutDashboard, true]] },
  { label: 'AUTOMATION', items: [['Automations', '/dashboard/automations', Workflow], ['Templates', '/dashboard/templates', LayoutTemplate]] },
  { label: 'ENGAGEMENT', items: [['Inbox', '/dashboard/inbox', Inbox], ['Contacts', '/dashboard/contacts', Users]] },
  { label: 'INSIGHTS', items: [['Analytics', '/dashboard/analytics', BarChart3]] },
  { label: 'AI', items: [['AI Assistant', '/dashboard/ai', Sparkles], ['Knowledge Base', '/dashboard/knowledge', BookOpen]] },
  { label: 'SYSTEM', items: [['Integrations', '/dashboard/integrations', PlugZap], ['Team', '/dashboard/team', UserRoundCog], ['Settings', '/dashboard/settings', Settings]] }
];

export default function Layout() {
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const automationLibrary = location.pathname.replace(/\/$/, '') === '/dashboard/automations';

  useEffect(() => {
    const loadProfile = () => api('/api/auth/me').then(result => { saveDatePreferences(result.workspace); setProfile(result); }).catch(() => {
      localStorage.removeItem('flowvik_token');
      navigate('/login', { replace: true });
    });
    loadProfile();
    window.addEventListener('flowvik-workspace-updated', loadProfile);
    return () => window.removeEventListener('flowvik-workspace-updated', loadProfile);
  }, [navigate]);

  const logout = async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch {}
    localStorage.removeItem('flowvik_token');
    localStorage.removeItem('flowvik_date_preferences');
    navigate('/login', { replace: true });
  };

  const initials = String(profile?.user?.name || 'FV').split(' ').map((p) => p[0]).join('').slice(0,2).toUpperCase();

  return (
    <div className={`app-shell ${automationLibrary ? 'automation-shell' : ''}`}>
      <button className="mobile-menu" onClick={() => setOpen(true)}><Menu size={20}/></button>
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand-row"><div className="brand-mark">P</div><div><strong>PingCheck</strong><small>Instagram Automation</small></div><button className="sidebar-close" onClick={() => setOpen(false)}><X size={20}/></button></div>
        <AccountMenu profile={profile} onNavigate={() => setOpen(false)} />
        <nav>
          {groups.map((group, gi) => <div className="nav-group" key={gi}>
            {group.label && <div className="nav-label">{group.label}</div>}
            {group.items.map(([name, to, Icon, end]) => <NavLink end={Boolean(end)} key={to} to={to} onClick={() => setOpen(false)} className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}><Icon size={18}/><span>{name}</span></NavLink>)}
          </div>)}
        </nav>
        <div className="sidebar-footer">
          <div className="workspace-card"><div className="avatar">{initials}</div><div><strong>{profile?.workspace?.name || 'Loading workspace...'}</strong><small>{profile?.workspace?.plan || 'FREE'} plan</small></div></div>
          <button className="logout-btn" onClick={logout}><LogOut size={16}/> Logout</button>
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <main className="main-content"><Outlet /></main>
    </div>
  );
}
