import nodemailer from 'nodemailer'
import { config } from '../config.js'

let transporter

function getTransporter() {
  if (!config.smtpHost) return null
  if (!transporter) {
    const isGmail = /gmail\.com$/i.test(config.smtpHost)
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      requireTLS: !config.smtpSecure && config.smtpPort === 587,
      tls: isGmail ? { minVersion: 'TLSv1.2' } : undefined,
      auth:
        config.smtpUser && config.smtpPass
          ? { user: config.smtpUser, pass: config.smtpPass }
          : undefined,
    })
  }
  return transporter
}

/**
 * @param {{ to: string, subject: string, text: string, html?: string }} opts
 */
export async function sendMail({ to, subject, text, html }) {
  const from = config.mailFrom || config.smtpUser
  if (!from) {
    console.warn('[mail] MAIL_FROM / SMTP_USER not set; logging body only')
    console.warn('[mail]', { to, subject, text })
    return { sent: false, reason: 'no_from' }
  }
  const tx = getTransporter()
  if (!tx) {
    console.warn('[mail] SMTP_HOST not set; logging body only')
    console.warn('[mail]', { to, subject, text })
    return { sent: false, reason: 'no_smtp' }
  }
  await tx.sendMail({ from, to, subject, text, html: html || text })
  return { sent: true }
}

function esc(v) {
  return String(v || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export async function sendWelcomeEmail({ to, displayName }) {
  const safeName = esc(String(displayName || '').trim() || 'there')
  const text = [
    `Hi ${safeName},`,
    '',
    'Welcome to TrustedHome.',
    'Your account has been created successfully and you can now explore listings, save homes, and connect with agents.',
    '',
    'Security tip: keep your login details private and enable a strong password.',
    '',
    'Thanks for joining us,',
    'TrustedHome Team',
  ].join('\n')

  const html = `
  <div style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <tr>
        <td style="padding:24px 28px;background:linear-gradient(135deg,#4338ca,#1d4ed8);color:#ffffff">
          <div style="font-size:20px;font-weight:700;letter-spacing:.2px">TrustedHome</div>
          <div style="margin-top:6px;font-size:14px;opacity:.92">Welcome to your new home journey</div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px">
          <h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:#0f172a">Welcome, ${safeName} 👋</h1>
          <p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#334155">
            Your TrustedHome account is ready. You can now browse listings, save favorites, and message agents.
          </p>
          <p style="margin:0 0 18px;font-size:14px;line-height:1.65;color:#64748b">
            If this was not you, please ignore this email and secure your inbox password.
          </p>
          <div style="margin:20px 0;padding:14px 16px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;color:#334155;font-size:13px;line-height:1.6">
            Security tip: use a unique, strong password and never share OTP codes with anyone.
          </div>
          <p style="margin:0;font-size:13px;color:#94a3b8">TrustedHome Team</p>
        </td>
      </tr>
    </table>
  </div>`

  return sendMail({
    to,
    subject: 'Welcome to TrustedHome',
    text,
    html,
  })
}
