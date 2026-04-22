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
    html: `<p>${mailIntro}</p><p style="font-size:22px;font-weight:bold;letter-spacing:0.2em">${code}</p><p style="color:#64748b;font-size:13px">Expires in 10 minutes. If you did not request this, you can ignore this email.</p>`,
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
