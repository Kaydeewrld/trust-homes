import crypto from 'crypto'
import { query } from '../db.js'
import { config } from '../config.js'
import { sendMail } from './mailService.js'
import { createId } from '../utils/createId.js'

export const OtpPurpose = {
  VERIFY_EMAIL: 'VERIFY_EMAIL',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  FORGOT_PASSWORD: 'FORGOT_PASSWORD',
}

const OTP_TTL_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 6

function pepper() {
  return config.otpPepper || config.jwtSecret
}

function digestCode(email, purpose, code) {
  return crypto.createHmac('sha256', pepper()).update(`${String(email).toLowerCase()}:${purpose}:${code}`).digest('hex')
}

function randomSixDigit() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
}

function esc(v) {
  return String(v || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function otpPurposeLabel(purpose) {
  if (purpose === OtpPurpose.VERIFY_EMAIL) return 'Email verification'
  if (purpose === OtpPurpose.PASSWORD_CHANGE) return 'Password change'
  if (purpose === OtpPurpose.FORGOT_PASSWORD) return 'Password reset'
  return 'Secure verification'
}

function renderOtpEmailHtml({ intro, code, purpose }) {
  const safeIntro = esc(intro)
  const safeCode = esc(code)
  const safePurpose = esc(otpPurposeLabel(purpose))
  return `
  <div style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0">
      <tr>
        <td style="padding:24px 28px;background:linear-gradient(135deg,#4338ca,#1d4ed8);color:#ffffff">
          <div style="font-size:20px;font-weight:700;letter-spacing:.2px">TrustedHome</div>
          <div style="margin-top:6px;font-size:14px;opacity:.92">${safePurpose}</div>
        </td>
      </tr>
      <tr>
        <td style="padding:28px">
          <p style="margin:0 0 10px;font-size:15px;line-height:1.65;color:#334155">${safeIntro}</p>
          <div style="margin:18px 0;padding:18px 16px;border-radius:12px;border:1px dashed #c7d2fe;background:#eef2ff;text-align:center">
            <div style="font-size:12px;letter-spacing:.1em;color:#64748b;text-transform:uppercase;margin-bottom:6px">Your code</div>
            <div style="font-size:32px;font-weight:800;letter-spacing:.28em;color:#312e81">${safeCode}</div>
          </div>
          <p style="margin:0 0 10px;font-size:14px;line-height:1.65;color:#334155">This code expires in <strong>10 minutes</strong>.</p>
          <p style="margin:0;font-size:13px;line-height:1.65;color:#94a3b8">
            For your security, never share this code with anyone. TrustedHome staff will never ask for it.
          </p>
        </td>
      </tr>
    </table>
  </div>`
}

export async function createAndDeliverOtp({ email, purpose, mailSubject, mailIntro }) {
  const e = String(email || '').trim().toLowerCase()
  if (!e) {
    const err = new Error('Email required')
    err.status = 400
    err.expose = true
    throw err
  }
  const code = randomSixDigit()
  const codeDigest = digestCode(e, purpose, code)
  const expiresAt = new Date(Date.now() + OTP_TTL_MS)

  await query(
    `UPDATE "OtpCode" SET "consumedAt" = NOW() WHERE email = $1 AND purpose = $2::"OtpPurpose" AND "consumedAt" IS NULL`,
    [e, purpose],
  )

  await query(
    `INSERT INTO "OtpCode" ("id", email, purpose, "codeDigest", "expiresAt", attempts, "consumedAt", "createdAt")
     VALUES ($1, $2, $3::"OtpPurpose", $4, $5, 0, NULL, NOW())`,
    [createId(), e, purpose, codeDigest, expiresAt],
  )

  const body = `${mailIntro}\n\nYour TrustedHome code: ${code}\n\nThis code expires in 10 minutes. If you did not request it, ignore this email.`

  await sendMail({
    to: e,
    subject: mailSubject,
    text: body,
    html: renderOtpEmailHtml({ intro: mailIntro, code, purpose }),
  })

  return { delivered: true }
}

/**
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export async function verifyOtpRecord({ email, purpose, code }) {
  const e = String(email || '').trim().toLowerCase()
  const c = String(code || '').replace(/\D/g, '')
  if (!e || !/^\d{6}$/.test(c)) return { ok: false, error: 'Invalid code' }

  const { rows } = await query(
    `SELECT id, "codeDigest" AS d, attempts FROM "OtpCode"
     WHERE email = $1 AND purpose = $2::"OtpPurpose" AND "consumedAt" IS NULL AND "expiresAt" > NOW()
     ORDER BY "createdAt" DESC LIMIT 1`,
    [e, purpose],
  )
  const row = rows[0]
  if (!row) return { ok: false, error: 'Code expired or not found. Request a new one.' }

  if (row.attempts >= MAX_ATTEMPTS) {
    await query(`UPDATE "OtpCode" SET "consumedAt" = NOW() WHERE id = $1`, [row.id])
    return { ok: false, error: 'Too many attempts. Request a new code.' }
  }

  const stored = row.d
  const got = digestCode(e, purpose, c)
  const match =
    stored &&
    String(stored).length === got.length &&
    crypto.timingSafeEqual(Buffer.from(String(stored), 'utf8'), Buffer.from(got, 'utf8'))

  if (!match) {
    await query(`UPDATE "OtpCode" SET attempts = attempts + 1 WHERE id = $1`, [row.id])
    return { ok: false, error: 'Invalid code' }
  }

  await query(`UPDATE "OtpCode" SET "consumedAt" = NOW() WHERE id = $1`, [row.id])
  return { ok: true }
}
