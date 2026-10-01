import React, { useEffect, useState } from 'react';
import { BookOpen, Plus } from 'lucide-react';
import { api } from '../api.js';

export default function Knowledge(){
 const [items,setItems]=useState([]),[title,setTitle]=useState(''),[content,setContent]=useState(''),[error,setError]=useState('');const load=()=>api('/api/knowledge').then(r=>setItems(Array.isArray(r.sources)?r.sources:[])).catch(e=>setError(e.message));useEffect(load,[]);
 const add=async()=>{if(!title.trim())return;try{await api('/api/knowledge',{method:'POST',body:JSON.stringify({title,type:'TEXT',content})});setTitle('');setContent('');load()}catch(e){setError(e.message)}};
 return <div><div className="page-heading"><div><span className="eyebrow">AI</span><h1>Knowledge Base</h1><p>Store FAQs and product details that can later power AI replies.</p></div></div>{error&&<div className="alert error">{error}</div>}<div className="settings-grid"><section className="panel"><span className="eyebrow">ADD SOURCE</span><h3>Text / FAQ</h3><label>Title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Product pricing FAQ"/></label><label>Content<textarea rows="7" value={content} onChange={e=>setContent(e.target.value)} placeholder="Add the information here..."/></label><button className="btn primary" onClick={add}><Plus size={15}/> Add Source</button></section><section className="panel"><span className="eyebrow">SOURCES</span><h3>{items.length} knowledge sources</h3><div className="source-list">{items.length===0?<div className="empty-mini"><BookOpen size={22}/> No sources yet.</div>:items.map(i=><div key={i.id}><strong>{i.title}</strong><small>{i.type} · {new Date(i.createdAt).toLocaleDateString()}</small><p>{String(i.content||'').slice(0,120)}</p></div>)}</div></section></div></div>;
}
