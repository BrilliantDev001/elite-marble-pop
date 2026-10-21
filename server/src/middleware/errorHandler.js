// Runs when no route matched the request.
export function notFound(req, res) {
  res.status(404).json({ message: "Route not found." });
}

// Runs whenever any route throws an error (Express 5 also catches errors from async routes).
// Express recognizes an error handler by its FOUR parameters, so `next` must stay,
// even though we do not use it.
export function errorHandler(err, req, res, next) {
  // Errors with a 4xx status (bad JSON, body too large...) are safe to explain to the caller.
  const status = err.status ?? err.statusCode ?? 500;

  if (status >= 500) {
    // Log the real problem for us, but never send its details to the visitor.
    console.error(err);
    return res
      .status(500)
      .json({ message: "Something went wrong on our side." });
  }

  res.status(status).json({
    message: err.expose ? err.message : "The request could not be processed.",
  });
}
