import { query } from '../db/index.js';
import { sanitizeSearchTerm } from '../utils/validation.js';

const BASE_COLUMNS = 'u.uid, u.uname, u.email, u.created_at';
const USER_SELECT = `
  SELECT ${BASE_COLUMNS},
         (SELECT COUNT(*)::int FROM public.orders o WHERE o.uid = u.uid) AS order_count
  FROM public.users u
`;

const SORT_COLUMNS = {
  uid: 'u.uid',
  uname: 'u.uname',
  email: 'u.email',
  order_count: 'order_count',
};

export async function list({ search = '', sort = 'uid', order = 'asc' } = {}) {
  const params = [];
  let where = '';

  const term = sanitizeSearchTerm(search);
  if (term) {
    params.push(`%${term}%`);
    where = 'WHERE (u.uname ILIKE $1 OR u.email ILIKE $1)';
  }

  const sortColumn = SORT_COLUMNS[sort] ?? SORT_COLUMNS.uid;
  const direction = order === 'desc' ? 'DESC' : 'ASC';

  const { rows } = await query(
    `${USER_SELECT} ${where} ORDER BY ${sortColumn} ${direction}`,
    params,
  );

  return rows;
}

export async function findById(uid) {
  const { rows } = await query(`${USER_SELECT} WHERE u.uid = $1`, [uid]);
  return rows[0] ?? null;
}

export async function findByEmail(email) {
  const { rows } = await query(
    'SELECT uid, uname, email FROM public.users WHERE email = $1',
    [email],
  );
  return rows[0] ?? null;
}

/** Internal helper that includes the password hash. Do not expose directly. */
export async function findAuthByEmail(email) {
  const { rows } = await query(
    'SELECT uid, uname, email, password FROM public.users WHERE email = $1',
    [email],
  );
  return rows[0] ?? null;
}

export async function create({ uname, email, passwordHash }) {
  const { rows } = await query(
    `INSERT INTO public.users (uname, email, password)
     VALUES ($1, $2, $3)
     RETURNING uid, uname, email, created_at`,
    [uname, email, passwordHash],
  );

  return { ...rows[0], order_count: 0 };
}

export async function update(uid, fields) {
  const assignments = [];
  const values = [];

  if (fields.uname !== undefined) {
    values.push(fields.uname);
    assignments.push(`uname = $${values.length}`);
  }
  if (fields.email !== undefined) {
    values.push(fields.email);
    assignments.push(`email = $${values.length}`);
  }
  if (fields.passwordHash !== undefined) {
    values.push(fields.passwordHash);
    assignments.push(`password = $${values.length}`);
  }

  if (assignments.length === 0) return findById(uid);

  values.push(uid);
  await query(
    `UPDATE public.users SET ${assignments.join(', ')} WHERE uid = $${values.length}`,
    values,
  );

  return findById(uid);
}

export async function remove(uid) {
  // Orders are removed automatically by the ON DELETE CASCADE constraint.
  const { rowCount } = await query('DELETE FROM public.users WHERE uid = $1', [uid]);
  return rowCount;
}
