import { query } from '../db.js'

function mapAgent(r) {
  return {
    id: String(r.id),
    displayName: String(r.displayName || 'Agent'),
    email: String(r.email || ''),
    phone: String(r.phone || ''),
    avatarUrl: r.avatarUrl || '',
    verified: Boolean(r.verified),
    agencyName: r.agencyName || '',
    activeListings: Number(r.activeListings || 0),
    soldListings: Number(r.soldListings || 0),
    score: Number(r.soldListings || 0) * 3 + Number(r.activeListings || 0),
  }
}

export async function listAgents({ take = 200, skip = 0 } = {}) {
  const lim = Math.min(Math.max(Number(take) || 200, 1), 500)
  const off = Math.max(Number(skip) || 0, 0)
  const { rows } = await query(
    `SELECT
      u.id,
      u."displayName",
      u.email,
      u.phone,
      COALESCE(u."avatarUrl", '') AS "avatarUrl",
      COALESCE(ap.verified, false) AS verified,
      COALESCE(ap."agencyName", '') AS "agencyName",
      (
        SELECT COUNT(1)::int FROM "Listing" l
        WHERE l."ownerId" = u.id AND l.status = 'APPROVED'::"ListingStatus"
      ) AS "activeListings",
      (
        SELECT COUNT(1)::int FROM "Listing" l
        WHERE l."ownerId" = u.id AND l.status = 'SOLD'::"ListingStatus"
      ) AS "soldListings"
     FROM "User" u
     LEFT JOIN "AgentProfile" ap ON ap."userId" = u.id
     WHERE u.role = 'AGENT'::"UserRole"
     ORDER BY
      (
        SELECT COUNT(1)::int FROM "Listing" l
        WHERE l."ownerId" = u.id AND l.status = 'SOLD'::"ListingStatus"
      ) DESC,
      (
        SELECT COUNT(1)::int FROM "Listing" l
        WHERE l."ownerId" = u.id AND l.status = 'APPROVED'::"ListingStatus"
      ) DESC,
      u."createdAt" DESC
     LIMIT $1 OFFSET $2`,
    [lim, off],
  )
  const all = rows.map(mapAgent)
  const top = all.slice(0, 6)
  return { top, agents: all }
}

