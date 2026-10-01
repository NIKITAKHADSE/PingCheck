const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000' : '');

export async function api(path, options = {}) {
  const token = localStorage.getItem('flowvik_token');
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API}${path}`, { ...options, headers });
  } catch {
    throw new Error(`Cannot reach PingCheck backend at ${API}. Make sure npm run dev is running.`);
  }

  const payload = await response.json().catch(() => ({}));
  if (response.status === 401 && path !== '/api/auth/login' && path !== '/api/auth/google') {
    localStorage.removeItem('flowvik_token');
  }
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status})`);
  return payload;
}

export const apiBase = API;
