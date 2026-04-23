import crypto from 'crypto'
import { z } from 'zod'
import { config } from '../config.js'
import * as paymentService from '../services/paymentService.js'

const listingInitSchema = z.object({
  listingId: z.string().min(1),
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
