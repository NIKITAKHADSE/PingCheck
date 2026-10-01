import React, { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

export default function GoogleSignIn({ onSuccess, text = 'signin_with' }) {
  const ref = useRef(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/api/auth/config')
      .then(setConfig)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!config?.googleClientId || !ref.current) return;
    let cancelled = false;
    let attempts = 0;

    const render = () => {
      if (cancelled) return;
      if (!window.google?.accounts?.id) {
        attempts += 1;
        if (attempts < 60) return setTimeout(render, 100);
        setError('Google Identity script did not load. Check your internet connection.');
        return;
      }
      window.google.accounts.id.initialize({
        client_id: config.googleClientId,
        callback: async (response) => {
          try {
            setError('');
            const result = await api('/api/auth/google', {
              method: 'POST',
              body: JSON.stringify({ credential: response.credential })
            });
            localStorage.setItem('flowvik_token', result.token);
            onSuccess?.(result);
          } catch (e) {
            setError(e.message);
          }
        }
      });
      ref.current.innerHTML = '';
      window.google.accounts.id.renderButton(ref.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text,
        width: 356
      });
    };

    render();
    return () => { cancelled = true; };
  }, [config, onSuccess, text]);

  if (config && !config.googleConfigured) {
    return <div className="google-config-note">Add <code>GOOGLE_CLIENT_ID</code> to <code>.env</code> to enable Google sign-up/sign-in.</div>;
  }

  return <div className="google-auth-wrap"><div ref={ref} className="google-button-slot"/>{error && <div className="auth-inline-error">{error}</div>}</div>;
}
