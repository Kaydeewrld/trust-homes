import { z } from 'zod'
import * as messageService from '../services/messageService.js'

const openSchema = z.object({
  withUserId: z.string().min(1),
  listingPreview: z
    .object({
      id: z.string().optional(),
      title: z.string().optional(),
      location: z.string().optional(),
      priceNgn: z.coerce.number().optional(),
      image: z.string().optional(),
    })
    .nullable()
    .optional(),
})

const sendSchema = z.object({
  kind: z.enum(['TEXT', 'IMAGE', 'VOICE', 'FILE', 'SYSTEM']).optional(),
  body: z.string().max(5000).optional(),
  attachments: z.array(z.object({ url: z.string(), name: z.string().optional(), sizeLabel: z.string().optional(), kind: z.string().optional() })).optional(),
  listingPreview: openSchema.shape.listingPreview,
})

export async function listConversations(req, res, next) {
  try {
    const rows = await messageService.listConversationsForUser(req.user.id)
    res.json({ ok: true, conversations: rows })
  } catch (e) {
    next(e)
  }
}

export async function openConversation(req, res, next) {
  try {
    const body = openSchema.parse(req.body)
    const conversationId = await messageService.openConversation({
      userId: req.user.id,
      withUserId: body.withUserId,
      listingPreview: body.listingPreview,
    })
    res.json({ ok: true, conversationId })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}

export async function listMessages(req, res, next) {
  try {
    const take = req.query.take ? Number(req.query.take) : 100
    const before = req.query.before ? String(req.query.before) : null
    const rows = await messageService.listMessages({
      userId: req.user.id,
      conversationId: req.params.id,
      take,
      before,
    })
    res.json({ ok: true, messages: rows })
  } catch (e) {
    next(e)
  }
}

export async function sendMessage(req, res, next) {
  try {
    const body = sendSchema.parse(req.body)
    const out = await messageService.sendMessage({
      userId: req.user.id,
      conversationId: req.params.id,
      kind: body.kind || 'TEXT',
      body: body.body || '',
      attachments: body.attachments || [],
      listingPreview: body.listingPreview || null,
    })
    res.json({ ok: true, ...out })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}

