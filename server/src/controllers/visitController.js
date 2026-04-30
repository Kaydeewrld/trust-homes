import { z } from 'zod'
import * as visitService from '../services/visitService.js'

const createSchema = z.object({
  listingId: z.string().min(1),
  visitDate: z.string().min(8),
  visitTime: z.string().min(4),
})

export async function createVisit(req, res, next) {
  try {
    const body = createSchema.parse(req.body)
    const out = await visitService.createScheduledVisit({
      requesterUserId: req.user.id,
      listingId: body.listingId,
      visitDate: body.visitDate,
      visitTime: body.visitTime,
    })
    res.status(201).json({ ok: true, ...out })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}

export async function myVisits(req, res, next) {
  try {
    const take = req.query.take ? Number(req.query.take) : 100
    const visits = await visitService.listScheduledVisitsForUser(req.user.id, { take })
    res.json({ ok: true, visits })
  } catch (e) {
    next(e)
  }
}

