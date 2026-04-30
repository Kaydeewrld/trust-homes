import process from 'node:process'
import { pool, query } from '../db.js'
import { config } from '../config.js'
import { createId } from '../utils/createId.js'
import * as listingService from './listingService.js'
import { sendPaymentSuccessEmails } from './transactionEmailService.js'

const PAYSTACK_API = 'https://api.paystack.co'

const MIN_WALLET_TOPUP_NGN = 100
const MAX_PAYMENT_NGN = 500_000_000
const PLATFORM_FEE_PCT = 0.1

export const PaymentKind = {
  WALLET_TOPUP: 'wallet_topup',
  LISTING_PURCHASE: 'listing_purchase',
  HOTEL_RESERVATION: 'hotel_reservation',
  PROPERTY_PAYMENT: 'property_payment',
}

function shouldCreditListingOwner(kind, metadata = {}) {
  const k = String(kind || '')
  if (k === PaymentKind.LISTING_PURCHASE) return true
  if (k === PaymentKind.HOTEL_RESERVATION) return true
  if (k === PaymentKind.PROPERTY_PAYMENT && String(metadata?.paymentType || '') === 'property_full_payment') return true
  return false
}

function shouldMarkListingSold(kind, metadata = {}) {
  const k = String(kind || '')
  if (k === PaymentKind.LISTING_PURCHASE) return true
  if (k === PaymentKind.PROPERTY_PAYMENT && String(metadata?.paymentType || '') === 'property_full_payment') return true
  return false
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

function isLocalDevCallbackUrl(url) {
  if (process.env.NODE_ENV === 'production') return false
  try {
    const u = new URL(url)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
    return u.hostname === 'localhost' || u.hostname === '127.0.0.1'
  } catch {
    return false
  }
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
  if (!ok && isLocalDevCallbackUrl(raw)) return raw
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

async function startCustomCharge({ userId, email, amountNgn, callbackUrl, kind, listingId = null, metadata = {} }) {
  const n = assertAmountNgn(amountNgn)
  const payEmail = await resolveUserEmail(userId, email)
  const cb = resolvePaystackCallbackUrl(callbackUrl)

  if (!config.paystackSecret) {
    const reference = `th_stub_${createId()}`
    return {
      mode: 'stub',
      reference,
      authorization_url:
        cb ||
        `${String(config.appPublicUrl || 'http://localhost:5173').replace(/\/$/, '')}/payments/callback?ref=${encodeURIComponent(reference)}`,
      amountNgn: n,
      kind,
      listingId,
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
    kind,
    listingId,
    metadata: { ...metadata, kind, paymentId, listingId: listingId || null },
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
        kind,
        listing_id: listingId || undefined,
        ...metadata,
      },
    })
    await updatePaymentAccessCode(paymentId, data.access_code)
    return {
      mode: 'live',
      reference: data.reference,
      authorization_url: data.authorization_url,
      access_code: data.access_code,
      amountNgn: n,
      kind,
      listingId: listingId || null,
      paymentId,
    }
  } catch (e) {
    await markPaymentFailedByReference(reference)
    throw e
  }
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
    if (p.listingId && (shouldCreditListingOwner(p.kind, p.metadata) || shouldMarkListingSold(p.kind, p.metadata))) {
      const { rows: lrows } = await client.query(`SELECT id, "ownerId" FROM "Listing" WHERE id = $1 LIMIT 1`, [p.listingId])
      const listing = lrows[0]
      if (listing?.ownerId && shouldCreditListingOwner(p.kind, p.metadata)) {
        const gross = Math.max(0, Math.floor(Number(p.amountNgn) || 0))
        const fee = Math.floor(gross * PLATFORM_FEE_PCT)
        const netToSeller = Math.max(0, gross - fee)
        await client.query(
          `INSERT INTO "Wallet" ("id", "userId", "balanceNgn", "createdAt", "updatedAt")
           VALUES ($1, $2, 0, NOW(), NOW())
           ON CONFLICT ("userId") DO NOTHING`,
          [createId(), listing.ownerId],
        )
        await client.query(
          `UPDATE "Wallet" SET "balanceNgn" = "balanceNgn" + $1, "updatedAt" = NOW() WHERE "userId" = $2`,
          [netToSeller, listing.ownerId],
        )
      }
      if (shouldMarkListingSold(p.kind, p.metadata)) {
        await client.query(
          `UPDATE "Listing"
           SET status = 'SOLD'::"ListingStatus", "updatedAt" = NOW()
           WHERE id = $1`,
          [p.listingId],
        )
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
      metadata: p.metadata || {},
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
  return startCustomCharge({
    userId,
    email,
    amountNgn: listing.priceNgn,
    callbackUrl,
    kind: PaymentKind.LISTING_PURCHASE,
    listingId: listing.id,
  })
}

export async function startHotelReservation({ userId, email, listingId, nights, callbackUrl, perNightNgn }) {
  const listing = await listingService.getListing(listingId)
  const nNights = Math.max(1, Math.min(365, Math.floor(Number(nights) || 0)))
  if (!Number.isFinite(nNights) || nNights < 1) {
    const err = new Error('nights must be at least 1')
    err.status = 400
    err.expose = true
    throw err
  }
  if (listing.ownerId === userId) {
    const err = new Error('You cannot reserve your own listing')
    err.status = 400
    err.expose = true
    throw err
  }
  const st = String(listing.status || '').toUpperCase()
  if (st !== 'APPROVED') {
    const err = new Error('This hotel is not available for reservation')
    err.status = 400
    err.expose = true
    throw err
  }
  const nightly = Math.max(1, Math.floor(Number(perNightNgn) || Number(listing.priceNgn) || 0))
  const total = nightly * nNights
  return startCustomCharge({
    userId,
    email,
    amountNgn: total,
    callbackUrl,
    kind: PaymentKind.HOTEL_RESERVATION,
    listingId: listing.id,
    metadata: { nights: nNights, perNightNgn: nightly, reservationType: 'hotel' },
  })
}

export async function startPropertyPayment({ userId, email, amountNgn, callbackUrl, title, listingId = null, paymentType }) {
  const cleanTitle = String(title || '').trim() || 'Property payment'
  const cleanListingId = listingId ? String(listingId) : null
  const cleanPaymentType = String(paymentType || '').trim() || 'property_generic'
  return startCustomCharge({
    userId,
    email,
    amountNgn,
    callbackUrl,
    kind: PaymentKind.PROPERTY_PAYMENT,
    listingId: cleanListingId,
    metadata: { title: cleanTitle, paymentType: cleanPaymentType, listingId: cleanListingId },
  })
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

export async function listPendingAgentPayouts({ take = 100, skip = 0 }) {
  const lim = Math.min(Math.max(Number(take) || 100, 1), 300)
  const off = Math.max(Number(skip) || 0, 0)
  const { rows } = await query(
    `SELECT
      p.id,
      p.reference,
      p."amountNgn",
      p.kind,
      p."createdAt",
      p."updatedAt",
      p."listingId",
      l.title AS "listingTitle",
      l."ownerId" AS "agentUserId",
      u."displayName" AS "agentName",
      u.email AS "agentEmail"
     FROM "Payment" p
     JOIN "Listing" l ON l.id = p."listingId"
     JOIN "User" u ON u.id = l."ownerId"
     WHERE p.status = 'SUCCESS'
       AND u.role = 'AGENT'::"UserRole"
       AND p.kind IN ('listing_purchase', 'hotel_reservation')
     ORDER BY p."updatedAt" DESC
     LIMIT $1 OFFSET $2`,
    [lim, off],
  )
  const feePct = Number(config.platformFeePct || 0.1)
  return rows.map((r) => {
    const gross = Math.floor(Number(r.amountNgn) || 0)
    const fee = Math.floor(gross * feePct)
    const net = Math.max(0, gross - fee)
    return {
      id: r.id,
      reference: r.reference,
      listingId: r.listingId,
      listingTitle: r.listingTitle || 'Property',
      agentUserId: r.agentUserId,
      agentName: r.agentName || 'Agent',
      agentEmail: r.agentEmail || '',
      grossAmountNgn: gross,
      platformFeeNgn: fee,
      netAmountNgn: net,
      status: 'PENDING',
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }
  })
}

export async function listAdminTransactions({ take = 200, skip = 0 }) {
  const lim = Math.min(Math.max(Number(take) || 200, 1), 500)
  const off = Math.max(Number(skip) || 0, 0)
  const { rows } = await query(
    `SELECT
      p.id::text AS id,
      p.reference::text AS reference,
      p.kind::text AS kind,
      p.status::text AS status,
      p."amountNgn"::int AS "amountNgn",
      p."createdAt" AS "createdAt",
      p."updatedAt" AS "updatedAt",
      payer.id::text AS "partyUserId",
      payer."displayName"::text AS "partyName",
      payer.email::text AS "partyEmail",
      l.id::text AS "listingId",
      l.title::text AS "listingTitle",
      seller.id::text AS "counterpartyId",
      seller."displayName"::text AS "counterpartyName",
      p.reference::text AS "gatewayRef",
      'payment'::text AS "entryType"
     FROM "Payment" p
     LEFT JOIN "User" payer ON payer.id = p."userId"
     LEFT JOIN "Listing" l ON l.id = p."listingId"
     LEFT JOIN "User" seller ON seller.id = l."ownerId"
     UNION ALL
     SELECT
      w.id::text AS id,
      ('WP-' || LEFT(w.id::text, 8))::text AS reference,
      'wallet_payout'::text AS kind,
      CASE w.status WHEN 'COMPLETED' THEN 'SUCCESS' WHEN 'REJECTED' THEN 'FAILED' ELSE 'PENDING' END::text AS status,
      w."amountNgn"::int AS "amountNgn",
      w."createdAt" AS "createdAt",
      w."updatedAt" AS "updatedAt",
      u.id::text AS "partyUserId",
      u."displayName"::text AS "partyName",
      u.email::text AS "partyEmail",
      NULL::text AS "listingId",
      NULL::text AS "listingTitle",
      COALESCE(sa.id::text, 'PLATFORM')::text AS "counterpartyId",
      COALESCE(sa.name::text, 'TrustedHome Payouts')::text AS "counterpartyName",
      NULL::text AS "gatewayRef",
      'payout'::text AS "entryType"
     FROM "WalletPayoutRequest" w
     JOIN "User" u ON u.id = w."userId"
     LEFT JOIN "StaffAdmin" sa ON sa.id = w."reviewedByStaffId"
    ORDER BY "createdAt" DESC
    LIMIT $1 OFFSET $2`,
    [lim, off],
  )
  return rows.map((r) => {
    const amount = Math.max(0, Math.floor(Number(r.amountNgn) || 0))
    const fee = Math.floor(amount * PLATFORM_FEE_PCT)
    const net = Math.max(0, amount - fee)
    const kind = String(r.kind || '')
    const entryType = String(r.entryType || 'payment')
    const typeLabelMap = {
      wallet_topup: 'Wallet top-up',
      listing_purchase: 'Property purchase',
      hotel_reservation: 'Hotel reservation',
      property_payment: 'Property payment',
      wallet_payout: 'Wallet payout',
    }
    const statusMap = { SUCCESS: 'Completed', PENDING: 'Pending', FAILED: 'Failed' }
    const status = statusMap[String(r.status || '').toUpperCase()] || 'Processing'
    return {
      id: String(r.id),
      reference: String(r.reference || r.id),
      type: typeLabelMap[kind] || 'Transaction',
      party: String(r.partyName || 'User'),
      partyEmail: String(r.partyEmail || ''),
      partyUserId: String(r.partyUserId || ''),
      counterparty: String(r.counterpartyName || 'TrustedHome'),
      counterpartyId: String(r.counterpartyId || 'PLATFORM'),
      listingRef: r.listingId ? String(r.listingId) : '—',
      total: `₦${amount.toLocaleString('en-NG')}`,
      fee: `₦${fee.toLocaleString('en-NG')}`,
      feePercent: '10%',
      net: `₦${net.toLocaleString('en-NG')}`,
      status,
      date: String(r.createdAt || '').slice(0, 10),
      initiatedAt: r.createdAt ? new Date(r.createdAt).toLocaleString('en-NG') : '—',
      settledAt: status === 'Completed' ? (r.updatedAt ? new Date(r.updatedAt).toLocaleString('en-NG') : '—') : '—',
      paymentMethod: entryType === 'payout' ? 'Bank transfer' : 'Paystack',
      gatewayRef: String(r.gatewayRef || '—'),
      idempotencyKey: String(r.reference || r.id),
      riskScore: 'Low',
      ipCountry: 'NG',
      reconciled: status === 'Completed' ? 'Yes' : 'No',
      disputeOpened: false,
      notesInternal:
        entryType === 'payout'
          ? 'Admin-approved wallet withdrawal.'
          : `Payment kind: ${kind}${r.listingTitle ? ` (${r.listingTitle})` : ''}`,
    }
  })
}
