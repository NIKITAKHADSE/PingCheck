import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname, '../..');
dotenv.config({ path: path.join(ROOT_DIR, '.env') });

const env = (name, fallback = '') => String(process.env[name] ?? fallback).trim();

const clientUrls = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',').map((x) => x.trim()).filter(Boolean);

export const config = {
  ai: { apiKey: env('OPENAI_API_KEY'), model: env('OPENAI_MODEL', 'gpt-4.1-mini') },
  port: Number(process.env.PORT || 4000),
  host: env('API_HOST', '127.0.0.1'),
  clientUrl: clientUrls[0] || 'http://localhost:5173',
  clientUrls,
  appUrl: env('APP_URL', 'http://localhost:4000'),
  demoMode: String(process.env.DEMO_MODE ?? 'true').toLowerCase() !== 'false',
  encryptionKey: process.env.TOKEN_ENCRYPTION_KEY || '',
  sessionSecret: process.env.SESSION_SECRET || 'flowvik-local-session-secret',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  meta: {
    appId: process.env.META_APP_ID || '',
    appSecret: process.env.META_APP_SECRET || '',
    redirectUri: env('META_REDIRECT_URI', 'http://localhost:4000/api/integrations/meta/callback'),
    verifyToken: process.env.META_VERIFY_TOKEN || '',
    version: process.env.META_GRAPH_VERSION || 'v26.0',
    scopes: (process.env.META_SCOPES || 'instagram_business_basic,instagram_business_manage_comments,instagram_business_manage_messages')
      .split(',').map((x) => x.trim()).filter(Boolean),
    webhookFields: (process.env.META_WEBHOOK_FIELDS || 'comments,messages')
      .split(',').map((x) => x.trim()).filter(Boolean)
  }
};
