import { verifyToken } from "../utils/generateToken.js";
import { User } from "../models/User.js";

/** Attach user when Bearer token is valid; never block the request */
export async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return next();

    const payload = verifyToken(token);
    if (payload.typ && payload.typ !== "access") return next();

    const user = await User.findById(payload.sub);
    if (user) {
      req.user = user;
      req.userId = user._id.toString();
      req.userRole = user.role || "user";
    }
  } catch {
    /* guest / anonymous */
  }
  next();
}
