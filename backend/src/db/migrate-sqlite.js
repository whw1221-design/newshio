/**
 * Optional one-off migration: copies the old local SQLite data into Supabase.
 *
 *   npm run migrate:sqlite        (from backend/)
 *
 * The target Supabase tables must already exist (run supabase/schema.sql) and
 * their current rows will be replaced. Password hashes are copied as-is, so
 * existing logins continue to work.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool, withTransaction } from './index.js';

// better-sqlite3 is an *optional* dependency: it is only needed for this
// local, one-off migration. Loading it lazily keeps the production install
// free of native modules that may not have prebuilt binaries for the host's
// Node version.
let Database;
try {
  ({ default: Database } = await import('better-sqlite3'));
} catch {
  console.error('better-sqlite3 is not installed, so the SQLite migration cannot run.');
  console.error('Install it locally with:  npm install --no-save --prefix backend better-sqlite3');
  console.error('Skip this step if you do not need to import backend/data/shopdesk.db.');
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sqliteFile = process.env.SQLITE_FILE
  ? path.resolve(process.env.SQLITE_FILE)
  : path.resolve(__dirname, '..', '..', 'data', 'shopdesk.db');

if (!fs.existsSync(sqliteFile)) {
  console.error(`SQLite database not found: ${sqliteFile}`);
  console.error('Set SQLITE_FILE to its location or skip this migration.');
  process.exit(1);
}

const sqlite = new Database(sqliteFile, { readonly: true, fileMustExist: true });

async function main() {
  const users = sqlite
    .prepare('SELECT uid, uname, email, password, created_at FROM users ORDER BY uid')
    .all();
  const products = sqlite
    .prepare('SELECT pid, pname, description, price, qty, created_at FROM products ORDER BY pid')
    .all();
  const orders = sqlite
    .prepare('SELECT oid, uid, pid, order_date FROM orders ORDER BY oid')
    .all();

  const summary = await withTransaction(async (client) => {
    await client.query(
      'TRUNCATE TABLE public.orders, public.users, public.products RESTART IDENTITY CASCADE',
    );

    const uidByEmail = new Map();
    for (const user of users) {
      const { rows } = await client.query(
        `INSERT INTO public.users (uname, email, password, created_at)
         VALUES ($1, $2, $3, $4)
         RETURNING uid, email`,
        [user.uname, user.email, user.password, user.created_at],
      );
      uidByEmail.set(rows[0].email, rows[0].uid);
    }

    const pidByName = new Map();
    const oldPidToNew = new Map();
    for (const product of products) {
      const { rows } = await client.query(
        `INSERT INTO public.products (pname, description, price, qty, created_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING pid, pname`,
        [
          product.pname,
          product.description,
          product.price,
          product.qty,
          product.created_at,
        ],
      );
      pidByName.set(rows[0].pname, rows[0].pid);
      oldPidToNew.set(product.pid, rows[0].pid);
    }

    const oldUidToNew = new Map(
      users.map((user) => [user.uid, uidByEmail.get(user.email)]),
    );

    let migratedOrders = 0;
    for (const order of orders) {
      const uid = oldUidToNew.get(order.uid);
      const pid = oldPidToNew.get(order.pid);
      if (!uid || !pid) continue;

      await client.query(
        'INSERT INTO public.orders (uid, pid, order_date) VALUES ($1, $2, $3)',
        [uid, pid, order.order_date],
      );
      migratedOrders += 1;
    }

    return {
      users: uidByEmail.size,
      products: pidByName.size,
      orders: migratedOrders,
    };
  });

  console.log('\nSQLite data migrated to Supabase.');
  console.log(`  Users:    ${summary.users}`);
  console.log(`  Products: ${summary.products}`);
  console.log(`  Orders:   ${summary.orders}`);
  console.log(`  Source:   ${sqliteFile}\n`);
}

main()
  .catch((error) => {
    console.error('\nMigration failed:', error.message);
    if (error.code === '42P01') {
      console.error('Run "npm run db:setup" first to create the tables.');
    }
    process.exitCode = 1;
  })
  .finally(async () => {
    sqlite.close();
    await pool.end();
  });
