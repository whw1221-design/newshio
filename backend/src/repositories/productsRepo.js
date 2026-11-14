import { query } from '../db/index.js';
import { sanitizeSearchTerm } from '../utils/validation.js';

const COLUMNS = 'pid, pname, description, price, qty, created_at';

const SORT_COLUMNS = {
  pid: 'pid',
  pname: 'pname',
  price: 'price',
  qty: 'qty',
};

function normalize(product) {
  if (!product) return null;
  return { ...product, price: Number(product.price) };
}

export async function list({ search = '', sort = 'pid', order = 'asc' } = {}) {
  const params = [];
  let where = '';

  const term = sanitizeSearchTerm(search);
  if (term) {
    params.push(`%${term}%`);
    where = 'WHERE (pname ILIKE $1 OR description ILIKE $1)';
  }

  const sortColumn = SORT_COLUMNS[sort] ?? SORT_COLUMNS.pid;
  const direction = order === 'desc' ? 'DESC' : 'ASC';

  const { rows } = await query(
    `SELECT ${COLUMNS} FROM public.products ${where} ORDER BY ${sortColumn} ${direction}`,
    params,
  );

  return rows.map(normalize);
}

export async function findById(pid) {
  const { rows } = await query(
    `SELECT ${COLUMNS} FROM public.products WHERE pid = $1`,
    [pid],
  );

  return normalize(rows[0]);
}

export async function create({ pname, description = '', price, qty }) {
  const { rows } = await query(
    `INSERT INTO public.products (pname, description, price, qty)
     VALUES ($1, $2, $3, $4)
     RETURNING ${COLUMNS}`,
    [pname, description, price, qty],
  );

  return normalize(rows[0]);
}

export async function update(pid, fields) {
  const assignments = [];
  const values = [];

  for (const key of ['pname', 'description', 'price', 'qty']) {
    if (fields[key] !== undefined) {
      values.push(fields[key]);
      assignments.push(`${key} = $${values.length}`);
    }
  }

  if (assignments.length === 0) return findById(pid);

  values.push(pid);
  const { rows } = await query(
    `UPDATE public.products
     SET ${assignments.join(', ')}
     WHERE pid = $${values.length}
     RETURNING ${COLUMNS}`,
    values,
  );

  return normalize(rows[0]);
}

export async function remove(pid) {
  const { rowCount } = await query('DELETE FROM public.products WHERE pid = $1', [pid]);
  return rowCount;
}

export async function countOrders(pid) {
  const { rows } = await query(
    'SELECT COUNT(*)::int AS total FROM public.orders WHERE pid = $1',
    [pid],
  );
  return rows[0].total;
}
