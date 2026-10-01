export function saveDatePreferences(workspace) {
  localStorage.setItem('flowvik_date_preferences', JSON.stringify({ timeZone: workspace?.timeZone || 'Asia/Calcutta', dateStyle: workspace?.dateStyle || 'medium' }));
}
export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '—';
  try {
    const prefs = JSON.parse(localStorage.getItem('flowvik_date_preferences') || '{}');
    return new Intl.DateTimeFormat(undefined, { timeZone: prefs.timeZone || 'Asia/Calcutta', dateStyle: prefs.dateStyle || 'medium', timeStyle: 'short' }).format(date);
  } catch { return date.toLocaleString(); }
}
