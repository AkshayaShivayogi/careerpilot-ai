import { verifyToken } from "../utils/generateToken.js";
import { User } from "../models/User.js";

/** Verify Bearer JWT access token and attach user */
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const payload = verifyToken(token);
    if (payload.typ && payload.typ !== "access") {
      return res.status(401).json({ success: false, message: "Invalid token type" });
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user;
    req.userId = user._id.toString();
    req.userRole = user.role || payload.role || "user";
    next();
  } catch (err) {
    const message =
      err.name === "TokenExpiredError"
        ? "Token expired — please refresh or sign in again"
        : "Invalid or expired token";
    return res.status(401).json({ success: false, message });
  }
}
