import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { issueTokenPair, hashRefreshToken, verifyToken } from "../utils/generateToken.js";
import { logActivity } from "../services/activity.js";
import { calcProfileCompletion } from "../utils/profileCompletion.js";
import { findUserByEmail, normalizeEmail } from "../utils/findUserByEmail.js";
import { verifyPassword, hashPassword } from "../utils/passwordAuth.js";
import { generateResetToken, hashResetToken } from "../utils/resetToken.js";
import {
  sendPasswordResetEmail,
  buildPasswordResetUrl,
  getClientBaseUrl,
  smtpConfigured,
} from "../services/mailService.js";

function publicUser(doc) {
  const user = doc.toPublicJSON();
  user.profileCompletion = calcProfileCompletion(doc);
  return user;
}

export async function signup(req, res, next) {
  try {
    console.log("[auth] signup request received");

    const fullName = String(req.body.fullName || req.body.fullname || req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!fullName || !email || !password) {
      return res.status(400).json({ success: false, message: "Full name, email, and password are required" });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address" });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const exists = await findUserByEmail(email);
    if (exists) {
      console.warn("[auth] signup — email already exists:", email);
      return res.status(409).json({ success: false, message: "Email already exists" });
    }

    const hash = await hashPassword(password);
    const user = await User.create({ fullName, email, password: hash });

    console.log("[auth] signup success — user saved in MongoDB:", {
      id: user._id.toString(),
      email: user.email,
      database: user.db?.name,
    });

    await logActivity(user, "auth", "Account created");

    const { accessToken, refreshToken } = issueTokenPair(user);
    await User.updateOne({ _id: user._id }, { refreshTokenHash: hashRefreshToken(refreshToken) });
    const userPayload = publicUser(user);

    console.log("[auth] signup success — tokens issued for:", user.email);

    res.status(201).json({
      success: true,
      token: accessToken,
      accessToken,
      refreshToken,
      user: userPayload,
    });
  } catch (e) {
    console.error("[auth] signup error:", e.message);
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    console.log("[auth] login request received:", { email });

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await findUserByEmail(email, { selectPassword: true });
    if (!user) {
      console.warn("[auth] login failed — invalid email:", email);
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.password || typeof user.password !== "string") {
      if (user.authProvider === "google" && user.googleId) {
        return res.status(401).json({
          success: false,
          message: "This account uses Google sign-in. Continue with Google or reset your password.",
        });
      }
      console.warn("[auth] login failed — no password on record:", email);
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const { ok, needsMigration } = await verifyPassword(password, user.password);
    if (!ok) {
      console.warn("[auth] login failed — invalid password:", email);
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (needsMigration) {
      const hash = await hashPassword(password);
      await User.updateOne({ _id: user._id }, { $set: { password: hash } });
      user.password = hash;
      console.log("[auth] migrated legacy plain-text password → bcrypt:", email);
    }

    const { accessToken, refreshToken } = issueTokenPair(user);
    await User.updateOne(
      { _id: user._id },
      { $set: { refreshTokenHash: hashRefreshToken(refreshToken), email: user.email } }
    );
    await logActivity(user, "auth", "Signed in");
    console.log("[auth] login success:", { id: user._id.toString(), email });

    res.json({
      success: true,
      token: accessToken,
      accessToken,
      refreshToken,
      user: publicUser(user),
    });
  } catch (e) {
    console.error("[auth] login error:", e.message);
    next(e);
  }
}

export async function getMe(req, res) {
  console.log("[auth] GET /me —", req.user.email);
  res.json({ success: true, user: publicUser(req.user) });
}

export async function updateProfile(req, res, next) {
  try {
    console.log("[auth] PUT /profile body keys:", Object.keys(req.body || {}));

    const updates = {};
    const fields = [
      "fullName",
      "college",
      "branch",
      "graduationYear",
      "github",
      "linkedin",
      "portfolio",
      "targetRole",
      "experienceLevel",
      "bio",
      "profileImage",
      "profilePicture",
    ];

    for (const key of fields) {
      if (req.body[key] !== undefined) {
        updates[key] = String(req.body[key]).trim();
      }
    }

    if (updates.profileImage && !updates.profilePicture) {
      updates.profilePicture = updates.profileImage;
    }
    if (updates.profilePicture && !updates.profileImage) {
      updates.profileImage = updates.profilePicture;
    }

    if (Array.isArray(req.body.skills)) {
      updates.skills = req.body.skills.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof req.body.skills === "string") {
      updates.skills = req.body.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await logActivity(user, "profile", "Profile updated via auth");
    console.log("[auth] profile updated in MongoDB:", user.email, updates);

    res.json({ success: true, user: publicUser(user) });
  } catch (e) {
    console.error("[auth] profile update error:", e.message);
    next(e);
  }
}

export async function refreshToken(req, res, next) {
  try {
    const token = String(req.body.refreshToken || "").trim();
    if (!token) return res.status(400).json({ success: false, message: "Refresh token required" });

    const payload = verifyToken(token);
    if (payload.typ !== "refresh") {
      return res.status(401).json({ success: false, message: "Invalid refresh token" });
    }

    const user = await User.findById(payload.sub).select("+refreshTokenHash");
    if (!user || user.refreshTokenHash !== hashRefreshToken(token)) {
      return res.status(401).json({ success: false, message: "Refresh token revoked" });
    }

    const { accessToken, refreshToken: newRefresh } = issueTokenPair(user);
    await User.updateOne({ _id: user._id }, { refreshTokenHash: hashRefreshToken(newRefresh) });

    res.json({
      success: true,
      token: accessToken,
      accessToken,
      refreshToken: newRefresh,
      user: publicUser(user),
    });
  } catch (e) {
    return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }
}

export async function googleAuth(req, res, next) {
  try {
    const credential = String(req.body.credential || req.body.idToken || "").trim();
    if (!credential) {
      return res.status(400).json({ success: false, message: "Google credential required" });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!clientId) {
      return res.status(503).json({ success: false, message: "Google login is not configured" });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();
    if (!payload?.email) {
      return res.status(401).json({ success: false, message: "Invalid Google token" });
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] });

    if (!user) {
      const randomPass = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 12);
      user = await User.create({
        fullName: payload.name || email.split("@")[0],
        email,
        password: randomPass,
        googleId: payload.sub,
        authProvider: "google",
        profileImage: payload.picture || "",
        profilePicture: payload.picture || "",
      });
      await logActivity(user, "auth", "Account created via Google");
    } else {
      if (!user.googleId) {
        user.googleId = payload.sub;
        user.authProvider = user.authProvider || "google";
      }
      if (payload.picture && !user.profileImage) {
        user.profileImage = payload.picture;
        user.profilePicture = payload.picture;
      }
      await user.save();
      await logActivity(user, "auth", "Signed in with Google");
    }

    const { accessToken, refreshToken } = issueTokenPair(user);
    await User.updateOne({ _id: user._id }, { refreshTokenHash: hashRefreshToken(refreshToken) });

    res.json({
      success: true,
      token: accessToken,
      accessToken,
      refreshToken,
      user: publicUser(user),
    });
  } catch (e) {
    console.error("[auth] google error:", e.message);
    next(e);
  }
}

export async function logout(req, res, next) {
  try {
    await User.updateOne({ _id: req.user._id }, { refreshTokenHash: "" });
    await logActivity(req.user, "auth", "Signed out");
    res.json({ success: true, message: "Logged out" });
  } catch (e) {
    next(e);
  }
}

const FORGOT_PASSWORD_MESSAGE =
  "If an account exists with that email, you will receive password reset instructions shortly.";

export async function forgotPassword(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    console.log("[auth] forgot-password request:", { email });

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address" });
    }

    if (!smtpConfigured()) {
      console.error("[auth] forgot-password: SMTP env missing on server");
      return res.status(503).json({
        success: false,
        message: "Email service is not configured on the server.",
        mailError: "Missing SMTP_USER or SMTP_PASS",
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      console.log("[auth] forgot-password: no user for email (returning generic success):", email);
      return res.json({ success: true, message: FORGOT_PASSWORD_MESSAGE });
    }

    const { token, hash, expires } = generateResetToken();
    console.log("[auth] reset token generated:", {
      email,
      expires: expires.toISOString(),
      tokenPreview: `${token.slice(0, 8)}…`,
    });

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordResetToken: hash,
          passwordResetExpires: expires,
        },
      }
    );
    console.log("[auth] reset token saved to MongoDB for:", email);

    const resetUrl = buildPasswordResetUrl(token, email);
    console.log("RESET URL:", resetUrl);
    console.log("[auth] CLIENT_URL resolved:", getClientBaseUrl());

    const mailStarted = Date.now();
    let mailResult = { sent: false, error: "Unknown mail error" };

    try {
      mailResult = await sendPasswordResetEmail({
        to: email,
        resetUrl,
        fullName: user.fullName,
      });
    } catch (mailErr) {
      console.error("[auth] forgot-password mail exception:", mailErr);
      mailResult = {
        sent: false,
        error: mailErr?.message || String(mailErr),
      };
    }

    console.log("[auth] forgot-password mail result:", {
      email,
      ms: Date.now() - mailStarted,
      sent: mailResult.sent,
      messageId: mailResult.messageId,
      error: mailResult.error,
    });

    if (!mailResult.sent) {
      return res.status(503).json({
        success: false,
        message: "Failed to send reset email.",
        mailError: mailResult.error,
      });
    }

    console.log("EMAIL SENT");
    await logActivity(user, "auth", "Password reset requested");

    return res.json({
      success: true,
      message: FORGOT_PASSWORD_MESSAGE,
    });
  } catch (e) {
    console.error("[auth] forgot-password error:", e);
    next(e);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const email = normalizeEmail(req.body.email);
    const token = String(req.body.token || "").trim();
    const password = String(req.body.password || "");

    if (!email || !token) {
      return res.status(400).json({ success: false, message: "Email and reset token are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const tokenHash = hashResetToken(token);
    const found = await findUserByEmail(email);
    if (!found) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset link. Request a new password reset.",
      });
    }

    const user = await User.findById(found._id).select("+passwordResetToken +passwordResetExpires");
    const validToken =
      user?.passwordResetToken === tokenHash &&
      user?.passwordResetExpires &&
      user.passwordResetExpires > new Date();

    if (!validToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset link. Request a new password reset.",
      });
    }

    const hash = await hashPassword(password);
    await User.updateOne(
      { _id: user._id },
      {
        $set: { password: hash, authProvider: "local", refreshTokenHash: "" },
        $unset: { passwordResetToken: "", passwordResetExpires: "" },
      }
    );

    await logActivity(user, "auth", "Password reset completed");

    res.json({ success: true, message: "Password updated. You can sign in with your new password." });
  } catch (e) {
    console.error("[auth] reset-password error:", e.message);
    next(e);
  }
}
