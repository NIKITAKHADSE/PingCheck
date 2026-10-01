import React, { useEffect } from 'react';
import { apiBase } from '../api.js';

export default function Privacy() {
  const url = `${apiBase}/privacy`;
  useEffect(() => { window.location.replace(url); }, [url]);
  return <main style={{ padding: 40 }}><h1>Privacy Policy</h1><p><a href={url}>Open PingCheck’s privacy policy</a></p></main>;
}
