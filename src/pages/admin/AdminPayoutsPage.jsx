import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { adminPayouts as adminPayoutsSeed } from '../../data/adminSeed'
import AdminModalShell from './AdminModalShell'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { adminPendingPayouts, adminWalletPayoutModerate, adminWalletPayoutsList } from '../../lib/api'

const PAGE_SIZE = 6

function nowWat() {
  const d = new Date()
  return `${d.toISOString().slice(0, 10)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WAT`
}

function nipRef() {
  const n = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `NIP-OK-${n}`
}

function StatusBadge({ status }) {
  const s = String(status || '')
  const map = {
    Paid: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
    Pending: 'bg-amber-50 text-amber-900 ring-amber-100',
    Processing: 'bg-sky-50 text-sky-800 ring-sky-100',
    Failed: 'bg-red-50 text-red-800 ring-red-100',
    'On hold': 'bg-violet-50 text-violet-800 ring-violet-100',
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

function isQueueStatus(s) {
  return s === 'Pending' || s === 'Processing'
}

export default function AdminPayoutsPage() {
  const toast = useToast()
  const { adminToken } = useAdminAuth()
  const [walletQueueRows, setWalletQueueRows] = useState([])
  const [liveRows, setLiveRows] = useState([])
  const [rows, setRows] = useState(() => adminPayoutsSeed.map((r) => ({ ...r })))
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [viewRow, setViewRow] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [refreshTick, setRefreshTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    if (!adminToken) return
    const fmtMoney = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`
    ;(async () => {
      const [listingRes, walletRes] = await Promise.allSettled([
        adminPendingPayouts(adminToken, { take: 200 }),
        adminWalletPayoutsList(adminToken, { status: 'PENDING', take: 200 }),
      ])

      if (listingRes.status === 'rejected') {
        if (!cancelled) toast.error('Listing payouts queue', listingRes.reason?.message || 'Could not load.')
      }
      if (walletRes.status === 'rejected') {
        if (!cancelled) toast.error('Wallet withdrawals', walletRes.reason?.message || 'Could not load wallet payout requests.')
      }

      const out = listingRes.status === 'fulfilled' ? listingRes.value : { payouts: [] }
      const wpOut = walletRes.status === 'fulfilled' ? walletRes.value : { payouts: [] }

      try {
        const mapped = Array.isArray(out?.payouts)
          ? out.payouts.map((p) => ({
              id: String(p.id),
              reference: String(p.reference || ''),
              agent: String(p.agentName || 'Agent'),
              agentEmail: String(p.agentEmail || ''),
              agentId: String(p.agentUserId || ''),
              requested: fmtMoney(p.grossAmountNgn),
              netToAgent: fmtMoney(p.netAmountNgn),
              feesDeducted: fmtMoney(p.platformFeeNgn),
              wallet: '—',
              bankName: 'Pending bank',
              accountMasked: '****',
              status: 'Pending',
              requestedAt: p.createdAt ? new Date(p.createdAt).toLocaleString('en-NG') : '—',
              history: String(p.listingTitle || 'Property payment'),
              processedAt: '—',
              paidAt: '—',
              batchRef: '—',
              approver: '—',
              riskScore: 'Low',
              flags: 'Auto-generated',
              method: 'Bank transfer',
              accountName: '—',
              sortCode: '—',
              notesInternal: `Listing ${p.listingId || '—'} payout pending platform settlement.`,
            }))
          : []
        const wpMapped = Array.isArray(wpOut?.payouts)
          ? wpOut.payouts.map((p) => ({
              rowKind: 'wallet',
              id: `wallet:${p.id}`,
              walletPayoutId: p.id,
              reference: `WP-${String(p.id).slice(0, 8)}`,
              agent: String(p.agentName || 'User'),
              agentEmail: String(p.agentEmail || ''),
              agentId: String(p.userId || ''),
              requested: fmtMoney(p.amountNgn),
              netToAgent: fmtMoney(p.netNgn),
              feesDeducted: fmtMoney(p.feeNgn),
              wallet: 'Withdrawal',
              bankName: String(p.bankName || ''),
              accountMasked: p.accountNumber
                ? `····${String(p.accountNumber).replace(/\D/g, '').slice(-4)}`
                : '····',
              status: 'Pending',
              requestedAt: p.createdAt ? new Date(p.createdAt).toLocaleString('en-NG') : '—',
              history: 'Wallet withdrawal',
              processedAt: '—',
              paidAt: '—',
              batchRef: '—',
              approver: '—',
              riskScore: 'Low',
              flags: 'Wallet',
              method: 'Bank transfer',
              accountName: String(p.accountName || ''),
              sortCode: '—',
              notesInternal: 'User-requested wallet payout; debits wallet when approved.',
            }))
          : []
        if (!cancelled) {
          setLiveRows(mapped)
          setWalletQueueRows(wpMapped)
        }
      } catch (err) {
        if (!cancelled) toast.error('Could not process payout data', err?.message || 'Unexpected error.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [adminToken, toast, refreshTick])

  useEffect(() => {
    const merged = [...walletQueueRows, ...liveRows, ...adminPayoutsSeed.map((r) => ({ ...r }))]
    const seen = new Set()
    setRows(
      merged.filter((row) => {
        const key = String(row.id || row.reference || '')
        if (!key || seen.has(key)) return false
        seen.add(key)
        return true
      }),
    )
  }, [liveRows, walletQueueRows])

  const stats = useMemo(() => {
    const total = rows.length
    const queue = rows.filter((r) => isQueueStatus(r.status)).length
    const paid = rows.filter((r) => r.status === 'Paid').length
    const blocked = rows.filter((r) => r.status === 'Failed' || r.status === 'On hold').length
    return { total, queue, paid, blocked }
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter === 'queue' && !isQueueStatus(r.status)) return false
      if (statusFilter !== 'all' && statusFilter !== 'queue' && r.status !== statusFilter) return false
      if (!q) return true
      const blob = [r.id, r.reference, r.agent, r.agentEmail, r.agentId, r.bankName, r.batchRef, r.accountMasked].filter(Boolean).join(' ').toLowerCase()
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
    toast.info('Filters cleared', 'Showing all payout batches.')
  }

  const exportQueue = () => {
    toast.success('Export queued', `${filtered.length} payout row(s) prepared (demo).`)
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

  const applyConfirm = async () => {
    if (!confirm) return
    const { type, row } = confirm
    const w = nowWat()
    const adminEmail = typeof localStorage !== 'undefined' ? localStorage.getItem('th_admin_email') || 'ops@trustedhome.com' : 'ops@trustedhome.com'

    if (row.rowKind === 'wallet' && adminToken) {
      try {
        if (type === 'process') {
          await adminWalletPayoutModerate(adminToken, row.walletPayoutId, { decision: 'approve' })
          toast.success('Withdrawal approved', 'Wallet balance was debited for this request.')
        } else if (type === 'hold' || type === 'fail') {
          await adminWalletPayoutModerate(adminToken, row.walletPayoutId, {
            decision: 'reject',
            note: type === 'hold' ? 'Rejected — placed on hold' : 'Rejected',
          })
          toast.info('Withdrawal rejected', 'No debit was made; user keeps wallet balance.')
        }
        setRows((prev) =>
          prev.map((x) =>
            x.id === row.id
              ? {
                  ...x,
                  status: type === 'process' ? 'Paid' : 'Failed',
                  processedAt: x.processedAt === '—' ? w : x.processedAt,
                  paidAt: type === 'process' ? w : '—',
                  batchRef: type === 'process' ? 'wallet-debit' : x.batchRef,
                  approver: adminEmail,
                }
              : x,
          ),
        )
      } catch (err) {
        toast.error('Could not update withdrawal', err?.message || 'Request failed.')
      }
      setConfirm(null)
      return
    }

    if (type === 'process') {
      const batch = nipRef()
      setRows((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? {
                ...x,
                status: 'Paid',
                processedAt: x.processedAt === '—' ? w : x.processedAt,
                paidAt: w,
                batchRef: batch,
                approver: adminEmail,
              }
            : x,
        ),
      )
      toast.success('Payout marked paid', `${row.reference} settled in demo ledger (batch ${batch}).`)
    }
    if (type === 'hold') {
      setRows((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? {
                ...x,
                status: 'On hold',
                notesInternal: x.notesInternal || 'Placed on hold by finance (demo).',
              }
            : x,
        ),
      )
      toast.warning('On hold', `${row.reference} will not pay out until released.`)
    }
    if (type === 'release') {
      setRows((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? {
                ...x,
                status: 'Pending',
                notesInternal: x.notesInternal ? `${x.notesInternal} Released back to queue (demo).` : 'Released back to queue (demo).',
              }
            : x,
        ),
      )
      toast.success('Released', `${row.reference} is back in the pending queue.`)
    }
    if (type === 'fail') {
      setRows((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? {
                ...x,
                status: 'Failed',
                paidAt: '—',
                batchRef: `NIP-ERR-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
                notesInternal: x.notesInternal || 'Marked failed after bank timeout (demo).',
              }
            : x,
        ),
      )
      toast.error('Marked failed', `${row.reference} — agent should verify bank details.`)
    }

    setConfirm(null)
  }

  const openView = (r) => {
    setConfirm(null)
    setViewRow(r)
  }

  /** Keep detail modal in sync after process — batch ref from state */
  useEffect(() => {
    if (!viewRow) return
    const fresh = rows.find((x) => x.id === viewRow.id)
    if (fresh) setViewRow(fresh)
  }, [rows, viewRow?.id])

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1760px] space-y-7 px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-6 lg:px-8 lg:py-8 xl:px-11 xl:py-9">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Payouts</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Review <span className="font-semibold text-slate-700">user wallet withdrawal requests</span> (bank payout from wallet balance), listing settlement payouts, and demo seed rows.
            Approve wallet withdrawals to debit the user wallet in one step.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setRefreshTick((t) => t + 1)}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Refresh data
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('queue')}
            className="h-10 rounded-lg border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-950 shadow-sm hover:bg-amber-100"
          >
            Open queue only
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
            onClick={exportQueue}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Export
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-5 py-4">
        <p className="text-sm font-semibold text-indigo-950">Operations note</p>
        <p className="mt-1 text-sm leading-relaxed text-indigo-900/85">
          In production, payouts should require finance role, two-person approval above a threshold, and immutable audit logs. Never expose full account numbers in the browser; use
          tokenized bank refs and server-side NIBSS initiation.
        </p>
      </section>

      <section className="rounded-xl border border-emerald-200/80 bg-emerald-50/35 px-5 py-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-emerald-950">User wallet withdrawals (pending)</h2>
            <p className="mt-1 max-w-3xl text-sm text-emerald-900/85">
              These are payout requests from the <span className="font-medium">wallet balance</span> (home or agent “Request payout”). They also appear in the settlement table below with a
              <span className="font-medium"> Withdrawal </span>
              wallet label.
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200/80">
            {walletQueueRows.length} pending
          </span>
        </div>
        {walletQueueRows.length === 0 ? (
          <p className="mt-3 text-sm text-emerald-900/75">
            No pending wallet payout requests. Submit one from the app while logged in (wallet modal or agent earnings), then click <span className="font-semibold">Refresh data</span>.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-emerald-100/90 bg-white">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/90">
                  <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">Reference</th>
                  <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">User</th>
                  <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">Amount</th>
                  <th className="px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">Bank</th>
                  <th className="px-4 py-2.5 text-right text-xs font-bold uppercase tracking-wide text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {walletQueueRows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 font-mono text-xs font-semibold text-slate-800">{r.reference}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-slate-900">{r.agent}</p>
                      <p className="text-xs text-slate-500">{r.agentEmail}</p>
                    </td>
                    <td className="px-4 py-2.5 font-semibold tabular-nums text-slate-900">{r.requested}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-600">
                      <p className="font-medium">{r.bankName}</p>
                      <p className="font-mono text-slate-500">{r.accountMasked}</p>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button type="button" onClick={() => openView(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm md:p-5">
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="py-search">
              Search
            </label>
            <input
              id="py-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Reference, agent, bank, batch…"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="py-status">
              Status
            </label>
            <select
              id="py-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
            >
              <option value="all">All</option>
              <option value="queue">Pending + processing</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Paid">Paid</option>
              <option value="On hold">On hold</option>
              <option value="Failed">Failed</option>
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of {rows.length} batches
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'All batches', value: stats.total, c: 'text-slate-900' },
          { label: 'In queue', value: stats.queue, c: 'text-amber-700' },
          { label: 'Paid (history)', value: stats.paid, c: 'text-emerald-700' },
          { label: 'Failed / on hold', value: stats.blocked, c: 'text-slate-600' },
        ].map((x) => (
          <article key={x.label} className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{x.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${x.c}`}>{x.value}</p>
          </article>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 md:px-6">
          <h2 className="text-[15px] font-semibold text-slate-900">Settlement queue</h2>
          <p className="mt-0.5 text-sm text-slate-500">Pending and in-flight batches at the top of your workflow; paid rows remain for reconciliation.</p>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-700">No payouts match your filters</p>
            <button type="button" onClick={resetFilters} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 md:px-6">Reference</th>
                    <th className="px-5 py-3 md:px-6">Agent</th>
                    <th className="px-5 py-3 md:px-6">Amount</th>
                    <th className="px-5 py-3 md:px-6">Wallet</th>
                    <th className="px-5 py-3 md:px-6">Destination</th>
                    <th className="px-5 py-3 md:px-6">Status</th>
                    <th className="px-5 py-3 md:px-6">Requested</th>
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
                      <td className="max-w-[160px] px-5 py-3.5 md:px-6">
                        <p className="truncate font-medium text-slate-900">{r.agent}</p>
                        <p className="truncate text-xs text-slate-500">{r.agentId}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-900 md:px-6">{r.requested}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 md:px-6">{r.wallet}</td>
                      <td className="max-w-[140px] px-5 py-3.5 text-slate-600 md:px-6">
                        <p className="truncate text-xs">{r.bankName}</p>
                        <p className="font-mono text-xs text-slate-500">{r.accountMasked}</p>
                      </td>
                      <td className="px-5 py-3.5 md:px-6">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 md:px-6">{r.requestedAt?.split(' ')[0] ?? '—'}</td>
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
                              <button type="button" onClick={() => setConfirm({ type: 'process', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                                Process
                              </button>
                              {r.rowKind === 'wallet' ? (
                                <button type="button" onClick={() => setConfirm({ type: 'fail', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                                  Reject
                                </button>
                              ) : r.status === 'Pending' ? (
                                <button type="button" onClick={() => setConfirm({ type: 'hold', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-50">
                                  Hold
                                </button>
                              ) : (
                                <button type="button" onClick={() => setConfirm({ type: 'fail', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                                  Fail
                                </button>
                              )}
                            </>
                          ) : null}
                          {r.status === 'On hold' ? (
                            <button type="button" onClick={() => setConfirm({ type: 'release', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
                              Release
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
        title="Payout detail"
        subtitle={viewRow ? `${viewRow.reference} · ${viewRow.agent}` : ''}
        footer={
          <button type="button" onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Close
          </button>
        }
      >
        {viewRow ? (
          <div className="space-y-8">
            <div>
              <SectionTitle>Request</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Payout ID" value={viewRow.id} />
                <Field label="Reference" value={viewRow.reference} />
                <Field label="Status" value={viewRow.status} />
                <Field label="Amount requested" value={viewRow.requested} />
                <Field label="Net to agent" value={viewRow.netToAgent} />
                <Field label="Fees deducted" value={viewRow.feesDeducted} />
                <Field label="Wallet snapshot" value={viewRow.wallet} />
                <Field label="History" value={viewRow.history} />
                <Field label="Requested at" value={viewRow.requestedAt} />
              </div>
            </div>

            <div>
              <SectionTitle>Beneficiary</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Agent" value={viewRow.agent} />
                <Field label="Agent ID" value={viewRow.agentId} />
                <Field label="Email" value={viewRow.agentEmail} />
                <Field label="Method" value={viewRow.method} />
                <Field label="Bank" value={viewRow.bankName} />
                <Field label="Account (masked)" value={viewRow.accountMasked} />
                <Field label="Account name" value={viewRow.accountName} />
                <Field label="Sort code" value={viewRow.sortCode} />
              </div>
            </div>

            <div>
              <SectionTitle>Settlement & audit</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Processed at" value={viewRow.processedAt} />
                <Field label="Paid at" value={viewRow.paidAt} />
                <Field label="Batch / NIP ref" value={viewRow.batchRef} />
                <Field label="Approver" value={viewRow.approver} />
                <Field label="Risk score" value={viewRow.riskScore} />
                <Field label="Flags" value={viewRow.flags} />
              </div>
            </div>

            {viewRow.notesInternal ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Internal notes</p>
                <p className="mt-1 text-sm text-amber-950/90">{viewRow.notesInternal}</p>
              </div>
            ) : null}

            {viewRow.status === 'Pending' || viewRow.status === 'Processing' ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setConfirm({ type: 'process', row: viewRow })} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                  {viewRow.rowKind === 'wallet' ? 'Approve & debit wallet' : 'Process payout'}
                </button>
                {viewRow.rowKind === 'wallet' ? (
                  <button type="button" onClick={() => setConfirm({ type: 'fail', row: viewRow })} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100">
                    Reject withdrawal
                  </button>
                ) : viewRow.status === 'Pending' ? (
                  <button type="button" onClick={() => setConfirm({ type: 'hold', row: viewRow })} className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-900 hover:bg-violet-100">
                    Place on hold
                  </button>
                ) : (
                  <button type="button" onClick={() => setConfirm({ type: 'fail', row: viewRow })} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100">
                    Mark failed
                  </button>
                )}
              </div>
            ) : null}
            {viewRow.status === 'On hold' ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setConfirm({ type: 'release', row: viewRow })} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                  Release to queue
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
            : confirm.type === 'process'
              ? 'Confirm payout?'
              : confirm.type === 'hold'
                ? 'Place on hold?'
                : confirm.type === 'release'
                  ? 'Release to queue?'
                  : 'Mark as failed?'
        }
        subtitle={
          !confirm
            ? ''
            : confirm.type === 'process'
              ? confirm.row.rowKind === 'wallet'
                ? `${confirm.row.reference} — approving debits the user's wallet by ${confirm.row.requested} for settlement (staff completes bank transfer).`
                : `${confirm.row.reference} — ${confirm.row.requested} will be marked Paid with a new NIP reference (demo).`
              : confirm.type === 'hold'
                ? `${confirm.row.reference} will not be paid until released.`
                : confirm.type === 'release'
                  ? `${confirm.row.reference} returns to Pending for re-review.`
                  : `${confirm.row.reference} will be marked Failed; no funds are sent (demo).`
        }
        footer={
          <>
            <button type="button" onClick={() => setConfirm(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void applyConfirm()}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                !confirm ? 'bg-slate-400' : confirm.type === 'hold' ? 'bg-violet-600 hover:bg-violet-500' : confirm.type === 'fail' ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {!confirm ? 'OK' : confirm.type === 'process' ? 'Mark paid' : confirm.type === 'hold' ? 'Confirm hold' : confirm.type === 'release' ? 'Release' : 'Confirm fail'}
            </button>
          </>
        }
      >
        {confirm ? (
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{confirm.row.agent}</span> · {confirm.row.bankName} {confirm.row.accountMasked}
          </p>
        ) : null}
      </AdminModalShell>
    </div>
  )
}
