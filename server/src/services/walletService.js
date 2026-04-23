import { query } from '../db.js'

export async function getWalletByUserId(userId) {
  const { rows } = await query(`SELECT "balanceNgn" FROM "Wallet" WHERE "userId" = $1 LIMIT 1`, [userId])
  if (!rows[0]) {
    const err = new Error('Wallet not found')
    err.status = 404
    err.expose = true
    throw err
  }
  return { currency: 'NGN', balanceNgn: Number(rows[0].balanceNgn) }
}

export async function listUserPayments(userId, take = 20) {
  const lim = Math.min(Math.max(Number(take) || 20, 1), 50)
  const { rows } = await query(
    `SELECT id, reference, "amountNgn", kind, "listingId", status, "createdAt", "updatedAt"
     FROM "Payment" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT $2`,
    [userId, lim],
  )
  return rows.map((r) => ({
    id: r.id,
    reference: r.reference,
    amountNgn: Number(r.amountNgn),
    kind: r.kind,
    listingId: r.listingId,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }))
}
