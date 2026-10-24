import { httpError } from "../utils/httpError.js";

// Anything that does not look like a database ID is simply "not found", not an error.
// Usage: router.param("id", objectIdParam("Review not found."));
export function objectIdParam(notFoundMessage) {
  return (req, res, next, id) => {
    if (!/^[a-f0-9]{24}$/i.test(id))
      return next(httpError(404, notFoundMessage));
    next();
  };
}
