/** @typedef {'payment' | 'payout' | 'wallet_topup'} TxKind */
/** @typedef {'completed' | 'processing' | 'failed'} TxStatus */

const paymentDescs = [
  'Promotion Payment — Standard Plan',
  'Promotion Payment — Premium Plan',
  'Listing boost — 7 days',
  'Featured placement — 14 days',
  'Lead unlock — Premium lead pack',
  'Verification badge renewal',
  'Sponsored search — Top slot',
  'Promo bundle — Spring campaign',
]

const payoutDescs = ['Payout to Bank', 'Scheduled payout — GTBank', 'Express payout', 'Monthly payout']

const walletDescs = ['Wallet Funding', 'Card top-up', 'Bank transfer — wallet', 'Refund to wallet']

const properties = [
  'Luxury 4 Bedroom Duplex',
  'Modern 3 Bedroom Apartment',
  'Waterfront Penthouse',
  'Executive Office Suite',
  'Semi-detached 4 Bedroom',
  'Garden Estate Villa',
  'City Loft Studio',
  'Commercial Plaza Unit',
]

function refFor(i, kind) {
  if (kind === 'wallet_topup') return '—'
  if (kind === 'payout') return `PAYOUT-${8200 + (i % 900)}`
  const codes = ['PROMO', 'LIST', 'LEAD', 'FEAT']
  return `${properties[i % properties.length]}, Ref: ${codes[i % codes.length]}-${8362 + (i % 400)}`
}

const kindPattern = ['payment', 'payment', 'payment', 'payout', 'wallet_topup', 'payment', 'payment', 'payout']

const statusPattern = ['completed', 'completed', 'completed', 'processing', 'failed']

/** 42 rows, newest first (May 28 → earlier in May). */
function buildRows() {
  const rows = []
  for (let idx = 0; idx < 42; idx++) {
    const i = 41 - idx
    const kind = kindPattern[idx % kindPattern.length]
    const status = statusPattern[idx % statusPattern.length]
    const hour = 8 + (idx % 10)
    const min = (idx * 7) % 60
    const day = Math.max(1, 28 - Math.floor(idx / 2))
    const dateLabel = `May ${day}, 2026`
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    const timeLabel = `${h12}:${String(min).padStart(2, '0')} ${ampm}`

    let amount
    if (kind === 'payment') amount = 15000 + (idx % 8) * 12500 + (idx * 137) % 9000
    else if (kind === 'payout') amount = 80000 + (idx % 6) * 45000 + (idx * 211) % 12000
    else amount = 25000 + (idx % 5) * 15000

    const serviceFee = kind === 'payment' ? Math.round(amount * 0.1) : null
    const netAmount = kind === 'payment' ? amount - serviceFee : amount

    let description
    if (kind === 'payment') description = paymentDescs[idx % paymentDescs.length]
    else if (kind === 'payout') description = payoutDescs[idx % payoutDescs.length]
    else description = walletDescs[idx % walletDescs.length]

    rows.push({
      id: `txn-${idx + 1}`,
      dateLabel,
      timeLabel,
      kind,
      description,
      listingRef: refFor(i, kind),
      amount,
      serviceFee,
      netAmount,
      status,
      actionKind: kind === 'payment' ? 'receipt' : 'details',
    })
  }
  return rows
}

export const agentTransactionRows = buildRows()

export const agentTransactionsKpiTrend = '▲ 18.6% vs Apr 1 – Apr 28'
