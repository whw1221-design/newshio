import { ApiError } from '../utils/ApiError.js';
import { optionalString, parseSortDirection, requireString, toNumber } from '../utils/validation.js';
import * as productsRepo from '../repositories/productsRepo.js';

const SORTABLE = new Set(['pid', 'pname', 'price', 'qty']);

function parsePayload(body, { partial = false } = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'A JSON object body is required.');
  }

  const fields = {};

  if (!partial || body.pname !== undefined) {
    fields.pname = requireString(body.pname, 'Product name', { min: 2, max: 100 });
  }

  if (!partial || body.description !== undefined) {
    fields.description = optionalString(body.description, 'Description', { max: 1000 }) ?? '';
  }

  if (!partial || body.price !== undefined) {
    fields.price = toNumber(body.price, 'Price', { min: 0, max: 9_999_999 });
  }

  if (!partial || body.qty !== undefined) {
    fields.qty = toNumber(body.qty, 'Quantity', { min: 0, max: 1_000_000, integer: true });
  }

  if (partial && Object.values(fields).every((value) => value === undefined)) {
    throw new ApiError(400, 'Provide at least one field to update.');
  }

  return fields;
}

export async function listProducts(req, res) {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const sort = SORTABLE.has(req.query.sort) ? req.query.sort : 'pid';
  const order = parseSortDirection(req.query.order, 'asc');

  const products = await productsRepo.list({ search, sort, order });
  res.json({ success: true, data: products, count: products.length });
}

export async function getProduct(req, res) {
  const product = await productsRepo.findById(req.productId);
  if (!product) {
    throw new ApiError(404, `Product ${req.productId} was not found.`);
  }
  res.json({ success: true, data: product });
}

export async function addProduct(req, res) {
  const fields = parsePayload(req.body);
  const product = await productsRepo.create(fields);
  res.status(201).json({ success: true, data: product, message: 'Product created.' });
}

export async function updateProduct(req, res) {
  const existing = await productsRepo.findById(req.productId);
  if (!existing) {
    throw new ApiError(404, `Product ${req.productId} was not found.`);
  }

  const fields = parsePayload(req.body, { partial: true });
  const product = await productsRepo.update(req.productId, fields);
  res.json({ success: true, data: product, message: 'Product updated.' });
}

export async function deleteProduct(req, res) {
  const existing = await productsRepo.findById(req.productId);
  if (!existing) {
    throw new ApiError(404, `Product ${req.productId} was not found.`);
  }

  if ((await productsRepo.countOrders(req.productId)) > 0) {
    throw new ApiError(
      409,
      `"${existing.pname}" is referenced by existing orders. Delete those orders first.`,
    );
  }

  await productsRepo.remove(req.productId);
  res.json({ success: true, data: { pid: req.productId }, message: 'Product deleted.' });
}
