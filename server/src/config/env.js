import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Normalize and validate cookie SameSite setting
const rawSameSite = process.env.COOKIE_SAME_SITE?.toLowerCase()?.trim();
const normalizedCookieSameSite =
  rawSameSite === 'none' || rawSameSite === 'lax' || rawSameSite === 'strict'
    ? rawSameSite
    : (process.env.NODE_ENV === 'production' ? 'none' : 'lax');

export const env = {
  port: parseInt(process.env.PORT, 10) || 5001,
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  cookieSecret: process.env.COOKIE_SECRET || 'dev_cookie_secret_change_in_production',
  cookieSameSite: normalizedCookieSameSite,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'gympilot_db',
    timezone: process.env.DB_TIMEZONE || '+05:30',
    ssl: process.env.DB_SSL === 'false' ? undefined : { minVersion: 'TLSv1.2', verifyIdentity: true },
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'dev_access_secret_change_in_production',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '60m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
};
