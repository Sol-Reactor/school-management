// Operational errors that controllers throw. The central error middleware turns
// them into `{ message, errors? }` JSON responses with the right status code.
export class AppError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    if (errors) this.errors = errors;
  }
}

export const badRequest = (message = 'Bad request', errors) => new AppError(400, message, errors);
export const unauthorized = (message = 'Authentication required') => new AppError(401, message);
export const forbidden = (message = 'You do not have access to this resource') =>
  new AppError(403, message);
export const notFound = (message = 'Not found') => new AppError(404, message);
export const conflict = (message = 'Conflict') => new AppError(409, message);
