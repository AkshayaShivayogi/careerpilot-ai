import nodemailer from "nodemailer";

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
  return Boolean(process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim());
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

/**
 * @returns {Promise<{ sent: boolean, messageId?: string, error?: string }>}
 */
export async function sendPasswordResetEmail({ to, resetUrl, fullName }) {
  if (!smtpConfigured()) {
    const msg = "SMTP not configured — set SMTP_USER, SMTP_PASS, and SMTP_FROM on Render";
    console.error("[mail]", msg);
    return { sent: false, error: msg };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const subject = "Reset your CareerPilot AI password";
  const html = `
    <p>Hi ${fullName || "there"},</p>
    <p>We received a request to reset your CareerPilot AI password.</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p>Or copy this link: ${resetUrl}</p>
    <p>This link expires in 1 hour.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `;

  console.log("[mail] sendMail →", { to, from: process.env.SMTP_FROM });

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });

    console.log("[mail] sendMail OK:", {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
    });
    console.log("EMAIL SENT");

    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error("[mail] sendMail FAILED:", err);
    console.error("[mail] error:", formatMailError(err));
    return { sent: false, error: formatMailError(err) };
  }
}
