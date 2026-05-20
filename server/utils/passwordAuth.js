import bcrypt from "bcryptjs";
import crypto from "crypto";

const BCRYPT_RE = /^\$2[aby]\$\d{2}\$/;

export function isBcryptHash(value) {
  return typeof value === "string" && BCRYPT_RE.test(value);
}

function timingSafeEqualString(a, b) {
  const left = String(a);
  const right = String(b);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(Buffer.from(left), Buffer.from(right));
}

/**
 * Verify password against stored value; supports legacy plain-text hashes.
 * @returns {{ ok: boolean, needsMigration: boolean }}
 */
export async function verifyPassword(plainPassword, storedPassword) {
  const plain = String(plainPassword || "");
  const stored = String(storedPassword || "");

  if (!plain || !stored) {
    return { ok: false, needsMigration: false };
  }

  if (isBcryptHash(stored)) {
    const ok = await bcrypt.compare(plain, stored);
    return { ok, needsMigration: false };
  }

  const ok = timingSafeEqualString(plain, stored);
  return { ok, needsMigration: ok };
}

export async function hashPassword(plainPassword) {
  return bcrypt.hash(String(plainPassword), 12);
}
