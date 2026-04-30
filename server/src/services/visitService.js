import { query } from '../db.js'
import { createId } from '../utils/createId.js'
import * as messageService from './messageService.js'
import { sendScheduledVisitEmails } from './transactionEmailService.js'

let visitsEnsured = false

async function ensureVisitSchema() {
  if (visitsEnsured) return
  await query(`
    CREATE TABLE IF NOT EXISTS "ScheduledVisit" (
      "id" TEXT PRIMARY KEY,
      "listingId" TEXT NOT NULL REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "requesterUserId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "agentUserId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "visitDate" DATE NOT NULL,
      "visitTime" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'REQUESTED',
      "conversationId" TEXT REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`)
  await query(`CREATE INDEX IF NOT EXISTS "ScheduledVisit_requester_idx" ON "ScheduledVisit" ("requesterUserId", "createdAt" DESC)`)
  await query(`CREATE INDEX IF NOT EXISTS "ScheduledVisit_agent_idx" ON "ScheduledVisit" ("agentUserId", "createdAt" DESC)`)
  visitsEnsured = true
}

function parseVisitDateTime(visitDate, visitTime) {
  const d = String(visitDate || '').trim()
  const t = String(visitTime || '').trim()
  const at = new Date(`${d}T${t}:00`)
  if (!Number.isFinite(at.getTime())) return null
  return at
}

export async function createScheduledVisit({ requesterUserId, listingId, visitDate, visitTime }) {
  await ensureVisitSchema()
  const when = parseVisitDateTime(visitDate, visitTime)
  if (!when) throw Object.assign(new Error('Invalid visit date/time'), { status: 400, expose: true })
  if (when.getTime() < Date.now() - 60_000) {
    throw Object.assign(new Error('Visit date/time must be in the future'), { status: 400, expose: true })
  }

  const { rows: lrows } = await query(
    `SELECT l.id, l.title, l.location, l."priceNgn", l."ownerId", l.status,
            u."displayName" AS "ownerName", u.email AS "ownerEmail", u.phone AS "ownerPhone",
            r."displayName" AS "requesterName", r.email AS "requesterEmail", r.phone AS "requesterPhone"
     FROM "Listing" l
     JOIN "User" u ON u.id = l."ownerId"
     JOIN "User" r ON r.id = $2
     WHERE l.id = $1
     LIMIT 1`,
    [listingId, requesterUserId],
  )
  const listing = lrows[0]
  if (!listing) throw Object.assign(new Error('Listing not found'), { status: 404, expose: true })
  if (String(listing.ownerId) === String(requesterUserId)) {
    throw Object.assign(new Error('You cannot schedule a visit on your own listing'), { status: 400, expose: true })
  }

  const conversationId = await messageService.openConversation({
    userId: requesterUserId,
    withUserId: String(listing.ownerId),
  })
  const body = `Visit request:\nProperty: ${listing.title}\nDate: ${visitDate}\nTime: ${visitTime}\nPlease confirm availability.`
  await messageService.sendMessage({
    userId: requesterUserId,
    conversationId,
    kind: 'TEXT',
    body,
    attachments: [],
    listingPreview: {
      id: String(listing.id),
      title: String(listing.title || ''),
      location: String(listing.location || ''),
      priceNgn: Number(listing.priceNgn || 0),
    },
  })

  const id = createId()
  await query(
    `INSERT INTO "ScheduledVisit" ("id","listingId","requesterUserId","agentUserId","visitDate","visitTime","status","conversationId","createdAt","updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,'REQUESTED',$7,NOW(),NOW())`,
    [id, listing.id, requesterUserId, listing.ownerId, visitDate, visitTime, conversationId],
  )

  await sendScheduledVisitEmails({
    listing: {
      id: String(listing.id),
      title: String(listing.title || ''),
      location: String(listing.location || ''),
    },
    requester: {
      id: String(requesterUserId),
      name: String(listing.requesterName || 'User'),
      email: String(listing.requesterEmail || ''),
      phone: String(listing.requesterPhone || ''),
    },
    agent: {
      id: String(listing.ownerId),
      name: String(listing.ownerName || 'Agent'),
      email: String(listing.ownerEmail || ''),
      phone: String(listing.ownerPhone || ''),
    },
    visitDate: String(visitDate),
    visitTime: String(visitTime),
  }).catch((e) => console.error('[visit] email notify failed:', e?.message || e))

  return { id, conversationId }
}

export async function listScheduledVisitsForUser(userId, { take = 100 } = {}) {
  await ensureVisitSchema()
  const lim = Math.min(Math.max(Number(take) || 100, 1), 300)
  const { rows } = await query(
    `SELECT
      sv.id, sv."visitDate", sv."visitTime", sv.status, sv."createdAt", sv."conversationId",
      l.id AS "listingId", l.title AS "listingTitle", l.location AS "listingLocation",
      a.id AS "agentUserId", a."displayName" AS "agentName", a.phone AS "agentPhone"
     FROM "ScheduledVisit" sv
     JOIN "Listing" l ON l.id = sv."listingId"
     JOIN "User" a ON a.id = sv."agentUserId"
     WHERE sv."requesterUserId" = $1
     ORDER BY sv."createdAt" DESC
     LIMIT $2`,
    [userId, lim],
  )
  return rows.map((r) => ({
    id: String(r.id),
    visitDate: String(r.visitDate || ''),
    visitTime: String(r.visitTime || ''),
    status: String(r.status || 'REQUESTED'),
    createdAt: r.createdAt,
    conversationId: r.conversationId ? String(r.conversationId) : null,
    listing: {
      id: String(r.listingId),
      title: String(r.listingTitle || 'Property'),
      location: String(r.listingLocation || ''),
    },
    agent: {
      id: String(r.agentUserId),
      name: String(r.agentName || 'Agent'),
      phone: String(r.agentPhone || ''),
    },
  }))
}

