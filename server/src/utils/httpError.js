// Creates an error that is safe to explain to the caller (the error handler sends its message).
// Usage: throw httpError(409, "Only approved reviews can be featured on the home page.");
export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  error.expose = true;
  return error;
}
