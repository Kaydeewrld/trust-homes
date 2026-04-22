import { useCallback, useEffect, useMemo, useState } from 'react'
import { payoutHistoryRows } from '../../data/agentPayoutHistorySeed'
import { useToast } from '../../context/ToastContext'

const fmtN = (n) => `₦${Number(n).toLocaleString('en-NG')}`

const PAGE_SIZE = 8

function StatusBadge({ status }) {
  if (status === 'paid')
    return (
      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">
        Paid
      </span>
    )
  if (status === 'processing')
    return (
      <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 ring-1 ring-amber-100">
        Processing
      </span>
    )
  return (
    <span className="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700 ring-1 ring-red-100">
      Failed
    </span>
  )
}

function BankIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M3 9h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9Z" strokeLinejoin="round" />
      <path d="M3 10V7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3" />
      <path d="M7 15h2M11 15h6" strokeLinecap="round" />
    </svg>
  )
}

export default function AgentPayoutHistoryModal({ open, onClose }) {
  const toast = useToast()
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (!open) {
      setPage(1)
      setStatusFilter('all')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return payoutHistoryRows
    return payoutHistoryRows.filter((r) => r.status === statusFilter)
  }, [statusFilter])

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

  const goExport = useCallback(() => {
    toast.info('Export started', 'Payout history export will be available shortly.')
  }, [toast])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" aria-label="Close dialog" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payout-history-title"
        className="relative flex max-h-[min(94vh,900px)] w-full max-w-[920px] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15"
      >
        <div className="shrink-0 border-b border-slate-100 px-5 pb-4 pt-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="payout-history-title" className="text-lg font-bold tracking-tight text-[#111827]">
                Payout History
              </h2>
              <p className="mt-1 text-[13px] text-slate-500">View all your payout requests and their status.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
              <div className="relative min-w-0 flex-1 sm:max-w-[240px]">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
                  </svg>
                </span>
                <select
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-9 text-[12px] font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
                  defaultValue="range-1"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.65rem center',
                  }}
                >
                  <option value="range-1">Jan 1 – May 16, 2026</option>
                  <option value="range-2">Jan 1 – Dec 31, 2025</option>
                </select>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="h-10 w-full min-w-[140px] flex-1 appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-[12px] font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 sm:w-auto sm:flex-initial"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.65rem center',
                }}
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <button
              type="button"
              onClick={goExport}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 sm:self-auto"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v12M8 11l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 19h14a2 2 0 0 0 2-2v-2" strokeLinecap="round" />
              </svg>
              Export
            </button>
          </div>
        </div>

        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  {['Date', 'Payout ID', 'Amount', 'Method', 'Status', 'Paid on'].map((h) => (
                    <th
                      key={h}
                      className={`whitespace-nowrap px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 ${
                        h === 'Amount' || h === 'Paid on' ? 'text-right' : ''
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                  <th className="w-12 px-2 py-3 text-center">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-[13px] text-slate-500">
                    No payouts match this filter.
                  </td>
                </tr>
                ) : (
                  pageRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 align-top">
                        <p className="text-[13px] font-bold text-[#111827]">{row.dateLabel}</p>
                        <p className="mt-0.5 text-[12px] font-medium text-slate-500">{row.timeLabel}</p>
                      </td>
                      <td className="px-4 py-3 align-middle text-[13px] font-semibold text-slate-800">{row.payoutId}</td>
                      <td className="px-4 py-3 align-middle text-right text-[13px] font-bold tabular-nums text-[#111827]">{fmtN(row.amount)}</td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                            <BankIcon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[13px] font-semibold text-[#111827]">{row.bankName}</span>
                            <span className="mt-0.5 block text-[12px] font-medium text-slate-500">•••• {row.accountLast4}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        {row.paidOnDate ? (
                          <>
                            <p className="text-[13px] font-bold text-[#111827]">{row.paidOnDate}</p>
                            <p className="mt-0.5 text-[12px] font-medium text-slate-500">{row.paidOnTime}</p>
                          </>
                        ) : (
                          <span className="text-[15px] font-medium text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-2 py-3 align-middle text-center">
                        <button
                          type="button"
                          className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                          aria-label="Row actions"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                            <circle cx="12" cy="6" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="12" cy="18" r="1.5" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="shrink-0 border-t border-slate-100 px-5 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[12px] font-medium text-slate-500">
              Showing <span className="font-semibold text-slate-700">{showingFrom}</span> to{' '}
              <span className="font-semibold text-slate-700">{showingTo}</span> of{' '}
              <span className="font-semibold text-slate-700">{totalFiltered}</span> payouts
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

        <div className="flex shrink-0 items-start gap-3 border-t border-indigo-100/90 bg-indigo-50/90 px-5 py-3.5 sm:px-6">
          <span className="mt-0.5 shrink-0 text-indigo-500">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
            </svg>
          </span>
          <p className="text-[12px] leading-relaxed text-indigo-950/90">
            Payouts are processed within <span className="font-semibold">1–3 business days</span>. You will receive an email notification once your payout is
            completed.
          </p>
        </div>
      </div>
    </div>
  )
}
