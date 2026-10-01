import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, X, Zap } from 'lucide-react';
import { api } from '../api.js';
import './template-picker.css';

const templates = [
  { id: 'links', name: 'Auto-DM links from comments', description: 'Send a link when people comment on a post or reel.', goal: 'Drive traffic', keyword: 'LINK', reply: 'Hey {{first_name}}! Thanks for your interest. Here is the link you requested: [add your link]', recommended: true, popular: true },
  { id: 'guide', name: 'Generate leads with a free guide', description: 'Share a helpful resource with people who comment on your content.', goal: 'Generate leads', keyword: 'GUIDE', reply: 'Hey {{first_name}}! Your free guide is ready: [add your guide link]', recommended: true },
  { id: 'info', name: 'Answer questions from comments', description: 'Send more information straight to a commenter’s inbox.', goal: 'Engage your audience', keyword: 'INFO', reply: 'Hey {{first_name}}! Here is the information you requested: [add your details]', recommended: true },
  { id: 'followers', name: 'Invite commenters to follow you', description: 'Share a useful link and invite interested commenters to follow your account.', goal: 'Grow your followers', keyword: 'MORE', reply: 'Hey {{first_name}}! Here is more for you: [add your link]. Follow our account for more tips and updates!' },
  { id: 'affiliate', name: 'Send affiliate product links', description: 'Help interested shoppers find the products you share in your posts.', goal: 'Drive traffic', keyword: 'SHOP', reply: 'Hey {{first_name}}! Here is the product you asked about: [add your affiliate link]. This is an affiliate link; I may earn a commission if you purchase.' },
  { id: 'price', name: 'Share product prices', description: 'Reply privately with pricing and product details when someone asks.', goal: 'Generate leads', keyword: 'PRICE', reply: 'Hey {{first_name}}! Here are the price and product details: [add your pricing and details]' },
  { id: 'offer', name: 'Send a special offer', description: 'Turn a comment into a conversation with a discount or promotion.', goal: 'Engage your audience', keyword: 'OFFER', reply: 'Hey {{first_name}}! Here is your special offer: [add your offer and terms]' },
  { id: 'booking', name: 'Share your booking link', description: 'Make it easy for people to book a call or appointment from a comment.', goal: 'Generate leads', keyword: 'BOOK', reply: 'Hey {{first_name}}! Choose a time that works for you: [add your booking link]' },
  { id: 'website', name: 'Bring visitors to your website', description: 'Give your audience a direct path from your latest reel to your website.', goal: 'Drive traffic', keyword: 'WEBSITE', reply: 'Hey {{first_name}}! Explore more on our website: [add your website link]' }
];
const goals = ['Grow your followers', 'Engage your audience', 'Drive traffic', 'Generate leads'];

export default function TemplatePicker({ onClose }) {
  const dialog = useRef(null);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All templates');
  const [creating, setCreating] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = previousOverflow; previousFocus?.focus(); };
  }, []);
  const filtered = templates.filter(t => (category === 'All templates' || category === 'Post or Reel comment' || t.goal === category) && `${t.name} ${t.description} ${t.keyword}`.toLowerCase().includes(query.trim().toLowerCase()));
  const useTemplate = async template => {
    if (creating) return;
    setCreating(template.id); setError('');
    try {
      const result = await api('/api/automations', { method: 'POST', body: JSON.stringify({
        name: template.name, keyword: template.keyword, matchType: 'CONTAINS', triggerScope: 'ALL',
        privateReply: template.reply, publicReply: 'Check your inbox! I sent you the details.', nodes: [], edges: []
      }) });
      navigate(`/dashboard/automations/${result.automation.id}/setup`);
    } catch (e) { setError(e.message); setCreating(''); }
  };
  const cards = (items, title) => items.length > 0 && <section className="picker-section" aria-label={title}><h3>{title}</h3><div className="picker-grid">{items.map(t => <button key={t.id} className="picker-card" disabled={Boolean(creating)} onClick={() => useTemplate(t)}>
    <h4>{t.name}</h4><p>{t.description}</p><div className="picker-card-footer"><span><Zap size={13}/>{creating === t.id ? 'Creating draft…' : 'Quick Automation'}</span>{t.popular && <b>POPULAR</b>}</div>
  </button>)}</div></section>;
  const isFiltered = Boolean(query.trim()) || category !== 'All templates';
  return <dialog ref={dialog} className="template-picker" aria-labelledby="template-picker-title" onCancel={e => { e.preventDefault(); if (!creating) onClose(); }} onClick={e => { if (e.target === e.currentTarget && !creating) { const rect = e.currentTarget.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) onClose(); } }}>
    <header className="picker-header"><h2 id="template-picker-title">Templates</h2><button className="picker-scratch" disabled={Boolean(creating)} onClick={() => navigate('/dashboard/automations/new')}><Plus size={17}/> Start From Scratch</button><button className="picker-close" aria-label="Close templates" disabled={Boolean(creating)} onClick={onClose}><X size={20}/></button></header>
    <div className="picker-search"><Search size={19}/><input autoFocus aria-label="Search Instagram templates" placeholder="Search Instagram templates..." value={query} onChange={e => setQuery(e.target.value)}/>{query && <button aria-label="Clear search" onClick={() => setQuery('')}><X size={16}/></button>}</div>
    <div className="picker-body"><nav className="picker-nav" aria-label="Template categories"><button className={category === 'All templates' ? 'selected' : ''} onClick={() => setCategory('All templates')}>All templates</button><h3>By goal</h3>{goals.map(goal => <button key={goal} className={category === goal ? 'selected' : ''} onClick={() => setCategory(goal)}>{goal}</button>)}<h3>By trigger</h3><button className={category === 'Post or Reel comment' ? 'selected' : ''} onClick={() => setCategory('Post or Reel comment')}>Post or Reel comment</button></nav>
      <div className="picker-content" aria-busy={Boolean(creating)}>{error && <div className="picker-error" role="alert">{error}</div>}{creating && <span className="picker-progress" role="status">Creating your automation draft…</span>}
        {filtered.length === 0 ? <div className="picker-empty"><Search size={28}/><h3>No templates found</h3><p>Try another search or browse all templates.</p><button onClick={() => { setQuery(''); setCategory('All templates'); }}>Clear filters</button></div> : isFiltered ? cards(filtered, category === 'All templates' ? 'Search results' : category) : <>{cards(filtered.filter(t => t.recommended), 'Recommended')}{cards(filtered.filter(t => !t.recommended), 'Discover more Templates')}</>}
      </div>
    </div>
  </dialog>;
}
