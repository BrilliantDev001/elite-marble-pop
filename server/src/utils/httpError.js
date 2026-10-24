// Creates an error that is safe to explain to the caller (the error handler sends its message).
// Usage: throw httpError(409, "Only approved reviews can be featured on the home page.");
export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  error.expose = true;
  return error;
}


// Like httpError, but also says WHICH field is wrong, in the shape the forms expect:
// { message, errors: { fieldName: "message" } }
// Usage: throw fieldError(409, "slug", "Another project already uses this web address.");
export function fieldError(status, field, message) {
  const error = httpError(status, "Please check the information you entered.");
  error.fields = { [field]: message };
  return error;
}
