import React, { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Trash2, Users } from 'lucide-react';
import { api } from '../api.js';

export default function Contacts(){
  const [items,setItems]=useState([]),[q,setQ]=useState(''),[show,setShow]=useState(false),[name,setName]=useState(''),[username,setUsername]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  const load=async()=>{setLoading(true);setError('');try{const r=await api('/api/contacts');setItems(Array.isArray(r.contacts)?r.contacts:[])}catch(e){setError(e.message)}finally{setLoading(false)}};
  useEffect(()=>{load();},[]);
  const add=async()=>{try{await api('/api/contacts',{method:'POST',body:JSON.stringify({name,username,status:'LEAD',tags:['Manual']})});setName('');setUsername('');setShow(false);load()}catch(e){setError(e.message)}};
  const remove=async(id)=>{if(window.confirm('Delete contact?')){try{await api(`/api/contacts/${id}`,{method:'DELETE'});load()}catch(e){setError(e.message)}}};
  const filtered=useMemo(()=>items.filter(x=>`${x?.name||''} ${x?.username||''}`.toLowerCase().includes(q.toLowerCase())),[items,q]);
  return <div><div className="page-heading"><div><span className="eyebrow">CRM</span><h1>Contacts</h1><p>Instagram leads and customers captured by your automations.</p></div><button className="btn primary" onClick={()=>setShow(!show)}><Plus size={17}/> Add Contact</button></div>
  {error&&<div className="alert error">{error}</div>}
  {show&&<div className="inline-form panel"><input placeholder="Name" value={name} onChange={e=>setName(e.target.value)}/><input placeholder="@username" value={username} onChange={e=>setUsername(e.target.value)}/><button className="btn primary" onClick={add}>Save</button></div>}
  <div className="toolbar"><div className="search-box"><Search size={17}/><input placeholder="Search contacts..." value={q} onChange={e=>setQ(e.target.value)}/></div><div className="toolbar-hint">{filtered.length} contacts</div></div>
  {loading?<div className="loading">Loading contacts...</div>:filtered.length===0?<div className="empty-panel"><Users size={28}/><strong>No contacts found</strong><span>Contacts created from Instagram comments will appear here.</span></div>:<section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Name</th><th>Username</th><th>Status</th><th>Tags</th><th>Source</th><th></th></tr></thead><tbody>{filtered.map(c=><tr key={c.id}><td><strong>{c.name||'Instagram Contact'}</strong></td><td>{c.username||'—'}</td><td><span className="badge active">{c.status||'CONTACT'}</span></td><td><div className="tag-list">{(Array.isArray(c.tags)?c.tags:[]).map(t=><span key={t}>{t}</span>)}</div></td><td>{c.source||'—'}</td><td><button className="icon-btn danger" onClick={()=>remove(c.id)}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div></section>}</div>;
}
