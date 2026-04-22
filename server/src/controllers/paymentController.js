import crypto from 'crypto'
import { config } from '../config.js'

/** Initialize Paystack transaction — returns client fields. Wire Paystack HTTP when keys are set. */
export async function initializePayment(req, res) {
  const { email, amountNgn, callbackUrl, metadata } = req.body || {}
  if (!email || amountNgn == null) {
    return res.status(400).json({ ok: false, error: 'email and amountNgn required' })
  }
  const reference = `th_${crypto.randomBytes(12).toString('hex')}`
  if (!config.paystackSecret) {
    return res.json({
      ok: true,
      mode: 'stub',
      reference,
      authorization_url: callbackUrl || 'https://checkout.paystack.com/#stub',
      message: 'PAYSTACK_SECRET_KEY not set — stub response for development',
      metadata: metadata || {},
    })
  }
  // Production: POST https://api.paystack.co/transaction/initialize with Bearer secret
  return res.status(501).json({
    ok: false,
    error: 'Paystack live initialize not implemented in this slice — set keys and add fetch to Paystack API',
    reference,
  })
}

/** Paystack webhook — verify signature header `x-paystack-signature` against body HMAC SHA512 */
export async function paystackWebhook(req, res) {
  const secret = config.paystackSecret
  if (!secret) return res.status(200).send('noop')
  const raw = req.paystackRawBody || Buffer.from(JSON.stringify(req.body || {}))
  const hash = crypto.createHmac('sha512', secret).update(raw).digest('hex')
  const sig = req.headers['x-paystack-signature']
  if (sig !== hash) return res.status(400).send('bad signature')
  // TODO: upsert Transaction, credit Wallet, idempotency by reference
  return res.status(200).json({ ok: true })
}
