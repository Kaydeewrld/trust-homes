import { query } from '../db.js'
import { createId } from '../utils/createId.js'

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
    createdAt: m.createdat ?? m.createdAt,
  }
}

export async function createListing(ownerId, body) {
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
  } = body
  if (!title || !location || priceNgn == null) {
    const err = new Error('title, location, and priceNgn are required')
    err.status = 400
    err.expose = true
    throw err
  }
  const id = createId()
  const { rows } = await query(
    `INSERT INTO "Listing" (
      "id", "ownerId", title, description, location, "priceNgn", purpose, "propertyType", status,
      bedrooms, bathrooms, "areaSqm", "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, 'PENDING'::"ListingStatus",
      $9, $10, $11, NOW(), NOW()
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
      bedrooms != null ? Math.floor(Number(bedrooms)) : null,
      bathrooms != null ? Math.floor(Number(bathrooms)) : null,
      areaSqm != null ? Math.floor(Number(areaSqm)) : null,
    ],
  )
  return mapListing(rows[0])
}

export async function listListings({ status, take = 50, skip = 0 }) {
  const lim = Math.min(take, 100)
  const { rows } = await query(
    `SELECT * FROM "Listing"
     WHERE ($1::text IS NULL OR status = $1::"ListingStatus")
     ORDER BY "createdAt" DESC
     LIMIT $2 OFFSET $3`,
    [status || null, lim, skip],
  )
  return rows.map(mapListing)
}

export async function getListing(id) {
  const { rows: lrows } = await query('SELECT * FROM "Listing" WHERE id = $1 LIMIT 1', [id])
  const listing = mapListing(lrows[0])
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
  const { rows: curRows } = await query('SELECT * FROM "Listing" WHERE id = $1 LIMIT 1', [id])
  const row = mapListing(curRows[0])
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
  if (!sets.length) {
    return row
  }
  sets.push(`"updatedAt" = NOW()`)
  vals.push(id)
  const { rows } = await query(
    `UPDATE "Listing" SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING *`,
    vals,
  )
  return mapListing(rows[0])
}

export async function deleteListing(id, ownerId) {
  const { rows: curRows } = await query('SELECT * FROM "Listing" WHERE id = $1 LIMIT 1', [id])
  const row = mapListing(curRows[0])
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
