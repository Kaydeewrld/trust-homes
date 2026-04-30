import { query } from '../db.js'
import { createId } from '../utils/createId.js'
import { isUserOnline } from '../realtime/socket.js'
let listingSchemaEnsured = false

const LISTING_SELECT = `SELECT
  l.*,
  u."displayName" AS "ownerDisplayName",
  u.phone AS "ownerPhone",
  u.role AS "ownerRole",
  COALESCE(ap.verified, false) AS "ownerAgentVerified",
  (
    SELECT lm.url
    FROM "ListingMedia" lm
    WHERE lm."listingId" = l.id
    ORDER BY lm."sortOrder" ASC, lm."createdAt" ASC
    LIMIT 1
  ) AS "previewMediaUrl",
  (
    SELECT COUNT(1)::int
    FROM "ListingMedia" lm
    WHERE lm."listingId" = l.id
  ) AS "mediaCount",
  (
    SELECT COUNT(1)::int
    FROM "ListingMedia" lm
    WHERE lm."listingId" = l.id AND LOWER(COALESCE(lm.kind, 'image')) = 'video'
  ) AS "videoCount",
  CASE
    WHEN u.role = 'AGENT'::"UserRole" AND COALESCE(ap.verified, false) = true THEN true
    ELSE false
  END AS "verificationBadge",
  (
    SELECT COUNT(1)::int
    FROM "Listing" ls
    WHERE ls."ownerId" = u.id AND ls.status = 'SOLD'::"ListingStatus"
  ) AS "ownerSoldListings",
  (
    SELECT COUNT(1)::int
    FROM "Payment" p
    JOIN "Listing" pl ON pl.id = p."listingId"
    WHERE pl."ownerId" = u.id
      AND p.status = 'SUCCESS'::"PaymentStatus"
      AND (
        p.kind = 'listing_purchase'::"PaymentKind"
        OR (
          p.kind = 'property_payment'::"PaymentKind"
          AND COALESCE(p.metadata->>'paymentType', '') = 'property_full_payment'
        )
      )
  ) AS "ownerReviewCount"
FROM "Listing" l
JOIN "User" u ON u.id = l."ownerId"
LEFT JOIN "AgentProfile" ap ON ap."userId" = u.id`

function mapListing(r) {
  if (!r) return null
  return {
    id: r.id,
    ownerId: r.ownerid ?? r.ownerId,
    title: r.title,
    description: r.description,
    location: r.location,
    priceNgn: r.pricengn ?? r.priceNgn,
    purpose: r.purpose,
    propertyType: r.propertytype ?? r.propertyType,
    status: r.status,
    bedrooms: r.bedrooms,
    bathrooms: r.bathrooms,
    areaSqm: r.areasqm ?? r.areaSqm,
    latitude: r.latitude != null ? Number(r.latitude) : null,
    longitude: r.longitude != null ? Number(r.longitude) : null,
    isDistressSale: Boolean(r.isdistresssale ?? r.isDistressSale),
    isInvestmentProperty: Boolean(r.isinvestmentproperty ?? r.isInvestmentProperty),
    ownerRole: r.ownerrole ?? r.ownerRole ?? null,
    ownerDisplayName: r.ownerdisplayname ?? r.ownerDisplayName ?? null,
    ownerPhone: r.ownerphone ?? r.ownerPhone ?? null,
    ownerOnline: isUserOnline(r.ownerid ?? r.ownerId),
    ownerSoldListings: Number(r.ownersoldlistings ?? r.ownerSoldListings ?? 0),
    ownerReviewCount: Number(r.ownerreviewcount ?? r.ownerReviewCount ?? 0),
    verificationBadge: Boolean(r.verificationbadge ?? r.verificationBadge),
    ownerAgentVerified: Boolean(r.owneragentverified ?? r.ownerAgentVerified),
    previewMediaUrl: r.previewmediaurl ?? r.previewMediaUrl ?? null,
    mediaCount: Number(r.mediacount ?? r.mediaCount ?? 0),
    videoCount: Number(r.videocount ?? r.videoCount ?? 0),
    createdAt: r.createdat ?? r.createdAt,
    updatedAt: r.updatedat ?? r.updatedAt,
  }
}

function mapMedia(m) {
  if (!m) return null
  return {
    id: m.id,
    listingId: m.listingid ?? m.listingId,
    url: m.url,
    sortOrder: m.sortorder ?? m.sortOrder,
    kind: String(m.kind || 'image'),
    createdAt: m.createdat ?? m.createdAt,
  }
}

async function ensureListingSchema() {
  if (listingSchemaEnsured) return
  await query(`ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "isDistressSale" BOOLEAN NOT NULL DEFAULT false`)
  await query(`ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS "isInvestmentProperty" BOOLEAN NOT NULL DEFAULT false`)
  await query(`ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION`)
  await query(`ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION`)
  await query(`ALTER TABLE "ListingMedia" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'image'`)
  listingSchemaEnsured = true
}

function normalizeMediaInput(media) {
  if (!Array.isArray(media)) return []
  return media
    .map((item, index) => {
      if (typeof item === 'string') {
        const url = item.trim()
        if (!url) return null
        return { url, kind: 'image', sortOrder: index }
      }
      if (!item || typeof item !== 'object') return null
      const rawUrl = typeof item.url === 'string' ? item.url.trim() : ''
      if (!rawUrl) return null
      const kind = item.kind === 'video' ? 'video' : 'image'
      const sortOrder = Number.isFinite(Number(item.sortOrder)) ? Math.floor(Number(item.sortOrder)) : index
      return { url: rawUrl, kind, sortOrder }
    })
    .filter(Boolean)
}

async function getOwnerContext(ownerId) {
  const { rows } = await query(
    `SELECT
      u.id,
      u.role AS "ownerRole",
      COALESCE(ap.verified, false) AS "ownerAgentVerified"
     FROM "User" u
     LEFT JOIN "AgentProfile" ap ON ap."userId" = u.id
     WHERE u.id = $1
     LIMIT 1`,
    [ownerId],
  )
  const row = rows[0]
  if (!row) {
    const err = new Error('Owner not found')
    err.status = 404
    err.expose = true
    throw err
  }
  return {
    ownerRole: row.ownerRole,
    ownerAgentVerified: Boolean(row.ownerAgentVerified),
  }
}

export async function createListing(ownerId, body) {
  await ensureListingSchema()
  const {
    title,
    description,
    location,
    priceNgn,
    purpose,
    propertyType,
    bedrooms,
    bathrooms,
    areaSqm,
    latitude,
    longitude,
    media,
    isDistressSale,
    isInvestmentProperty,
  } = body
  if (!title || !location || priceNgn == null) {
    const err = new Error('title, location, and priceNgn are required')
    err.status = 400
    err.expose = true
    throw err
  }
  const id = createId()
  const owner = await getOwnerContext(ownerId)
  const status = owner.ownerRole === 'AGENT' && owner.ownerAgentVerified ? 'APPROVED' : 'PENDING'
  const mediaItems = normalizeMediaInput(media)
  const { rows: existingRows } = await query(
    `SELECT id
     FROM "Listing"
     WHERE "ownerId" = $1
       AND title = $2
       AND location = $3
       AND "priceNgn" = $4
       AND "createdAt" >= (NOW() - INTERVAL '90 seconds')
     ORDER BY "createdAt" DESC
     LIMIT 1`,
    [ownerId, String(title), String(location), Math.floor(Number(priceNgn))],
  )
  if (existingRows[0]?.id) {
    return getListing(existingRows[0].id)
  }
  const { rows } = await query(
    `INSERT INTO "Listing" (
      "id", "ownerId", title, description, location, "priceNgn", purpose, "propertyType", status,
      bedrooms, bathrooms, "areaSqm", latitude, longitude, "isDistressSale", "isInvestmentProperty", "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9::"ListingStatus",
      $10, $11, $12, $13, $14, $15, $16, NOW(), NOW()
    )
    RETURNING *`,
    [
      id,
      ownerId,
      String(title),
      String(description || ''),
      String(location),
      Math.floor(Number(priceNgn)),
      String(purpose || 'Sale'),
      String(propertyType || 'Residential'),
      status,
      bedrooms != null ? Math.floor(Number(bedrooms)) : null,
      bathrooms != null ? Math.floor(Number(bathrooms)) : null,
      areaSqm != null ? Math.floor(Number(areaSqm)) : null,
      latitude != null ? Number(latitude) : null,
      longitude != null ? Number(longitude) : null,
      Boolean(isDistressSale),
      Boolean(isInvestmentProperty),
    ],
  )
  const listingId = rows[0]?.id || id
  for (const item of mediaItems) {
    await query(
      `INSERT INTO "ListingMedia" ("id", "listingId", url, kind, "sortOrder", "createdAt")
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [createId(), listingId, item.url, item.kind, item.sortOrder],
    )
  }
  return getListing(listingId)
}

export async function listListings({ status, take = 50, skip = 0, includeNonApproved = false }) {
  await ensureListingSchema()
  const lim = Math.min(take, 100)
  const { rows } = await query(
    `${LISTING_SELECT}
     WHERE
       ($1::text IS NULL OR l.status = $1::"ListingStatus")
       AND ($2::boolean = true OR l.status IN ('APPROVED'::"ListingStatus", 'SOLD'::"ListingStatus"))
     ORDER BY "createdAt" DESC
     LIMIT $3 OFFSET $4`,
    [status || null, includeNonApproved, lim, skip],
  )
  return rows.map(mapListing)
}

export async function listOwnListings(ownerId, { status, take = 50, skip = 0 }) {
  await ensureListingSchema()
  const lim = Math.min(take, 100)
  const { rows } = await query(
    `${LISTING_SELECT}
     WHERE l."ownerId" = $1
       AND ($2::text IS NULL OR l.status = $2::"ListingStatus")
     ORDER BY "createdAt" DESC
     LIMIT $3 OFFSET $4`,
    [ownerId, status || null, lim, skip],
  )
  return rows.map(mapListing)
}

export async function getListing(id) {
  await ensureListingSchema()
  const listing = await getListingCoreById(id)
  if (!listing) {
    const err = new Error('Listing not found')
    err.status = 404
    err.expose = true
    throw err
  }
  const { rows: mrows } = await query(
    `SELECT * FROM "ListingMedia" WHERE "listingId" = $1 ORDER BY "sortOrder" ASC`,
    [id],
  )
  return { ...listing, media: mrows.map(mapMedia) }
}

export async function updateListing(id, ownerId, patch) {
  await ensureListingSchema()
  const row = await getListingCoreById(id)
  if (!row) {
    const err = new Error('Listing not found')
    err.status = 404
    err.expose = true
    throw err
  }
  if (row.ownerId !== ownerId) {
    const err = new Error('Forbidden')
    err.status = 403
    err.expose = true
    throw err
  }
  const sets = []
  const vals = []
  let n = 1
  if (patch.title != null) {
    sets.push(`title = $${n++}`)
    vals.push(String(patch.title))
  }
  if (patch.description != null) {
    sets.push(`description = $${n++}`)
    vals.push(String(patch.description))
  }
  if (patch.location != null) {
    sets.push(`location = $${n++}`)
    vals.push(String(patch.location))
  }
  if (patch.priceNgn != null) {
    sets.push(`"priceNgn" = $${n++}`)
    vals.push(Math.floor(Number(patch.priceNgn)))
  }
  if (patch.purpose != null) {
    sets.push(`purpose = $${n++}`)
    vals.push(String(patch.purpose))
  }
  if (patch.propertyType != null) {
    sets.push(`"propertyType" = $${n++}`)
    vals.push(String(patch.propertyType))
  }
  if (patch.bedrooms != null) {
    sets.push(`bedrooms = $${n++}`)
    vals.push(Math.floor(Number(patch.bedrooms)))
  }
  if (patch.bathrooms != null) {
    sets.push(`bathrooms = $${n++}`)
    vals.push(Math.floor(Number(patch.bathrooms)))
  }
  if (patch.areaSqm != null) {
    sets.push(`"areaSqm" = $${n++}`)
    vals.push(Math.floor(Number(patch.areaSqm)))
  }
  if (patch.latitude != null) {
    sets.push(`latitude = $${n++}`)
    vals.push(Number(patch.latitude))
  }
  if (patch.longitude != null) {
    sets.push(`longitude = $${n++}`)
    vals.push(Number(patch.longitude))
  }
  if (patch.isDistressSale != null) {
    sets.push(`"isDistressSale" = $${n++}`)
    vals.push(Boolean(patch.isDistressSale))
  }
  if (patch.isInvestmentProperty != null) {
    sets.push(`"isInvestmentProperty" = $${n++}`)
    vals.push(Boolean(patch.isInvestmentProperty))
  }
  if (!sets.length) {
    return row
  }
  sets.push(`"updatedAt" = NOW()`)
  vals.push(id)
  const { rows } = await query(
    `UPDATE "Listing" SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
    vals,
  )
  return getListingCoreById(rows[0]?.id || id)
}

export async function deleteListing(id, ownerId) {
  const row = await getListingCoreById(id)
  if (!row) {
    const err = new Error('Listing not found')
    err.status = 404
    err.expose = true
    throw err
  }
  if (row.ownerId !== ownerId) {
    const err = new Error('Forbidden')
    err.status = 403
    err.expose = true
    throw err
  }
  await query('DELETE FROM "Listing" WHERE id = $1', [id])
  return { ok: true }
}

export async function listListingsForModeration({ status = 'PENDING', take = 100, skip = 0 }) {
  await ensureListingSchema()
  const lim = Math.min(take, 200)
  const normalized = String(status || 'PENDING').toUpperCase()
  const allowAll = normalized === 'ALL'
  const normalizedFilter = allowAll ? null : normalized
  if (!allowAll && !['PENDING', 'APPROVED', 'REJECTED', 'SOLD', 'DRAFT'].includes(normalized)) {
    const err = new Error('Invalid moderation status filter')
    err.status = 400
    err.expose = true
    throw err
  }
  const { rows } = await query(
    `${LISTING_SELECT}
     WHERE ($1::boolean = true OR l.status = $2::"ListingStatus")
     ORDER BY
       CASE l.status
         WHEN 'PENDING'::"ListingStatus" THEN 0
         WHEN 'REJECTED'::"ListingStatus" THEN 1
         WHEN 'APPROVED'::"ListingStatus" THEN 2
         ELSE 3
       END,
       l."createdAt" DESC
     LIMIT $3 OFFSET $4`,
    [allowAll, normalizedFilter, lim, skip],
  )
  return rows.map(mapListing)
}

export async function setListingModerationStatus(id, nextStatus) {
  await ensureListingSchema()
  const normalized = String(nextStatus || '').toUpperCase()
  if (!['APPROVED', 'REJECTED', 'PENDING'].includes(normalized)) {
    const err = new Error('Invalid moderation status')
    err.status = 400
    err.expose = true
    throw err
  }
  const { rows } = await query(
    `UPDATE "Listing"
     SET status = $2::"ListingStatus", "updatedAt" = NOW()
     WHERE id = $1
     RETURNING id`,
    [id, normalized],
  )
  if (!rows[0]) {
    const err = new Error('Listing not found')
    err.status = 404
    err.expose = true
    throw err
  }
  return getListingCoreById(id)
}

async function getListingCoreById(id) {
  await ensureListingSchema()
  const { rows } = await query(`${LISTING_SELECT} WHERE l.id = $1 LIMIT 1`, [id])
  return mapListing(rows[0])
}
