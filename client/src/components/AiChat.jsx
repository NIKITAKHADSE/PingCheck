import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { api } from '../api.js';

export default function AiChat() {
  const [configured, setConfigured] = useState(null);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const bottom = useRef(null);
  useEffect(() => { api('/api/ai/status').then(r => setConfigured(r.configured)).catch(e => setError(e.message)); }, []);
  useEffect(() => { if (messages.length || busy) bottom.current?.scrollIntoView({ block: 'nearest' }); }, [messages, busy]);
  async function send(event) {
    event.preventDefault();
    if (!question.trim() || lock.current || !configured) return;
    const next = [...messages.slice(-10).map(m => ({ ...m, content: m.content.slice(0, 4000) })), { role: 'user', content: question.trim() }];
    lock.current = true;
    setBusy(true); setError('');
    try {
      const result = await api('/api/ai/chat', { method: 'POST', body: JSON.stringify({ messages: next }) });
      setMessages([...next, { role: 'assistant', content: result.reply }]);
      setQuestion('');
    } catch (e) { setError(e.message); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section className="panel dashboard-ai">
    <div className="panel-title"><div><span className="eyebrow">WORKSPACE AI</span><h3><Sparkles size={19}/> Ask your dashboard</h3></div><button className="btn" disabled={busy || !messages.length} onClick={() => { setMessages([]); setError(''); }}>Clear chat</button></div>
    <p>Understand your metrics, explore automation ideas, and draft replies.</p>
    {configured === false && <div className="alert">AI setup required: add OPENAI_API_KEY to the server .env file and restart the backend.</div>}
    {configured === null && !error && <p role="status">Checking AI availability...</p>}
    <div className="ai-chat-messages" role="log" aria-label="AI conversation" aria-live="polite">
      {!messages.length && <div className="ai-suggestions">{['Summarize my workspace performance.', 'How can I improve my comment-to-DM automations?', 'Draft a friendly product enquiry reply.'].map(text => <button className="btn" key={text} disabled={busy} onClick={() => setQuestion(text)}>{text}</button>)}</div>}
      {messages.map((message, index) => <div key={index} className={`ai-chat-message ${message.role}`}><strong>{message.role === 'user' ? 'You' : 'AI Assistant'}</strong><p>{message.content}</p></div>)}
      {busy && <p role="status">Thinking about your question...</p>}<div ref={bottom}/>
    </div>
    {error && <div className="alert error" role="alert">{error}</div>}
    <form onSubmit={send}><label htmlFor="ai-question">Your question</label><textarea id="ai-question" rows="3" maxLength={4000} value={question} disabled={busy} onChange={e => setQuestion(e.target.value)} placeholder="Ask about your workspace..."/><div className="ai-chat-actions"><small>Questions, recent chat, and workspace metrics are sent to OpenAI. AI answers may be inaccurate.</small><button className="btn primary" disabled={!configured || busy || !question.trim()}><Send size={15}/>{busy ? 'Thinking...' : 'Ask AI'}</button></div></form>
  </section>;
}
