import { ApiError } from './ApiError.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Parse a route/query id into a positive integer. */
export function parseId(raw, label = 'id') {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) {
    throw new ApiError(400, `Invalid ${label}: it must be a positive integer.`);
  }
  return value;
}

/** Required, trimmed string with a length range. */
export function requireString(value, name, { min = 1, max = 255 } = {}) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ApiError(400, `${name} is required.`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min) {
    throw new ApiError(400, `${name} must be at least ${min} characters.`);
  }
  if (trimmed.length > max) {
    throw new ApiError(400, `${name} must be at most ${max} characters.`);
  }
  return trimmed;
}

/** Optional string. Returns undefined when omitted, so updates stay partial. */
export function optionalString(value, name, { max = 1000 } = {}) {
  if (value === undefined) return undefined;
  if (value === null) return '';
  if (typeof value !== 'string') {
    throw new ApiError(400, `${name} must be a string.`);
  }
  if (value.length > max) {
    throw new ApiError(400, `${name} must be at most ${max} characters.`);
  }
  return value.trim();
}

/** Coerce to a finite number and enforce bounds. */
export function toNumber(value, name, { min = -Infinity, max = Infinity, integer = false } = {}) {
  if (value === undefined || value === null || value === '') {
    throw new ApiError(400, `${name} is required.`);
  }
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number)) {
    throw new ApiError(400, `${name} must be a number.`);
  }
  if (integer && !Number.isInteger(number)) {
    throw new ApiError(400, `${name} must be a whole number.`);
  }
  if (number < min) {
    throw new ApiError(400, `${name} must be at least ${min}.`);
  }
  if (number > max) {
    throw new ApiError(400, `${name} must be at most ${max}.`);
  }
  return number;
}

/** Normalise and validate an email address. */
export function requireEmail(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ApiError(400, 'Email is required.');
  }
  const email = value.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw new ApiError(400, 'Please provide a valid email address.');
  }
  return email;
}

/**
 * Validate a password. `required: false` allows an empty value (used when
 * editing a user without changing the password).
 */
export function requirePassword(value, { required = true } = {}) {
  if (!required && (value === undefined || value === null || value === '')) {
    return undefined;
  }
  if (typeof value !== 'string' || value.length < 6) {
    throw new ApiError(400, 'Password must be at least 6 characters.');
  }
  if (value.length > 72) {
    throw new ApiError(400, 'Password must be at most 72 characters.');
  }
  return value;
}

/** Accept a date-only or ISO date string and store it as ISO-8601 UTC. */
export function normalizeOrderDate(value) {
  if (value === undefined) return undefined;
  if (value === null || value === '') {
    throw new ApiError(400, 'order_date cannot be empty.');
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, 'order_date must be a valid date.');
  }
  return date.toISOString();
}

/** Read a whitelisted sort direction. */
export function parseSortDirection(raw, fallback = 'asc') {
  const value = String(raw ?? '').toLowerCase();
  return value === 'asc' || value === 'desc' ? value : fallback;
}

/**
 * Make a user-supplied search term safe for a PostgREST `or=(ilike...)` filter.
 * Commas, parentheses and percent signs are part of PostgREST syntax, so they
 * are replaced rather than allowed to alter the query.
 */
export function sanitizeSearchTerm(value, maxLength = 100) {
  return String(value ?? '')
    .replace(/[%,()\\*"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

