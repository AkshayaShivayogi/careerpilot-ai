import crypto from "crypto";

const RESET_TTL_MS = 60 * 60 * 1000;

export function generateResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = hashResetToken(token);
  const expires = new Date(Date.now() + RESET_TTL_MS);
  return { token, hash, expires };
}

export function hashResetToken(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}
