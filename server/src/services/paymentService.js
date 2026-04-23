import { pool, query } from '../db.js'
import { config } from '../config.js'
import { createId } from '../utils/createId.js'
import * as listingService from './listingService.js'
import { sendPaymentSuccessEmails } from './transactionEmailService.js'

const PAYSTACK_API = 'https://api.paystack.co'

const MIN_WALLET_TOPUP_NGN = 100
const MAX_PAYMENT_NGN = 500_000_000

export const PaymentKind = {
  WALLET_TOPUP: 'wallet_topup',
  LISTING_PURCHASE: 'listing_purchase',
}

function ngnToKobo(ngn) {
  return Math.floor(Number(ngn) * 100)
}

function assertAmountNgn(amountNgn) {
  const n = Math.floor(Number(amountNgn))
  if (!Number.isFinite(n) || n < MIN_WALLET_TOPUP_NGN || n > MAX_PAYMENT_NGN) {
    const err = new Error(`amountNgn must be between ${MIN_WALLET_TOPUP_NGN} and ${MAX_PAYMENT_NGN}`)
    err.status = 400
    err.expose = true
    throw err
  }
  return n
}

/** callbackUrl must match a configured CLIENT_ORIGIN prefix (prevents open redirects). */
export function resolvePaystackCallbackUrl(clientProvided) {
  const raw = String(clientProvided || '').trim()
  if (!raw) {
    const base = String(config.appPublicUrl || '').trim().replace(/\/+$/, '')
    return base ? `${base}/payments/callback` : undefined
  }
  const ok = config.clientOrigins.some((origin) => {
    const o = String(origin).replace(/\/+$/, '')
    return raw === o || raw.startsWith(`${o}/`)
  })
  if (!ok) {
    const err = new Error('callbackUrl must start with a URL listed in CLIENT_ORIGIN')
    err.status = 400
    err.expose = true
    throw err
  }
  return raw
}

async function resolveUserEmail(userId, jwtEmail) {
  const e = String(jwtEmail || '').trim().toLowerCase()
  if (e) return e
  const { rows } = await query(`SELECT email FROM "User" WHERE id = $1 LIMIT 1`, [userId])
  const got = rows[0]?.email
  if (!got) {
    const err = new Error('User email not found')
    err.status = 400
    err.expose = true
    throw err
  }
  return String(got).toLowerCase()
}

async function paystackPost(path, body) {
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.paystackSecret}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.status !== true) {
    const err = new Error(json.message || `Paystack error (${res.status})`)
    err.status = 502
    err.expose = true
    throw err
  }
  return json.data
}

async function paystackGet(path) {
  const res = await fetch(`${PAYSTACK_API}${path}`, {
    headers: { Authorization: `Bearer ${config.paystackSecret}` },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok || json.status !== true) {
    const err = new Error(json.message || `Paystack verify failed (${res.status})`)
    err.status = 502
    err.expose = true
    throw err
  }
  return json.data
}

async function insertPaymentRow({ id, userId, reference, amountNgn, kind, listingId, metadata }) {
  await query(
    `INSERT INTO "Payment" ("id", "userId", reference, "amountNgn", kind, "listingId", status, metadata, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', $7::jsonb, NOW(), NOW())`,
    [id, userId, reference, amountNgn, kind, listingId || null, JSON.stringify(metadata || {})],
  )
}

async function updatePaymentAccessCode(paymentId, accessCode) {
  await query(`UPDATE "Payment" SET "paystackAccessCode" = $2, "updatedAt" = NOW() WHERE id = $1`, [paymentId, accessCode || null])
}

async function markPaymentFailedByReference(reference) {
  await query(
    `UPDATE "Payment" SET status = 'FAILED', "updatedAt" = NOW() WHERE reference = $1 AND status = 'PENDING'`,
    [reference],
  )
}

export async function fulfillChargeIfValid({ reference, amountKobo, currency }) {
  const cur = String(currency || 'NGN').toUpperCase()
  if (cur !== 'NGN') {
    console.warn('[payment] skip fulfill: unsupported currency', currency)
    return { ok: false, reason: 'currency', fulfilled: false }
  }
  const kobo = Number(amountKobo)
  if (!Number.isFinite(kobo)) return { ok: false, reason: 'amount', fulfilled: false }

  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(`SELECT * FROM "Payment" WHERE reference = $1 FOR UPDATE`, [reference])
    const p = rows[0]
    if (!p) {
      await client.query('ROLLBACK')
      return { ok: false, reason: 'unknown_reference', fulfilled: false }
    }
    if (p.status === 'SUCCESS') {
      await client.query('COMMIT')
      return { ok: true, idempotent: true, fulfilled: false }
    }
    const expectedKobo = Math.floor(Number(p.amountNgn)) * 100
    if (expectedKobo !== kobo) {
      await client.query('ROLLBACK')
      console.error('[payment] amount mismatch', { reference, expectedKobo, got: kobo })
      return { ok: false, reason: 'amount_mismatch', fulfilled: false }
    }
    if (p.kind === PaymentKind.WALLET_TOPUP) {
      const { rowCount } = await client.query(
        `UPDATE "Wallet" SET "balanceNgn" = "balanceNgn" + $1, "updatedAt" = NOW() WHERE "userId" = $2`,
        [p.amountNgn, p.userId],
      )
      if (!rowCount) {
        await client.query('ROLLBACK')
        console.error('[payment] wallet missing for user', p.userId)
        return { ok: false, reason: 'wallet_missing', fulfilled: false }
      }
    }
    await client.query(`UPDATE "Payment" SET status = 'SUCCESS', "updatedAt" = NOW() WHERE id = $1`, [p.id])
    await client.query('COMMIT')
    void sendPaymentSuccessEmails({
      userId: p.userId,
      kind: String(p.kind),
      amountNgn: Math.floor(Number(p.amountNgn)),
      reference: String(p.reference),
      listingId: p.listingId || null,
    }).catch((err) => console.error('[payment] success email failed:', err?.message || err))
    return { ok: true, fulfilled: true }
  } catch (e) {
    try {
      await client.query('ROLLBACK')
    } catch {
      /* ignore */
    }
    throw e
  } finally {
    client.release()
  }
}

export async function startWalletTopUp({ userId, email, amountNgn, callbackUrl }) {
  const n = assertAmountNgn(amountNgn)
  const payEmail = await resolveUserEmail(userId, email)
  const cb = resolvePaystackCallbackUrl(callbackUrl)

  if (!config.paystackSecret) {
    const reference = `th_stub_${createId()}`
    return {
      mode: 'stub',
      reference,
      authorization_url: cb || `${String(config.appPublicUrl || 'http://localhost:5173').replace(/\/$/, '')}/payments/callback?ref=${encodeURIComponent(reference)}`,
      amountNgn: n,
      kind: PaymentKind.WALLET_TOPUP,
      message: 'PAYSTACK_SECRET_KEY not set — stub response for local development',
    }
  }

  const paymentId = createId()
  const reference = `th_${createId()}`
  await insertPaymentRow({
    id: paymentId,
    userId,
    reference,
    amountNgn: n,
    kind: PaymentKind.WALLET_TOPUP,
    listingId: null,
    metadata: { kind: PaymentKind.WALLET_TOPUP, paymentId },
  })

  try {
    const data = await paystackPost('/transaction/initialize', {
      email: payEmail,
      amount: ngnToKobo(n),
      reference,
      currency: 'NGN',
      callback_url: cb,
      metadata: {
        user_id: userId,
        payment_id: paymentId,
        kind: PaymentKind.WALLET_TOPUP,
      },
    })
    await updatePaymentAccessCode(paymentId, data.access_code)
    return {
      mode: 'live',
      reference: data.reference,
      authorization_url: data.authorization_url,
      access_code: data.access_code,
      amountNgn: n,
      kind: PaymentKind.WALLET_TOPUP,
      paymentId,
    }
  } catch (e) {
    await markPaymentFailedByReference(reference)
    throw e
  }
}

export async function startListingPurchase({ userId, email, listingId, callbackUrl }) {
  const listing = await listingService.getListing(listingId)
  if (listing.ownerId === userId) {
    const err = new Error('You cannot purchase your own listing')
    err.status = 400
    err.expose = true
    throw err
  }
  const st = String(listing.status || '').toUpperCase()
  if (st === 'SOLD' || st === 'REJECTED' || st === 'DRAFT') {
    const err = new Error('This listing is not available for purchase')
    err.status = 400
    err.expose = true
    throw err
  }
  const n = assertAmountNgn(listing.priceNgn)
  const payEmail = await resolveUserEmail(userId, email)
  const cb = resolvePaystackCallbackUrl(callbackUrl)

  if (!config.paystackSecret) {
    const reference = `th_stub_${createId()}`
    return {
      mode: 'stub',
      reference,
      authorization_url: cb || `${String(config.appPublicUrl || 'http://localhost:5173').replace(/\/$/, '')}/payments/callback?ref=${encodeURIComponent(reference)}`,
      amountNgn: n,
      kind: PaymentKind.LISTING_PURCHASE,
      listingId: listing.id,
      message: 'PAYSTACK_SECRET_KEY not set — stub response for local development',
    }
  }

  const paymentId = createId()
  const reference = `th_${createId()}`
  await insertPaymentRow({
    id: paymentId,
    userId,
    reference,
    amountNgn: n,
    kind: PaymentKind.LISTING_PURCHASE,
    listingId: listing.id,
    metadata: { kind: PaymentKind.LISTING_PURCHASE, paymentId, listingId: listing.id },
  })

  try {
    const data = await paystackPost('/transaction/initialize', {
      email: payEmail,
      amount: ngnToKobo(n),
      reference,
      currency: 'NGN',
      callback_url: cb,
      metadata: {
        user_id: userId,
        payment_id: paymentId,
        kind: PaymentKind.LISTING_PURCHASE,
        listing_id: listing.id,
      },
    })
    await updatePaymentAccessCode(paymentId, data.access_code)
    return {
      mode: 'live',
      reference: data.reference,
      authorization_url: data.authorization_url,
      access_code: data.access_code,
      amountNgn: n,
      kind: PaymentKind.LISTING_PURCHASE,
      listingId: listing.id,
      paymentId,
    }
  } catch (e) {
    await markPaymentFailedByReference(reference)
    throw e
  }
}

export async function getPaymentForUser(reference, userId) {
  const { rows } = await query(`SELECT * FROM "Payment" WHERE reference = $1 AND "userId" = $2 LIMIT 1`, [
    reference,
    userId,
  ])
  return rows[0] || null
}

export async function verifyAndFulfillForUser(reference, userId) {
  const row = await getPaymentForUser(reference, userId)
  if (!row) {
    const err = new Error('Payment not found')
    err.status = 404
    err.expose = true
    throw err
  }
  if (row.status === 'SUCCESS') {
    return { ok: true, status: 'SUCCESS', payment: mapPaymentRow(row), source: 'database' }
  }
  if (!config.paystackSecret) {
    return { ok: true, status: row.status, payment: mapPaymentRow(row), source: 'stub' }
  }
  const data = await paystackGet(`/transaction/verify/${encodeURIComponent(reference)}`)
  const d = data
  if (d.status === 'success' && String(d.currency || 'NGN').toUpperCase() === 'NGN') {
    const r = await fulfillChargeIfValid({
      reference: d.reference,
      amountKobo: d.amount,
      currency: d.currency,
    })
    if (!r.ok && r.reason === 'amount_mismatch') {
      const err = new Error('Payment verification failed')
      err.status = 400
      err.expose = true
      throw err
    }
  }
  const fresh = await getPaymentForUser(reference, userId)
  return { ok: true, status: fresh?.status || row.status, payment: mapPaymentRow(fresh || row), source: 'paystack' }
}

function mapPaymentRow(r) {
  if (!r) return null
  return {
    id: r.id,
    reference: r.reference,
    amountNgn: Number(r.amountNgn),
    kind: r.kind,
    listingId: r.listingId,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

export async function handlePaystackWebhookEvent(body) {
  const event = body?.event
  const data = body?.data || {}
  const reference = data.reference
  if (!reference) return { handled: false }

  if (event === 'charge.success' && String(data.status).toLowerCase() === 'success') {
    await fulfillChargeIfValid({
      reference,
      amountKobo: data.amount,
      currency: data.currency,
    })
    return { handled: true }
  }
  if (event === 'charge.failed') {
    await markPaymentFailedByReference(reference)
    return { handled: true }
  }
  return { handled: false }
}
