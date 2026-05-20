import { buildTechConcepts, builders } from "./topicBuilder.js";

const T = "Express";

export const expressConcepts = buildTechConcepts(T, [
  {
    name: "Express routing and route params",
    beginner: "app.get/post mount paths; req.params for :id segments.",
    intermediate: "Router() modularizes routes; mergeParams for nested routers.",
    advanced: "Version APIs (/v1) without breaking clients.",
    mcq: builders.mcq(T, "routing", "Where do dynamic segments live?", ["req.body", "req.params", "res.locals"], "req.params", "Colon routes expose params."),
  },
  {
    name: "middleware chain order",
    beginner: "Middleware runs in registration order; calls next() or ends response.",
    intermediate: "Auth middleware before protected routes; error handler last with 4 args.",
    advanced: "Avoid async middleware without try/catch — unhandled rejections crash Node.",
    scenario: builders.scenario(T, "middleware", "401 on all routes after adding auth.", "Auth runs globally without public path whitelist.", "Show route-specific router mounting."),
  },
  {
    name: "request validation",
    beginner: "Validate body/query with Joi/Zod/express-validator before business logic.",
    intermediate: "Return 400 with field-level errors; never trust client types.",
    advanced: "Coerce types carefully; reject unknown fields for security.",
    coding: builders.coding(T, "Validate POST /users body {email, age} — approach?", "Schema validate → 400 on fail → controller.", "Centralize validation middleware.", "", "O(1)", "O(1)"),
  },
  {
    name: "error handling middleware",
    beginner: "(err, req, res, next) sends consistent JSON errors.",
    intermediate: "Distinguish operational vs programmer errors; log stack server-side only.",
    advanced: "Map DB duplicate key to 409 Conflict.",
    debug: builders.debug(T, "errors", "Stack trace leaked to clients.", ["Remove err.stack from JSON in prod", "Disable logging", "Return 200"], "Remove err.stack from JSON in prod", "Use NODE_ENV guard."),
  },
  {
    name: "JWT authentication in Express",
    beginner: "Bearer token in Authorization header; verify with secret/public key.",
    intermediate: "Refresh tokens stored httpOnly; short-lived access tokens.",
    advanced: "Rotate signing keys; handle clock skew exp margin.",
    why: "Standard backend interview topic.",
  },
  {
    name: "rate limiting and security headers",
    beginner: "express-rate-limit per IP; helmet sets security headers.",
    intermediate: "Redis store for rate limits across instances.",
    advanced: "Different limits for auth vs public endpoints.",
    scenario: builders.scenario(T, "security", "Brute-force login attempts.", "Rate limit /login; CAPTCHA after N failures; audit log.", "Defense in depth."),
  },
  {
    name: "REST status codes and idempotency",
    beginner: "201 create, 204 delete, 404 missing resource.",
    intermediate: "PUT idempotent; POST not; use Idempotency-Key header for payments.",
    advanced: "409 on version conflicts with ETags.",
    why: "API design interviews.",
  },
  {
    name: "file uploads and multipart",
    beginner: "multer handles multipart/form-data; limit file size.",
    intermediate: "Stream uploads to S3 instead of buffering in memory.",
    advanced: "Scan uploads; validate MIME not just extension.",
    coding: builders.coding(T, "Upload avatar endpoint — pitfalls?", "Size limits, virus scan, auth, store object key not path.", "Memory exhaustion risk.", "", "O(n)", "O(n)"),
  },
  {
    name: "caching with Express",
    beginner: "Cache-Control headers for static assets.",
    intermediate: "Redis cache-aside for hot GET endpoints.",
    advanced: "Invalidate cache keys on writes; avoid stale reads.",
    why: "Performance tuning.",
  },
  {
    name: "Express production deployment",
    beginner: "Trust proxy behind nginx; set NODE_ENV=production.",
    intermediate: "PM2 cluster mode; health check route for load balancer.",
    advanced: "Graceful shutdown on SIGTERM draining connections.",
    bestPractice: { question: "Health check should verify what?", answer: "DB connectivity and critical dependencies, not always 200 OK.", explanation: "Avoid routing traffic to broken instances." },
  },
  {
    name: "testing Express APIs",
    beginner: "supertest hits app without listening on port.",
    intermediate: "Mock external services; test auth middleware in isolation.",
    advanced: "Contract tests for mobile clients.",
    why: "Quality signal.",
  },
  {
    name: "WebSockets with Express",
    beginner: "socket.io attaches to http.Server from app.listen.",
    intermediate: "Authenticate socket handshake with JWT.",
    advanced: "Horizontal scale needs Redis adapter for rooms.",
    scenario: builders.scenario(T, "realtime", "Chat disconnects after deploy.", "Sticky sessions or Redis pub/sub for multi-instance.", "Stateless HTTP vs stateful WS."),
  },
]);
