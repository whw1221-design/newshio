import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { ApiError } from './utils/ApiError.js';
import { asyncHandler } from './utils/asyncHandler.js';
import { query } from './db/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Built React app. Override with CLIENT_DIST if the build lives elsewhere.
const clientDist = process.env.CLIENT_DIST
  ? path.resolve(process.env.CLIENT_DIST)
  : path.resolve(__dirname, '..', '..', 'frontend', 'dist');

export const clientBuild = {
  directory: clientDist,
  available: fs.existsSync(path.join(clientDist, 'index.html')),
};

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // Everything is served over plain HTTP locally; forcing HTTPS upgrades
        // would break the bundled JS/CSS and the API calls.
        'upgrade-insecure-requests': null,
      },
    },
  }),
);
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ? process.env.CLIENT_ORIGIN.split(',') : true,
  }),
);
app.use(express.json({ limit: '100kb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.get(
  '/api/health',
  asyncHandler(async (req, res) => {
    try {
      await query('SELECT 1');
    } catch (error) {
      throw new ApiError(503, `Database health check failed: ${error.message}`);
    }

    res.json({
      success: true,
      data: {
        status: 'ok',
        database: 'supabase-postgres',
        uptime: Math.round(process.uptime()),
      },
    });
  }),
);

app.get('/api', (req, res) => {
  res.json({
    name: 'ShopDesk API',
    version: '1.0.0',
    database: 'supabase',
    docs: 'See README.md for the full endpoint list.',
    endpoints: {
      products: [
        'GET /api/get_products',
        'GET /api/get_product/:id',
        'POST /api/add_product',
        'PUT /api/update_product/:id',
        'DELETE /api/delete_product/:id',
      ],
      users: [
        'GET /api/get_users',
        'GET /api/get_user/:id',
        'POST /api/add_user',
        'PUT /api/update_user/:id',
        'DELETE /api/delete_user/:id',
      ],
      orders: [
        'GET /api/get_orders',
        'GET /api/get_order/:id',
        'GET /api/get_orders/uid/:uid',
        'GET /api/get_orders/pid/:pid',
        'POST /api/add_order',
        'PUT /api/update_order/:id',
        'DELETE /api/delete_order/:id',
      ],
    },
  });
});

app.use('/api', routes);

if (clientBuild.available) {
  // Hashed build assets can be cached forever; HTML must always be revalidated.
  app.use(
    express.static(clientDist, {
      index: false,
      setHeaders(res, filePath) {
        if (filePath.includes(`${path.sep}assets${path.sep}`)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      },
    }),
  );

  // Client-side routing fallback: /products, /users, /orders, etc. all load
  // the SPA, while unknown /api routes still return JSON 404s.
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    if (path.extname(req.path)) return next();

    res.sendFile(path.join(clientDist, 'index.html'), {
      headers: { 'Cache-Control': 'no-store' },
    });
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message:
        'Frontend build not found. Run "npm run build" at the project root, then restart the server.',
      api: '/api',
      health: '/api/health',
    });
  });
}

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
