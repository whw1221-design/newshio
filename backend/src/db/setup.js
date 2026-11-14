/**
 * Applies supabase/schema.sql to the database in DATABASE_URL.
 *
 *   npm run db:setup
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, '..', '..', '..', 'supabase', 'schema.sql');

async function main() {
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema file not found: ${schemaPath}`);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(sql);

  console.log('\nSchema applied to Supabase Postgres.');
  console.log('Tables ready: public.users, public.products, public.orders');
  console.log('Next: npm run seed (optional sample data)\n');
}

main()
  .catch((error) => {
    console.error('\nSchema setup failed:', error.message);
    echoHint(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());

function echoHint(error) {
  if (error.code === '28P01') {
    console.error('Check the database password in DATABASE_URL.');
  } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    console.error('Check the host/port in DATABASE_URL and your network.');
  }
}
