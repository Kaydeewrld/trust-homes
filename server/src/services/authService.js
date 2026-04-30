import { pool, query } from '../db.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { signAppToken } from '../utils/jwt.js'
import { assertPasswordStrength } from '../utils/passwordPolicy.js'
import { createAndDeliverOtp, verifyOtpRecord, OtpPurpose } from './otpService.js'
import { sendWelcomeEmail, schedulePostVerificationNewsletter } from './mailService.js'
import { sendTransactionAlertEmails } from './transactionEmailService.js'
import { createId } from '../utils/createId.js'

const UserRole = { USER: 'USER', AGENT: 'AGENT' }
let userProfileTableReadyPromise = null

const USER_SELECT = `SELECT id, email,
  "passwordHash" AS ph,
  "displayName" AS dn,
  phone,
  role,
  "avatarUrl" AS av,
  (SELECT up.bio FROM "UserProfile" up WHERE up."userId" = "User".id LIMIT 1) AS bio,
  "googleSub" AS gs,
  "emailVerified" AS ev,
  "createdAt" AS ca,
  "updatedAt" AS ua`

function mapUserRow(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.ph,
    displayName: row.dn,
    phone: row.phone,
    role: row.role,
    avatarUrl: row.av,
    bio: row.bio ?? null,
    googleSub: row.gs,
    emailVerified: row.ev,
    createdAt: row.ca,
    updatedAt: row.ua,
  }
}

function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    role: u.role,
    avatarUrl: u.avatarUrl,
    bio: u.bio ?? null,
    phone: u.phone,
    emailVerified: Boolean(u.emailVerified),
    createdAt: u.createdAt,
  }
}

async function selectUserByEmail(email) {
  await ensureUserProfileTableReady()
  const { rows } = await query(`${USER_SELECT} FROM "User" WHERE email = $1 LIMIT 1`, [email])
  return mapUserRow(rows[0])
}

async function selectUserById(id) {
  await ensureUserProfileTableReady()
  const { rows } = await query(`${USER_SELECT} FROM "User" WHERE id = $1 LIMIT 1`, [id])
  return mapUserRow(rows[0])
}

async function ensureUserProfileTable() {
  await query(`CREATE TABLE IF NOT EXISTS "UserProfile" (
    "userId" TEXT PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "bio" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)
}

async function ensureUserProfileTableReady() {
  if (!userProfileTableReadyPromise) {
    userProfileTableReadyPromise = ensureUserProfileTable().catch((err) => {
      userProfileTableReadyPromise = null
      throw err
    })
  }
  await userProfileTableReadyPromise
}

export async function register({ email, password, displayName, role, phone, agencyName, licenseId }) {
  const e = String(email || '').trim().toLowerCase()
  if (!e || !password) {
    const err = new Error('Valid email and password required')
    err.status = 400
    err.expose = true
    throw err
  }
  assertPasswordStrength(password)
  const r = role === 'AGENT' ? UserRole.AGENT : UserRole.USER
  const { rows: exists } = await query('SELECT id FROM "User" WHERE email = $1 LIMIT 1', [e])
  if (exists.length) {
    const err = new Error('Email already registered')
    err.status = 409
    err.expose = true
    throw err
  }
  const passwordHash = await hashPassword(password)
  const name = String(displayName || '').trim() || e.split('@')[0]
  const uid = createId()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    await client.query(
      `INSERT INTO "User" ("id", email, "passwordHash", "displayName", phone, role, "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6::"UserRole", false, NOW(), NOW())`,
      [uid, e, passwordHash, name, phone || null, r],
    )
    await client.query(
      `INSERT INTO "Wallet" ("id", "userId", "balanceNgn", "createdAt", "updatedAt") VALUES ($1, $2, 0, NOW(), NOW())`,
      [createId(), uid],
    )
    if (r === UserRole.AGENT) {
      await client.query(
        `INSERT INTO "AgentProfile" ("id", "userId", "agencyName", "licenseId", verified, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, false, NOW(), NOW())`,
        [createId(), uid, agencyName || null, licenseId || null],
      )
    }
    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }

  const user = await selectUserById(uid)
  let emailDelivery = 'sent'
  try {
    await createAndDeliverOtp({
      email: e,
      purpose: OtpPurpose.VERIFY_EMAIL,
      mailSubject: 'Your TrustedHome verification code',
      mailIntro: 'Use this code to verify your email address:',
    })
  } catch (err) {
    console.error('[auth] verify-email OTP send failed (account was created):', err?.message || err)
    emailDelivery = 'failed'
  }
  const token = signAppToken({ sub: user.id, email: user.email, role: user.role })
  const out = { token, user: publicUser(user) }
  if (emailDelivery === 'failed') out.emailDelivery = 'failed'
  return out
}

export async function login({ email, password, intent }) {
  const e = String(email || '').trim().toLowerCase()
  const user = await selectUserByEmail(e)
  if (!user) {
    const err = new Error('Invalid email or password')
    err.status = 401
    err.expose = true
    throw err
  }
  if (!user.passwordHash) {
    const err = new Error('This account uses Google sign-in. Continue with Google.')
    err.status = 400
    err.expose = true
    throw err
  }
  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) {
    const err = new Error('Invalid email or password')
    err.status = 401
    err.expose = true
    throw err
  }
  const want = intent === 'AGENT' ? UserRole.AGENT : UserRole.USER
  if (user.role !== want) {
    const err = new Error(intent === 'AGENT' ? 'This account is not an agent login.' : 'This account is not a user login.')
    err.status = 403
    err.expose = true
    throw err
  }
  const token = signAppToken({ sub: user.id, email: user.email, role: user.role })
  return { token, user: publicUser(user) }
}

export async function verifyEmailWithOtp({ email, code }) {
  const e = String(email || '').trim().toLowerCase()
  const v = await verifyOtpRecord({ email: e, purpose: OtpPurpose.VERIFY_EMAIL, code })
  if (!v.ok) {
    const err = new Error(v.error)
    err.status = 400
    err.expose = true
    throw err
  }
  const user = await selectUserByEmail(e)
  if (!user) {
    const err = new Error('User not found')
    err.status = 404
    err.expose = true
    throw err
  }
  const { rows } = await query(
    `UPDATE "User" SET "emailVerified" = true, "updatedAt" = NOW() WHERE id = $1
     RETURNING id, email,
       "passwordHash" AS ph, "displayName" AS dn, phone, role, "avatarUrl" AS av, "googleSub" AS gs,
       "emailVerified" AS ev, "createdAt" AS ca, "updatedAt" AS ua`,
    [user.id],
  )
  const updated = mapUserRow(rows[0])
  const token = signAppToken({ sub: updated.id, email: updated.email, role: updated.role })

  void sendWelcomeEmail({ to: updated.email, displayName: updated.displayName }).catch((err) => {
    console.error('[auth] welcome email send failed after verify:', err?.message || err)
  })
  schedulePostVerificationNewsletter({ to: updated.email, displayName: updated.displayName })

  return { token, user: publicUser(updated) }
}

export async function resendVerifyEmailOtp({ email }) {
  const e = String(email || '').trim().toLowerCase()
  const user = await selectUserByEmail(e)
  if (!user) {
    return { ok: true, message: 'If an account exists for this email, a code was sent.' }
  }
  if (user.emailVerified) {
    return { ok: true, message: 'If an account exists for this email, a code was sent.' }
  }
  await createAndDeliverOtp({
    email: e,
    purpose: OtpPurpose.VERIFY_EMAIL,
    mailSubject: 'Your TrustedHome verification code',
    mailIntro: 'Use this code to verify your email address:',
  })
  return { ok: true, message: 'If an account exists for this email, a code was sent.' }
}

export async function requestPasswordChangeOtp(userId) {
  const user = await selectUserById(userId)
  if (!user) {
    const err = new Error('User not found')
    err.status = 404
    err.expose = true
    throw err
  }
  if (!user.passwordHash) {
    const err = new Error('Password change is not available for Google-only accounts.')
    err.status = 400
    err.expose = true
    throw err
  }
  await createAndDeliverOtp({
    email: user.email,
    purpose: OtpPurpose.PASSWORD_CHANGE,
    mailSubject: 'Your TrustedHome password change code',
    mailIntro: 'Use this code to confirm your password change:',
  })
  return { ok: true }
}

const forgotPasswordGenericMessage =
  'If an account exists for this email with password sign-in, a reset code was sent.'

export async function requestForgotPasswordOtp({ email }) {
  const e = String(email || '').trim().toLowerCase()
  const user = await selectUserByEmail(e)
  if (!user?.passwordHash) {
    return { ok: true, message: forgotPasswordGenericMessage }
  }
  await createAndDeliverOtp({
    email: e,
    purpose: OtpPurpose.FORGOT_PASSWORD,
    mailSubject: 'Reset your TrustedHome password',
    mailIntro: 'Use this code to reset your password:',
  })
  return { ok: true, message: forgotPasswordGenericMessage }
}

export async function resetPasswordWithForgotOtp({ email, otp, newPassword }) {
  assertPasswordStrength(newPassword)
  const e = String(email || '').trim().toLowerCase()
  const v = await verifyOtpRecord({ email: e, purpose: OtpPurpose.FORGOT_PASSWORD, code: otp })
  if (!v.ok) {
    const err = new Error(v.error)
    err.status = 400
    err.expose = true
    throw err
  }
  const user = await selectUserByEmail(e)
  if (!user?.passwordHash) {
    const err = new Error('Password reset is not available for this account. Try signing in with Google.')
    err.status = 400
    err.expose = true
    throw err
  }
  const passwordHash = await hashPassword(newPassword)
  await query(`UPDATE "User" SET "passwordHash" = $2, "updatedAt" = NOW() WHERE id = $1`, [user.id, passwordHash])
  void sendTransactionAlertEmails({
    title: 'Password reset complete',
    summaryHtml:
      '<p>Your TrustedHome password was reset using a one-time code.</p><p style="margin-top:12px;color:#64748b;font-size:13px">If you did not do this, contact support immediately.</p>',
    summaryText: 'Your TrustedHome password was reset via forgot-password flow.',
    userEmail: user.email,
    userDisplayName: user.displayName,
  }).catch((err) => console.error('[auth] forgot-password alert email failed:', err?.message || err))
  return { ok: true }
}

export async function changePasswordWithOtp({ userId, currentPassword, newPassword, otp }) {
  assertPasswordStrength(newPassword)
  const user = await selectUserById(userId)
  if (!user?.passwordHash) {
    const err = new Error('Password change is not available for this account.')
    err.status = 400
    err.expose = true
    throw err
  }
  const curOk = await verifyPassword(currentPassword, user.passwordHash)
  if (!curOk) {
    const err = new Error('Current password is incorrect')
    err.status = 401
    err.expose = true
    throw err
  }
  const v = await verifyOtpRecord({
    email: user.email,
    purpose: OtpPurpose.PASSWORD_CHANGE,
    code: otp,
  })
  if (!v.ok) {
    const err = new Error(v.error)
    err.status = 400
    err.expose = true
    throw err
  }
  const passwordHash = await hashPassword(newPassword)
  await query(`UPDATE "User" SET "passwordHash" = $2, "updatedAt" = NOW() WHERE id = $1`, [userId, passwordHash])
  void sendTransactionAlertEmails({
    title: 'Password updated',
    summaryHtml:
      '<p>Your TrustedHome password was changed successfully.</p><p style="margin-top:12px;color:#64748b;font-size:13px">If you did not do this, secure your email and contact support immediately.</p>',
    summaryText: 'Your TrustedHome password was changed successfully. If this was not you, contact support.',
    userEmail: user.email,
    userDisplayName: user.displayName,
  }).catch((err) => console.error('[auth] password-change alert email failed:', err?.message || err))
  return { ok: true }
}

export async function getMe(userId) {
  await ensureUserProfileTable()
  const user = await selectUserById(userId)
  if (!user) {
    const err = new Error('User not found')
    err.status = 404
    err.expose = true
    throw err
  }
  return publicUser(user)
}

export async function updateMe(userId, { displayName, phone, avatarUrl, bio }) {
  await ensureUserProfileTable()
  const user = await selectUserById(userId)
  if (!user) {
    const err = new Error('User not found')
    err.status = 404
    err.expose = true
    throw err
  }
  const nextName = String(displayName ?? user.displayName ?? '').trim() || user.email.split('@')[0] || 'Member'
  const nextPhone = phone == null ? user.phone : String(phone).trim() || null
  const nextAvatar = avatarUrl == null ? user.avatarUrl : String(avatarUrl).trim() || null
  const nextBio = bio == null ? user.bio : String(bio).trim()
  await query(
    `UPDATE "User" SET "displayName" = $2, phone = $3, "avatarUrl" = $4, "updatedAt" = NOW() WHERE id = $1`,
    [userId, nextName, nextPhone, nextAvatar],
  )
  await query(
    `INSERT INTO "UserProfile" ("userId", bio, "updatedAt")
     VALUES ($1, $2, NOW())
     ON CONFLICT ("userId")
     DO UPDATE SET bio = EXCLUDED.bio, "updatedAt" = NOW()`,
    [userId, nextBio || null],
  )
  const refreshed = await selectUserById(userId)
  return publicUser(refreshed)
}
