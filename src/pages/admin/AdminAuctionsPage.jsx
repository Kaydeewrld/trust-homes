import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { adminAuctions as adminAuctionsSeed } from '../../data/adminSeed'
import AdminModalShell from './AdminModalShell'

const PAGE_SIZE = 6

function nowWat() {
  const d = new Date()
  return `${d.toISOString().slice(0, 10)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WAT`
}

function settleRef() {
  return `AUC-SET-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function StatusBadge({ status }) {
  const s = String(status || '')
  const map = {
    Active: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
    Scheduled: 'bg-slate-100 text-slate-800 ring-slate-200',
    Paused: 'bg-amber-50 text-amber-900 ring-amber-100',
    Ended: 'bg-sky-50 text-sky-800 ring-sky-100',
    Settled: 'bg-indigo-50 text-indigo-900 ring-indigo-100',
    Cancelled: 'bg-red-50 text-red-800 ring-red-100',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${map[s] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
      {status}
    </span>
  )
}

function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-slate-900">{value ?? '—'}</p>
    </div>
  )
}

function SectionTitle({ children }) {
  return <h3 className="mb-3 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{children}</h3>
}

function isLiveStatus(s) {
  return s === 'Active' || s === 'Paused'
}

export default function AdminAuctionsPage() {
  const toast = useToast()
  const [rows, setRows] = useState(() => adminAuctionsSeed.map((r) => ({ ...r })))
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [viewRow, setViewRow] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const stats = useMemo(() => {
    const total = rows.length
    const live = rows.filter((r) => isLiveStatus(r.status)).length
    const scheduled = rows.filter((r) => r.status === 'Scheduled').length
    const ended = rows.filter((r) => r.status === 'Ended').length
    const settled = rows.filter((r) => r.status === 'Settled').length
    const cancelled = rows.filter((r) => r.status === 'Cancelled').length
    return { total, live, scheduled, ended, settled, cancelled }
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter === 'live' && !isLiveStatus(r.status)) return false
      if (statusFilter === 'post' && r.status !== 'Ended') return false
      if (statusFilter !== 'all' && statusFilter !== 'live' && statusFilter !== 'post' && r.status !== statusFilter) return false
      if (!q) return true
      const blob = [r.id, r.reference, r.listing, r.listingId, r.location, r.agent, r.agentId, r.highBidder, r.settledRef].filter(Boolean).join(' ').toLowerCase()
      return blob.includes(q)
    })
  }, [rows, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter])

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('all')
    toast.info('Filters cleared', 'Showing all auctions.')
  }

  const exportCatalogue = () => {
    toast.success('Export queued', `${filtered.length} auction row(s) prepared (demo).`)
  }

  const copyRef = (r) => {
    const text = r.reference || r.id
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => toast.success('Copied', `${text} on clipboard.`),
        () => toast.info('Reference', text),
      )
    } else {
      toast.info('Reference', text)
    }
  }

  const extendWindow = (r) => {
    const n = (r.extensionCount || 0) + 1
    setRows((prev) =>
      prev.map((x) =>
        x.id === r.id
          ? {
              ...x,
              extensionCount: n,
              ends: `Extended +24h (×${n})`,
              notesInternal: `${x.notesInternal ? `${x.notesInternal} ` : ''}Closing extended by admin (demo).`.trim(),
            }
          : x,
      ),
    )
    toast.success('Timer extended', `${r.reference} — +24h applied (demo).`)
  }

  const applyConfirm = () => {
    if (!confirm) return
    const { type, row } = confirm
    const w = nowWat()

    if (type === 'goLive') {
      setRows((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? {
                ...x,
                status: 'Active',
                startedAt: w,
                ends: '7d (demo timer)',
                bid: x.bid === '—' ? 'Opening' : x.bid,
                notesInternal: `${x.notesInternal ? `${x.notesInternal} ` : ''}Went live from admin console (demo).`.trim(),
              }
            : x,
        ),
      )
      toast.success('Now live', `${row.reference} is Active.`)
    }
    if (type === 'cancel') {
      setRows((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? {
                ...x,
                status: 'Cancelled',
                ends: 'Cancelled',
                notesInternal: `${x.notesInternal ? `${x.notesInternal} ` : ''}Cancelled by admin (demo).`.trim(),
              }
            : x,
        ),
      )
      toast.warning('Cancelled', `${row.reference} will not accept further bids.`)
    }
    if (type === 'forceEnd') {
      setRows((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? {
                ...x,
                status: 'Ended',
                ends: 'Ended',
                notesInternal: `${x.notesInternal ? `${x.notesInternal} ` : ''}Force-ended by admin (demo).`.trim(),
              }
            : x,
        ),
      )
      toast.info('Auction ended', `${row.reference} moved to Ended — settle or void per policy.`)
    }
    if (type === 'settle') {
      const ref = settleRef()
      const win = row.highBidder && row.highBidder !== '—' ? row.highBidder : 'No sale'
      setRows((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? {
                ...x,
                status: 'Settled',
                ends: 'Settled',
                winner: win,
                settledAt: w,
                settledRef: ref,
                notesInternal: `${x.notesInternal ? `${x.notesInternal} ` : ''}Marked settled ${ref} (demo).`.trim(),
              }
            : x,
        ),
      )
      toast.success('Settled', `${row.reference} closed in ledger (${ref}).`)
    }

    setConfirm(null)
  }

  const pauseAuction = (r) => {
    setRows((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, status: 'Paused', ends: 'Paused', lastEndsLabel: x.ends } : x)),
    )
    toast.info('Paused', `${r.reference} — bidding frozen.`)
  }

  const resumeAuction = (r) => {
    setRows((prev) =>
      prev.map((x) =>
        x.id === r.id ? { ...x, status: 'Active', ends: x.lastEndsLabel && x.lastEndsLabel !== 'Paused' ? x.lastEndsLabel : 'Timer running (demo)' } : x,
      ),
    )
    toast.success('Resumed', `${r.reference} is Active again.`)
  }

  const openView = (r) => {
    setConfirm(null)
    setViewRow(r)
  }

  useEffect(() => {
    if (!viewRow) return
    const fresh = rows.find((x) => x.id === viewRow.id)
    if (fresh) setViewRow(fresh)
  }, [rows, viewRow?.id])

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1760px] space-y-7 px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-6 lg:px-8 lg:py-8 xl:px-11 xl:py-9">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Auctions</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Monitor timers, bidding integrity, and settlement. <span className="font-semibold text-slate-700">Live</span> events can be paused, extended, or ended;{' '}
            <span className="font-semibold text-slate-700">Ended</span> lots move to settlement (demo — wire to your auction engine).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('live')}
            className="h-10 rounded-lg border border-emerald-200 bg-emerald-50 px-4 text-sm font-semibold text-emerald-950 shadow-sm hover:bg-emerald-100"
          >
            Live only
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('post')}
            className="h-10 rounded-lg border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-sky-950 shadow-sm hover:bg-sky-100"
          >
            Needs settlement
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Clear filters
          </button>
          <button
            type="button"
            onClick={exportCatalogue}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Export
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-amber-100 bg-amber-50/50 px-5 py-4">
        <p className="text-sm font-semibold text-amber-950">Fairness & compliance</p>
        <p className="mt-1 text-sm leading-relaxed text-amber-900/85">
          Production should log every bid server-side, enforce anti-sniping rules, and never trust client clocks for close time. Pausing or ending an auction must write an immutable audit entry with admin identity.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm md:p-5">
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="auc-search">
              Search
            </label>
            <input
              id="auc-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Reference, listing, agent, location…"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="auc-status">
              Status
            </label>
            <select
              id="auc-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
            >
              <option value="all">All</option>
              <option value="live">Live (active + paused)</option>
              <option value="post">Ended (needs settlement)</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Ended">Ended</option>
              <option value="Settled">Settled</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of {rows.length} auctions
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'Total', value: stats.total, c: 'text-slate-900' },
          { label: 'Live', value: stats.live, c: 'text-emerald-700' },
          { label: 'Scheduled', value: stats.scheduled, c: 'text-slate-600' },
          { label: 'Ended', value: stats.ended, c: 'text-sky-700' },
          { label: 'Settled', value: stats.settled, c: 'text-indigo-700' },
          { label: 'Cancelled', value: stats.cancelled, c: 'text-red-700' },
        ].map((x) => (
          <article key={x.label} className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{x.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${x.c}`}>{x.value}</p>
          </article>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 md:px-6">
          <h2 className="text-[15px] font-semibold text-slate-900">Live catalogue</h2>
          <p className="mt-0.5 text-sm text-slate-500">High bid, bidder counts, and close timers — drill into any row for reserve, increments, and bid tape.</p>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-700">No auctions match your filters</p>
            <button type="button" onClick={resetFilters} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1020px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 md:px-6">Reference</th>
                    <th className="px-5 py-3 md:px-6">Listing</th>
                    <th className="px-5 py-3 md:px-6">High bid</th>
                    <th className="px-5 py-3 md:px-6">Bidders</th>
                    <th className="px-5 py-3 md:px-6">Ends</th>
                    <th className="px-5 py-3 md:px-6">Agent</th>
                    <th className="px-5 py-3 md:px-6">Status</th>
                    <th className="px-5 py-3 text-right md:px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 md:px-6">
                        <p className="font-mono text-xs font-semibold text-slate-800">{r.reference}</p>
                        <p className="text-xs text-slate-400">{r.id}</p>
                      </td>
                      <td className="max-w-[200px] px-5 py-3.5 md:px-6">
                        <p className="truncate font-medium text-slate-900">{r.listing}</p>
                        <p className="truncate text-xs text-slate-500">{r.location}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-900 md:px-6">{r.bid}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 md:px-6">{r.bidders}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 md:px-6">{r.ends}</td>
                      <td className="max-w-[140px] truncate px-5 py-3.5 text-slate-700 md:px-6">{r.agent}</td>
                      <td className="px-5 py-3.5 md:px-6">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right md:px-6">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button type="button" onClick={() => openView(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50">
                            View
                          </button>
                          <button type="button" onClick={() => copyRef(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                            Copy ref
                          </button>
                          {r.status === 'Scheduled' ? (
                            <>
                              <button type="button" onClick={() => setConfirm({ type: 'goLive', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                                Go live
                              </button>
                              <button type="button" onClick={() => setConfirm({ type: 'cancel', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                                Cancel
                              </button>
                            </>
                          ) : null}
                          {r.status === 'Active' ? (
                            <>
                              <button type="button" onClick={() => pauseAuction(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-50">
                                Pause
                              </button>
                              <button type="button" onClick={() => extendWindow(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50">
                                +24h
                              </button>
                              <button type="button" onClick={() => setConfirm({ type: 'forceEnd', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                                End now
                              </button>
                              <button type="button" onClick={() => setConfirm({ type: 'cancel', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                                Cancel
                              </button>
                            </>
                          ) : null}
                          {r.status === 'Paused' ? (
                            <>
                              <button type="button" onClick={() => resumeAuction(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                                Resume
                              </button>
                              <button type="button" onClick={() => setConfirm({ type: 'forceEnd', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                                End now
                              </button>
                              <button type="button" onClick={() => setConfirm({ type: 'cancel', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                                Cancel
                              </button>
                            </>
                          ) : null}
                          {r.status === 'Ended' ? (
                            <button type="button" onClick={() => setConfirm({ type: 'settle', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
                              Settle
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500 md:px-6">
              <span>
                Page {page} of {totalPages} · {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <AdminModalShell
        size="xl"
        open={Boolean(viewRow)}
        onClose={() => setViewRow(null)}
        title="Auction detail"
        subtitle={viewRow ? `${viewRow.reference} · ${viewRow.listing}` : ''}
        footer={
          <button type="button" onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Close
          </button>
        }
      >
        {viewRow ? (
          <div className="space-y-8">
            <div>
              <SectionTitle>Overview</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Auction ID" value={viewRow.id} />
                <Field label="Reference" value={viewRow.reference} />
                <Field label="Status" value={viewRow.status} />
                <Field label="Listing ID" value={viewRow.listingId} />
                <Field label="Location" value={viewRow.location} />
                <Field label="Compliance" value={viewRow.compliance} />
              </div>
            </div>

            <div>
              <SectionTitle>Listing & agent</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Listing title" value={viewRow.listing} />
                <Field label="Agent" value={viewRow.agent} />
                <Field label="Agent ID" value={viewRow.agentId} />
              </div>
            </div>

            <div>
              <SectionTitle>Bidding rules</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Reserve" value={viewRow.reserve} />
                <Field label="Min increment" value={viewRow.increment} />
                <Field label="Extensions applied" value={String(viewRow.extensionCount ?? 0)} />
              </div>
            </div>

            <div>
              <SectionTitle>Market</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Current high bid" value={viewRow.bid} />
                <Field label="Registered bidders" value={viewRow.bidders} />
                <Field label="Leading bidder" value={viewRow.highBidder} />
                <Field label="Leader account ref" value={viewRow.highBidderId} />
                <Field label="Close display" value={viewRow.ends} />
                <Field label="Close (scheduled)" value={viewRow.endsAt} />
              </div>
            </div>

            <div>
              <SectionTitle>Timeline</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Opened / scheduled start" value={viewRow.startedAt} />
                <Field label="Settled at" value={viewRow.settledAt} />
                <Field label="Settlement ref" value={viewRow.settledRef} />
                <Field label="Declared winner" value={viewRow.winner} />
              </div>
            </div>

            {viewRow.bidTape && viewRow.bidTape !== '—' ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Bid tape (summary)</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{viewRow.bidTape}</p>
              </div>
            ) : null}

            {viewRow.notesInternal ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Internal notes</p>
                <p className="mt-1 text-sm text-amber-950/90">{viewRow.notesInternal}</p>
              </div>
            ) : null}

            {viewRow.status === 'Scheduled' ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setConfirm({ type: 'goLive', row: viewRow })} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                  Go live
                </button>
                <button type="button" onClick={() => setConfirm({ type: 'cancel', row: viewRow })} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100">
                  Cancel auction
                </button>
              </div>
            ) : null}
            {viewRow.status === 'Active' ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => pauseAuction(viewRow)} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100">
                  Pause
                </button>
                <button type="button" onClick={() => extendWindow(viewRow)} className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-900 hover:bg-sky-100">
                  Extend +24h
                </button>
                <button type="button" onClick={() => setConfirm({ type: 'forceEnd', row: viewRow })} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                  End now
                </button>
                <button type="button" onClick={() => setConfirm({ type: 'cancel', row: viewRow })} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100">
                  Cancel
                </button>
              </div>
            ) : null}
            {viewRow.status === 'Paused' ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => resumeAuction(viewRow)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                  Resume
                </button>
                <button type="button" onClick={() => setConfirm({ type: 'forceEnd', row: viewRow })} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                  End now
                </button>
                <button type="button" onClick={() => setConfirm({ type: 'cancel', row: viewRow })} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100">
                  Cancel
                </button>
              </div>
            ) : null}
            {viewRow.status === 'Ended' ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setConfirm({ type: 'settle', row: viewRow })} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                  Mark settled
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </AdminModalShell>

      <AdminModalShell
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={
          !confirm
            ? ''
            : confirm.type === 'goLive'
              ? 'Go live with this auction?'
              : confirm.type === 'cancel'
                ? 'Cancel this auction?'
                : confirm.type === 'forceEnd'
                  ? 'End auction now?'
                  : 'Mark as settled?'
        }
        subtitle={
          !confirm
            ? ''
            : confirm.type === 'goLive'
              ? `${confirm.row.reference} will become Active and accept bids (demo).`
              : confirm.type === 'cancel'
                ? `${confirm.row.reference} will be Cancelled; bidders notified in production.`
                : confirm.type === 'forceEnd'
                  ? `${confirm.row.reference} moves to Ended — verify reserve and winner logic.`
                  : `${confirm.row.reference} will be recorded as Settled with a settlement reference (demo).`
        }
        footer={
          <>
            <button type="button" onClick={() => setConfirm(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Back
            </button>
            <button
              type="button"
              onClick={applyConfirm}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                !confirm
                  ? 'bg-slate-400'
                  : confirm.type === 'cancel'
                    ? 'bg-red-600 hover:bg-red-500'
                    : confirm.type === 'settle'
                      ? 'bg-indigo-600 hover:bg-indigo-500'
                      : confirm.type === 'forceEnd'
                        ? 'bg-slate-800 hover:bg-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {!confirm ? 'OK' : confirm.type === 'goLive' ? 'Go live' : confirm.type === 'cancel' ? 'Cancel auction' : confirm.type === 'forceEnd' ? 'End now' : 'Confirm settle'}
            </button>
          </>
        }
      >
        {confirm ? (
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{confirm.row.listing}</span> · reserve <span className="font-semibold">{confirm.row.reserve}</span> · current bid{' '}
            <span className="font-semibold">{confirm.row.bid}</span>
          </p>
        ) : null}
      </AdminModalShell>
    </div>
  )
}
