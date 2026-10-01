import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import './post-gallery.css';

export default function PostGallery({ accountId, selectedId, onSelect }) {
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const generation = useRef(0);
  const load = async (after = '', version = generation.current) => {
    if (!accountId) return;
    setBusy(true); setError('');
    try {
      const result = await api(`/api/integrations/meta/accounts/${encodeURIComponent(accountId)}/media?after=${encodeURIComponent(after)}`);
      if (version !== generation.current) return;
      setItems(previous => Array.from(new Map([...(after ? previous : []), ...result.media].map(m => [m.id, m])).values()));
      setCursor(result.nextCursor || '');
    } catch(e) { if (version === generation.current) setError(e.message); }
    finally { if (version === generation.current) setBusy(false); }
  };
  useEffect(() => {
    const version = ++generation.current;
    setItems([]); setCursor(''); setQuery(''); setError(''); setBusy(false);
    load('', version);
    return () => { generation.current++; };
  }, [accountId]);
  const visible = items.filter(m => (filter === 'ALL' || (filter === 'REELS' ? m.media_product_type === 'REELS' : m.media_product_type !== 'REELS')) && `${m.caption || ''} ${m.id}`.toLowerCase().includes(query.toLowerCase()));
  return <section className="post-gallery" aria-label="Choose Instagram post">
    <h3>Choose the post for this automation</h3>
    <p>Select a thumbnail below, or use all posts and reels.</p>
    <button type="button" aria-pressed={!selectedId} onClick={() => onSelect('')}>All posts and reels</button>
    <input aria-label="Search loaded posts" placeholder="Search loaded posts…" value={query} onChange={e => setQuery(e.target.value)}/>
    <select aria-label="Filter post type" value={filter} onChange={e => setFilter(e.target.value)}><option value="ALL">Posts and reels</option><option value="POSTS">Posts</option><option value="REELS">Reels</option></select>
    {error && <p role="alert">{error}</p>}
    {!accountId ? <p>Select a connected Instagram account first.</p> : <>
      <div className="post-gallery-grid">{visible.map(m => <button type="button" key={m.id} aria-pressed={String(selectedId) === String(m.id)} onClick={() => onSelect(m.id)} title={m.caption || m.id}>
        {m.thumbnail_url || (m.media_type !== 'VIDEO' && m.media_url) ? <img src={m.thumbnail_url || m.media_url} alt={m.caption || 'Instagram post'} onError={e => { e.currentTarget.style.display = 'none'; }}/> : <span className="post-gallery-fallback">{m.media_type === 'VIDEO' ? '▶ Reel / Video' : 'Post'}</span>}
        <span>{m.caption || 'Untitled post'}</span><small>{String(selectedId) === String(m.id) ? '✓ Selected' : m.media_product_type || m.media_type}</small>
      </button>)}</div>
      {!busy && !error && !visible.length && <p>{items.length ? 'No loaded posts match these filters.' : 'No posts returned. Publish a post and refresh.'}</p>}
      {busy && <p role="status">Loading Instagram posts…</p>}
      <div className="post-gallery-actions"><button type="button" disabled={busy} onClick={() => load()}>Refresh posts</button>{cursor && <button type="button" disabled={busy} onClick={() => load(cursor)}>Load more posts</button>}</div>
    </>}
  </section>;
}
