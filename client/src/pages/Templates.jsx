import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutTemplate, ArrowRight, MessageCircle, Link as LinkIcon } from 'lucide-react';
import { api } from '../api.js';

export default function Templates(){
  const [items,setItems]=useState([]),[error,setError]=useState(''),[loading,setLoading]=useState(true),[creating,setCreating]=useState('');const navigate=useNavigate();
  useEffect(()=>{api('/api/templates').then(r=>setItems(Array.isArray(r.templates)?r.templates:[])).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[]);
  const useTemplate=async(id)=>{setCreating(id);setError('');try{const r=await api(`/api/templates/${id}/use`,{method:'POST'});navigate(`/dashboard/automations/${r.automation.id}`)}catch(e){setError(e.message);setCreating('')}};
  return <div><div className="page-heading"><div><span className="eyebrow">AUTOMATION</span><h1>Templates</h1><p>Start with an Instagram comment-to-DM workflow, then add your details link.</p></div></div>{error&&<div className="alert error">{error}</div>}{loading?<div className="loading">Loading templates...</div>:items.length===0?<div className="empty-panel"><LayoutTemplate size={28}/><strong>No templates available</strong><span>Create a custom workflow from the Automations page.</span></div>:<div className="template-grid">{items.map(t=><section className="panel template-card" key={t.id}><div className="template-icon"><LayoutTemplate size={20}/></div><span className="eyebrow">{t.category}</span><h3>{t.name}</h3><div className="template-trigger"><MessageCircle size={14}/><span>Comment contains</span><code>{t.keyword}</code></div><div className="template-message"><LinkIcon size={14}/><span>{t.privateReply}</span></div><button className="btn primary" disabled={Boolean(creating)} onClick={()=>useTemplate(t.id)}>{creating===t.id?'Creating...':'Use Template'} {creating!==t.id&&<ArrowRight size={15}/>}</button></section>)}</div>}</div>;
}
