import { OAuth2Client } from 'google-auth-library'
import { pool, query } from '../db.js'
import { config } from '../config.js'
import { signAppToken } from '../utils/jwt.js'
import { createId } from '../utils/createId.js'

const UserRole = { USER: 'USER', AGENT: 'AGENT' }

let client

function getClient() {
  if (!config.googleClientId) {
    const err = new Error('Google sign-in is not configured')
    err.status = 503
    err.expose = true
    throw err
  }
  if (!client) client = new OAuth2Client(config.googleClientId)
  return client
}

const USER_SELECT = `SELECT id, email,
  "passwordHash" AS ph,
  "displayName" AS dn,
  phone,
  role,
  "avatarUrl" AS av,
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
    phone: u.phone,
    emailVerified: Boolean(u.emailVerified),
    createdAt: u.createdAt,
  }
}

export async function loginWithGoogleIdToken({ idToken, intent }) {
  const c = getClient()
  const ticket = await c.verifyIdToken({
    idToken,
    audience: config.googleClientId,
  })
  const payload = ticket.getPayload()
  if (!payload?.sub || !payload.email) {
    const err = new Error('Invalid Google token')
    err.status = 401
    err.expose = true
    throw err
  }
  const sub = payload.sub
  const email = String(payload.email).trim().toLowerCase()
  const want = intent === 'AGENT' ? UserRole.AGENT : UserRole.USER
  const displayName = String(payload.name || email.split('@')[0]).slice(0, 120)
  const avatarUrl = payload.picture || null
  const verifiedByGoogle = Boolean(payload.email_verified)

  const { rows: byG } = await query(`${USER_SELECT} FROM "User" WHERE "googleSub" = $1 LIMIT 1`, [sub])
  const byGoogle = mapUserRow(byG[0])
  if (byGoogle) {
    if (byGoogle.role !== want) {
      const err = new Error(
        want === UserRole.AGENT ? 'This Google account is registered as a user, not an agent.' : 'This Google account is registered as an agent, not a user.',
      )
      err.status = 403
      err.expose = true
      throw err
    }
    const token = signAppToken({ sub: byGoogle.id, email: byGoogle.email, role: byGoogle.role })
    return { token, user: publicUser(byGoogle) }
  }

  const { rows: byE } = await query(`${USER_SELECT} FROM "User" WHERE email = $1 LIMIT 1`, [email])
  const byEmail = mapUserRow(byE[0])
  if (byEmail) {
    if (byEmail.role !== want) {
      const err = new Error(
        want === UserRole.AGENT ? 'This email is registered as a user account.' : 'This email is registered as an agent account.',
      )
      err.status = 403
      err.expose = true
      throw err
    }
    if (byEmail.googleSub && byEmail.googleSub !== sub) {
      const err = new Error('This email is already linked to another Google account.')
      err.status = 409
      err.expose = true
      throw err
    }
    if (!byEmail.googleSub && byEmail.passwordHash) {
      const err = new Error('This email is already registered with a password. Sign in with email or link Google in account settings (coming soon).')
      err.status = 409
      err.expose = true
      throw err
    }
    const { rows: up } = await query(
      `UPDATE "User" SET
        "googleSub" = COALESCE("googleSub", $2),
        "avatarUrl" = COALESCE($3, "avatarUrl"),
        "emailVerified" = ("emailVerified" OR $4),
        "updatedAt" = NOW()
       WHERE id = $1
       RETURNING id, email,
         "passwordHash" AS ph, "displayName" AS dn, phone, role, "avatarUrl" AS av, "googleSub" AS gs,
         "emailVerified" AS ev, "createdAt" AS ca, "updatedAt" AS ua`,
      [byEmail.id, sub, avatarUrl, verifiedByGoogle],
    )
    const updated = mapUserRow(up[0])
    const token = signAppToken({ sub: updated.id, email: updated.email, role: updated.role })
    return { token, user: publicUser(updated) }
  }

  const uid = createId()
  const dbClient = await pool.connect()
  try {
    await dbClient.query('BEGIN')
    await dbClient.query(
      `INSERT INTO "User" ("id", email, "passwordHash", "displayName", phone, role, "avatarUrl", "googleSub", "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, NULL, $3, NULL, $4::"UserRole", $5, $6, $7, NOW(), NOW())`,
      [uid, email, displayName, want, avatarUrl, sub, verifiedByGoogle],
    )
    await dbClient.query(
      `INSERT INTO "Wallet" ("id", "userId", "balanceNgn", "createdAt", "updatedAt") VALUES ($1, $2, 0, NOW(), NOW())`,
      [createId(), uid],
    )
    if (want === UserRole.AGENT) {
      await dbClient.query(
        `INSERT INTO "AgentProfile" ("id", "userId", "agencyName", "licenseId", verified, "createdAt", "updatedAt")
         VALUES ($1, $2, NULL, NULL, false, NOW(), NOW())`,
        [createId(), uid],
      )
    }
    await dbClient.query('COMMIT')
  } catch (err) {
    await dbClient.query('ROLLBACK')
    throw err
  } finally {
    dbClient.release()
  }

  const user = mapUserRow((await query(`${USER_SELECT} FROM "User" WHERE id = $1`, [uid])).rows[0])
  const token = signAppToken({ sub: user.id, email: user.email, role: user.role })
  return { token, user: publicUser(user) }
}
