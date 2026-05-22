import nodemailer from "nodemailer";

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
  );
}

function createTransport() {
  if (!smtpConfigured()) return null;

  const port = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST.trim(),
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER.trim(),
      pass: process.env.SMTP_PASS.trim(),
    },
  });
}

export function getClientBaseUrl() {
  const url =
    process.env.CLIENT_URL?.trim() ||
    process.env.FRONTEND_URL?.trim() ||
    "http://localhost:5173";
  return url.replace(/\/+$/, "");
}

/**
 * @returns {{ sent: boolean }}
 */
export async function sendPasswordResetEmail({ to, resetUrl, fullName }) {
  const transport = createTransport();
  const from =
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    "CareerPilot AI <noreply@careerpilot.ai>";

  if (!transport) {
    console.warn("[mail] SMTP not configured — password reset link (dev only):", resetUrl);
    return { sent: false };
  }

  await transport.sendMail({
    from,
    to,
    subject: "Reset your CareerPilot AI password",
    text: [
      `Hi ${fullName || "there"},`,
      "",
      "We received a request to reset your password.",
      `Reset link (expires in 1 hour): ${resetUrl}`,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `
      <p>Hi ${fullName || "there"},</p>
      <p>We received a request to reset your CareerPilot AI password.</p>
      <p><a href="${resetUrl}">Reset your password</a> (link expires in 1 hour)</p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });

  return { sent: true };
}
