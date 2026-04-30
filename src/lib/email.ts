import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Check if SMTP is configured (i.e. SMTP_HOST env var is set).
 */
export function isSmtpConfigured(): boolean {
  return !!process.env.SMTP_HOST;
}

/**
 * Create a nodemailer transporter using SMTP env vars.
 * Only called when SMTP_HOST is set.
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  });
}

/**
 * Send an email.
 *
 * If SMTP_HOST is configured, sends the email via SMTP and returns true.
 * If SMTP_HOST is not set, logs the email content to console (dev mode) and returns false.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<boolean> {
  const from =
    process.env.SMTP_FROM || "OpusClip <noreply@opusclip.app>";

  if (!isSmtpConfigured()) {
    // Dev / demo mode — log instead of sending
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("[DEV EMAIL] Email not sent (SMTP_HOST not configured)");
    console.log(`  From:    ${from}`);
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Text:    ${text.substring(0, 200)}${text.length > 200 ? "…" : ""}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    return false;
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text,
    });
    console.log(`[EMAIL] Sent password reset email to ${to}`);
    return true;
  } catch (error) {
    console.error("[EMAIL] Failed to send email:", error);
    return false;
  }
}

/**
 * Generate a professional HTML email for password reset.
 */
export function generateResetEmailHtml(resetUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset Your Password – OpusClip</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f4f5;
      padding: 40px 0;
    }
    .container {
      max-width: 560px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    }
    .header {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      padding: 32px 40px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #ffffff;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.3px;
    }
    .header .brand {
      margin-top: 8px;
      color: rgba(255,255,255,0.85);
      font-size: 14px;
      font-weight: 500;
    }
    .body {
      padding: 36px 40px;
    }
    .body p {
      margin: 0 0 16px;
      color: #3f3f46;
      font-size: 15px;
      line-height: 1.6;
    }
    .button-wrapper {
      text-align: center;
      margin: 28px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 36px;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }
    .fallback {
      margin-top: 24px;
      padding: 16px;
      background-color: #f4f4f5;
      border-radius: 8px;
      font-size: 13px;
      color: #71717a;
      line-height: 1.5;
      word-break: break-all;
    }
    .fallback span {
      font-weight: 600;
      color: #52525b;
    }
    .footer {
      padding: 24px 40px;
      border-top: 1px solid #e4e4e7;
      text-align: center;
    }
    .footer p {
      margin: 0;
      color: #a1a1aa;
      font-size: 12px;
      line-height: 1.5;
    }
    .expiry-notice {
      display: inline-block;
      margin-top: 8px;
      padding: 6px 14px;
      background-color: #fef3c7;
      color: #92400e;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Reset Your Password</h1>
        <div class="brand">OpusClip</div>
      </div>
      <div class="body">
        <p>Hi there,</p>
        <p>We received a request to reset the password for your OpusClip account. Click the button below to choose a new password:</p>
        <div class="button-wrapper">
          <a href="${resetUrl}" class="button">Reset Password</a>
        </div>
        <div class="expiry-notice">
          ⏱ This link expires in 1 hour
        </div>
        <div class="fallback">
          If the button above doesn't work, copy and paste the following URL into your browser:<br />
          <span>${resetUrl}</span>
        </div>
        <p style="margin-top: 24px;">If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.</p>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} OpusClip. All rights reserved.</p>
        <p>This is an automated message — please do not reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate the plain-text fallback for the password reset email.
 */
export function generateResetEmailText(resetUrl: string): string {
  return `
Reset Your Password – OpusClip

Hi there,

We received a request to reset the password for your OpusClip account.

Click the link below to choose a new password:
${resetUrl}

This link expires in 1 hour.

If you didn't request a password reset, you can safely ignore this email — your password will remain unchanged.

© ${new Date().getFullYear()} OpusClip
`.trim();
}
