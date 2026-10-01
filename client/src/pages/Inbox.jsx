import { formatDate } from '../dateFormat.js';
import React, { useEffect, useMemo, useState } from 'react';
import { Search, Instagram, Send } from 'lucide-react';
import { api } from '../api.js';

export default function Inbox(){
  const [items,setItems]=useState([]),[selected,setSelected]=useState(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  useEffect(()=>{api('/api/conversations').then(r=>{const list=Array.isArray(r.conversations)?r.conversations:[];setItems(list);setSelected(list[0]?.id||null)}).catch(e=>setError(e.message)).finally(()=>setLoading(false));},[]);
  const current=useMemo(()=>items.find(x=>x.id===selected),[items,selected]);
  if(loading)return <div className="loading">Loading inbox...</div>;
  return <div><div className="page-heading"><div><span className="eyebrow">ENGAGEMENT</span><h1>Inbox</h1><p>View Instagram conversations and automation messages.</p></div></div>
  {error&&<div className="alert error">{error}</div>}
  <div className="inbox-grid panel"><aside className="conversation-list"><div className="inbox-search"><Search size={16}/><input placeholder="Search conversations"/></div>{items.length===0?<div className="empty-mini">No conversations yet. Connect Instagram or simulate a comment.</div>:items.map(c=><button key={c.id} onClick={()=>setSelected(c.id)} className={`conversation-item ${selected===c.id?'selected':''}`}><div className="avatar">{(c.contact?.name||'IG').slice(0,2).toUpperCase()}</div><div><strong>{c.contact?.name||'Instagram Contact'}</strong><small>{c.messages?.at?.(-1)?.body||'Conversation'}</small></div><Instagram size={15}/></button>)}</aside>
  <section className="chat-area">{current?<><div className="chat-head"><div className="avatar">{(current.contact?.name||'IG').slice(0,2).toUpperCase()}</div><div><strong>{current.contact?.name||'Instagram Contact'}</strong><small>{current.contact?.username||''}</small></div></div><div className="messages">{(Array.isArray(current.messages)?current.messages:[]).map(m=><div key={m.id} className={`bubble ${m.direction==='OUT'?'out':'in'}`}>{m.body}<small>{m.at?formatDate(m.at):'—'}</small></div>)}</div><div className="composer"><input placeholder="Manual reply UI — automation messages are logged here" disabled/><button disabled><Send size={17}/></button></div></>:<div className="empty-chat"><Instagram size={34}/><strong>Select a conversation</strong><span>Messages created by comment automations will appear here.</span></div>}</section>
  <aside className="contact-panel">{current?<><span className="eyebrow">CONTACT</span><div className="profile-avatar">{(current.contact?.name||'IG').slice(0,2).toUpperCase()}</div><h3>{current.contact?.name||'Instagram Contact'}</h3><p>{current.contact?.username||''}</p><hr/><small>Status</small><strong>{current.contact?.status||'CONTACT'}</strong><small>Source</small><strong>{current.contact?.source||'Instagram'}</strong></>:<p>Select a contact.</p>}</aside></div></div>;
}
