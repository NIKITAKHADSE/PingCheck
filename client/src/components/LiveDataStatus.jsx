import React from 'react';

export default function LiveDataStatus({ error, updatedAt, refresh }) {
  return <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
    <small role="status" style={{ color: error ? '#ba3a3a' : '#66777b' }}>
      {error ? `Refresh failed — ${error}${updatedAt ? ' Showing last received data.' : ''}` : updatedAt ? `Updates every 5 seconds · Last received ${updatedAt.toLocaleTimeString()}` : 'Connecting to workspace...'}
    </small>
    <button type="button" className="btn ghost compact" onClick={refresh}>Refresh now</button>
  </div>;
}
