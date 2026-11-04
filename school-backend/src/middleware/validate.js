// Validates and normalises request input with zod schemas.
// A failed parse throws a ZodError, which the central error handler turns into
// a 400 `{ message: 'Validation failed', errors: [{ path, message }] }`.
//
// Usage: router.post('/', validate({ body: createClassSchema }), createClass)
export const validate = ({ body, query } = {}) => (req, res, next) => {
  if (body) {
    req.body = body.parse(req.body ?? {});
  }
  if (query) {
    // Express 5 exposes req.query as a getter, so shadow it on the instance.
    Object.defineProperty(req, 'query', {
      value: query.parse(req.query ?? {}),
      writable: true,
      configurable: true,
      enumerable: true,
    });
  }
  next();
};

export default validate;
