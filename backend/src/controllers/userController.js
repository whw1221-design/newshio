import bcrypt from 'bcryptjs';
import { ApiError } from '../utils/ApiError.js';
import {
  parseSortDirection,
  requireEmail,
  requirePassword,
  requireString,
} from '../utils/validation.js';
import * as usersRepo from '../repositories/usersRepo.js';

const SORTABLE = new Set(['uid', 'uname', 'email', 'order_count']);
const BCRYPT_ROUNDS = 10;

async function ensureEmailAvailable(email, currentUid = null) {
  const existing = await usersRepo.findByEmail(email);
  if (existing && existing.uid !== currentUid) {
    throw new ApiError(409, 'A user with that email already exists.');
  }
}

export async function listUsers(req, res) {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const sort = SORTABLE.has(req.query.sort) ? req.query.sort : 'uid';
  const order = parseSortDirection(req.query.order, 'asc');

  const users = await usersRepo.list({ search, sort, order });
  res.json({ success: true, data: users, count: users.length });
}

export async function getUser(req, res) {
  const user = await usersRepo.findById(req.userId);
  if (!user) {
    throw new ApiError(404, `User ${req.userId} was not found.`);
  }
  res.json({ success: true, data: user });
}

export async function addUser(req, res) {
  if (!req.body || typeof req.body !== 'object') {
    throw new ApiError(400, 'A JSON object body is required.');
  }

  const uname = requireString(req.body.uname, 'Name', { min: 2, max: 80 });
  const email = requireEmail(req.body.email);
  const password = requirePassword(req.body.password, { required: true });

  await ensureEmailAvailable(email);

  let user;
  try {
    user = await usersRepo.create({
      uname,
      email,
      passwordHash: bcrypt.hashSync(password, BCRYPT_ROUNDS),
    });
  } catch (error) {
    if (error.code === '23505') {
      throw new ApiError(409, 'A user with that email already exists.');
    }
    throw error;
  }

  res.status(201).json({ success: true, data: user, message: 'User created.' });
}

export async function updateUser(req, res) {
  const existing = await usersRepo.findById(req.userId);
  if (!existing) {
    throw new ApiError(404, `User ${req.userId} was not found.`);
  }
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw new ApiError(400, 'A JSON object body is required.');
  }

  const fields = {};

  if (req.body.uname !== undefined) {
    fields.uname = requireString(req.body.uname, 'Name', { min: 2, max: 80 });
  }

  if (req.body.email !== undefined) {
    fields.email = requireEmail(req.body.email);
    await ensureEmailAvailable(fields.email, req.userId);
  }

  if (req.body.password !== undefined) {
    const password = requirePassword(req.body.password, { required: false });
    if (password !== undefined) {
      fields.passwordHash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
    }
  }

  if (Object.keys(fields).length === 0) {
    throw new ApiError(400, 'Provide at least one field to update.');
  }

  let user;
  try {
    user = await usersRepo.update(req.userId, fields);
  } catch (error) {
    if (error.code === '23505') {
      throw new ApiError(409, 'A user with that email already exists.');
    }
    throw error;
  }

  res.json({ success: true, data: user, message: 'User updated.' });
}

export async function deleteUser(req, res) {
  const existing = await usersRepo.findById(req.userId);
  if (!existing) {
    throw new ApiError(404, `User ${req.userId} was not found.`);
  }

  await usersRepo.remove(req.userId);

  const orderNote =
    existing.order_count > 0
      ? ` ${existing.order_count} related order${existing.order_count === 1 ? '' : 's'} removed by cascade.`
      : '';

  res.json({
    success: true,
    data: { uid: req.userId },
    message: `User deleted.${orderNote}`,
  });
}
