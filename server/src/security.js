import crypto from 'node:crypto';
import { config } from './config.js';

function keyBytes() {
  if (!config.encryptionKey) return null;
  try {
    const decoded = Buffer.from(config.encryptionKey, 'base64');
    if (decoded.length === 32) return decoded;
  } catch {}
  return crypto.createHash('sha256').update(config.encryptionKey).digest();
}

export function encryptSecret(value) {
  const key = keyBytes();
  if (!key) return `plain-dev:${value}`;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join('.');
}

export function decryptSecret(value) {
  if (!value) return '';
  if (value.startsWith('plain-dev:')) return value.slice('plain-dev:'.length);
  const key = keyBytes();
  if (!key) throw new Error('TOKEN_ENCRYPTION_KEY is required to decrypt Instagram access tokens.');
  const [version, iv64, tag64, data64] = value.split('.');
  if (version !== 'v1' || !iv64 || !tag64 || !data64) throw new Error('Invalid encrypted token format.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(iv64, 'base64'));
  decipher.setAuthTag(Buffer.from(tag64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(data64, 'base64')), decipher.final()]).toString('utf8');
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  if (!stored) return false;
  if (!stored.startsWith('scrypt$')) return stored === password; // compatibility with early local demo builds
  const [, salt, expected] = stored.split('$');
  if (!salt || !expected) return false;
  const actual = crypto.scryptSync(String(password), salt, 64).toString('hex');
  try { return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex')); }
  catch { return false; }
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function validateMetaSignature(rawBody, signature) {
  if (!config.meta.appSecret) return config.demoMode;
  if (!signature) return false;
  const expected = `sha256=${crypto.createHmac('sha256', config.meta.appSecret).update(rawBody).digest('hex')}`;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
