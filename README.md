# ShopDesk — React + Node CRUD with Supabase

A complete CRUD app with a **React + Material UI** frontend, an **Express** REST
API, and **Supabase Postgres** for products, users and orders. The API routes and
the UI are unchanged — only the database layer was replaced (SQLite → Supabase).

```
crud-test/
├── package.json              Root scripts (install, db:setup, build, start)
├── supabase/
│   └── schema.sql            Tables, foreign keys, indexes, RLS
├── backend/                  Express API + Postgres pool
│   ├── src/
│   │   ├── app.js            Express app, static frontend, health check
│   │   ├── server.js         HTTP server entry point
│   │   ├── controllers/      Request validation + response shaping
│   │   ├── repositories/     Parameterised SQL queries
│   │   ├── routes/           Endpoint definitions
│   │   ├── middleware/       Route param parsing + error handling
│   │   ├── utils/            ApiError, async wrapper, validation
│   │   └── db/
│   │       ├── index.js      pg Pool, transactions, error mapping
│   │       ├── setup.js      Applies supabase/schema.sql
│   │       ├── seed.js       Sample data
│   │       └── migrate-sqlite.js  Optional legacy SQLite import
│   ├── data/shopdesk.db      Old SQLite file (only used for migration)
│   └── .env                  DATABASE_URL lives here (git-ignored)
└── frontend/                 React (Vite) + Material UI
    ├── dist/                 Production build served by Express
    └── src/
        ├── api/              Fetch client + endpoint modules
        ├── components/       Layout, DataTable, dialogs, etc.
        ├── context/          Global snackbar/notification provider
        ├── hooks/            Data fetching + debounce
        ├── pages/            Dashboard, Products, Users, Orders
        ├── utils/            Currency/date/stock formatting
        └── theme.js          Material UI theme
```

## Architecture

```
Browser ──► Express (port 5000)
              ├── serves frontend/dist (React SPA)
              ├── /api/*  ──► pg Pool ──► Supabase Postgres
              └── JSON 404 for unknown API routes
```

The database password stays on the server inside `DATABASE_URL`. The browser only
talks to the Express API.

## 1. Supabase setup

1. Create a project at <https://supabase.com/dashboard>.
2. Open **Connect** (top bar) or **Project Settings → Database** and copy a
   connection string:
   - **Session pooler** — recommended, e.g.
     `postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`
   - or **Direct connection** — `postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres`
3. Put it in `backend/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

`.env` is git-ignored. Copy `backend/.env.example` if you need a template.

## 2. Create the tables

From the project root:

```bash
npm run db:setup
```

This executes [`supabase/schema.sql`](supabase/schema.sql) against the database in
`DATABASE_URL`. It is idempotent (`create table if not exists`). You can also
paste the file into the Supabase **SQL Editor** instead.

The schema creates `users`, `products` and `orders`, their foreign keys and
indexes, and enables RLS with no public policies. The backend connects as the
project owner (which bypasses RLS), so the public anon key cannot read or write
these tables directly.

## 3. Install, seed, build, run

```bash
npm run install:all     # first time only: backend + frontend dependencies
npm run seed            # optional: 4 users, 8 products, 9 orders (replaces data)
npm run build           # compile React into frontend/dist
npm start               # Express serves UI + API on port 5000
```

Or build and start in one command:

```bash
npm run serve           # = npm run build && npm start
```

Open **http://localhost:5000**. Only port 5000 is used.

Seeded accounts all use the password **`password123`**:
`alice@example.com`, `bob@example.com`, `carol@example.com`, `david@example.com`.

### Import the old SQLite data (optional)

The previous local database is still at `backend/data/shopdesk.db`. To copy its
rows into Supabase:

```bash
npm run migrate:data
```

This replaces the current Supabase rows. Password hashes and order dates are
preserved. Set `SQLITE_FILE` in `backend/.env` to use a different file.

> `better-sqlite3` is declared as an **optional** dependency, because only this
> local migration needs it. If it is missing (for example on a host whose Node
> version has no prebuilt binary), install it just for the migration:
> `npm install --no-save --prefix backend better-sqlite3`. Nothing else at
> runtime, and no deploy step, depends on it.

## Commands

| Command | What it does |
|---|---|
| `npm run install:all` | Install backend and frontend dependencies |
| `npm run db:setup` | Apply `supabase/schema.sql` to Supabase |
| `npm run seed` | Replace Supabase data with sample data |
| `npm run migrate:data` | Import the old SQLite database into Supabase |
| `npm run build` | Production build of the React app |
| `npm start` | Start Express (serves API + built UI) |
| `npm run serve` | `build` then `start` |
| `npm run dev:api` | Backend only, watch mode (port 5000) |
| `npm run dev:web` | Vite dev server with HMR (port 5173) |

## Development mode

```bash
# terminal 1
npm run dev:api      # Express API on :5000

# terminal 2
npm run dev:web      # Vite on :5173
```

Open **http://localhost:5173**. Vite proxies `/api` to `http://localhost:5000`.
To point the dev frontend at a different API, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

## Database model

Tables in the `public` schema:

```sql
users    (uid bigint identity PK, uname, email unique, password, created_at timestamptz)
products (pid bigint identity PK, pname, description, price numeric(12,2), qty int, created_at timestamptz)
orders   (oid bigint identity PK, uid → users.uid, pid → products.pid, order_date timestamptz)
```

Relationships:

- One **user** → many **orders**. `orders.uid` uses `ON DELETE CASCADE`, so
  deleting a user removes their orders.
- One **product** → many **orders**. `orders.pid` uses `ON DELETE RESTRICT`, so a
  product on an order cannot be deleted until those orders are removed
  (`409 Conflict`).
- Indexes on `orders(uid)`, `orders(pid)` and `orders(order_date)`.

## API

Base URL: `http://localhost:5000/api`

Success: `{ "success": true, "data": …, "count"?: n }` · Error:
`{ "success": false, "message": "…" }` with `400`, `404`, `409`, `502` or `500`.

### Products

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/get_products` | List; optional `?search=`, `?sort=pid\|pname\|price\|qty`, `?order=asc\|desc` |
| GET | `/get_product/:id` | Get one |
| POST | `/add_product` | Create — `{ pname, description, price, qty }` |
| PUT / PATCH | `/update_product/:id` | Partial update |
| DELETE | `/delete_product/:id` | Delete (`409` if referenced by orders) |

### Users

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/get_users` | List with `order_count`; optional `?search=`, `?sort=uid\|uname\|email\|order_count`, `?order=` |
| GET | `/get_user/:id` | Get one |
| POST | `/add_user` | Create — `{ uname, email, password }` |
| PUT / PATCH | `/update_user/:id` | Partial update; password optional |
| DELETE | `/delete_user/:id` | Delete user and cascade orders |

Passwords are bcrypt-hashed and never returned by any endpoint.

### Orders

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/get_orders` | List (joined with user + product); `?uid=&pid=&search=&sort=oid\|order_date\|user_name\|product_name\|price&order=` |
| GET | `/get_order/:id` | Get one |
| GET | `/get_orders/uid/:uid` | Orders for a user |
| GET | `/get_orders/pid/:pid` | Orders for a product |
| POST | `/add_order` | Create — `{ uid, pid, order_date? }` |
| PUT / PATCH | `/update_order/:id` | Partial update |
| DELETE | `/delete_order/:id` | Delete |

Order responses include `user_name`, `user_email`, `product_name` and
`product_price` so the frontend needs no extra lookups.

### Example

```bash
curl -X POST http://localhost:5000/api/add_order \
  -H "Content-Type: application/json" \
  -d '{"uid":1,"pid":2,"order_date":"2026-05-01"}'
```

## Frontend features

- **Dashboard** — counts, 30-day order activity, low-stock watchlist, recent orders.
- **Products** — searchable/sortable table, stock chips, create/edit dialogs, delete guard.
- **Users** — avatars, order counts, optional password change, cascade warning.
- **Orders** — customer/product filters, search, sorting, create/edit dialogs.
- Loading skeletons, empty states, snackbars, inline validation, responsive nav.

## Notes

- **`api/update/:id` conflict.** The original spec listed one `update` route for
  products and users; they are implemented as `update_product/:id` and
  `update_user/:id`. `PUT` and `PATCH` both work.
- **Database access** uses the `pg` connection pool with parameterised queries;
  `DATABASE_URL` is server-only. Keep it out of git.
- **Transactions** are used by the seed/migration scripts. API writes are single
  statements, so they are atomic on their own.
- **Health check.** `GET /api/health` runs `SELECT 1` and returns `503` if the
  database is unreachable.
- **Stock is informational.** Placing an order does not decrement `products.qty`.
- **Resetting.** `npm run seed` truncates and re-inserts all rows (identities
  restart at 1).
- **RLS.** Enabled on all tables with no policies; the backend's Postgres role
  bypasses it as the table owner.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Missing DATABASE_URL` on start | Add `DATABASE_URL` to `backend/.env` |
| `password authentication failed` | Re-copy the connection string and password |
| `ENOTFOUND` / `ETIMEDOUT` | Check host/port; use the Session pooler if direct IPv6 fails |
| `Database schema is not initialised` | Run `npm run db:setup` |
| Seed reports missing tables | Run `npm run db:setup` first |
| Frontend build missing at `/` | Run `npm run build` |
| Build fails compiling `better-sqlite3` (node-gyp / V8 errors) | Only the legacy migration needs it; it is optional. Install it locally for the migration, or pin an older Node on the host |
