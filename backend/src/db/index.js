import pg from 'pg';
import { ApiError } from '../utils/ApiError.js';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'Missing DATABASE_URL. Add your Supabase Postgres connection string to ' +
      'backend/.env (see backend/.env.example).',
  );
}

const useSsl = process.env.DATABASE_SSL !== 'false';

/**
 * Pooled connection to Supabase Postgres. The password inside DATABASE_URL is
 * server-only and must never be exposed to the browser.
 */
export const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  max: Number(process.env.DATABASE_POOL_MAX ?? 5),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
});

pool.on('error', (error) => {
  console.error('Supabase Postgres pool error:', error.message);
});

const PG_ERRORS = {
  '23505': [409, 'A record with that value already exists.'],
  '23503': [409, 'This record is referenced by other records and cannot be changed or deleted.'],
  '23502': [400, 'A required field is missing.'],
  '22P02': [400, 'One of the provided values has an invalid format.'],
  '42P01': [500, 'Database schema is not initialised. Run "npm run db:setup" first.'],
  '28P01': [500, 'Database authentication failed. Check DATABASE_URL in backend/.env.'],
  '3D000': [500, 'Database not found. Check DATABASE_URL in backend/.env.'],
};

const NETWORK_CODES = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNRESET',
  'EHOSTUNREACH',
  'EAI_AGAIN',
  '08000',
  '08001',
  '08003',
  '08004',
  '08006',
  '53300',
]);

export function mapPostgresError(error, fallbackMessage = 'Database request failed.') {
  if (error instanceof ApiError) return error;

  let apiError;
  if (PG_ERRORS[error.code]) {
    apiError = new ApiError(PG_ERRORS[error.code][0], PG_ERRORS[error.code][1], error.detail);
  } else if (
    NETWORK_CODES.has(error.code) ||
    /ECONNREFUSED|ENOTFOUND|ETIMEDOUT|connection|timeout/i.test(error.message ?? '')
  ) {
    apiError = new ApiError(
      502,
      'Cannot reach the Supabase database. Check DATABASE_URL and your network connection.',
    );
  } else {
    apiError = new ApiError(500, fallbackMessage);
  }

  apiError.code = error.code;
  return apiError;
}

/** Run a parameterised query, translating Postgres errors to ApiError. */
export async function query(text, params = []) {
  try {
    return await pool.query(text, params);
  } catch (error) {
    throw mapPostgresError(error);
  }
}

/** Run work inside a transaction with a dedicated client. */
export async function withTransaction(work) {
  let client;
  try {
    client = await pool.connect();
  } catch (error) {
    throw mapPostgresError(error);
  }

  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore rollback failures, surface the original error
    }
    throw mapPostgresError(error);
  } finally {
    client.release();
  }
}

/** Safe display value for logs (host/database, never the password). */
export function databaseHost() {
  try {
    const url = new URL(connectionString);
    return `${url.hostname}${url.port ? `:${url.port}` : ''}/${url.pathname.replace(/^\//, '')}`;
  } catch {
    return 'Supabase Postgres';
  }
}
