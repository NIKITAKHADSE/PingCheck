import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

export default function useLiveData(path) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const request = useRef(null);
  const active = useRef(false);
  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = setTimeout(() => controller.abort('timeout'), 15000);
    try {
      const result = await api(path, { cache: 'no-store', signal: controller.signal });
      if (active.current && !controller.signal.aborted) {
        setData(result); setError(''); setUpdatedAt(new Date());
      }
    } catch (e) {
      if (active.current && controller.signal.reason === 'timeout') setError('The backend took too long to respond.');
      else if (active.current && !controller.signal.aborted) setError(e.message);
    } finally {
      clearTimeout(timeout);
      if (active.current && (!controller.signal.aborted || controller.signal.reason === 'timeout')) setLoading(false);
      if (request.current === controller) request.current = null;
    }
  }, [path]);
  useEffect(() => {
    active.current = true;
    refresh();
    const update = () => { if (!document.hidden && !request.current) refresh(); };
    const timer = setInterval(update, 5000);
    window.addEventListener('focus', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      active.current = false; clearInterval(timer); request.current?.abort();
      window.removeEventListener('focus', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, [refresh]);
  return { data, error, updatedAt, loading, refresh };
}
