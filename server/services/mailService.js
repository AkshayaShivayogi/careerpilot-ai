import { Resend } from "resend";

let resendClient = null;

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

export function emailServiceConfigured() {
  return Boolean(cleanEnv(process.env.RESEND_API_KEY) && cleanEnv(process.env.EMAIL_FROM));
}

/** @deprecated use emailServiceConfigured */
export const smtpConfigured = emailServiceConfigured;

export function getResendClient() {
  if (!emailServiceConfigured()) return null;
  if (!resendClient) {
    resendClient = new Resend(cleanEnv(process.env.RESEND_API_KEY));
  }
  return resendClient;
}

export function formatMailError(err) {
  if (!err) return "Unknown email error";
  if (typeof err === "string") return err;
  return err.message || JSON.stringify(err);
}

export function getClientBaseUrl() {
  const url = cleanEnv(process.env.CLIENT_URL) || cleanEnv(process.env.FRONTEND_URL);
  if (!url) return "";
  return url.replace(/\/+$/, "");
}

export function buildPasswordResetUrl(token, email) {
  return `${getClientBaseUrl()}/reset-password?token=${token}&email=${email}`;
}

/**
 * @returns {Promise<{ sent: boolean, messageId?: string, error?: string }>}
 */
export async function sendPasswordResetEmail({ to, resetUrl, fullName }) {
  const resend = getResendClient();
  if (!resend) {
    return { sent: false, error: "RESEND_API_KEY and EMAIL_FROM are required" };
  }

  const from = cleanEnv(process.env.EMAIL_FROM);
  const subject = "Reset your CareerPilot AI password";
  const html = `
    <p>Hi ${fullName || "there"},</p>
    <p>We received a request to reset your CareerPilot AI password.</p>
    <p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 20px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">
        Reset your password
      </a>
    </p>
    <p>Or copy this link: <a href="${resetUrl}">${resetUrl}</a></p>
    <p>This link expires in 1 hour.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("[mail] Resend error:", error);
      return { sent: false, error: formatMailError(error) };
    }

    return { sent: true, messageId: data?.id };
  } catch (err) {
    console.error("[mail] Resend exception:", err);
    return { sent: false, error: formatMailError(err) };
  }
}
