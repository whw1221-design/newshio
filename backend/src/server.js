import 'dotenv/config';
import app, { clientBuild } from './app.js';
import { databaseHost, pool } from './db/index.js';

const port = Number(process.env.PORT ?? 5000);

const server = app.listen(port, () => {
  console.log(`\nShopDesk is running at http://localhost:${port}`);
  console.log(`API:      http://localhost:${port}/api`);
  console.log(`Health:   http://localhost:${port}/api/health`);
  console.log(`Database: Supabase Postgres (${databaseHost()})`);

  if (clientBuild.available) {
    console.log(`Frontend: served from ${clientBuild.directory}`);
  } else {
    console.log('Frontend: not built (run "npm run build" at the project root)');
  }

  console.log('');
});

function shutdown(signal) {
  console.log(`\n${signal} received, shutting down...`);
  server.close(() => {
    pool.end().finally(() => process.exit(0));
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
