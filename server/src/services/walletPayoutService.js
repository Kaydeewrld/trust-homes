import { pool, query } from '../db.js'
import { createId } from '../utils/createId.js'

/** Matches agent payout UI service charge (10%). */
const PLATFORM_FEE_PCT = 0.1
const MIN_PAYOUT_NGN = 1000

let schemaEnsured = false

async function ensureWalletPayoutSchema() {
  if (schemaEnsured) return
  await query(`
    DO $$ BEGIN
      CREATE TYPE "WalletPayoutStatus" AS ENUM ('PENDING', 'COMPLETED', 'REJECTED');
    EXCEPTION WHEN duplicate_object THEN NULL; END $$`)
  await query(`
    CREATE TABLE IF NOT EXISTS "WalletPayoutRequest" (
      "id" TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      "amountNgn" INTEGER NOT NULL,
      "feeNgn" INTEGER NOT NULL DEFAULT 0,
      "netNgn" INTEGER NOT NULL,
      "bankName" TEXT NOT NULL,
      "accountName" TEXT NOT NULL,
      "accountNumber" TEXT NOT NULL,
      "status" "WalletPayoutStatus" NOT NULL DEFAULT 'PENDING',
      "reviewedByStaffId" TEXT REFERENCES "StaffAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE,
      "reviewedAt" TIMESTAMP(3),
      "reviewNote" TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`)
  await query(`CREATE INDEX IF NOT EXISTS "WalletPayoutRequest_userId_idx" ON "WalletPayoutRequest" ("userId")`)
  await query(`CREATE INDEX IF NOT EXISTS "WalletPayoutRequest_status_idx" ON "WalletPayoutRequest" ("status")`)
  schemaEnsured = true
}

function mapRow(r, { maskAccount } = { maskAccount: true }) {
  if (!r) return null
  const rawAcct = String(r.accountnumber ?? r.accountNumber ?? '')
  const last4 = rawAcct.replace(/\D/g, '').slice(-4) || '—'
  return {
    id: r.id,
    userId: String(r.userid ?? r.userId ?? ''),
    amountNgn: Number(r.amountngn ?? r.amountNgn),
    feeNgn: Number(r.feengn ?? r.feeNgn ?? 0),
    netNgn: Number(r.netngn ?? r.netNgn ?? 0),
    bankName: r.bankname ?? r.bankName,
    accountName: r.accountname ?? r.accountName,
    accountNumber: maskAccount ? undefined : rawAcct,
    accountMasked: maskAccount ? `****${last4}` : undefined,
    status: r.status,
    reviewedAt: r.reviewedat ?? r.reviewedAt,
    reviewNote: r.reviewnote ?? r.reviewNote,
    createdAt: r.createdat ?? r.createdAt,
    updatedAt: r.updatedat ?? r.updatedAt,
    agentName: r.agentname ?? r.agentName,
    agentEmail: r.agentemail ?? r.agentEmail,
  }
}

async function sumPendingForUser(userId) {
  const { rows } = await query(
    `SELECT COALESCE(SUM("amountNgn"), 0)::int AS total FROM "WalletPayoutRequest" WHERE "userId" = $1 AND status = 'PENDING'`,
    [userId],
  )
  return Number(rows[0]?.total ?? 0)
}

export async function createWalletPayoutRequest(userId, body) {
  await ensureWalletPayoutSchema()
  const amountNgn = Math.floor(Number(body.amountNgn))
  if (!Number.isFinite(amountNgn) || amountNgn < MIN_PAYOUT_NGN) {
    const err = new Error(`amountNgn must be at least ${MIN_PAYOUT_NGN}`)
    err.status = 400
    err.expose = true
    throw err
  }
  const bankName = String(body.bankName || '').trim()
  const accountName = String(body.accountName || '').trim()
  const accountNumber = String(body.accountNumber || '').replace(/\D/g, '')
  if (!bankName || !accountName || accountNumber.length !== 10) {
    const err = new Error('bankName, accountName, and a 10-digit accountNumber are required')
    err.status = 400
    err.expose = true
    throw err
  }

  const feeNgn = Math.round(amountNgn * PLATFORM_FEE_PCT)
  const netNgn = Math.max(0, amountNgn - feeNgn)

  const { rows: wb } = await query(`SELECT "balanceNgn" FROM "Wallet" WHERE "userId" = $1 LIMIT 1`, [userId])
  if (!wb[0]) {
    const err = new Error('Wallet not found')
    err.status = 404
    err.expose = true
    throw err
  }
  const balance = Math.floor(Number(wb[0].balanceNgn))
  const committed = await sumPendingForUser(userId)
  const available = balance - committed
  if (amountNgn > available) {
    const err = new Error('Insufficient available balance (including pending payout requests)')
    err.status = 400
    err.expose = true
    throw err
  }

  const id = createId()
  await query(
    `INSERT INTO "WalletPayoutRequest" (
      "id", "userId", "amountNgn", "feeNgn", "netNgn",
      "bankName", "accountName", "accountNumber", status, "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'PENDING', NOW(), NOW())`,
    [id, userId, amountNgn, feeNgn, netNgn, bankName, accountName, accountNumber],
  )
  const { rows } = await query(`SELECT * FROM "WalletPayoutRequest" WHERE id = $1 LIMIT 1`, [id])
  return mapRow(rows[0], { maskAccount: true })
}

export async function listWalletPayoutsForUser(userId, take = 50) {
  await ensureWalletPayoutSchema()
  const lim = Math.min(Math.max(Number(take) || 50, 1), 100)
  const { rows } = await query(
    `SELECT * FROM "WalletPayoutRequest" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT $2`,
    [userId, lim],
  )
  return rows.map((r) => mapRow(r, { maskAccount: true }))
}

export async function listWalletPayoutsForAdmin({ status, take = 100, skip = 0 }) {
  await ensureWalletPayoutSchema()
  const lim = Math.min(Math.max(Number(take) || 100, 1), 300)
  const off = Math.max(Number(skip) || 0, 0)
  const rawSt = status ? String(status).toUpperCase() : ''
  const st = rawSt === 'PENDING' || rawSt === 'COMPLETED' || rawSt === 'REJECTED' ? rawSt : null
  const { rows } = await query(
    `SELECT w.*, u."displayName" AS "agentName", u.email AS "agentEmail"
     FROM "WalletPayoutRequest" w
     JOIN "User" u ON u.id = w."userId"
     WHERE ($1::text IS NULL OR w.status::text = $1::text)
     ORDER BY w."createdAt" DESC
     LIMIT $2 OFFSET $3`,
    [st, lim, off],
  )
  return rows.map((r) => mapRow(r, { maskAccount: false }))
}

export async function approveWalletPayout(payoutId, staffId) {
  await ensureWalletPayoutSchema()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    let reviewerId = null
    if (staffId) {
      const { rows: srows } = await client.query(`SELECT id FROM "StaffAdmin" WHERE id = $1 LIMIT 1`, [String(staffId)])
      reviewerId = srows[0]?.id ? String(srows[0].id) : null
    }
    const { rows: pre } = await client.query(`SELECT * FROM "WalletPayoutRequest" WHERE id = $1 FOR UPDATE`, [payoutId])
    const req = pre[0]
    if (!req) {
      const err = new Error('Payout request not found')
      err.status = 404
      err.expose = true
      throw err
    }
    if (String(req.status) !== 'PENDING') {
      const err = new Error('Payout is not pending')
      err.status = 409
      err.expose = true
      throw err
    }
    const userId = req.userId || req.userid
    const amt = Math.floor(Number(req.amountngn ?? req.amountNgn))

    const { rows: wrows } = await client.query(`SELECT "balanceNgn" FROM "Wallet" WHERE "userId" = $1 FOR UPDATE`, [userId])
    if (!wrows[0]) {
      const err = new Error('Wallet not found')
      err.status = 404
      err.expose = true
      throw err
    }
    const bal = Math.floor(Number(wrows[0].balanceNgn))
    if (bal < amt) {
      const err = new Error('Insufficient wallet balance to approve this payout')
      err.status = 409
      err.expose = true
      throw err
    }

    await client.query(`UPDATE "Wallet" SET "balanceNgn" = "balanceNgn" - $1, "updatedAt" = NOW() WHERE "userId" = $2`, [amt, userId])
    await client.query(
      `UPDATE "WalletPayoutRequest"
       SET status = 'COMPLETED', "reviewedByStaffId" = $2, "reviewedAt" = NOW(), "updatedAt" = NOW()
       WHERE id = $1`,
      [payoutId, reviewerId],
    )
    await client.query('COMMIT')
    const { rows } = await query(`SELECT w.*, u."displayName" AS "agentName", u.email AS "agentEmail"
      FROM "WalletPayoutRequest" w JOIN "User" u ON u.id = w."userId" WHERE w.id = $1`, [payoutId])
    return mapRow(rows[0], { maskAccount: false })
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

export async function rejectWalletPayout(payoutId, staffId, note) {
  await ensureWalletPayoutSchema()
  let reviewerId = null
  if (staffId) {
    const { rows: srows } = await query(`SELECT id FROM "StaffAdmin" WHERE id = $1 LIMIT 1`, [String(staffId)])
    reviewerId = srows[0]?.id ? String(srows[0].id) : null
  }
  const { rows } = await query(
    `UPDATE "WalletPayoutRequest"
     SET status = 'REJECTED', "reviewedByStaffId" = $2, "reviewedAt" = NOW(),
         "reviewNote" = $3, "updatedAt" = NOW()
     WHERE id = $1 AND status = 'PENDING'
     RETURNING *`,
    [payoutId, reviewerId, note ? String(note).trim().slice(0, 2000) : null],
  )
  if (!rows[0]) {
    const err = new Error('Payout not found or not pending')
    err.status = 404
    err.expose = true
    throw err
  }
  const { rows: joined } = await query(
    `SELECT w.*, u."displayName" AS "agentName", u.email AS "agentEmail"
     FROM "WalletPayoutRequest" w JOIN "User" u ON u.id = w."userId" WHERE w.id = $1`,
    [payoutId],
  )
  return mapRow(joined[0], { maskAccount: false })
}
