import { ApiError } from '../utils/ApiError.js';
import {
  normalizeOrderDate,
  parseId,
  parseSortDirection,
} from '../utils/validation.js';
import * as ordersRepo from '../repositories/ordersRepo.js';
import * as usersRepo from '../repositories/usersRepo.js';
import * as productsRepo from '../repositories/productsRepo.js';

const SORTABLE = new Set(['oid', 'order_date', 'user_name', 'product_name', 'price']);

async function ensureUserExists(uid) {
  if (!(await usersRepo.findById(uid))) {
    throw new ApiError(400, `User ${uid} does not exist.`);
  }
}

async function ensureProductExists(pid) {
  if (!(await productsRepo.findById(pid))) {
    throw new ApiError(400, `Product ${pid} does not exist.`);
  }
}

export async function listOrders(req, res) {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const sort = SORTABLE.has(req.query.sort) ? req.query.sort : 'order_date';
  const order = parseSortDirection(req.query.order, 'desc');
  const uid = req.query.uid !== undefined ? parseId(req.query.uid, 'uid') : undefined;
  const pid = req.query.pid !== undefined ? parseId(req.query.pid, 'pid') : undefined;

  const orders = await ordersRepo.list({ search, sort, order, uid, pid });
  res.json({ success: true, data: orders, count: orders.length });
}

export async function getOrder(req, res) {
  const order = await ordersRepo.findById(req.orderId);
  if (!order) {
    throw new ApiError(404, `Order ${req.orderId} was not found.`);
  }
  res.json({ success: true, data: order });
}

export async function getOrdersByUser(req, res) {
  const user = await usersRepo.findById(req.userId);
  if (!user) {
    throw new ApiError(404, `User ${req.userId} was not found.`);
  }

  const orders = await ordersRepo.findByUser(req.userId, {
    sort: 'order_date',
    order: 'desc',
  });
  res.json({ success: true, data: orders, count: orders.length, user });
}

export async function getOrdersByProduct(req, res) {
  const product = await productsRepo.findById(req.productId);
  if (!product) {
    throw new ApiError(404, `Product ${req.productId} was not found.`);
  }

  const orders = await ordersRepo.findByProduct(req.productId, {
    sort: 'order_date',
    order: 'desc',
  });
  res.json({ success: true, data: orders, count: orders.length, product });
}

export async function addOrder(req, res) {
  if (!req.body || typeof req.body !== 'object') {
    throw new ApiError(400, 'A JSON object body is required.');
  }

  const uid = parseId(req.body.uid, 'uid');
  const pid = parseId(req.body.pid, 'pid');
  const orderDate = normalizeOrderDate(req.body.order_date);

  await ensureUserExists(uid);
  await ensureProductExists(pid);

  const order = await ordersRepo.create({ uid, pid, order_date: orderDate });
  res.status(201).json({ success: true, data: order, message: 'Order created.' });
}

export async function updateOrder(req, res) {
  const existing = await ordersRepo.findById(req.orderId);
  if (!existing) {
    throw new ApiError(404, `Order ${req.orderId} was not found.`);
  }
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    throw new ApiError(400, 'A JSON object body is required.');
  }

  const fields = {};

  if (req.body.uid !== undefined) {
    fields.uid = parseId(req.body.uid, 'uid');
    await ensureUserExists(fields.uid);
  }

  if (req.body.pid !== undefined) {
    fields.pid = parseId(req.body.pid, 'pid');
    await ensureProductExists(fields.pid);
  }

  if (req.body.order_date !== undefined) {
    fields.order_date = normalizeOrderDate(req.body.order_date);
  }

  if (Object.keys(fields).length === 0) {
    throw new ApiError(400, 'Provide at least one field to update.');
  }

  const order = await ordersRepo.update(req.orderId, fields);
  res.json({ success: true, data: order, message: 'Order updated.' });
}

export async function deleteOrder(req, res) {
  const existing = await ordersRepo.findById(req.orderId);
  if (!existing) {
    throw new ApiError(404, `Order ${req.orderId} was not found.`);
  }

  await ordersRepo.remove(req.orderId);
  res.json({ success: true, data: { oid: req.orderId }, message: 'Order deleted.' });
}
