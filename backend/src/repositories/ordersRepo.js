import { query } from '../db/index.js';
import { sanitizeSearchTerm } from '../utils/validation.js';

const ORDER_SELECT = `
  SELECT o.oid, o.uid, o.pid, o.order_date,
         u.uname AS user_name, u.email AS user_email,
         p.pname AS product_name, p.price AS product_price, p.qty AS product_qty
  FROM public.orders o
  JOIN public.users u ON u.uid = o.uid
  JOIN public.products p ON p.pid = o.pid
`;

const SORT_COLUMNS = {
  oid: 'o.oid',
  order_date: 'o.order_date',
  user_name: 'u.uname',
  product_name: 'p.pname',
  price: 'p.price',
};

function normalize(order) {
  if (!order) return null;
  return { ...order, product_price: Number(order.product_price) };
}

export async function list({
  search = '',
  sort = 'order_date',
  order = 'desc',
  uid,
  pid,
} = {}) {
  const params = [];
  const where = [];

  const term = sanitizeSearchTerm(search);
  if (term) {
    params.push(`%${term}%`);
    where.push(
      `(u.uname ILIKE $${params.length} OR u.email ILIKE $${params.length} OR p.pname ILIKE $${params.length})`,
    );
  }

  if (uid) {
    params.push(uid);
    where.push(`o.uid = $${params.length}`);
  }

  if (pid) {
    params.push(pid);
    where.push(`o.pid = $${params.length}`);
  }

  const sortColumn = SORT_COLUMNS[sort] ?? SORT_COLUMNS.order_date;
  const direction = order === 'desc' ? 'DESC' : 'ASC';

  const { rows } = await query(
    `${ORDER_SELECT}
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY ${sortColumn} ${direction}`,
    params,
  );

  return rows.map(normalize);
}

export async function findById(oid) {
  const { rows } = await query(`${ORDER_SELECT} WHERE o.oid = $1`, [oid]);
  return normalize(rows[0]);
}

export function findByUser(uid, options = {}) {
  return list({ ...options, uid });
}

export function findByProduct(pid, options = {}) {
  return list({ ...options, pid });
}

export async function create({ uid, pid, order_date }) {
  const { rows } = await query(
    `INSERT INTO public.orders (uid, pid, order_date)
     VALUES ($1, $2, COALESCE($3, now()))
     RETURNING oid`,
    [uid, pid, order_date ?? null],
  );

  return findById(rows[0].oid);
}

export async function update(oid, fields) {
  const assignments = [];
  const values = [];

  if (fields.uid !== undefined) {
    values.push(fields.uid);
    assignments.push(`uid = $${values.length}`);
  }
  if (fields.pid !== undefined) {
    values.push(fields.pid);
    assignments.push(`pid = $${values.length}`);
  }
  if (fields.order_date !== undefined) {
    values.push(fields.order_date);
    assignments.push(`order_date = $${values.length}`);
  }

  if (assignments.length === 0) return findById(oid);

  values.push(oid);
  await query(
    `UPDATE public.orders SET ${assignments.join(', ')} WHERE oid = $${values.length}`,
    values,
  );

  return findById(oid);
}

export async function remove(oid) {
  const { rowCount } = await query('DELETE FROM public.orders WHERE oid = $1', [oid]);
  return rowCount;
}
