export function errorHandler(err, _req, res, _next) {
  console.error("[error]", err);

  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: "Email already exists" });
  }

  if (err.name === "ValidationError") {
    const first = Object.values(err.errors || {})[0];
    return res.status(400).json({ success: false, message: first?.message || "Validation failed" });
  }

  const status = err.statusCode || err.status || 500;
  const friendly =
    status >= 500
      ? "Something went wrong on our end. Please try again."
      : err.message || "Request failed";
  res.status(status).json({
    success: false,
    message: friendly,
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
}
