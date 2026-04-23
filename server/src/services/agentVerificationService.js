import { query } from '../db.js'

function mapAgentRow(r) {
  if (!r) return null
  const verified = Boolean(r.verified)
  return {
    userId: r.userid ?? r.userId,
    profileId: r.profileid ?? r.profileId,
    email: r.email,
    displayName: r.displayname ?? r.displayName,
    phone: r.phone ?? null,
    agencyName: r.agencyname ?? r.agencyName ?? null,
    licenseId: r.licenseid ?? r.licenseId ?? null,
    nin: r.nin ?? null,
    verificationPhotoUrl: r.verificationphotourl ?? r.verificationPhotoUrl ?? null,
    emergencyContact: r.emergencycontact ?? r.emergencyContact ?? null,
    verificationRequestedAt: r.verificationrequestedat ?? r.verificationRequestedAt ?? null,
    verified,
    verificationStatus: verified ? 'VERIFIED' : 'PENDING',
    profileCreatedAt: r.profilecreatedat ?? r.profileCreatedAt,
    profileUpdatedAt: r.profileupdatedat ?? r.profileUpdatedAt,
  }
}

const AGENT_SELECT = `SELECT
  u.id AS "userId",
  ap.id AS "profileId",
  u.email,
  u."displayName",
  u.phone,
  ap."agencyName",
  ap."licenseId",
  ap.nin,
  ap."verificationPhotoUrl",
  ap."emergencyContact",
  ap."verificationRequestedAt",
  ap.verified,
  ap."createdAt" AS "profileCreatedAt",
  ap."updatedAt" AS "profileUpdatedAt"
FROM "AgentProfile" ap
JOIN "User" u ON u.id = ap."userId"
WHERE u.role = 'AGENT'::"UserRole"`

export async function listPendingAgentVerification() {
  const { rows } = await query(
    `${AGENT_SELECT}
     AND ap.verified = false
     ORDER BY ap."createdAt" ASC`,
  )
  return rows.map(mapAgentRow)
}

export async function setAgentVerificationStatus({ userId, approved }) {
  const yes = Boolean(approved)
  const { rows } = await query(
    `UPDATE "AgentProfile" ap
     SET verified = $2, "updatedAt" = NOW()
     FROM "User" u
     WHERE ap."userId" = u.id
       AND u.id = $1
       AND u.role = 'AGENT'::"UserRole"
     RETURNING
       u.id AS "userId",
       ap.id AS "profileId",
       u.email,
       u."displayName",
       u.phone,
       ap."agencyName",
       ap."licenseId",
       ap.nin,
       ap."verificationPhotoUrl",
       ap."emergencyContact",
       ap."verificationRequestedAt",
       ap.verified,
       ap."createdAt" AS "profileCreatedAt",
       ap."updatedAt" AS "profileUpdatedAt"`,
    [userId, yes],
  )
  const row = rows[0]
  if (!row) {
    const err = new Error('Agent profile not found')
    err.status = 404
    err.expose = true
    throw err
  }
  return mapAgentRow(row)
}

export async function getMyAgentVerificationStatus(userId) {
  const { rows } = await query(
    `SELECT
       u.role,
       ap.id AS "profileId",
       ap.verified,
       ap."agencyName",
       ap."licenseId",
       ap.nin,
       ap."verificationPhotoUrl",
       ap."emergencyContact",
       ap."verificationRequestedAt",
       ap."createdAt" AS "profileCreatedAt",
       ap."updatedAt" AS "profileUpdatedAt"
     FROM "User" u
     LEFT JOIN "AgentProfile" ap ON ap."userId" = u.id
     WHERE u.id = $1
     LIMIT 1`,
    [userId],
  )
  const row = rows[0]
  if (!row) {
    const err = new Error('User not found')
    err.status = 404
    err.expose = true
    throw err
  }
  const role = row.role
  if (role !== 'AGENT') {
    return { role, hasAgentProfile: false, verificationStatus: 'NOT_APPLICABLE', verified: false }
  }
  if (!row.profileId) {
    return { role, hasAgentProfile: false, verificationStatus: 'MISSING_PROFILE', verified: false }
  }
  const verified = Boolean(row.verified)
  return {
    role,
    hasAgentProfile: true,
    verificationStatus: verified ? 'VERIFIED' : 'PENDING',
    verified,
    agencyName: row.agencyName ?? null,
    licenseId: row.licenseId ?? null,
    nin: row.nin ?? null,
    verificationPhotoUrl: row.verificationPhotoUrl ?? null,
    emergencyContact: row.emergencyContact ?? null,
    verificationRequestedAt: row.verificationRequestedAt ?? null,
    profileCreatedAt: row.profileCreatedAt,
    profileUpdatedAt: row.profileUpdatedAt,
  }
}

export async function submitMyVerificationRequest({
  userId,
  nin,
  verificationPhotoUrl,
  emergencyContact,
}) {
  const n = String(nin || '').trim()
  const p = String(verificationPhotoUrl || '').trim()
  const e = String(emergencyContact || '').trim()
  if (!n || !p || !e) {
    const err = new Error('nin, verificationPhotoUrl and emergencyContact are required')
    err.status = 400
    err.expose = true
    throw err
  }
  const { rows } = await query(
    `UPDATE "AgentProfile" ap
     SET
       nin = $2,
       "verificationPhotoUrl" = $3,
       "emergencyContact" = $4,
       "verificationRequestedAt" = NOW(),
       verified = false,
       "updatedAt" = NOW()
     FROM "User" u
     WHERE ap."userId" = u.id
       AND u.id = $1
       AND u.role = 'AGENT'::"UserRole"
     RETURNING
       u.id AS "userId",
       ap.id AS "profileId",
       u.email,
       u."displayName",
       u.phone,
       ap."agencyName",
       ap."licenseId",
       ap.nin,
       ap."verificationPhotoUrl",
       ap."emergencyContact",
       ap."verificationRequestedAt",
       ap.verified,
       ap."createdAt" AS "profileCreatedAt",
       ap."updatedAt" AS "profileUpdatedAt"`,
    [userId, n, p, e],
  )
  const row = rows[0]
  if (!row) {
    const err = new Error('Agent profile not found')
    err.status = 404
    err.expose = true
    throw err
  }
  return mapAgentRow(row)
}
