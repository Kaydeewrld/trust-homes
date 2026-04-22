import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { adminLoans as adminLoansSeed } from '../../data/adminSeed'
import AdminModalShell from './AdminModalShell'

const PAGE_SIZE = 6

function nowWat() {
  const d = new Date()
  return `${d.toISOString().slice(0, 10)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WAT`
}

function uwRef(prefix) {
  return `UW-${prefix}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
}

function StatusBadge({ status }) {
  const s = String(status || '')
  const map = {
    Draft: 'bg-slate-100 text-slate-700 ring-slate-200',
    Submitted: 'bg-sky-50 text-sky-800 ring-sky-100',
    Review: 'bg-amber-50 text-amber-900 ring-amber-100',
    'Info requested': 'bg-violet-50 text-violet-800 ring-violet-100',
    Underwriting: 'bg-indigo-50 text-indigo-900 ring-indigo-100',
    Approved: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
    Declined: 'bg-red-50 text-red-800 ring-red-100',
    Disbursed: 'bg-teal-50 text-teal-900 ring-teal-100',
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

function isPipelineStatus(s) {
  return s === 'Submitted' || s === 'Review' || s === 'Info requested' || s === 'Underwriting'
}

export default function AdminHomeLoansPage() {
  const toast = useToast()
  const [rows, setRows] = useState(() => adminLoansSeed.map((r) => ({ ...r })))
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [viewRow, setViewRow] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const stats = useMemo(() => {
    const total = rows.length
    const pipeline = rows.filter((r) => isPipelineStatus(r.status)).length
    const approved = rows.filter((r) => r.status === 'Approved').length
    const declined = rows.filter((r) => r.status === 'Declined').length
    const disbursed = rows.filter((r) => r.status === 'Disbursed').length
    const draft = rows.filter((r) => r.status === 'Draft').length
    return { total, pipeline, approved, declined, disbursed, draft }
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter === 'pipeline' && !isPipelineStatus(r.status)) return false
      if (statusFilter !== 'all' && statusFilter !== 'pipeline' && r.status !== statusFilter) return false
      if (!q) return true
      const blob = [r.id, r.reference, r.applicant, r.applicantEmail, r.applicantId, r.bankPartner, r.propertyAddress, r.underwritingRef].filter(Boolean).join(' ').toLowerCase()
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
    toast.info('Filters cleared', 'Showing all applications.')
  }

  const exportQueue = () => {
    toast.success('Export queued', `${filtered.length} loan row(s) prepared (demo).`)
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

  const bumpUpdated = (patch) => ({ ...patch, updatedAt: nowWat() })

  const applyConfirm = () => {
    if (!confirm) return
    const { type, row } = confirm
    const w = nowWat()
    const adminEmail = typeof localStorage !== 'undefined' ? localStorage.getItem('th_admin_email') || 'ops@trustedhome.com' : 'ops@trustedhome.com'

    if (type === 'approve') {
      const ref = uwRef('APR')
      setRows((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? bumpUpdated({
                ...x,
                status: 'Approved',
                approvedAmount: x.amount,
                offerApr: x.offerApr && x.offerApr !== '—' ? x.offerApr : '18.0% p.a. (demo)',
                underwritingRef: ref,
                decidedAt: w,
                officer: adminEmail,
                notesInternal: `${x.notesInternal ? `${x.notesInternal} ` : ''}Approved in console (demo).`.trim(),
              })
            : x,
        ),
      )
      toast.success('Approved', `${row.reference} — offer terms recorded (demo).`)
    }
    if (type === 'decline') {
      setRows((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? bumpUpdated({
                ...x,
                status: 'Declined',
                approvedAmount: '—',
                offerApr: '—',
                decidedAt: w,
                officer: adminEmail,
                notesInternal: `${x.notesInternal ? `${x.notesInternal} ` : ''}Declined in console (demo).`.trim(),
              })
            : x,
        ),
      )
      toast.warning('Declined', `${row.reference} — applicant should receive policy reason in production.`)
    }
    if (type === 'disburse') {
      setRows((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? bumpUpdated({
                ...x,
                status: 'Disbursed',
                disbursedAt: w,
                notesInternal: `${x.notesInternal ? `${x.notesInternal} ` : ''}Marked disbursed (demo).`.trim(),
              })
            : x,
        ),
      )
      toast.success('Disbursed', `${row.reference} logged as funded.`)
    }
    if (type === 'reopen') {
      setRows((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? bumpUpdated({
                ...x,
                status: 'Review',
                decidedAt: '—',
                notesInternal: `${x.notesInternal ? `${x.notesInternal} ` : ''}Reopened to review (demo).`.trim(),
              })
            : x,
        ),
      )
      toast.info('Reopened', `${row.reference} is back in Review.`)
    }

    setConfirm(null)
  }

  const startReview = (r) => {
    setRows((prev) => prev.map((x) => (x.id === r.id ? bumpUpdated({ ...x, status: 'Review', officer: 'credit.team@trustedhome.com' }) : x)))
    toast.success('In review', `${r.reference} assigned to credit queue.`)
  }

  const submitDraft = (r) => {
    setRows((prev) =>
      prev.map((x) =>
        x.id === r.id ? bumpUpdated({ ...x, status: 'Submitted', submittedAt: nowWat(), notesInternal: `${x.notesInternal ? `${x.notesInternal} ` : ''}Submitted from admin (demo).`.trim() }) : x,
      ),
    )
    toast.success('Submitted', `${r.reference} is now in the intake queue.`)
  }

  const requestInfo = (r) => {
    setRows((prev) =>
      prev.map((x) =>
        x.id === r.id
          ? bumpUpdated({
              ...x,
              status: 'Info requested',
              notesInternal: `${x.notesInternal ? `${x.notesInternal} ` : ''}Additional documentation requested (demo).`.trim(),
            })
          : x,
      ),
    )
    toast.info('Info requested', `${r.reference} — status updated.`)
  }

  const docsReceived = (r) => {
    setRows((prev) =>
      prev.map((x) =>
        x.id === r.id
          ? bumpUpdated({
              ...x,
              status: 'Review',
              docsComplete: 'Yes',
              notesInternal: `${x.notesInternal ? `${x.notesInternal} ` : ''}Documents marked complete (demo).`.trim(),
            })
          : x,
      ),
    )
    toast.success('Docs in', `${r.reference} returned to Review.`)
  }

  const toUnderwriting = (r) => {
    const ref = uwRef('UW')
    setRows((prev) =>
      prev.map((x) => (x.id === r.id ? bumpUpdated({ ...x, status: 'Underwriting', underwritingRef: ref, officer: 'credit.team@trustedhome.com' }) : x)),
    )
    toast.success('Underwriting', `${r.reference} → ${ref}`)
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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Home loans</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Origination queue for partner-bank mortgages: income, collateral, LTV/DTI, and document completeness. Actions here are <span className="font-semibold text-slate-700">demo only</span> — production
            should integrate credit bureaus, scoring engines, and immutable decision logs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('pipeline')}
            className="h-10 rounded-lg border border-indigo-200 bg-indigo-50 px-4 text-sm font-semibold text-indigo-950 shadow-sm hover:bg-indigo-100"
          >
            Pipeline only
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

      <section className="rounded-xl border border-slate-200 bg-slate-50/80 px-5 py-4">
        <p className="text-sm font-semibold text-slate-900">Regulatory reminder</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Treat NIN/BVN and full statements as highly sensitive. Offer APR, fees, and decline reasons must follow CBN consumer protection rules; this UI does not constitute a lending decision.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm md:p-5">
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="hl-search">
              Search
            </label>
            <input
              id="hl-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Reference, applicant, property, bank partner…"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="hl-status">
              Status
            </label>
            <select
              id="hl-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
            >
              <option value="all">All</option>
              <option value="pipeline">Pipeline (intake → UW)</option>
              <option value="Draft">Draft</option>
              <option value="Submitted">Submitted</option>
              <option value="Review">Review</option>
              <option value="Info requested">Info requested</option>
              <option value="Underwriting">Underwriting</option>
              <option value="Approved">Approved</option>
              <option value="Declined">Declined</option>
              <option value="Disbursed">Disbursed</option>
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of {rows.length} applications
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'Total', value: stats.total, c: 'text-slate-900' },
          { label: 'Pipeline', value: stats.pipeline, c: 'text-indigo-700' },
          { label: 'Approved', value: stats.approved, c: 'text-emerald-700' },
          { label: 'Declined', value: stats.declined, c: 'text-red-700' },
          { label: 'Disbursed', value: stats.disbursed, c: 'text-teal-700' },
          { label: 'Drafts', value: stats.draft, c: 'text-slate-600' },
        ].map((x) => (
          <article key={x.label} className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{x.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${x.c}`}>{x.value}</p>
          </article>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 md:px-6">
          <h2 className="text-[15px] font-semibold text-slate-900">Underwriting queue</h2>
          <p className="mt-0.5 text-sm text-slate-500">Requested amount, stated income, and current stage — open a row for LTV, DTI, partner bank, and internal notes.</p>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-700">No applications match your filters</p>
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
                    <th className="px-5 py-3 md:px-6">Applicant</th>
                    <th className="px-5 py-3 md:px-6">Amount</th>
                    <th className="px-5 py-3 md:px-6">Income</th>
                    <th className="px-5 py-3 md:px-6">LTV / DTI</th>
                    <th className="px-5 py-3 md:px-6">Bank</th>
                    <th className="px-5 py-3 md:px-6">Docs</th>
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
                      <td className="max-w-[160px] px-5 py-3.5 md:px-6">
                        <p className="truncate font-medium text-slate-900">{r.applicant}</p>
                        <p className="truncate text-xs text-slate-500">{r.applicantEmail}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-900 md:px-6">{r.amount}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 md:px-6">{r.income}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 md:px-6">
                        {r.ltv} / {r.dti}
                      </td>
                      <td className="max-w-[120px] truncate px-5 py-3.5 text-slate-700 md:px-6">{r.bankPartner}</td>
                      <td className="px-5 py-3.5 text-slate-600 md:px-6">{r.docsComplete}</td>
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
                          {r.status === 'Draft' ? (
                            <button type="button" onClick={() => submitDraft(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50">
                              Submit
                            </button>
                          ) : null}
                          {r.status === 'Submitted' ? (
                            <button type="button" onClick={() => startReview(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-50">
                              Start review
                            </button>
                          ) : null}
                          {r.status === 'Review' ? (
                            <>
                              <button type="button" onClick={() => requestInfo(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-50">
                                Request info
                              </button>
                              <button type="button" onClick={() => toUnderwriting(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
                                To UW
                              </button>
                              <button type="button" onClick={() => setConfirm({ type: 'approve', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                                Approve
                              </button>
                              <button type="button" onClick={() => setConfirm({ type: 'decline', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                                Decline
                              </button>
                            </>
                          ) : null}
                          {r.status === 'Info requested' ? (
                            <button type="button" onClick={() => docsReceived(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                              Docs in
                            </button>
                          ) : null}
                          {r.status === 'Underwriting' ? (
                            <>
                              <button type="button" onClick={() => setConfirm({ type: 'approve', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                                Approve
                              </button>
                              <button type="button" onClick={() => setConfirm({ type: 'decline', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                                Decline
                              </button>
                            </>
                          ) : null}
                          {r.status === 'Approved' ? (
                            <button type="button" onClick={() => setConfirm({ type: 'disburse', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-50">
                              Disburse
                            </button>
                          ) : null}
                          {r.status === 'Declined' ? (
                            <button type="button" onClick={() => setConfirm({ type: 'reopen', row: r })} className="rounded-md px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
                              Reopen
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
        title="Application detail"
        subtitle={viewRow ? `${viewRow.reference} · ${viewRow.applicant}` : ''}
        footer={
          <button type="button" onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Close
          </button>
        }
      >
        {viewRow ? (
          <div className="space-y-8">
            <div>
              <SectionTitle>Identifiers</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Application ID" value={viewRow.id} />
                <Field label="Reference" value={viewRow.reference} />
                <Field label="Status" value={viewRow.status} />
                <Field label="Applicant user ID" value={viewRow.applicantId} />
                <Field label="Underwriting ref" value={viewRow.underwritingRef} />
                <Field label="Assigned officer" value={viewRow.officer} />
              </div>
            </div>

            <div>
              <SectionTitle>Borrower</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Full name" value={viewRow.applicant} />
                <Field label="Email" value={viewRow.applicantEmail} />
                <Field label="Phone" value={viewRow.phone} />
                <Field label="Employment" value={viewRow.employment} />
                <Field label="Employer" value={viewRow.employer} />
                <Field label="Stated income" value={viewRow.income} />
              </div>
            </div>

            <div>
              <SectionTitle>Facility & collateral</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Requested amount" value={viewRow.amount} />
                <Field label="Approved amount" value={viewRow.approvedAmount} />
                <Field label="Tenor" value={viewRow.tenor} />
                <Field label="Property address" value={viewRow.propertyAddress} />
                <Field label="Indicative value" value={viewRow.propertyValue} />
                <Field label="LTV" value={viewRow.ltv} />
                <Field label="DTI" value={viewRow.dti} />
                <Field label="Credit band" value={viewRow.creditBand} />
                <Field label="Partner bank" value={viewRow.bankPartner} />
              </div>
            </div>

            <div>
              <SectionTitle>Decision & disbursement</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Offer APR" value={viewRow.offerApr} />
                <Field label="Docs complete" value={viewRow.docsComplete} />
                <Field label="Risk score" value={viewRow.riskScore} />
                <Field label="Submitted" value={viewRow.submittedAt} />
                <Field label="Last updated" value={viewRow.updatedAt} />
                <Field label="Decision at" value={viewRow.decidedAt} />
                <Field label="Disbursed at" value={viewRow.disbursedAt} />
              </div>
            </div>

            {viewRow.notesInternal ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Internal notes</p>
                <p className="mt-1 text-sm text-amber-950/90">{viewRow.notesInternal}</p>
              </div>
            ) : null}

            {viewRow.status === 'Draft' ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => submitDraft(viewRow)} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">
                  Submit application
                </button>
              </div>
            ) : null}
            {viewRow.status === 'Submitted' ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => startReview(viewRow)} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500">
                  Start review
                </button>
              </div>
            ) : null}
            {viewRow.status === 'Review' ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => requestInfo(viewRow)} className="rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-900 hover:bg-violet-100">
                  Request info
                </button>
                <button type="button" onClick={() => toUnderwriting(viewRow)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                  Send to underwriting
                </button>
                <button type="button" onClick={() => setConfirm({ type: 'approve', row: viewRow })} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                  Approve
                </button>
                <button type="button" onClick={() => setConfirm({ type: 'decline', row: viewRow })} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100">
                  Decline
                </button>
              </div>
            ) : null}
            {viewRow.status === 'Info requested' ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => docsReceived(viewRow)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                  Mark docs received
                </button>
              </div>
            ) : null}
            {viewRow.status === 'Underwriting' ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setConfirm({ type: 'approve', row: viewRow })} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                  Approve
                </button>
                <button type="button" onClick={() => setConfirm({ type: 'decline', row: viewRow })} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-800 hover:bg-red-100">
                  Decline
                </button>
              </div>
            ) : null}
            {viewRow.status === 'Approved' ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setConfirm({ type: 'disburse', row: viewRow })} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500">
                  Mark disbursed
                </button>
              </div>
            ) : null}
            {viewRow.status === 'Declined' ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setConfirm({ type: 'reopen', row: viewRow })} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                  Reopen to review
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
            : confirm.type === 'approve'
              ? 'Approve this application?'
              : confirm.type === 'decline'
                ? 'Decline this application?'
                : confirm.type === 'disburse'
                  ? 'Mark as disbursed?'
                  : 'Reopen application?'
        }
        subtitle={
          !confirm
            ? ''
            : confirm.type === 'approve'
              ? `${confirm.row.reference} — facility ${confirm.row.amount} (demo approval).`
              : confirm.type === 'decline'
                ? `${confirm.row.reference} will move to Declined; ensure a compliant reason is sent to the borrower in production.`
                : confirm.type === 'disburse'
                  ? `${confirm.row.reference} will be recorded as Disbursed with today’s timestamp (demo).`
                  : `${confirm.row.reference} returns to Review for a fresh decision.`
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
                !confirm
                  ? 'bg-slate-400'
                  : confirm.type === 'decline'
                    ? 'bg-red-600 hover:bg-red-500'
                    : confirm.type === 'disburse'
                      ? 'bg-teal-600 hover:bg-teal-500'
                      : confirm.type === 'reopen'
                        ? 'bg-indigo-600 hover:bg-indigo-500'
                        : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {!confirm ? 'OK' : confirm.type === 'approve' ? 'Confirm approve' : confirm.type === 'decline' ? 'Confirm decline' : confirm.type === 'disburse' ? 'Confirm disburse' : 'Reopen'}
            </button>
          </>
        }
      >
        {confirm ? (
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{confirm.row.applicant}</span> · LTV {confirm.row.ltv} · DTI {confirm.row.dti} · docs {confirm.row.docsComplete}
          </p>
        ) : null}
      </AdminModalShell>
    </div>
  )
}
