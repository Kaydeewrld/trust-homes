import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { adminPromotions as adminPromotionsSeed } from '../../data/adminSeed'
import AdminModalShell from './AdminModalShell'

const PAGE_SIZE = 6

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function endDatePlusDays(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function StatusBadge({ status }) {
  const s = String(status || '')
  const map = {
    Active: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
    Paused: 'bg-slate-100 text-slate-700 ring-slate-200',
    Ended: 'bg-slate-100 text-slate-600 ring-slate-200',
    'Pending review': 'bg-amber-50 text-amber-900 ring-amber-100',
    Draft: 'bg-indigo-50 text-indigo-800 ring-indigo-100',
    Rejected: 'bg-red-50 text-red-800 ring-red-100',
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

export default function AdminPromotionsPage() {
  const toast = useToast()
  const [rows, setRows] = useState(() =>
    adminPromotionsSeed.map((r) => ({
      ...r,
      complianceFlags: [...(r.complianceFlags || [])],
    })),
  )
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [viewRow, setViewRow] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const ownerOptions = useMemo(() => {
    const s = new Set(rows.map((r) => r.owner).filter(Boolean))
    return Array.from(s).sort()
  }, [rows])

  const typeOptions = useMemo(() => {
    const s = new Set(rows.map((r) => r.promoType).filter(Boolean))
    return Array.from(s).sort()
  }, [rows])

  const stats = useMemo(() => {
    const total = rows.length
    const active = rows.filter((r) => r.status === 'Active').length
    const attention = rows.filter((r) => r.status === 'Paused' || r.status === 'Pending review' || r.status === 'Draft').length
    const closed = rows.filter((r) => r.status === 'Ended' || r.status === 'Rejected').length
    return { total, active, attention, closed }
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (typeFilter !== 'all' && r.promoType !== typeFilter) return false
      if (ownerFilter !== 'all' && r.owner !== ownerFilter) return false
      if (!q) return true
      const blob = [r.campaignName, r.listing, r.id, r.owner, r.ownerEmail, r.listingId, r.invoiceId].filter(Boolean).join(' ').toLowerCase()
      return blob.includes(q)
    })
  }, [rows, search, statusFilter, typeFilter, ownerFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, typeFilter, ownerFilter])

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setTypeFilter('all')
    setOwnerFilter('all')
    toast.info('Filters cleared', 'Showing all promotion campaigns.')
  }

  const exportRows = () => {
    toast.success('Export queued', `${filtered.length} campaign row(s) prepared (demo).`)
  }

  const copyId = (r) => {
    const text = r.id
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => toast.success('Copied', `${text} on clipboard.`),
        () => toast.info('Campaign ID', text),
      )
    } else {
      toast.info('Campaign ID', text)
    }
  }

  const applyConfirm = () => {
    if (!confirm) return
    const { type, row } = confirm
    const t = todayIso()
    if (type === 'pause') {
      setRows((prev) => prev.map((x) => (x.id === row.id ? { ...x, status: 'Paused' } : x)))
      toast.info('Campaign paused', `${row.campaignName || row.listing} is no longer spending.`)
    }
    if (type === 'resume') {
      setRows((prev) => prev.map((x) => (x.id === row.id ? { ...x, status: 'Active' } : x)))
      toast.success('Campaign resumed', `${row.campaignName || row.listing} is active again.`)
    }
    if (type === 'end') {
      setRows((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? {
                ...x,
                status: 'Ended',
                budgetRemaining: '₦0',
                budgetSpent: x.budget,
                endDate: t,
              }
            : x,
        ),
      )
      toast.success('Campaign ended', `${row.campaignName || row.listing} is closed (demo).`)
    }
    if (type === 'approve') {
      const end = endDatePlusDays(14)
      setRows((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? {
                ...x,
                status: 'Active',
                startDate: t,
                endDate: end,
                lastChargeAt: t,
                invoiceId: x.invoiceId === '—' ? `INV-${x.id}-GO` : x.invoiceId,
              }
            : x,
        ),
      )
      toast.success('Campaign approved', `${row.campaignName || row.listing} is now live and can spend.`)
    }
    if (type === 'reject') {
      setRows((prev) => prev.map((x) => (x.id === row.id ? { ...x, status: 'Rejected' } : x)))
      toast.success('Campaign rejected', `${row.campaignName || row.listing} will not run.`)
    }
    setConfirm(null)
    setViewRow((v) => {
      if (!v || v.id !== row.id) return v
      if (type === 'pause') return { ...v, status: 'Paused' }
      if (type === 'resume') return { ...v, status: 'Active' }
      if (type === 'end') return { ...v, status: 'Ended', budgetRemaining: '₦0', budgetSpent: v.budget, endDate: t }
      if (type === 'approve') return { ...v, status: 'Active', startDate: t, endDate: endDatePlusDays(14), lastChargeAt: t }
      if (type === 'reject') return { ...v, status: 'Rejected' }
      return v
    })
  }

  const submitDraft = (r) => {
    setRows((prev) =>
      prev.map((x) =>
        x.id === r.id
          ? {
              ...x,
              status: 'Pending review',
              complianceFlags: [...(x.complianceFlags || []).filter((f) => !String(f).includes('incomplete')), 'Submitted for admin review'],
            }
          : x,
      ),
    )
    toast.success('Submitted', `${r.campaignName || r.listing} is in the review queue.`)
    setViewRow((v) =>
      v?.id === r.id
        ? { ...v, status: 'Pending review', complianceFlags: ['Submitted for admin review'] }
        : v,
    )
  }

  const openView = (r) => {
    setConfirm(null)
    setViewRow(r)
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1760px] space-y-7 px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-6 lg:px-8 lg:py-8 xl:px-11 xl:py-9">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Promotions</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Paid boosts, featured slots, and performance campaigns tied to listings. Click <span className="font-semibold text-slate-700">View</span> for billing,
            delivery metrics, and compliance flags (demo).
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
            onClick={exportRows}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Export campaigns
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-violet-100 bg-violet-50/50 px-5 py-4">
        <p className="text-sm font-semibold text-violet-950">Billing & policy</p>
        <p className="mt-1 text-sm leading-relaxed text-violet-900/85">
          Wallet debits should reconcile to ledger transactions; rejected creatives must not serve. Production should enforce spend caps, fraud checks, and immutable audit trails for status changes.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm md:p-5">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="pr-search">
              Search
            </label>
            <input
              id="pr-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Campaign, listing, owner, invoice…"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="pr-status">
              Status
            </label>
            <select
              id="pr-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
            >
              <option value="all">All statuses</option>
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
              <option value="Ended">Ended</option>
              <option value="Pending review">Pending review</option>
              <option value="Draft">Draft</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="pr-type">
              Promo type
            </label>
            <select
              id="pr-type"
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
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="pr-owner">
              Owner (agent)
            </label>
            <select
              id="pr-owner"
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
            >
              <option value="all">All owners</option>
              {ownerOptions.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of {rows.length} campaigns
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total campaigns', value: stats.total, c: 'text-slate-900' },
          { label: 'Active (spending)', value: stats.active, c: 'text-emerald-700' },
          { label: 'Needs attention', value: stats.attention, c: 'text-amber-700' },
          { label: 'Closed / rejected', value: stats.closed, c: 'text-slate-600' },
        ].map((x) => (
          <article key={x.label} className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{x.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${x.c}`}>{x.value}</p>
          </article>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 md:px-6">
          <h2 className="text-[15px] font-semibold text-slate-900">Campaign queue</h2>
          <p className="mt-0.5 text-sm text-slate-500">Budgets, delivery, and moderation in one place.</p>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-700">No campaigns match your filters</p>
            <button type="button" onClick={resetFilters} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 md:px-6">Campaign</th>
                    <th className="px-5 py-3 md:px-6">Listing</th>
                    <th className="px-5 py-3 md:px-6">Owner</th>
                    <th className="px-5 py-3 md:px-6">Type</th>
                    <th className="px-5 py-3 md:px-6">Budget</th>
                    <th className="px-5 py-3 md:px-6">Spend / left</th>
                    <th className="px-5 py-3 md:px-6">Leads</th>
                    <th className="px-5 py-3 md:px-6">Status</th>
                    <th className="px-5 py-3 text-right md:px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="max-w-[200px] px-5 py-3.5 md:px-6">
                        <p className="line-clamp-2 font-medium text-slate-900">{r.campaignName || r.listing}</p>
                        <p className="text-xs text-slate-400">{r.id}</p>
                      </td>
                      <td className="max-w-[180px] px-5 py-3.5 md:px-6">
                        <p className="line-clamp-2 text-slate-700">{r.listing}</p>
                        <p className="text-xs text-slate-400">{r.listingId}</p>
                      </td>
                      <td className="max-w-[140px] truncate px-5 py-3.5 text-slate-600 md:px-6">{r.owner}</td>
                      <td className="px-5 py-3.5 text-slate-600 md:px-6">{r.promoType}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-800 md:px-6">{r.budget}</td>
                      <td className="min-w-[140px] px-5 py-3.5 text-xs text-slate-600 md:px-6">
                        <div>Spent: {r.budgetSpent}</div>
                        <div className="text-slate-500">Left: {r.budgetRemaining}</div>
                      </td>
                      <td className="px-5 py-3.5 tabular-nums font-medium text-slate-800 md:px-6">{r.leads}</td>
                      <td className="px-5 py-3.5 md:px-6">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right md:px-6">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button type="button" onClick={() => openView(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50">
                            View
                          </button>
                          <button type="button" onClick={() => copyId(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                            Copy ID
                          </button>
                          {r.status === 'Active' ? (
                            <>
                              <button type="button" onClick={() => setConfirm({ type: 'pause', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                                Pause
                              </button>
                              <button type="button" onClick={() => setConfirm({ type: 'end', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                                End
                              </button>
                            </>
                          ) : null}
                          {r.status === 'Paused' ? (
                            <>
                              <button type="button" onClick={() => setConfirm({ type: 'resume', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                                Resume
                              </button>
                              <button type="button" onClick={() => setConfirm({ type: 'end', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                                End
                              </button>
                            </>
                          ) : null}
                          {r.status === 'Pending review' ? (
                            <>
                              <button type="button" onClick={() => setConfirm({ type: 'approve', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                                Approve
                              </button>
                              <button type="button" onClick={() => setConfirm({ type: 'reject', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                                Reject
                              </button>
                            </>
                          ) : null}
                          {r.status === 'Draft' ? (
                            <button type="button" onClick={() => submitDraft(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
                              Submit review
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
        title="Campaign dossier"
        subtitle={viewRow ? `${viewRow.campaignName || viewRow.listing} · ${viewRow.id}` : ''}
        footer={
          <button type="button" onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Close
          </button>
        }
      >
        {viewRow ? (
          <div className="space-y-8">
            <div>
              <SectionTitle>Campaign & listing</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Campaign ID" value={viewRow.id} />
                <Field label="Campaign name" value={viewRow.campaignName} />
                <Field label="Status" value={viewRow.status} />
                <Field label="Promo type" value={viewRow.promoType} />
                <Field label="Listing title" value={viewRow.listing} />
                <Field label="Listing ID" value={viewRow.listingId} />
              </div>
            </div>

            <div>
              <SectionTitle>Owner & billing</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Owner (agent)" value={viewRow.owner} />
                <Field label="Owner account ID" value={viewRow.ownerAccountId} />
                <Field label="Billing email" value={viewRow.ownerEmail} />
                <Field label="Payment method" value={viewRow.paymentMethod} />
                <Field label="Invoice" value={viewRow.invoiceId} />
                <Field label="Last charge" value={viewRow.lastChargeAt} />
              </div>
            </div>

            <div>
              <SectionTitle>Budget & schedule</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Total budget" value={viewRow.budget} />
                <Field label="Spent" value={viewRow.budgetSpent} />
                <Field label="Remaining" value={viewRow.budgetRemaining} />
                <Field label="Planned duration" value={viewRow.duration} />
                <Field label="Start date" value={viewRow.startDate} />
                <Field label="End date" value={viewRow.endDate} />
              </div>
            </div>

            <div>
              <SectionTitle>Delivery & performance</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Leads (window)" value={viewRow.leads} />
                <Field label="Clicks" value={viewRow.clicks} />
                <Field label="Impressions" value={viewRow.impressions} />
                <Field label="CTR" value={viewRow.ctr} />
                <Field label="Geo target" value={viewRow.geoTarget} />
                <Field label="Bid / pacing strategy" value={viewRow.bidStrategy} />
              </div>
            </div>

            <div>
              <SectionTitle>Compliance & policy flags</SectionTitle>
              <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                {(viewRow.complianceFlags || []).length === 0 ? <li className="text-slate-500">No flags.</li> : null}
                {(viewRow.complianceFlags || []).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>

            {viewRow.internalNotes ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Internal notes</p>
                <p className="mt-1 text-sm text-amber-950/90">{viewRow.internalNotes}</p>
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
            : confirm.type === 'pause'
              ? 'Pause campaign?'
              : confirm.type === 'resume'
                ? 'Resume campaign?'
                : confirm.type === 'end'
                  ? 'End campaign permanently?'
                  : confirm.type === 'approve'
                    ? 'Approve campaign?'
                    : 'Reject campaign?'
        }
        subtitle={
          !confirm
            ? ''
            : confirm.type === 'pause'
              ? `${confirm.row.campaignName || confirm.row.listing} will stop spending immediately.`
              : confirm.type === 'resume'
                ? `${confirm.row.campaignName || confirm.row.listing} will resume delivery.`
                : confirm.type === 'end'
                  ? `${confirm.row.campaignName || confirm.row.listing} will move to Ended and release reserved budget (demo).`
                  : confirm.type === 'approve'
                    ? `${confirm.row.campaignName || confirm.row.listing} will go live with a 14-day window from today (demo).`
                    : `${confirm.row.campaignName || confirm.row.listing} will not be allowed to run.`
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
                !confirm ? 'bg-slate-400' : confirm.type === 'reject' || confirm.type === 'end' ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {!confirm
                ? 'OK'
                : confirm.type === 'pause'
                  ? 'Pause'
                  : confirm.type === 'resume'
                    ? 'Resume'
                    : confirm.type === 'end'
                      ? 'End campaign'
                      : confirm.type === 'approve'
                        ? 'Approve'
                        : 'Reject'}
            </button>
          </>
        }
      >
        {confirm ? (
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{confirm.row.id}</span> — tied to listing{' '}
            <span className="font-semibold text-slate-800">{confirm.row.listingId}</span>.
          </p>
        ) : null}
      </AdminModalShell>
    </div>
  )
}
