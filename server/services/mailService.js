import nodemailer from "nodemailer";

const SEND_MAIL_MAX_MS = 20000;

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
    cleanEnv(process.env.SMTP_USER) &&
      cleanEnv(process.env.SMTP_PASS) &&
      cleanEnv(process.env.SMTP_FROM)
  );
}

export function formatMailError(err) {
  if (!err) return "Unknown mail error";
  return [
    err.message,
    err.code && `code=${err.code}`,
    err.errno && `errno=${err.errno}`,
    err.syscall && `syscall=${err.syscall}`,
    err.address && `address=${err.address}`,
    err.port != null && `port=${err.port}`,
    err.responseCode != null && `responseCode=${err.responseCode}`,
    err.command && `command=${err.command}`,
    err.response && `response=${String(err.response).slice(0, 500)}`,
  ]
    .filter(Boolean)
    .join(" | ");
}

export function getClientBaseUrl() {
  const url = cleanEnv(process.env.CLIENT_URL) || cleanEnv(process.env.FRONTEND_URL);
  if (!url) {
    console.error("[mail] CLIENT_URL is not set on Render");
    return "";
  }
  return url.replace(/\/+$/, "");
}

export function buildPasswordResetUrl(token, email) {
  const clientUrl = getClientBaseUrl();
  return `${clientUrl}/reset-password?token=${token}&email=${email}`;
}

function createGmailTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: String(process.env.SMTP_PASS || "").replace(/\s+/g, ""),
    },
  });
}

function withSendDeadline(promise) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        const err = new Error(`sendMail timed out after ${SEND_MAIL_MAX_MS}ms`);
        err.code = "SMTP_TIMEOUT";
        reject(err);
      }, SEND_MAIL_MAX_MS);
    }),
  ]);
}

/**
 * @returns {Promise<{ sent: boolean, messageId?: string, error?: string }>}
 */
export async function sendPasswordResetEmail({ to, resetUrl, fullName }) {
  if (!smtpConfigured()) {
    const msg = "Set SMTP_USER, SMTP_PASS, SMTP_FROM, and CLIENT_URL on Render";
    console.error("[mail]", msg);
    return { sent: false, error: msg };
  }

  const transporter = createGmailTransporter();
  const subject = "Reset your CareerPilot AI password";
  const html = `
    <p>Hi ${fullName || "there"},</p>
    <p>We received a request to reset your CareerPilot AI password.</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p>Or copy this link: ${resetUrl}</p>
    <p>This link expires in 1 hour.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `;

  console.log("[mail] sendMail start:", {
    to,
    from: process.env.SMTP_FROM,
    service: "gmail",
  });

  try {
    const info = await withSendDeadline(
      transporter.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject,
        html,
      })
    );

    if (info.rejected?.length) {
      const err = `sendMail rejected: ${info.rejected.join(", ")}`;
      console.error("[mail]", err, info);
      return { sent: false, error: err };
    }

    console.log("[mail] sendMail OK:", info.messageId, info.response);
    console.log("EMAIL SENT");
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error("[mail] sendMail FAILED — full error:", err);
    console.error("[mail] formatted:", formatMailError(err));
    return { sent: false, error: formatMailError(err) };
  } finally {
    try {
      transporter.close();
    } catch {
      /* ignore */
    }
  }
}
