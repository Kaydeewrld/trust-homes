import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { adminTransactions as adminTransactionsSeed } from '../../data/adminSeed'
import AdminModalShell from './AdminModalShell'

const PAGE_SIZE = 6

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function nowWat() {
  const d = new Date()
  return `${d.toISOString().slice(0, 10)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WAT`
}

function StatusBadge({ status }) {
  const s = String(status || '')
  const map = {
    Completed: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
    Pending: 'bg-amber-50 text-amber-900 ring-amber-100',
    Processing: 'bg-sky-50 text-sky-800 ring-sky-100',
    Failed: 'bg-red-50 text-red-800 ring-red-100',
    Refunded: 'bg-violet-50 text-violet-800 ring-violet-100',
    Disputed: 'bg-orange-50 text-orange-900 ring-orange-200',
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

export default function AdminTransactionsPage() {
  const toast = useToast()
  const [rows, setRows] = useState(() => adminTransactionsSeed.map((r) => ({ ...r })))
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [reconFilter, setReconFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [viewRow, setViewRow] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const typeOptions = useMemo(() => {
    const s = new Set(rows.map((r) => r.type).filter(Boolean))
    return Array.from(s).sort()
  }, [rows])

  const stats = useMemo(() => {
    const total = rows.length
    const completed = rows.filter((r) => r.status === 'Completed').length
    const open = rows.filter((r) => r.status === 'Pending' || r.status === 'Processing' || r.status === 'Disputed').length
    const failed = rows.filter((r) => r.status === 'Failed' || r.status === 'Refunded').length
    return { total, completed, open, failed }
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (typeFilter !== 'all' && r.type !== typeFilter) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (reconFilter === 'yes' && r.reconciled !== 'Yes') return false
      if (reconFilter === 'no' && r.reconciled !== 'No') return false
      if (!q) return true
      const blob = [r.id, r.reference, r.party, r.partyEmail, r.counterparty, r.gatewayRef, r.listingRef].filter(Boolean).join(' ').toLowerCase()
      return blob.includes(q)
    })
  }, [rows, search, typeFilter, statusFilter, reconFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  useEffect(() => {
    setPage(1)
  }, [search, typeFilter, statusFilter, reconFilter])

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const resetFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setStatusFilter('all')
    setReconFilter('all')
    toast.info('Filters cleared', 'Showing the full ledger.')
  }

  const exportLedger = () => {
    toast.success('Export queued', `${filtered.length} transaction row(s) prepared (demo).`)
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

  const markReconciled = (r) => {
    setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, reconciled: 'Yes' } : x)))
    toast.success('Reconciled', `${r.reference || r.id} marked as matched in demo ledger.`)
    setViewRow((v) => (v?.id === r.id ? { ...v, reconciled: 'Yes' } : v))
  }

  const applyConfirm = () => {
    if (!confirm) return
    const { type, row } = confirm
    const t = todayIso()
    const w = nowWat()
    if (type === 'complete') {
      setRows((prev) =>
        prev.map((x) =>
          x.id === row.id ? { ...x, status: 'Completed', settledAt: w, date: t, reconciled: 'Yes', disputeOpened: false } : x,
        ),
      )
      toast.success('Settled', `${row.reference || row.id} is now Completed.`)
    }
    if (type === 'fail') {
      setRows((prev) => prev.map((x) => (x.id === row.id ? { ...x, status: 'Failed', settledAt: '—', reconciled: 'No' } : x)))
      toast.warning('Marked failed', `${row.reference || row.id} will not settle without manual review.`)
    }
    if (type === 'resolveDispute') {
      setRows((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? { ...x, status: 'Completed', disputeOpened: false, settledAt: w, reconciled: 'Yes', notesInternal: x.notesInternal || 'Dispute resolved — funds released (demo).' }
            : x,
        ),
      )
      toast.success('Dispute resolved', `${row.reference || row.id} closed in favour of settlement (demo).`)
    }
    setConfirm(null)
    setViewRow((v) => {
      if (!v || v.id !== row.id) return v
      if (type === 'complete') return { ...v, status: 'Completed', settledAt: w, date: t, reconciled: 'Yes', disputeOpened: false }
      if (type === 'fail') return { ...v, status: 'Failed', settledAt: '—', reconciled: 'No' }
      if (type === 'resolveDispute')
        return { ...v, status: 'Completed', disputeOpened: false, settledAt: w, reconciled: 'Yes' }
      return v
    })
  }

  const openView = (r) => {
    setConfirm(null)
    setViewRow(r)
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1760px] space-y-7 px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-6 lg:px-8 lg:py-8 xl:px-11 xl:py-9">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Transactions</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Ledger of payments, escrow releases, fees, and refunds. Click <span className="font-semibold text-slate-700">View</span> for gateway references,
            idempotency keys, and risk metadata (demo — connect your PSP webhooks for live data).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resetFilters}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Clear filters
          </button>
          <button
            type="button"
            onClick={exportLedger}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Export ledger
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-5 py-4">
        <p className="text-sm font-semibold text-emerald-950">Reconciliation</p>
        <p className="mt-1 text-sm leading-relaxed text-emerald-900/85">
          Never mutate settled amounts in production without compensating entries. Use PSP settlement files to mark reconciled; disputed rows should freeze payout until case is closed.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm md:p-5">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="tx-search">
              Search
            </label>
            <input
              id="tx-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ID, reference, party, gateway, listing…"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="tx-type">
              Type
            </label>
            <select
              id="tx-type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
            >
              <option value="all">All types</option>
              {typeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="tx-status">
              Status
            </label>
            <select
              id="tx-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
            >
              <option value="all">All statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Failed">Failed</option>
              <option value="Refunded">Refunded</option>
              <option value="Disputed">Disputed</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="tx-recon">
              Reconciliation
            </label>
            <select
              id="tx-recon"
              value={reconFilter}
              onChange={(e) => setReconFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
            >
              <option value="all">All</option>
              <option value="yes">Reconciled</option>
              <option value="no">Unreconciled</option>
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of {rows.length} rows
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Ledger rows', value: stats.total, c: 'text-slate-900' },
          { label: 'Completed', value: stats.completed, c: 'text-emerald-700' },
          { label: 'Open pipeline', value: stats.open, c: 'text-amber-700' },
          { label: 'Failed / refunded', value: stats.failed, c: 'text-slate-600' },
        ].map((x) => (
          <article key={x.label} className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{x.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${x.c}`}>{x.value}</p>
          </article>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 md:px-6">
          <h2 className="text-[15px] font-semibold text-slate-900">Ledger</h2>
          <p className="mt-0.5 text-sm text-slate-500">Gross amounts, platform fee (10% where applicable), and net movement.</p>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-700">No transactions match your filters</p>
            <button type="button" onClick={resetFilters} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 md:px-6">Reference</th>
                    <th className="px-5 py-3 md:px-6">Type</th>
                    <th className="px-5 py-3 md:px-6">Party</th>
                    <th className="px-5 py-3 md:px-6">Total</th>
                    <th className="px-5 py-3 md:px-6">Fee</th>
                    <th className="px-5 py-3 md:px-6">Net</th>
                    <th className="px-5 py-3 md:px-6">Status</th>
                    <th className="px-5 py-3 md:px-6">Date</th>
                    <th className="px-5 py-3 md:px-6">Recon</th>
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
                      <td className="max-w-[140px] px-5 py-3.5 text-slate-700 md:px-6">{r.type}</td>
                      <td className="max-w-[160px] truncate px-5 py-3.5 text-slate-700 md:px-6">{r.party}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-900 md:px-6">{r.total}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 md:px-6">{r.fee}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-medium text-slate-800 md:px-6">{r.net}</td>
                      <td className="px-5 py-3.5 md:px-6">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 md:px-6">{r.date}</td>
                      <td className="px-5 py-3.5 md:px-6">
                        <span className={`text-xs font-semibold ${r.reconciled === 'Yes' ? 'text-emerald-700' : 'text-amber-700'}`}>{r.reconciled}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right md:px-6">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button type="button" onClick={() => openView(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50">
                            View
                          </button>
                          <button type="button" onClick={() => copyRef(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                            Copy ref
                          </button>
                          {r.status === 'Pending' || r.status === 'Processing' ? (
                            <>
                              <button type="button" onClick={() => setConfirm({ type: 'complete', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                                Settle
                              </button>
                              <button type="button" onClick={() => setConfirm({ type: 'fail', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                                Fail
                              </button>
                            </>
                          ) : null}
                          {r.status === 'Disputed' ? (
                            <button type="button" onClick={() => setConfirm({ type: 'resolveDispute', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
                              Resolve
                            </button>
                          ) : null}
                          {r.reconciled === 'No' && r.status === 'Completed' ? (
                            <button type="button" onClick={() => markReconciled(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                              Mark recon
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
        title="Transaction detail"
        subtitle={viewRow ? `${viewRow.reference} · ${viewRow.id}` : ''}
        footer={
          <button type="button" onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Close
          </button>
        }
      >
        {viewRow ? (
          <div className="space-y-8">
            <div>
              <SectionTitle>Identifiers & type</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Internal ID" value={viewRow.id} />
                <Field label="Public reference" value={viewRow.reference} />
                <Field label="Transaction type" value={viewRow.type} />
                <Field label="Status" value={viewRow.status} />
                <Field label="Ledger date" value={viewRow.date} />
                <Field label="Listing ref" value={viewRow.listingRef} />
              </div>
            </div>

            <div>
              <SectionTitle>Parties</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Payer / user" value={viewRow.party} />
                <Field label="Email" value={viewRow.partyEmail} />
                <Field label="User / account ID" value={viewRow.partyUserId} />
                <Field label="Counterparty" value={viewRow.counterparty} />
                <Field label="Counterparty ID" value={viewRow.counterpartyId} />
              </div>
            </div>

            <div>
              <SectionTitle>Amounts</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Gross (total)" value={viewRow.total} />
                <Field label="Platform fee" value={viewRow.fee} />
                <Field label="Fee %" value={viewRow.feePercent} />
                <Field label="Net movement" value={viewRow.net} />
              </div>
            </div>

            <div>
              <SectionTitle>Payment rail & timing</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Payment method" value={viewRow.paymentMethod} />
                <Field label="Gateway reference" value={viewRow.gatewayRef} />
                <Field label="Idempotency key" value={viewRow.idempotencyKey} />
                <Field label="Initiated" value={viewRow.initiatedAt} />
                <Field label="Settled" value={viewRow.settledAt} />
              </div>
            </div>

            <div>
              <SectionTitle>Risk & reconciliation</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Risk score" value={viewRow.riskScore} />
                <Field label="IP country" value={viewRow.ipCountry} />
                <Field label="Reconciled" value={viewRow.reconciled} />
                <Field label="Dispute opened" value={viewRow.disputeOpened ? 'Yes' : 'No'} />
              </div>
            </div>

            {viewRow.notesInternal ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Internal notes</p>
                <p className="mt-1 text-sm text-amber-950/90">{viewRow.notesInternal}</p>
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
            : confirm.type === 'complete'
              ? 'Mark as settled?'
              : confirm.type === 'fail'
                ? 'Mark as failed?'
                : 'Resolve dispute?'
        }
        subtitle={
          !confirm
            ? ''
            : confirm.type === 'complete'
              ? `${confirm.row.reference} will become Completed and reconciled (demo).`
              : confirm.type === 'fail'
                ? `${confirm.row.reference} will be marked Failed; no funds movement (demo).`
                : `${confirm.row.reference} dispute will close and funds treatment follows policy (demo).`
        }
        footer={
          <>
            <button type="button" onClick={() => setConfirm(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="button"
              onClick={applyConfirm}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                !confirm ? 'bg-slate-400' : confirm.type === 'fail' ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {!confirm ? 'OK' : confirm.type === 'complete' ? 'Confirm settle' : confirm.type === 'fail' ? 'Confirm fail' : 'Resolve'}
            </button>
          </>
        }
      >
        {confirm ? (
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{confirm.row.id}</span> — gross <span className="font-semibold">{confirm.row.total}</span>, fee{' '}
            <span className="font-semibold">{confirm.row.fee}</span>, net <span className="font-semibold">{confirm.row.net}</span>.
          </p>
        ) : null}
      </AdminModalShell>
    </div>
  )
}
