import nodemailer from "nodemailer";

/** Trim Render/env values; strip wrapping quotes. */
export function cleanEnv(value) {
  if (value == null) return "";
  let v = String(value).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

export function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
  );
}

export function formatMailError(err) {
  if (!err) return "Unknown mail error";
  const parts = [
    err.message,
    err.code && `code=${err.code}`,
    err.responseCode != null && `responseCode=${err.responseCode}`,
    err.command && `command=${err.command}`,
    err.response && `response=${String(err.response).slice(0, 500)}`,
  ].filter(Boolean);
  return parts.join(" | ");
}

export function createTransport() {
  if (!smtpConfigured()) {
    console.error("[mail] createTransport: missing SMTP_HOST, SMTP_USER, or SMTP_PASS");
    return null;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  console.log("[mail] createTransport:", {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    hasPassword: Boolean(process.env.SMTP_PASS),
  });

  return transporter;
}

export function getClientBaseUrl() {
  const url =
    cleanEnv(process.env.CLIENT_URL) ||
    cleanEnv(process.env.FRONTEND_URL) ||
    "http://localhost:5173";
  return url.replace(/\/+$/, "");
}

export function buildPasswordResetUrl(token, email) {
  const clientUrl = getClientBaseUrl();
  return `${clientUrl}/reset-password?token=${token}&email=${email}`;
}

function resolveFromAddress() {
  const fromEnv = cleanEnv(process.env.SMTP_FROM);
  if (fromEnv && fromEnv.includes("@")) return fromEnv;
  return process.env.SMTP_USER;
}

/**
 * @returns {Promise<{ sent: boolean, messageId?: string, error?: string, info?: object }>}
 */
export async function sendPasswordResetEmail({ to, resetUrl, fullName }) {
  if (!smtpConfigured()) {
    const msg = "SMTP not configured — set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS on Render";
    console.error("[mail]", msg);
    return { sent: false, error: msg };
  }

  console.log("[mail] sendPasswordResetEmail →", { to, resetUrl });

  const transporter = createTransport();
  if (!transporter) {
    return { sent: false, error: "Failed to create nodemailer transport" };
  }

  const from = resolveFromAddress();

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: "Reset your CareerPilot AI password",
      text: [
        `Hi ${fullName || "there"},`,
        "",
        "We received a request to reset your password.",
        "",
        `Reset your password using this link (expires in 1 hour):`,
        resetUrl,
        "",
        "If you did not request this, you can ignore this email.",
      ].join("\n"),
      html: `
        <p>Hi ${fullName || "there"},</p>
        <p>We received a request to reset your CareerPilot AI password.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>Or copy this link: ${resetUrl}</p>
        <p>This link expires in 1 hour.</p>
        <p>If you did not request this, you can ignore this email.</p>
      `,
    });

    if (info.rejected?.length) {
      const err = `sendMail rejected recipients: ${info.rejected.join(", ")}`;
      console.error("[mail]", err, info);
      return { sent: false, error: err, info };
    }

    console.log("[mail] transporter.sendMail() response:", {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
    console.log("EMAIL SENT");

    return { sent: true, messageId: info.messageId, info };
  } catch (err) {
    console.error("[mail] transporter.sendMail() FAILED — full error:", err);
    console.error("[mail] nodemailer error:", formatMailError(err));
    return { sent: false, error: formatMailError(err) };
  } finally {
    try {
      if (transporter?.close) await transporter.close();
    } catch (closeErr) {
      console.warn("[mail] transport.close:", closeErr?.message);
    }
  }
}
