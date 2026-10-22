// Checks the request body against a zod schema before the route runs.
// If anything is wrong, it replies 400 with a message for each problem field, in the same
// shape the frontend forms already use: { message, errors: { fieldName: "message" } }.
// On success, req.body is replaced by the cleaned data (trimmed, lowercased, unknown fields removed).
//
// Because zod checks the TYPE of every field, a trick like {"email": {"$gt": ""}} (an attempt to
// sneak a database operator into a query) is rejected here and never reaches MongoDB.
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      const errors = {};
      for (const issue of result.error.issues) {
        const field = issue.path.join(".") || "form";
        if (!errors[field]) errors[field] = issue.message; // keep the first message per field
      }
      return res
        .status(400)
        .json({ message: "Please check the information you entered.", errors });
    }

    req.body = result.data;
    next();
  };
}


// Same idea as validateBody, but for the part of the web address after the "?"
// (for example /api/projects?service=marble&page=2).
// The cleaned values are placed in res.locals.query. (Express 5 does not let us replace req.query.)
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = {};
      for (const issue of result.error.issues) {
        const field = issue.path.join(".") || "query";
        if (!errors[field]) errors[field] = issue.message;
      }
      return res.status(400).json({ message: "Some of the filters are not valid.", errors });
    }

    res.locals.query = result.data;
    next();
  };
}