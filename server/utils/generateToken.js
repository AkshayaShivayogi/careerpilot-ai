import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_TTL = process.env.JWT_ACCESS_EXPIRES || "15m";
const REFRESH_TTL = process.env.JWT_REFRESH_EXPIRES || "7d";

function secret() {
  if (!process.env.JWT_SECRET?.trim()) {
    throw new Error("JWT_SECRET is not configured");
  }
  return process.env.JWT_SECRET;
}

export function generateAccessToken(userId, role = "user") {
  return jwt.sign({ sub: userId, typ: "access", role }, secret(), { expiresIn: ACCESS_TTL });
}

export function generateRefreshToken(userId) {
  const token = jwt.sign({ sub: userId, typ: "refresh", jti: crypto.randomUUID() }, secret(), {
    expiresIn: REFRESH_TTL,
  });
  return token;
}

/** @deprecated use generateAccessToken */
export function generateToken(userId) {
  return generateAccessToken(userId);
}

export function verifyToken(token) {
  return jwt.verify(token, secret());
}

export function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function issueTokenPair(user) {
  const accessToken = generateAccessToken(user._id.toString(), user.role || "user");
  const refreshToken = generateRefreshToken(user._id.toString());
  return { accessToken, refreshToken };
}
