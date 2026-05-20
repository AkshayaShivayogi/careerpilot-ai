import { User } from "../models/User.js";

export function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function emailRegex(normalized) {
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}$`, "i");
}

/**
 * Find user by email — handles legacy mixed-case emails stored before normalization.
 */
export async function findUserByEmail(email, { selectPassword = false } = {}) {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const query = selectPassword ? "+password" : "";
  let user = await User.findOne({ email: normalized }).select(query);
  if (user) return user;

  user = await User.findOne({ email: emailRegex(normalized) }).select(query);
  if (user && user.email !== normalized) {
    await User.updateOne({ _id: user._id }, { $set: { email: normalized } });
    user.email = normalized;
    console.log("[auth] normalized legacy email:", normalized);
  }
  return user;
}
