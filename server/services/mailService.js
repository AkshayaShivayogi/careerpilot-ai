import nodemailer from "nodemailer";

let transporter = null;
let mailVerifyState = {
  checked: false,
  ok: false,
  error: "SMTP not initialized",
};

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

function createTransporter() {
  console.log("[mail] before transporter creation");

  const instance = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: cleanEnv(process.env.SMTP_USER),
      pass: cleanEnv(process.env.SMTP_PASS),
    },
    tls: {
      rejectUnauthorized: false,
      family: 4,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  console.log("[mail] after transporter creation", {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    user: cleanEnv(process.env.SMTP_USER),
  });

  return instance;
}

export async function initMailService() {
  if (!smtpConfigured()) {
    mailVerifyState = {
      checked: true,
      ok: false,
      error: "Missing SMTP_USER, SMTP_PASS, or SMTP_FROM",
    };
    console.error("[mail] startup:", mailVerifyState.error);
    return { ...mailVerifyState };
  }

  try {
    transporter = createTransporter();
    await transporter.verify();
    mailVerifyState = { checked: true, ok: true, error: null };
    console.log("[mail] transporter.verify() OK");
  } catch (err) {
    console.error("[mail] transporter.verify() FAILED — full error:", err);
    console.error("[mail] FULL SMTP ERROR:", formatMailError(err));
    transporter = null;
    mailVerifyState = {
      checked: true,
      ok: false,
      error: formatMailError(err),
    };
  }

  return { ...mailVerifyState };
}

export function getMailServiceStatus() {
  return { ...mailVerifyState };
}

export function isMailServiceReady() {
  return mailVerifyState.checked && mailVerifyState.ok && Boolean(transporter);
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
  return `${getClientBaseUrl()}/reset-password?token=${token}&email=${email}`;
}

/**
 * @returns {Promise<{ sent: boolean, messageId?: string, error?: string }>}
 */
export async function sendPasswordResetEmail({ to, resetUrl, fullName }) {
  if (!smtpConfigured()) {
    const error = "SMTP_USER, SMTP_PASS, and SMTP_FROM are required";
    console.error("[mail]", error);
    return { sent: false, error };
  }

  if (!mailVerifyState.checked) {
    await initMailService();
  }

  if (!isMailServiceReady()) {
    const error = mailVerifyState.error || "Mail service unavailable";
    console.error("[mail] sendMail skipped — SMTP not ready:", error);
    return { sent: false, error };
  }

  const from = cleanEnv(process.env.SMTP_FROM);
  const subject = "Reset your CareerPilot AI password";
  const html = `
    <p>Hi ${fullName || "there"},</p>
    <p>We received a request to reset your CareerPilot AI password.</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p>Or copy this link: ${resetUrl}</p>
    <p>This link expires in 1 hour.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `;

  console.log("[mail] sendMail start", { to, from, resetUrl });

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    if (info.rejected?.length) {
      const error = `sendMail rejected: ${info.rejected.join(", ")}`;
      console.error("[mail] FULL SMTP ERROR:", error);
      return { sent: false, error };
    }

    console.log("[mail] after sendMail OK", {
      messageId: info.messageId,
      accepted: info.accepted,
      response: info.response,
    });
    console.log("EMAIL SENT");
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error("[mail] sendMail FAILED — full error:", err);
    const error = formatMailError(err);
    console.error("[mail] FULL SMTP ERROR:", error);
    return { sent: false, error };
  }
}
