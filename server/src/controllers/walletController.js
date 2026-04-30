import { z } from 'zod'
import * as walletService from '../services/walletService.js'
import * as paymentService from '../services/paymentService.js'
import * as walletPayoutService from '../services/walletPayoutService.js'

const fundSchema = z.object({
  amountNgn: z.coerce.number().int().positive(),
  callbackUrl: z.string().url().optional(),
})

const payoutSchema = z.object({
  amountNgn: z.coerce.number().int().positive(),
  bankName: z.string().min(2),
  accountName: z.string().min(2),
  accountNumber: z.string().regex(/^\d{10}$/),
})

export async function getWallet(req, res, next) {
  try {
    const w = await walletService.getWalletByUserId(req.user.id)
    res.json({ ok: true, ...w })
  } catch (e) {
    next(e)
  }
}

export async function listWalletPayments(req, res, next) {
  try {
    const take = req.query.take ? Number(req.query.take) : 20
    const payments = await walletService.listUserPayments(req.user.id, take)
    res.json({ ok: true, payments })
  } catch (e) {
    next(e)
  }
}

export async function fundWallet(req, res, next) {
  try {
    const body = fundSchema.parse(req.body)
    const out = await paymentService.startWalletTopUp({
      userId: req.user.id,
      email: req.user.email,
      amountNgn: body.amountNgn,
      callbackUrl: body.callbackUrl,
    })
    res.json({ ok: true, ...out })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}

export async function requestWalletPayout(req, res, next) {
  try {
    const body = payoutSchema.parse(req.body)
    const payout = await walletPayoutService.createWalletPayoutRequest(req.user.id, body)
    res.status(201).json({ ok: true, payout })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}

export async function listMyWalletPayouts(req, res, next) {
  try {
    const take = req.query.take ? Number(req.query.take) : 50
    const payouts = await walletPayoutService.listWalletPayoutsForUser(req.user.id, take)
    res.json({ ok: true, payouts })
  } catch (e) {
    next(e)
  }
}
