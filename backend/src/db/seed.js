import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool, withTransaction } from './index.js';

const PASSWORD = 'password123';

const users = [
  { uname: 'Alice Johnson', email: 'alice@example.com' },
  { uname: 'Bob Smith', email: 'bob@example.com' },
  { uname: 'Carol Diaz', email: 'carol@example.com' },
  { uname: 'David Kim', email: 'david@example.com' },
];

const products = [
  {
    pname: 'Aurora Mechanical Keyboard',
    description: 'Hot-swappable 75% keyboard with PBT keycaps and RGB lighting.',
    price: 129.99,
    qty: 24,
  },
  {
    pname: 'Nimbus Wireless Mouse',
    description: 'Ergonomic 2.4 GHz mouse with silent switches and USB-C charging.',
    price: 39.5,
    qty: 62,
  },
  {
    pname: 'Starlight 27" Monitor',
    description: '4K IPS display with HDR400, 99% sRGB and a height-adjustable stand.',
    price: 349.0,
    qty: 11,
  },
  {
    pname: 'Vertex USB-C Hub',
    description: '7-in-1 hub with HDMI 4K, gigabit Ethernet and 100 W pass-through.',
    price: 54.95,
    qty: 5,
  },
  {
    pname: 'Echo Noise-Cancelling Headphones',
    description: 'Over-ear ANC headphones with 40-hour battery life.',
    price: 219.0,
    qty: 0,
  },
  {
    pname: 'Basecamp Laptop Stand',
    description: 'Adjustable aluminium stand that fits laptops up to 17 inches.',
    price: 32.0,
    qty: 38,
  },
  {
    pname: 'Lumen 1080p Webcam',
    description: 'Full HD webcam with dual microphones and a privacy shutter.',
    price: 64.99,
    qty: 7,
  },
  {
    pname: 'Halo Desk Lamp',
    description: 'Dimmable LED lamp with wireless charging base and USB port.',
    price: 45.0,
    qty: 19,
  },
];

const daysAgo = (days) =>
  new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const orders = [
  { user: 'alice@example.com', product: 'Aurora Mechanical Keyboard', date: daysAgo(1) },
  { user: 'bob@example.com', product: 'Echo Noise-Cancelling Headphones', date: daysAgo(2) },
  { user: 'carol@example.com', product: 'Starlight 27" Monitor', date: daysAgo(4) },
  { user: 'alice@example.com', product: 'Nimbus Wireless Mouse', date: daysAgo(6) },
  { user: 'david@example.com', product: 'Vertex USB-C Hub', date: daysAgo(9) },
  { user: 'bob@example.com', product: 'Lumen 1080p Webcam', date: daysAgo(12) },
  { user: 'carol@example.com', product: 'Basecamp Laptop Stand', date: daysAgo(16) },
  { user: 'david@example.com', product: 'Halo Desk Lamp', date: daysAgo(21) },
  { user: 'alice@example.com', product: 'Starlight 27" Monitor', date: daysAgo(28) },
];

async function main() {
  const summary = await withTransaction(async (client) => {
    // Restart identity so the seeded ids start at 1 again.
    await client.query(
      'TRUNCATE TABLE public.orders, public.users, public.products RESTART IDENTITY CASCADE',
    );

    const passwordHash = bcrypt.hashSync(PASSWORD, 10);
    const uidByEmail = new Map();

    for (const user of users) {
      const { rows } = await client.query(
        `INSERT INTO public.users (uname, email, password)
         VALUES ($1, $2, $3)
         RETURNING uid, email`,
        [user.uname, user.email, passwordHash],
      );
      uidByEmail.set(rows[0].email, rows[0].uid);
    }

    const pidByName = new Map();
    for (const product of products) {
      const { rows } = await client.query(
        `INSERT INTO public.products (pname, description, price, qty)
         VALUES ($1, $2, $3, $4)
         RETURNING pid, pname`,
        [product.pname, product.description, product.price, product.qty],
      );
      pidByName.set(rows[0].pname, rows[0].pid);
    }

    for (const order of orders) {
      await client.query(
        'INSERT INTO public.orders (uid, pid, order_date) VALUES ($1, $2, $3)',
        [uidByEmail.get(order.user), pidByName.get(order.product), order.date],
      );
    }

    return {
      users: uidByEmail.size,
      products: pidByName.size,
      orders: orders.length,
    };
  });

  console.log('\nSupabase Postgres seeded successfully.');
  console.log(`  Users:    ${summary.users}`);
  console.log(`  Products: ${summary.products}`);
  console.log(`  Orders:   ${summary.orders}`);
  console.log(`\nPassword for every account: "${PASSWORD}"`);
  console.log('Emails: alice@example.com, bob@example.com, carol@example.com, david@example.com\n');
}

main()
  .catch((error) => {
    console.error('\nSeeding failed:', error.message);
    if (error.code === '42P01') {
      console.error('Run "npm run db:setup" first to create the tables.');
    } else if (error.code === '28P01') {
      console.error('Check the database password in DATABASE_URL.');
    }
    process.exitCode = 1;
  })
  .finally(() => pool.end());
