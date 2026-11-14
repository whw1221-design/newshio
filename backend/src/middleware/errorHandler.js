import { ApiError } from '../utils/ApiError.js';

const POSTGRES_CONFLICTS = {
  '23505': 'A record with that value already exists.',
  '23503': 'This record is referenced by other records and cannot be changed or deleted.',
};

/** Catch-all for unknown routes. */
export function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} was not found.`));
}

/** Central error translator: every error leaves the API as JSON. */
export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let status = err.status ?? 500;
  let message = err.message ?? 'Internal server error.';

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    status = 400;
    message = 'The request body contains invalid JSON.';
  } else if (!err.status && POSTGRES_CONFLICTS[err.code]) {
    status = 409;
    message = POSTGRES_CONFLICTS[err.code];
  } else if (status >= 500) {
    // Do not leak internal details to clients in production.
    if (process.env.NODE_ENV !== 'production') {
      console.error(err);
    } else {
      message = 'Internal server error.';
    }
  }

  res.status(status).json({
    success: false,
    message,
    ...(err.details ? { details: err.details } : {}),
  });
}
