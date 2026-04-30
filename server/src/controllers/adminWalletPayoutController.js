import { z } from 'zod'
import * as walletPayoutService from '../services/walletPayoutService.js'

const WALLET_PAYOUT_STATUSES = new Set(['PENDING', 'COMPLETED', 'REJECTED'])

export async function listWalletPayouts(req, res, next) {
  try {
    const take = req.query.take ? Number(req.query.take) : 100
    const skip = req.query.skip ? Number(req.query.skip) : 0
    const raw = req.query.status ? String(req.query.status).trim().toUpperCase() : ''
    const status = WALLET_PAYOUT_STATUSES.has(raw) ? raw : undefined
    const payouts = await walletPayoutService.listWalletPayoutsForAdmin({ status, take, skip })
    res.json({ ok: true, payouts })
  } catch (e) {
    next(e)
  }
}

export async function moderateWalletPayout(req, res, next) {
  try {
    const schema = z.object({
      decision: z.enum(['approve', 'reject']),
      note: z.string().max(2000).optional(),
    })
    const body = schema.parse(req.body)
    const id = String(req.params.id || '').trim()
    if (!id) return res.status(400).json({ ok: false, error: 'id required' })

    const staffId = req.staff?.id || null
    if (body.decision === 'approve') {
      const payout = await walletPayoutService.approveWalletPayout(id, staffId)
      return res.json({ ok: true, payout })
    }
    const payout = await walletPayoutService.rejectWalletPayout(id, staffId, body.note)
    return res.json({ ok: true, payout })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}
