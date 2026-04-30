import { query } from '../db.js'
import { createId } from '../utils/createId.js'
import { emitToUser, isUserOnline } from '../realtime/socket.js'

let ensured = false
const TRUSTED_HOME_PARTICIPANT = 'TRUSTED_HOME'

async function ensureTables() {
  if (ensured) return
  await query(`CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT PRIMARY KEY,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)
  await query(`CREATE TABLE IF NOT EXISTS "ConversationParticipant" (
    "id" TEXT PRIMARY KEY,
    "conversationId" TEXT NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "participantKind" TEXT NOT NULL DEFAULT 'USER',
    "displayName" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "lastReadAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)
  await query(`CREATE TABLE IF NOT EXISTS "Message" (
    "id" TEXT PRIMARY KEY,
    "conversationId" TEXT NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    "senderParticipantId" TEXT REFERENCES "ConversationParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "senderUserId" TEXT REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    "kind" TEXT NOT NULL DEFAULT 'TEXT',
    "body" TEXT,
    "attachments" JSONB,
    "listingPreview" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)
  ensured = true
}

async function getUserMini(userId) {
  const { rows } = await query(`SELECT id, "displayName", "avatarUrl", role FROM "User" WHERE id = $1 LIMIT 1`, [userId])
  const u = rows[0]
  if (!u) throw Object.assign(new Error('User not found'), { status: 404, expose: true })
  return u
}

async function ensureTrustedHomeConversation(userId) {
  const { rows: existing } = await query(
    `SELECT c.id
     FROM "Conversation" c
     JOIN "ConversationParticipant" p1 ON p1."conversationId" = c.id
     JOIN "ConversationParticipant" p2 ON p2."conversationId" = c.id
     WHERE c."isSystem" = true AND p1."userId" = $1 AND p2."participantKind" = $2
     LIMIT 1`,
    [userId, TRUSTED_HOME_PARTICIPANT],
  )
  if (existing[0]?.id) return existing[0].id
  const cid = createId()
  const pidUser = createId()
  const pidSystem = createId()
  await query(`INSERT INTO "Conversation" ("id", "isSystem", "createdAt", "updatedAt") VALUES ($1, true, NOW(), NOW())`, [cid])
  const user = await getUserMini(userId)
  await query(
    `INSERT INTO "ConversationParticipant" ("id", "conversationId", "userId", "participantKind", "displayName", "avatarUrl", "createdAt")
     VALUES ($1,$2,$3,'USER',$4,$5,NOW()),($6,$2,NULL,$7,'TrustedHome',NULL,NOW())`,
    [pidUser, cid, user.id, user.displayName, user.avatarUrl || null, pidSystem, TRUSTED_HOME_PARTICIPANT],
  )
  await query(
    `INSERT INTO "Message" ("id","conversationId","senderParticipantId","senderUserId","kind","body","createdAt")
     VALUES ($1,$2,$3,NULL,'TEXT',$4,NOW())`,
    [createId(), cid, pidSystem, 'Welcome to TrustedHome messages. You will receive important updates here.'],
  )
  return cid
}

function mapConversationRow(row, meId) {
  return {
    id: row.id,
    isSystem: Boolean(row.isSystem),
    unreadCount: Number(row.unreadCount || 0),
    updatedAt: row.updatedAt,
    counterpart: {
      participantId: row.counterpartParticipantId,
      userId: row.counterpartUserId || null,
      displayName: row.counterpartLiveName || row.counterpartName || 'Unknown',
      avatarUrl: row.counterpartLiveAvatarUrl || row.counterpartAvatarUrl || '',
      kind: row.counterpartKind || 'USER',
      role: row.counterpartRole || null,
      verified: Boolean(row.counterpartVerified),
    },
    lastMessage: row.lastMessageBody || '',
    lastMessageKind: row.lastMessageKind || 'TEXT',
    lastSenderUserId: row.lastSenderUserId || null,
    lastDeliveryStatus: row.lastDeliveryStatus || null,
    listingPreview: row.lastListingPreview || null,
    meId,
  }
}

export async function listConversationsForUser(userId) {
  await ensureTables()
  await ensureTrustedHomeConversation(userId)
  const { rows } = await query(
    `SELECT
      c.id,
      c."isSystem",
      c."updatedAt",
      cp2.id AS "counterpartParticipantId",
      cp2."userId" AS "counterpartUserId",
      cp2."participantKind" AS "counterpartKind",
      cp2."displayName" AS "counterpartName",
      cp2."avatarUrl" AS "counterpartAvatarUrl",
      u2."displayName" AS "counterpartLiveName",
      u2."avatarUrl" AS "counterpartLiveAvatarUrl",
      u2.role AS "counterpartRole",
      COALESCE(ap2.verified, false) AS "counterpartVerified",
      lm.body AS "lastMessageBody",
      lm.kind AS "lastMessageKind",
      lm."senderUserId" AS "lastSenderUserId",
      lm."listingPreview" AS "lastListingPreview",
      CASE
        WHEN lm."senderUserId" = $1 THEN
          CASE
            WHEN cp2."lastReadAt" IS NOT NULL AND cp2."lastReadAt" >= lm."createdAt" THEN 'READ'
            WHEN cp2."lastReadAt" IS NOT NULL THEN 'DELIVERED'
            ELSE 'SENT'
          END
        ELSE NULL
      END AS "lastDeliveryStatus",
      (
        SELECT COUNT(1)::int
        FROM "Message" mm
        WHERE mm."conversationId" = c.id
          AND mm."createdAt" > COALESCE(cp1."lastReadAt", 'epoch'::timestamp)
          AND (mm."senderUserId" IS NULL OR mm."senderUserId" <> $1)
      ) AS "unreadCount"
    FROM "Conversation" c
    JOIN "ConversationParticipant" cp1 ON cp1."conversationId" = c.id AND cp1."userId" = $1
    JOIN "ConversationParticipant" cp2 ON cp2."conversationId" = c.id AND cp2.id <> cp1.id
    LEFT JOIN "User" u2 ON u2.id = cp2."userId"
    LEFT JOIN "AgentProfile" ap2 ON ap2."userId" = u2.id
    LEFT JOIN LATERAL (
      SELECT m.body, m.kind, m."listingPreview", m."createdAt", m."senderUserId"
      FROM "Message" m
      WHERE m."conversationId" = c.id
      ORDER BY m."createdAt" DESC
      LIMIT 1
    ) lm ON true
    ORDER BY COALESCE(lm."createdAt", c."updatedAt") DESC
    LIMIT 200`,
    [userId],
  )
  return rows.map((r) => mapConversationRow(r, userId))
}

export async function openConversation({ userId, withUserId }) {
  await ensureTables()
  if (String(withUserId || '') === String(userId)) {
    throw Object.assign(new Error('Cannot open conversation with yourself'), { status: 400, expose: true })
  }
  const { rows: existing } = await query(
    `SELECT c.id
     FROM "Conversation" c
     JOIN "ConversationParticipant" p1 ON p1."conversationId" = c.id AND p1."userId" = $1
     JOIN "ConversationParticipant" p2 ON p2."conversationId" = c.id AND p2."userId" = $2
     WHERE c."isSystem" = false
     LIMIT 1`,
    [userId, withUserId],
  )
  if (existing[0]?.id) return existing[0].id
  const me = await getUserMini(userId)
  const other = await getUserMini(withUserId)
  const cid = createId()
  const p1 = createId()
  const p2 = createId()
  await query(`INSERT INTO "Conversation" ("id","isSystem","createdAt","updatedAt") VALUES ($1,false,NOW(),NOW())`, [cid])
  await query(
    `INSERT INTO "ConversationParticipant" ("id","conversationId","userId","participantKind","displayName","avatarUrl","createdAt")
     VALUES
     ($1,$3,$4,'USER',$5,$6,NOW()),
     ($2,$3,$7,'USER',$8,$9,NOW())`,
    [p1, p2, cid, me.id, me.displayName, me.avatarUrl || null, other.id, other.displayName, other.avatarUrl || null],
  )
  return cid
}

export async function listMessages({ userId, conversationId, take = 100, before }) {
  await ensureTables()
  const { rows: access } = await query(
    `SELECT 1 FROM "ConversationParticipant" WHERE "conversationId" = $1 AND "userId" = $2 LIMIT 1`,
    [conversationId, userId],
  )
  if (!access[0]) throw Object.assign(new Error('Forbidden'), { status: 403, expose: true })
  const lim = Math.min(Math.max(Number(take) || 100, 1), 200)
  const { rows } = await query(
    `SELECT m.*,
      cp."displayName" AS "senderName",
      cp."participantKind" AS "senderKind",
      CASE
        WHEN m."senderUserId" = $2 THEN
          CASE
            WHEN cpo."lastReadAt" IS NOT NULL AND cpo."lastReadAt" >= m."createdAt" THEN 'READ'
            WHEN cpo."lastReadAt" IS NOT NULL THEN 'DELIVERED'
            ELSE 'SENT'
          END
        ELSE NULL
      END AS "deliveryStatus"
     FROM "Message" m
     LEFT JOIN "ConversationParticipant" cp ON cp.id = m."senderParticipantId"
     LEFT JOIN "ConversationParticipant" cpm ON cpm."conversationId" = m."conversationId" AND cpm."userId" = $2
     LEFT JOIN "ConversationParticipant" cpo ON cpo."conversationId" = m."conversationId" AND cpo.id <> cpm.id
     WHERE m."conversationId" = $1
       AND ($3::timestamp IS NULL OR m."createdAt" < $3::timestamp)
     ORDER BY m."createdAt" DESC
     LIMIT $4`,
    [conversationId, userId, before || null, lim],
  )
  await query(
    `UPDATE "ConversationParticipant" SET "lastReadAt" = NOW()
     WHERE "conversationId" = $1 AND "userId" = $2`,
    [conversationId, userId],
  )
  return rows.reverse().map((m) => ({
    id: m.id,
    conversationId: m.conversationId,
    senderUserId: m.senderUserId || null,
    senderName: m.senderName || null,
    senderKind: m.senderKind || null,
    kind: m.kind,
    body: m.body || '',
    attachments: m.attachments || [],
    listingPreview: m.listingPreview || null,
    deliveryStatus: m.deliveryStatus || null,
    createdAt: m.createdAt,
  }))
}

export async function sendMessage({ userId, conversationId, kind = 'TEXT', body = '', attachments = [], listingPreview = null }) {
  await ensureTables()
  const { rows: p } = await query(
    `SELECT id FROM "ConversationParticipant" WHERE "conversationId" = $1 AND "userId" = $2 LIMIT 1`,
    [conversationId, userId],
  )
  if (!p[0]) throw Object.assign(new Error('Forbidden'), { status: 403, expose: true })
  const id = createId()
  const normalizedKind = String(kind || 'TEXT').toUpperCase()
  const normalizedBody = String(body || '')
  const normalizedAttachments = attachments || []
  const normalizedPreview = listingPreview || null
  await query(
    `INSERT INTO "Message" ("id","conversationId","senderParticipantId","senderUserId","kind","body","attachments","listingPreview","createdAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,NOW())`,
    [id, conversationId, p[0].id, userId, normalizedKind, normalizedBody, JSON.stringify(normalizedAttachments), JSON.stringify(normalizedPreview)],
  )
  await query(`UPDATE "Conversation" SET "updatedAt" = NOW() WHERE id = $1`, [conversationId])
  const { rows: counterpartRows } = await query(
    `SELECT "userId"
     FROM "ConversationParticipant"
     WHERE "conversationId" = $1
       AND "userId" IS NOT NULL
       AND "userId" <> $2`,
    [conversationId, userId],
  )
  const recipients = counterpartRows.map((r) => String(r.userId))
  const deliveryStatus = recipients.some((rid) => isUserOnline(rid)) ? 'DELIVERED' : 'SENT'
  const eventPayload = {
    message: {
      id,
      conversationId,
      senderUserId: userId,
      kind: normalizedKind,
      body: normalizedBody,
      attachments: normalizedAttachments,
      listingPreview: normalizedPreview,
      createdAt: new Date().toISOString(),
      deliveryStatus,
    },
  }
  emitToUser(userId, 'message:new', eventPayload)
  for (const rid of recipients) {
    emitToUser(rid, 'message:new', eventPayload)
    emitToUser(rid, 'conversation:refresh', { conversationId })
  }
  emitToUser(userId, 'conversation:refresh', { conversationId })
  return { id }
}

