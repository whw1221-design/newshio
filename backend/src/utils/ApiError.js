/**
 * Error type that carries an HTTP status code. Thrown from controllers and
 * repositories, translated into a JSON response by the error middleware.
 */
export class ApiError extends Error {
  constructor(status, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}
