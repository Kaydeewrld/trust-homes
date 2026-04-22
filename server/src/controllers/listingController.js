import { z } from 'zod'
import * as listingService from '../services/listingService.js'

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  location: z.string().min(2),
  priceNgn: z.coerce.number().int().positive(),
  purpose: z.string().optional(),
  propertyType: z.string().optional(),
  bedrooms: z.coerce.number().int().optional(),
  bathrooms: z.coerce.number().int().optional(),
  areaSqm: z.coerce.number().int().optional(),
})

const patchSchema = createSchema.partial()

export async function create(req, res, next) {
  try {
    const body = createSchema.parse(req.body)
    const row = await listingService.createListing(req.user.id, body)
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
    const rows = await listingService.listListings({ status, take, skip })
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
