import { useCallback, useEffect, useMemo, useState } from 'react'
import { useWallet } from '../../context/WalletContext'
import { agentTransactionRows, agentTransactionsKpiTrend } from '../../data/agentTransactionsSeed'
import { useToast } from '../../context/ToastContext'

const fmtN = (n) => `₦${Number(n).toLocaleString('en-NG')}`

const PAGE_SIZE = 8

const selectStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.65rem center',
}

const TABS = [
  { id: 'all', label: 'All Transactions', kind: null },
  { id: 'payments', label: 'Payments Made', kind: 'payment' },
  { id: 'payouts', label: 'Payouts Received', kind: 'payout' },
  { id: 'wallet', label: 'Wallet Activities', kind: 'wallet_topup' },
]

function TypeBadge({ kind }) {
  if (kind === 'payment')
    return (
      <span className="inline-flex rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-700 ring-1 ring-indigo-100">
        Payment
      </span>
    )
  if (kind === 'payout')
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
        Payout
      </span>
    )
  return (
    <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-100">
      Wallet Top-up
    </span>
  )
}

const txStatusStyle = {
  completed: { label: 'Completed', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  processing: { label: 'Processing', dot: 'bg-amber-500', text: 'text-amber-800', bg: 'bg-amber-50' },
  failed: { label: 'Failed', dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
}

function StatusBadge({ status }) {
  const c = txStatusStyle[status] || txStatusStyle.completed
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

function TransactionDonut({ breakdown }) {
  let a = -90
  const segs = breakdown.map((s) => {
    const sweep = (s.pct / 100) * 360
    const start = a
    const end = a + sweep
    a = end
    return { ...s, start, end }
  })
  const gradientStops = segs.map((s) => `${s.color} ${s.start}deg ${s.end}deg`).join(', ')
  const bg = segs.length ? `conic-gradient(from -90deg, ${gradientStops})` : 'conic-gradient(from -90deg, #e2e8f0 0deg 360deg)'
  const total = breakdown.reduce((s, x) => s + x.amount, 0)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="border-b border-slate-100/90 px-4 pb-3 pt-4 sm:px-5">
        <h3 className="text-[15px] font-bold tracking-tight text-slate-900">Transaction Summary</h3>
        <p className="mt-0.5 text-xs text-slate-500">Share by activity type</p>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-5">
        <div className="relative mx-auto h-[150px] w-[150px] shrink-0 sm:mx-0 sm:h-[158px] sm:w-[158px]">
          <div
            className="h-full w-full rounded-full shadow-[inset_0_2px_8px_rgba(15,23,42,0.06)] ring-2 ring-white"
            style={{ background: bg }}
          />
          <div className="absolute inset-[24%] flex flex-col items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(15,23,42,0.08)]">
            <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total</p>
            <p className="mt-0.5 text-center text-[15px] font-bold leading-none tabular-nums tracking-tight text-slate-900 sm:text-[16px]">
              {fmtN(total)}
            </p>
          </div>
        </div>
        <ul className="w-full min-w-0 flex-1 space-y-2 sm:max-w-[200px]">
          {breakdown.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-2 text-[12px] sm:text-[13px]">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: row.color }} />
                <span className="truncate font-medium text-slate-700">{row.label}</span>
              </span>
              <span className="shrink-0 font-bold tabular-nums text-slate-800">{row.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-auto border-t border-slate-100/90 px-4 py-3 sm:px-5">
        <button
          type="button"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          View Full Breakdown
        </button>
      </div>
    </div>
  )
}

export default function AgentTransactionsPage() {
  const { openFundWallet } = useWallet()
  const toast = useToast()
  const [tab, setTab] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const tabKind = TABS.find((t) => t.id === tab)?.kind ?? null

  useEffect(() => {
    setPage(1)
    if (tab !== 'all') setTypeFilter('all')
  }, [tab])

  const filtered = useMemo(() => {
    return agentTransactionRows.filter((r) => {
      if (tabKind && r.kind !== tabKind) return false
      if (tab === 'all' && typeFilter !== 'all' && r.kind !== typeFilter) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      return true
    })
  }, [tab, tabKind, typeFilter, statusFilter])

  const totalFiltered = filtered.length
  const pageCount = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE))

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount))
  }, [pageCount])

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const showingFrom = totalFiltered === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const showingTo = Math.min(page * PAGE_SIZE, totalFiltered)

  const kpis = useMemo(() => {
    let paid = 0
    let fees = 0
    let payouts = 0
    let wallet = 0
    for (const r of filtered) {
      if (r.kind === 'payment') {
        paid += r.amount
        fees += r.serviceFee ?? 0
      } else if (r.kind === 'payout') payouts += r.amount
      else wallet += r.amount
    }
    return { paid, fees, payouts, wallet }
  }, [filtered])

  const donutBreakdown = useMemo(() => {
    const p = kpis.paid
    const pu = kpis.payouts
    const w = kpis.wallet
    const sum = p + pu + w
    if (sum <= 0) {
      return [
        { label: 'Payments Made', pct: 0, amount: 0, color: '#6366F1' },
        { label: 'Payouts Received', pct: 0, amount: 0, color: '#22C55E' },
        { label: 'Wallet Top-ups', pct: 0, amount: 0, color: '#3B82F6' },
      ]
    }
    return [
      { label: 'Payments Made', pct: Math.round((p / sum) * 1000) / 10, amount: p, color: '#6366F1' },
      { label: 'Payouts Received', pct: Math.round((pu / sum) * 1000) / 10, amount: pu, color: '#22C55E' },
      { label: 'Wallet Top-ups', pct: Math.round((w / sum) * 1000) / 10, amount: w, color: '#3B82F6' },
    ]
  }, [kpis])

  const goExport = useCallback(() => {
    toast.info('Export started', 'Transaction export will be available shortly.')
  }, [toast])

  const kpiCards = useMemo(
    () => [
      {
        label: 'Total Amount Paid',
        value: fmtN(kpis.paid),
        trend: agentTransactionsKpiTrend,
        trendClass: 'text-emerald-600',
        wrap: 'bg-indigo-50 text-indigo-600',
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: 'Total Service Charge (10%)',
        value: fmtN(kpis.fees),
        trend: agentTransactionsKpiTrend,
        trendClass: 'text-emerald-600',
        wrap: 'bg-orange-50 text-orange-500',
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinejoin="round" />
            <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        label: 'Total Payouts',
        value: fmtN(kpis.payouts),
        trend: agentTransactionsKpiTrend,
        trendClass: 'text-emerald-600',
        wrap: 'bg-emerald-50 text-emerald-600',
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        label: 'Wallet Top-ups',
        value: fmtN(kpis.wallet),
        trend: agentTransactionsKpiTrend,
        trendClass: 'text-emerald-600',
        wrap: 'bg-blue-50 text-blue-600',
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <rect x="2" y="5" width="20" height="14" rx="2" strokeLinejoin="round" />
            <path d="M2 10h20" />
          </svg>
        ),
      },
    ],
    [kpis],
  )

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1480px] flex-col px-4 py-3 text-slate-800 md:px-6 md:py-4">
      <div className="min-w-0">
        <h1 className="text-[22px] font-bold leading-tight tracking-tight text-[#111827]">Transactions</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-slate-500">Track all your payments, payouts, and wallet activities.</p>
      </div>

      <div className="mt-4 shrink-0 border-b border-slate-200">
        <nav className="-mb-px flex flex-wrap gap-1" aria-label="Transaction filters">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`relative whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-medium transition ${
                tab === t.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-3 flex shrink-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="sr-only" htmlFor="tx-date-range">
            Date range
          </label>
          <select
            id="tx-date-range"
            defaultValue="may-2026"
            className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 pr-9 text-[12px] font-medium text-slate-700 shadow-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 sm:w-auto sm:min-w-[200px]"
            style={selectStyle}
          >
            <option value="may-2026">May 1 – May 28, 2026</option>
            <option value="apr-2026">Apr 1 – Apr 30, 2026</option>
            <option value="q1-2026">Jan 1 – Mar 31, 2026</option>
          </select>
          {tab === 'all' && (
            <>
              <label className="sr-only" htmlFor="tx-type">
                Type
              </label>
              <select
                id="tx-type"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setPage(1)
                }}
                className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 pr-9 text-[12px] font-medium text-slate-700 shadow-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 sm:w-auto sm:min-w-[140px]"
                style={selectStyle}
              >
                <option value="all">All Types</option>
                <option value="payment">Payment</option>
                <option value="payout">Payout</option>
                <option value="wallet_topup">Wallet Top-up</option>
              </select>
            </>
          )}
          <label className="sr-only" htmlFor="tx-status">
            Status
          </label>
          <select
            id="tx-status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-3 pr-9 text-[12px] font-medium text-slate-700 shadow-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 sm:w-auto sm:min-w-[130px]"
            style={selectStyle}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <button
          type="button"
          onClick={goExport}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 lg:self-auto"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Export
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-100/80 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.wrap}`}>{card.icon}</div>
            <p className="mt-2 text-[11px] font-semibold text-slate-500">{card.label}</p>
            <p className="mt-1 text-[22px] font-bold leading-none tracking-tight text-slate-900">{card.value}</p>
            <p className={`mt-1.5 text-[11px] font-semibold ${card.trendClass}`}>{card.trend}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-5 lg:items-stretch">
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-3">
          <div className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[1040px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/90">
                    {['Date', 'Type', 'Description', 'Listing / Ref', 'Amount', 'Service fee (10%)', 'Net amount', 'Status', 'Action'].map((h) => (
                      <th
                        key={h}
                        className={`whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 ${
                          h === 'Amount' || h === 'Service fee (10%)' || h === 'Net amount' || h === 'Status' || h === 'Action' ? 'text-right' : ''
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-[13px] text-slate-500">
                        No transactions match this filter.
                      </td>
                    </tr>
                  ) : (
                    pageRows.map((row) => (
                      <tr key={row.id} className="border-b border-slate-100 last:border-0">
                        <td className="whitespace-nowrap px-3 py-3 align-top">
                          <p className="text-[13px] font-bold text-[#111827]">{row.dateLabel}</p>
                          <p className="mt-0.5 text-[12px] font-medium text-slate-500">{row.timeLabel}</p>
                        </td>
                        <td className="px-3 py-3 align-middle">
                          <TypeBadge kind={row.kind} />
                        </td>
                        <td className="max-w-[200px] px-3 py-3 align-middle text-[13px] text-slate-600">{row.description}</td>
                        <td className="max-w-[220px] px-3 py-3 align-middle text-[12px] font-medium leading-snug text-slate-700">{row.listingRef}</td>
                        <td className="whitespace-nowrap px-3 py-3 align-middle text-right text-[13px] font-bold tabular-nums text-[#111827]">
                          {fmtN(row.amount)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 align-middle text-right text-[13px] font-semibold tabular-nums text-slate-600">
                          {row.serviceFee != null ? fmtN(row.serviceFee) : '—'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 align-middle text-right text-[13px] font-bold tabular-nums text-[#111827]">
                          {fmtN(row.netAmount)}
                        </td>
                        <td className="px-3 py-3 align-middle text-right">
                          <StatusBadge status={row.status} />
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 align-middle text-right">
                          <button
                            type="button"
                            className="text-[12px] font-semibold text-indigo-600 transition hover:text-indigo-500"
                          >
                            {row.actionKind === 'receipt' ? 'View Receipt' : 'View Details'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
              <p className="text-[12px] font-medium text-slate-500">
                Showing <span className="font-semibold text-slate-700">{showingFrom}</span> to{' '}
                <span className="font-semibold text-slate-700">{showingTo}</span> of{' '}
                <span className="font-semibold text-slate-700">{totalFiltered}</span> transactions
              </p>
              <div className="flex items-center justify-end gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`grid h-9 min-w-[2.25rem] place-items-center rounded-lg px-2 text-[13px] font-bold transition ${
                      page === n ? 'bg-[#6366F1] text-white shadow-sm shadow-indigo-500/25' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-indigo-100/90 bg-indigo-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100/80">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="5" width="20" height="14" rx="2" strokeLinejoin="round" />
                  <path d="M2 10h20" />
                  <path d="M6 15h.01M10 15h4" strokeLinecap="round" />
                </svg>
              </span>
              <div className="min-w-0">
                <h2 className="text-[15px] font-bold text-indigo-950">Fund Your Wallet</h2>
                <p className="mt-0.5 text-[12px] leading-relaxed text-indigo-950/85">
                  Add funds instantly to pay for promotions and unlock premium leads.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={openFundWallet}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 self-start rounded-xl bg-[#6366F1] px-4 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600 sm:self-auto"
            >
              <span className="text-base font-bold leading-none">+</span>
              Fund Wallet
            </button>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
          <TransactionDonut breakdown={donutBreakdown} />

          <div className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            <div className="border-b border-slate-100/90 px-4 pb-3 pt-4 sm:px-5">
              <h3 className="text-[15px] font-bold tracking-tight text-slate-900">How it works</h3>
              <p className="mt-0.5 text-xs text-slate-500">Fees, payouts, and your wallet</p>
            </div>
            <ol className="list-none space-y-3 px-4 py-4 sm:px-5">
              {[
                'Payments for promotions and leads include a 10% platform service charge, shown before you confirm.',
                'Commissions and earnings are credited to your available balance; you can request a bank payout anytime above the minimum.',
                'Wallet top-ups are instant; use your wallet to pay for services without re-entering card details.',
                'Failed payments can be retried from this list; completed rows include receipts for your records.',
              ].map((text, i) => (
                <li key={i} className="flex gap-3 text-[12px] leading-relaxed text-slate-600 sm:text-[13px]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[12px] font-bold text-slate-700">
                    {i + 1}
                  </span>
                  <span className="min-w-0 pt-0.5">{text}</span>
                </li>
              ))}
            </ol>
            <div className="border-t border-slate-100/90 px-4 py-4 sm:px-5">
              <p className="text-[13px] font-bold text-slate-900">Need help?</p>
              <p className="mt-1 text-[12px] text-slate-500">Our team can explain charges, payouts, or refunds.</p>
              <button
                type="button"
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Chat with Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
