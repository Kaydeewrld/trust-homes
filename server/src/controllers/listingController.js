import { z } from 'zod'
import * as listingService from '../services/listingService.js'
import { esc, sendTransactionAlertEmails } from '../services/transactionEmailService.js'

const createSchema = z.object({
  // Accept both remote URLs and data URLs from frontend uploads.
  // Data URLs are persisted for now until object storage is introduced.
  title: z.string().min(2),
  description: z.string().optional(),
  location: z.string().min(2),
  priceNgn: z.coerce.number().int().positive(),
  purpose: z.string().optional(),
  propertyType: z.string().optional(),
  bedrooms: z.coerce.number().int().optional(),
  bathrooms: z.coerce.number().int().optional(),
  areaSqm: z.coerce.number().int().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  isDistressSale: z.coerce.boolean().optional(),
  isInvestmentProperty: z.coerce.boolean().optional(),
  media: z
    .array(
      z.union([
        z.string().refine((v) => /^https?:\/\//i.test(String(v)) || /^data:(image|video)\//i.test(String(v)), 'Invalid media URL'),
        z.object({
          url: z.string().refine((v) => /^https?:\/\//i.test(String(v)) || /^data:(image|video)\//i.test(String(v)), 'Invalid media URL'),
          kind: z.enum(['image', 'video']).optional(),
          sortOrder: z.coerce.number().int().optional(),
        }),
      ]),
    )
    .max(30)
    .optional(),
})

const patchSchema = createSchema.partial()

export async function create(req, res, next) {
  try {
    const body = createSchema.parse(req.body)
    const row = await listingService.createListing(req.user.id, body)
    const statusText = row.status === 'APPROVED' ? 'approved and live' : 'pending review'
    void sendTransactionAlertEmails({
      title: 'Listing submitted',
      summaryHtml: `<p><strong>${esc(row.title)}</strong> is <strong>${esc(statusText)}</strong>.</p><p style="margin-top:10px;color:#64748b;font-size:13px">Reference ID: <code style="background:#f1f5f9;padding:2px 6px;border-radius:6px">${esc(row.id)}</code></p>`,
      summaryText: `Listing "${row.title}" submitted and is ${statusText}. Id: ${row.id}`,
      userEmail: req.user.email,
      userDisplayName: String(req.user.email || '').split('@')[0] || 'Member',
    }).catch((err) => console.error('[listing] submit alert email failed:', err?.message || err))
    res.status(201).json({ ok: true, listing: row })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}

export async function list(req, res, next) {
  try {
    const take = req.query.take ? Number(req.query.take) : 50
    const skip = req.query.skip ? Number(req.query.skip) : 0
    const status = req.query.status ? String(req.query.status) : undefined
    const rows = await listingService.listListings({ status, take, skip, includeNonApproved: false })
    res.json({ ok: true, listings: rows })
  } catch (e) {
    next(e)
  }
}

export async function listMine(req, res, next) {
  try {
    const take = req.query.take ? Number(req.query.take) : 50
    const skip = req.query.skip ? Number(req.query.skip) : 0
    const status = req.query.status ? String(req.query.status) : undefined
    const rows = await listingService.listOwnListings(req.user.id, { status, take, skip })
    res.json({ ok: true, listings: rows })
  } catch (e) {
    next(e)
  }
}

export async function getOne(req, res, next) {
  try {
    const row = await listingService.getListing(req.params.id)
    res.json({ ok: true, listing: row })
  } catch (e) {
    next(e)
  }
}

export async function update(req, res, next) {
  try {
    const body = patchSchema.parse(req.body)
    const row = await listingService.updateListing(req.params.id, req.user.id, body)
    res.json({ ok: true, listing: row })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}

export async function remove(req, res, next) {
  try {
    const out = await listingService.deleteListing(req.params.id, req.user.id)
    res.json(out)
  } catch (e) {
    next(e)
  }
}

export async function listForModeration(req, res, next) {
  try {
    const take = req.query.take ? Number(req.query.take) : 100
    const skip = req.query.skip ? Number(req.query.skip) : 0
    const status = req.query.status ? String(req.query.status) : 'PENDING'
    const rows = await listingService.listListingsForModeration({ status, take, skip })
    res.json({ ok: true, listings: rows })
  } catch (e) {
    next(e)
  }
}

export async function moderateStatus(req, res, next) {
  try {
    const schema = z.object({ status: z.enum(['APPROVED', 'REJECTED', 'PENDING']) })
    const body = schema.parse(req.body)
    const row = await listingService.setListingModerationStatus(req.params.id, body.status)
    res.json({ ok: true, listing: row })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}
