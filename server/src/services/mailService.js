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
 * @param {{ to: string, subject: string, text: string, html?: string, bcc?: string }} opts
 */
export async function sendMail({ to, subject, text, html, bcc }) {
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
  await tx.sendMail({ from, to, subject, text, html: html || text, bcc: bcc || undefined })
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
    'Your email is verified and your account is fully active. Explore listings, save homes you love, and connect with trusted agents.',
    '',
    'Security tip: keep your login details private and use a strong, unique password.',
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
          <div style="margin-top:6px;font-size:14px;opacity:.92">You&apos;re verified — welcome aboard</div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px">
          <h1 style="margin:0 0 10px;font-size:22px;line-height:1.3;color:#0f172a">Welcome, ${safeName} 👋</h1>
          <p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#334155">
            Your email is verified and your TrustedHome account is ready. Browse listings, save favorites, and message agents whenever you like.
          </p>
          <p style="margin:0 0 18px;font-size:14px;line-height:1.65;color:#64748b">
            If this was not you, please secure your email account and contact support.
          </p>
          <div style="margin:20px 0;padding:14px 16px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;color:#334155;font-size:13px;line-height:1.6">
            Security tip: never share OTP codes or passwords with anyone. TrustedHome will never ask for your code by phone or DM.
          </div>
          <p style="margin:0;font-size:13px;color:#94a3b8">TrustedHome Team</p>
        </td>
      </tr>
    </table>
  </div>`

  return sendMail({
    to,
    subject: 'Welcome to TrustedHome - email verified',
    text,
    html,
  })
}

const NEWSLETTER_DELAY_MS = 60 * 60 * 1000

function publicExploreUrl() {
  const b = String(config.appPublicUrl || '').trim().replace(/\/+$/, '')
  if (!b || !/^https?:\/\//i.test(b)) return ''
  return `${b}/explore`
}

export async function sendPostVerificationNewsletter({ to, displayName }) {
  const safeName = esc(String(displayName || '').trim() || 'there')
  const exploreUrl = publicExploreUrl()
  const ctaLine = exploreUrl
    ? `Start exploring: ${exploreUrl}`
    : 'Open the TrustedHome app or website to explore new listings and saved searches.'

  const text = [
    `Hi ${safeName},`,
    '',
    'Amazing offers from TrustedHome are here.',
    'Discover curated homes, price drops, and spotlight listings picked for buyers and renters like you.',
    '',
    ctaLine,
    '',
    'We are building the most trusted way to find a home in Nigeria — stay tuned for more perks.',
    '',
    'TrustedHome',
  ].join('\n')

  const ctaBlock = exploreUrl
    ? `<a href="${exploreUrl.replace(/&/g, '&amp;')}" style="display:inline-block;margin-top:8px;padding:12px 22px;border-radius:999px;background:#4338ca;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none">Explore listings</a>`
    : ''

  const html = `
  <div style="margin:0;padding:24px;background:#eef2ff;font-family:Arial,sans-serif;color:#0f172a">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #c7d2fe">
      <tr>
        <td style="padding:24px 28px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff">
          <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;opacity:.9">TrustedHome picks</div>
          <div style="margin-top:8px;font-size:22px;font-weight:800;line-height:1.25">Amazing offers &amp; fresh homes</div>
          <div style="margin-top:8px;font-size:14px;opacity:.95">Hand-picked for you, ${safeName}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px">
          <p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:#334155">
            Thanks for being part of TrustedHome. Here is a quick digest of what you can do next: explore new listings, save your favorites, and get ahead when agents respond fast.
          </p>
          <ul style="margin:0 0 18px;padding-left:20px;font-size:14px;line-height:1.7;color:#475569">
            <li>Spotlight homes and featured neighborhoods</li>
            <li>Smarter search — filter by budget, beds, and location</li>
            <li>Trusted agents ready to help you move</li>
          </ul>
          <div style="text-align:left">
            ${ctaBlock}
          </div>
          <p style="margin:22px 0 0;font-size:12px;line-height:1.6;color:#94a3b8">
            You received this because you verified your email on TrustedHome. If you prefer fewer emails, reply and we will tune your preferences.
          </p>
        </td>
      </tr>
    </table>
  </div>`

  return sendMail({
    to,
    subject: 'TrustedHome — amazing offers & fresh listings for you',
    text,
    html,
  })
}

/** Schedule the post-verification newsletter (default 1 hour). For tests use `delayMs`. */
export function schedulePostVerificationNewsletter({ to, displayName, delayMs = NEWSLETTER_DELAY_MS }) {
  setTimeout(() => {
    sendPostVerificationNewsletter({ to, displayName }).catch((err) => {
      console.error('[mail] delayed newsletter send failed:', err?.message || err)
    })
  }, delayMs)
}
