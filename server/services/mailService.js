import nodemailer from "nodemailer";

const SEND_TIMEOUT_MS = 35_000;

/** Trim Render/env values; strip wrapping quotes; Gmail app passwords often include spaces. */
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

function normalizeAppPassword(value) {
  return cleanEnv(value).replace(/\s+/g, "");
}

/** Env names must match Render: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM, CLIENT_URL */
export function getSmtpConfig() {
  const host = cleanEnv(process.env.SMTP_HOST);
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true";
  const user = cleanEnv(process.env.SMTP_USER);
  const pass = normalizeAppPassword(process.env.SMTP_PASS);
  return { host, port, secure, user, pass };
}

export function smtpConfigured() {
  const { host, user, pass } = getSmtpConfig();
  return Boolean(host && user && pass);
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

function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`${label} timed out after ${ms}ms`);
      err.code = "SMTP_TIMEOUT";
      reject(err);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function closeTransport(transport) {
  try {
    if (transport?.close) await transport.close();
  } catch (err) {
    console.warn("[mail] transport.close:", err?.message);
  }
}

export function createTransport() {
  if (!smtpConfigured()) {
    console.error("[mail] createTransport: missing SMTP_HOST, SMTP_USER, or SMTP_PASS");
    return null;
  }

  const host = cleanEnv(process.env.SMTP_HOST);
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === "true";
  const user = cleanEnv(process.env.SMTP_USER);
  const pass = normalizeAppPassword(process.env.SMTP_PASS);

  const options = {
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 30_000,
    greetingTimeout: 30_000,
    socketTimeout: 30_000,
  };

  if (port === 587 && !secure) {
    options.requireTLS = true;
  }

  console.log("[mail] createTransport:", {
    host: options.host,
    port: options.port,
    secure: options.secure,
    user: options.auth.user,
    hasPassword: Boolean(options.auth.pass),
  });

  return nodemailer.createTransport(options);
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
  const { user } = getSmtpConfig();
  const fromEnv = cleanEnv(process.env.SMTP_FROM);
  if (fromEnv && fromEnv.includes("@")) return fromEnv;
  return cleanEnv(process.env.SMTP_USER) || user;
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

  const transport = createTransport();
  if (!transport) {
    return { sent: false, error: "Failed to create nodemailer transport" };
  }

  const from = resolveFromAddress();

  try {
    const info = await withTimeout(
      transport.sendMail({
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
      }),
      SEND_TIMEOUT_MS,
      "transporter.sendMail"
    );

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
    await closeTransport(transport);
  }
}
