export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
}

export function errorHandler(error, req, res, next) {
  console.error(error);

  if (res.headersSent) {
    return next(error);
  }

  if (error.name === "ZodError") {
    return res.status(400).json({
      error: "Validation failed",
      details: error.issues,
    });
  }

  if (error.code === "P2002") {
    return res.status(409).json({
      error: "A record with the same unique value already exists",
      fields: error.meta?.target ?? [],
    });
  }

  if (error.code === "P2025") {
    return res.status(404).json({ error: "Record not found" });
  }

  if (error.code === "P2003") {
    return res.status(409).json({
      error: "This record cannot be deleted or updated because it is referenced by another record",
    });
  }

  res.status(error.statusCode ?? 500).json({
    error: error.statusCode ? error.message : "Internal server error",
  });
}
