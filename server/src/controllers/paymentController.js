import crypto from 'crypto'
import { Buffer } from 'node:buffer'
import { z } from 'zod'
import { config } from '../config.js'
import * as paymentService from '../services/paymentService.js'

const listingInitSchema = z.object({
  listingId: z.string().min(1),
  callbackUrl: z.string().url().optional(),
})

const hotelReservationInitSchema = z.object({
  listingId: z.string().min(1),
  nights: z.coerce.number().int().min(1).max(365),
  perNightNgn: z.coerce.number().int().positive().optional(),
  callbackUrl: z.string().url().optional(),
})

const propertyPaymentInitSchema = z.object({
  amountNgn: z.coerce.number().int().positive(),
  title: z.string().min(1).max(200).optional(),
  listingId: z.string().min(1).optional(),
  paymentType: z.enum(['property_generic', 'inspection_fee', 'property_full_payment']).optional(),
  callbackUrl: z.string().url().optional(),
})

/** Legacy alias: wallet top-up via Paystack (authenticated user only). */
export async function initializePayment(req, res, next) {
  try {
    const amountNgn = req.body?.amountNgn
    if (amountNgn == null) {
      return res.status(400).json({ ok: false, error: 'amountNgn required' })
    }
    const out = await paymentService.startWalletTopUp({
      userId: req.user.id,
      email: req.user.email,
      amountNgn,
      callbackUrl: req.body?.callbackUrl,
    })
    res.json({ ok: true, ...out })
  } catch (e) {
    next(e)
  }
}

export async function initListingPayment(req, res, next) {
  try {
    const body = listingInitSchema.parse(req.body)
    const out = await paymentService.startListingPurchase({
      userId: req.user.id,
      email: req.user.email,
      listingId: body.listingId,
      callbackUrl: body.callbackUrl,
    })
    res.json({ ok: true, ...out })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}

export async function initHotelReservationPayment(req, res, next) {
  try {
    const body = hotelReservationInitSchema.parse(req.body)
    const out = await paymentService.startHotelReservation({
      userId: req.user.id,
      email: req.user.email,
      listingId: body.listingId,
      nights: body.nights,
      perNightNgn: body.perNightNgn,
      callbackUrl: body.callbackUrl,
    })
    res.json({ ok: true, ...out })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}

export async function initPropertyPayment(req, res, next) {
  try {
    const body = propertyPaymentInitSchema.parse(req.body)
    const out = await paymentService.startPropertyPayment({
      userId: req.user.id,
      email: req.user.email,
      amountNgn: body.amountNgn,
      title: body.title,
      listingId: body.listingId,
      paymentType: body.paymentType,
      callbackUrl: body.callbackUrl,
    })
    res.json({ ok: true, ...out })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}

export async function verifyPaymentStatus(req, res, next) {
  try {
    const reference = String(req.params.reference || '').trim()
    if (!reference) {
      return res.status(400).json({ ok: false, error: 'reference required' })
    }
    const out = await paymentService.verifyAndFulfillForUser(reference, req.user.id)
    res.json({ ok: true, ...out })
  } catch (e) {
    next(e)
  }
}

/** Paystack webhook — verify signature header `x-paystack-signature` against body HMAC SHA512 */
export async function paystackWebhook(req, res) {
  const secret = config.paystackSecret
  if (!secret) return res.status(200).send('noop')
  const raw = req.paystackRawBody || Buffer.from(JSON.stringify(req.body || {}))
  const hash = crypto.createHmac('sha512', secret).update(raw).digest('hex')
  const sig = req.headers['x-paystack-signature']
  if (sig !== hash) return res.status(400).send('bad signature')
  try {
    await paymentService.handlePaystackWebhookEvent(req.body)
  } catch (e) {
    console.error('[payment] webhook handler error:', e?.message || e)
  }
  return res.status(200).json({ ok: true })
}

export async function adminPendingPayouts(req, res, next) {
  try {
    const take = req.query.take ? Number(req.query.take) : 100
    const skip = req.query.skip ? Number(req.query.skip) : 0
    const payouts = await paymentService.listPendingAgentPayouts({ take, skip })
    res.json({ ok: true, payouts })
  } catch (e) {
    next(e)
  }
}

export async function adminTransactions(req, res, next) {
  try {
    const take = req.query.take ? Number(req.query.take) : 200
    const skip = req.query.skip ? Number(req.query.skip) : 0
    const transactions = await paymentService.listAdminTransactions({ take, skip })
    res.json({ ok: true, transactions })
  } catch (e) {
    next(e)
  }
}
