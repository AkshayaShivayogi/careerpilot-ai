import jwt from "jsonwebtoken";

const ACCESS_TTL = "7d";

export function signToken(userId) {
  return jwt.sign({ sub: userId, typ: "access" }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TTL,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
