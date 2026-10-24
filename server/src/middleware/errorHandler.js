// Runs when no route matched the request.
export function notFound(req, res) {
  res.status(404).json({ message: "Route not found." });
}

// Runs whenever any route throws an error (Express 5 also catches errors from async routes).
// Express recognizes an error handler by its FOUR parameters, so `next` must stay,
// even though we do not use it.
export function errorHandler(err, req, res, next) {
  // Errors with a 4xx status (bad JSON, body too large...) are safe to explain to the caller.
  // A database validation problem (rare, because the request checks run first): say which fields.
  if (err.name === "ValidationError" && err.errors) {
    const errors = {};
    for (const [field, problem] of Object.entries(err.errors)) errors[field] = problem.message;
    return res.status(400).json({ message: "Please check the information you entered.", errors });
  }

  // A duplicate value, such as a web address already in use.
  if (err.code === 11000) {
    return res.status(409).json({ message: "That value is already in use." });
  }

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
