import { z } from 'zod'
import * as listingService from '../services/listingService.js'
import { sendPropertyInfoRequestEmail } from '../services/transactionEmailService.js'

const requestInfoSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(40).optional(),
  note: z.string().max(800).optional(),
  property: z
    .object({
      id: z.string().optional(),
      title: z.string(),
      location: z.string(),
      purpose: z.string().optional(),
      propertyType: z.string().optional(),
      priceNgn: z.coerce.number().optional(),
      bedrooms: z.coerce.number().optional(),
      bathrooms: z.coerce.number().optional(),
      areaSqm: z.coerce.number().optional(),
    })
    .optional(),
})

export async function requestPropertyInfo(req, res, next) {
  try {
    const body = requestInfoSchema.parse(req.body)
    let listing = null
    try {
      listing = await listingService.getListing(req.params.id)
    } catch {
      listing = null
    }
    if (!listing && body.property) {
      listing = {
        id: body.property.id || req.params.id,
        title: body.property.title,
        location: body.property.location,
        purpose: body.property.purpose || 'Sale',
        propertyType: body.property.propertyType || 'Property',
        priceNgn: Number(body.property.priceNgn || 0),
        bedrooms: Number(body.property.bedrooms || 0),
        bathrooms: Number(body.property.bathrooms || 0),
        areaSqm: Number(body.property.areaSqm || 0),
      }
    }
    if (!listing) {
      return res.status(404).json({ ok: false, error: 'Property not found' })
    }
    await sendPropertyInfoRequestEmail({
      requesterName: body.name,
      requesterEmail: body.email,
      requesterPhone: body.phone,
      note: body.note,
      listing,
    })
    res.json({ ok: true, message: 'Request received' })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    }
    next(e)
  }
}

