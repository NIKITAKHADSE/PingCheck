import React, { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import AiChat from '../components/AiChat.jsx';

export default function AiAssistant(){
 const [prompt,setPrompt]=useState('When someone comments PRICE on my Reel, send them the product details.');const [draft,setDraft]=useState(null),[error,setError]=useState('');const navigate=useNavigate();
 const generate=async()=>{try{const r=await api('/api/ai/generate',{method:'POST',body:JSON.stringify({prompt})});setDraft(r.draft)}catch(e){setError(e.message)}};
 const create=async()=>{if(!draft)return;try{const r=await api('/api/automations',{method:'POST',body:JSON.stringify({...draft,triggerScope:'ALL',publicReply:'Sent you a DM! 🚀'})});navigate(`/dashboard/automations/${r.automation.id}`)}catch(e){setError(e.message)}};
 return <div><AiChat /><div className="page-heading"><div><span className="eyebrow">LOCAL TEMPLATES</span><h1>Quick Automation Draft</h1><p>Describe the workflow you want and PingCheck creates a local automation draft.</p></div></div>{error&&<div className="alert error">{error}</div>}<section className="panel ai-compose"><Sparkles size={26}/><textarea rows="6" value={prompt} onChange={e=>setPrompt(e.target.value)}/><button className="btn primary" onClick={generate}>Generate automation <ArrowRight size={15}/></button></section>{draft&&<section className="panel ai-result"><span className="eyebrow">GENERATED DRAFT</span><h3>{draft.name}</h3><div className="ai-flow-row"><span>Instagram comment</span><b>→</b><span>Keyword: {draft.keyword}</span><b>→</b><span>Private DM</span></div><p>{draft.privateReply}</p><button className="btn primary" onClick={create}>Open in Builder</button></section>}</div>;
}
