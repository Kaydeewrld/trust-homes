import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { adminTickets as adminTicketsSeed } from '../../data/adminSeed'
import AdminModalShell from './AdminModalShell'

const PAGE_SIZE = 6

function nowWat() {
  const d = new Date()
  return `${d.toISOString().slice(0, 10)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} WAT`
}

function StatusBadge({ status }) {
  const s = String(status || '')
  const map = {
    Open: 'bg-sky-50 text-sky-900 ring-sky-100',
    'In progress': 'bg-indigo-50 text-indigo-900 ring-indigo-100',
    'Pending user': 'bg-amber-50 text-amber-900 ring-amber-100',
    Escalated: 'bg-red-50 text-red-900 ring-red-100',
    Resolved: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
    Closed: 'bg-slate-100 text-slate-700 ring-slate-200',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${map[s] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
      {status}
    </span>
  )
}

function PriorityBadge({ priority }) {
  const p = String(priority || '')
  const map = {
    Urgent: 'bg-red-100 text-red-900 ring-red-200',
    High: 'bg-orange-100 text-orange-950 ring-orange-200',
    Normal: 'bg-slate-100 text-slate-800 ring-slate-200',
    Low: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
  }
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${map[p] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
      {priority}
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

function isActiveQueue(s) {
  return s !== 'Resolved' && s !== 'Closed'
}

function needsFirstResponse(r) {
  return isActiveQueue(r.status) && r.firstResponseAt === '—'
}

export default function AdminSupportPage() {
  const toast = useToast()
  const [rows, setRows] = useState(() =>
    adminTicketsSeed.map((r) => ({
      ...r,
      staffReplies: Array.isArray(r.staffReplies) ? r.staffReplies : [],
      adminIssueNote: r.adminIssueNote ?? '',
    })),
  )
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [viewRow, setViewRow] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [priorityDraft, setPriorityDraft] = useState('Normal')
  const [replyDraft, setReplyDraft] = useState('')
  const [issueDraft, setIssueDraft] = useState('')
  const [confirmCustomerMessage, setConfirmCustomerMessage] = useState('')
  const [confirmInternalNote, setConfirmInternalNote] = useState('')

  const adminEmail = typeof localStorage !== 'undefined' ? localStorage.getItem('th_admin_email') || 'ops@trustedhome.com' : 'ops@trustedhome.com'

  const categoryOptions = useMemo(() => {
    const s = new Set(rows.map((r) => r.category).filter(Boolean))
    return Array.from(s).sort()
  }, [rows])

  const stats = useMemo(() => {
    const total = rows.length
    const inbox = rows.filter(needsFirstResponse).length
    const active = rows.filter((r) => isActiveQueue(r.status)).length
    const resolved = rows.filter((r) => r.status === 'Resolved').length
    const closed = rows.filter((r) => r.status === 'Closed').length
    const urgent = rows.filter((r) => (r.priority === 'Urgent' || r.priority === 'High') && isActiveQueue(r.status)).length
    return { total, inbox, active, resolved, closed, urgent }
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (statusFilter === 'inbox' && !needsFirstResponse(r)) return false
      if (statusFilter === 'active' && !isActiveQueue(r.status)) return false
      if (statusFilter !== 'all' && statusFilter !== 'inbox' && statusFilter !== 'active' && r.status !== statusFilter) return false
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
      if (priorityFilter !== 'all' && r.priority !== priorityFilter) return false
      if (!q) return true
      const blob = [r.id, r.reference, r.from, r.fromEmail, r.subject, r.tags, r.assignee, r.linkedListing, r.linkedTransaction, r.adminIssueNote].filter(Boolean).join(' ').toLowerCase()
      return blob.includes(q)
    })
  }, [rows, search, statusFilter, categoryFilter, priorityFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, categoryFilter, priorityFilter])

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const bump = (patch) => ({ ...patch, updatedAt: nowWat(), updated: 'Just now' })

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setCategoryFilter('all')
    setPriorityFilter('all')
    toast.info('Filters cleared', 'Showing all tickets.')
  }

  const exportTickets = () => {
    toast.success('Export queued', `${filtered.length} ticket row(s) prepared (demo).`)
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

  const pasteTemplate = (kind) => {
    const templates = {
      ack: 'Thanks for contacting TrustedHome Support. We are reviewing your case and will update you shortly.',
      info: 'Could you please send a screenshot or reference number so we can trace this on our side?',
      resolve: 'We believe this issue is now resolved. If anything else comes up, reply to this thread.',
    }
    const body = templates[kind] || templates.ack
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(body).then(
        () => toast.success('Template copied', 'Paste into your mail or CRM (demo).'),
        () => toast.info('Template', body.slice(0, 80) + '…'),
      )
    } else {
      toast.info('Template', body.slice(0, 120) + '…')
    }
  }

  const claimOrStart = (r) => {
    const w = nowWat()
    setRows((prev) =>
      prev.map((x) =>
        x.id === r.id
          ? bump({
              ...x,
              status: x.status === 'Open' || x.status === 'Escalated' ? 'In progress' : x.status,
              assignee: adminEmail,
              firstResponseAt: x.firstResponseAt === '—' ? w : x.firstResponseAt,
              internalNotes: `${x.internalNotes ? `${x.internalNotes} ` : ''}[${w}] Claimed / in progress by ${adminEmail} (demo).`.trim(),
            })
          : x,
      ),
    )
    toast.success('Claimed', `${r.reference} is now in progress under you.`)
  }

  const setPendingUser = (r) => {
    setRows((prev) =>
      prev.map((x) =>
        x.id === r.id
          ? bump({
              ...x,
              status: 'Pending user',
              internalNotes: `${x.internalNotes ? `${x.internalNotes} ` : ''}[${nowWat()}] Awaiting customer reply (demo).`.trim(),
            })
          : x,
      ),
    )
    toast.info('Pending user', `${r.reference} — waiting on customer.`)
  }

  const escalate = (r) => {
    setRows((prev) =>
      prev.map((x) =>
        x.id === r.id
          ? bump({
              ...x,
              status: 'Escalated',
              priority: x.priority === 'Low' || x.priority === 'Normal' ? 'High' : x.priority,
              internalNotes: `${x.internalNotes ? `${x.internalNotes} ` : ''}[${nowWat()}] Escalated (demo).`.trim(),
            })
          : x,
      ),
    )
    toast.warning('Escalated', `${r.reference} marked for senior review.`)
  }

  const resumeWork = (r) => {
    setRows((prev) =>
      prev.map((x) =>
        x.id === r.id
          ? bump({
              ...x,
              status: 'In progress',
              internalNotes: `${x.internalNotes ? `${x.internalNotes} ` : ''}[${nowWat()}] Resumed from pending user (demo).`.trim(),
            })
          : x,
      ),
    )
    toast.success('Resumed', `${r.reference} back to In progress.`)
  }

  const logTouch = (r) => {
    setRows((prev) =>
      prev.map((x) =>
        x.id === r.id
          ? bump({
              ...x,
              threadCount: String(Math.max(1, (Number(x.threadCount) || 0) + 1)),
              internalNotes: `${x.internalNotes ? `${x.internalNotes} ` : ''}[${nowWat()}] Internal touch logged (demo).`.trim(),
            })
          : x,
      ),
    )
    toast.success('Logged', `${r.reference} — touch added to internal notes.`)
  }

  const applyPriorityFromModal = () => {
    if (!viewRow) return
    setRows((prev) =>
      prev.map((x) => (x.id === viewRow.id ? bump({ ...x, priority: priorityDraft, internalNotes: `${x.internalNotes ? `${x.internalNotes} ` : ''}Priority → ${priorityDraft} (demo).`.trim() }) : x)),
    )
    toast.success('Priority updated', `${viewRow.reference} is now ${priorityDraft}.`)
    setViewRow((v) => (v ? { ...v, priority: priorityDraft } : v))
  }

  const applyConfirm = () => {
    if (!confirm) return
    const { type, row } = confirm
    const w = nowWat()
    const cust = confirmCustomerMessage.trim()
    const internalExtra = confirmInternalNote.trim()

    if (type === 'resolve') {
      const resolutionSummary = cust || 'Resolved via admin console (demo).'
      setRows((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? bump({
                ...x,
                status: 'Resolved',
                resolutionSummary,
                staffReplies: cust
                  ? [...(x.staffReplies || []), { id: `SR-${Date.now()}`, at: w, author: adminEmail, audience: 'customer', body: cust }]
                  : x.staffReplies || [],
                threadCount: cust ? String(Math.max(0, (Number(x.threadCount) || 0) + 1)) : x.threadCount,
                internalNotes: `${x.internalNotes ? `${x.internalNotes} ` : ''}[${w}] Resolved by ${adminEmail}${internalExtra ? ` — ${internalExtra}` : ''}.`.trim(),
              })
            : x,
        ),
      )
      toast.success('Resolved', `${row.reference} — resolution saved for customer view (demo).`)
    }
    if (type === 'close') {
      setRows((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? bump({
                ...x,
                status: 'Closed',
                internalNotes: `${x.internalNotes ? `${x.internalNotes} ` : ''}[${w}] Closed by ${adminEmail}${internalExtra ? `. Note: ${internalExtra}` : ''}.`.trim(),
              })
            : x,
        ),
      )
      toast.info('Closed', `${row.reference} archived from active queue.`)
    }
    if (type === 'reopen') {
      setRows((prev) =>
        prev.map((x) =>
          x.id === row.id
            ? bump({
                ...x,
                status: 'Open',
                assignee: '—',
                internalNotes: `${x.internalNotes ? `${x.internalNotes} ` : ''}[${w}] Reopened by ${adminEmail}${internalExtra ? ` — ${internalExtra}` : ''}.`.trim(),
              })
            : x,
        ),
      )
      toast.success('Reopened', `${row.reference} is Open again.`)
    }

    setConfirm(null)
    setConfirmCustomerMessage('')
    setConfirmInternalNote('')
  }

  const openView = (r) => {
    setConfirm(null)
    setConfirmCustomerMessage('')
    setConfirmInternalNote('')
    setReplyDraft('')
    setPriorityDraft(r.priority || 'Normal')
    setIssueDraft(r.adminIssueNote ?? '')
    setViewRow(r)
  }

  const sendStaffReply = () => {
    if (!viewRow) return
    const body = replyDraft.trim()
    if (!body) {
      toast.warning('Empty reply', 'Write a message before sending.')
      return
    }
    const w = nowWat()
    const entry = { id: `SR-${Date.now()}`, at: w, author: adminEmail, audience: 'customer', body }
    setRows((prev) =>
      prev.map((x) =>
        x.id === viewRow.id
          ? bump({
              ...x,
              staffReplies: [...(x.staffReplies || []), entry],
              threadCount: String(Math.max(0, (Number(x.threadCount) || 0) + 1)),
              firstResponseAt: x.firstResponseAt === '—' ? w : x.firstResponseAt,
              internalNotes: `${x.internalNotes ? `${x.internalNotes} ` : ''}[${w}] Staff reply logged (demo).`.trim(),
            })
          : x,
      ),
    )
    setReplyDraft('')
    toast.success('Reply logged', 'Customer would receive this in production.')
  }

  const saveAdminIssueNote = () => {
    if (!viewRow) return
    const text = issueDraft.trim()
    setRows((prev) => prev.map((x) => (x.id === viewRow.id ? bump({ ...x, adminIssueNote: text }) : x)))
    toast.success('Issue note saved', text ? 'Admin summary updated.' : 'Cleared issue summary.')
  }

  const openConfirm = (type, row) => {
    setConfirmCustomerMessage('')
    setConfirmInternalNote('')
    if (type === 'resolve') {
      setConfirmCustomerMessage(row.resolutionSummary && row.resolutionSummary !== '—' ? row.resolutionSummary : '')
    }
    setConfirm({ type, row })
  }

  useEffect(() => {
    if (!viewRow) return
    const fresh = rows.find((x) => x.id === viewRow.id)
    if (fresh) {
      setViewRow(fresh)
      setPriorityDraft(fresh.priority || 'Normal')
      setIssueDraft(fresh.adminIssueNote ?? '')
    }
  }, [rows, viewRow?.id])

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1760px] space-y-7 px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-6 lg:px-8 lg:py-8 xl:px-11 xl:py-9">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Support</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Unified ticket desk for users and agents: triage by priority, meet first-response SLAs, and keep an audit trail. Actions here are <span className="font-semibold text-slate-700">demo only</span> — connect
            your helpdesk webhooks for production.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('inbox')}
            className="h-10 rounded-lg border border-sky-200 bg-sky-50 px-4 text-sm font-semibold text-sky-950 shadow-sm hover:bg-sky-100"
          >
            First response inbox
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className="h-10 rounded-lg border border-indigo-200 bg-indigo-50 px-4 text-sm font-semibold text-indigo-950 shadow-sm hover:bg-indigo-100"
          >
            Active only
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
            onClick={exportTickets}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Export
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-violet-100 bg-violet-50/50 px-5 py-4">
        <p className="text-sm font-semibold text-violet-950">Handling sensitive threads</p>
        <p className="mt-1 text-sm leading-relaxed text-violet-900/85">
          Never paste full payment card numbers, BVN, or passwords in ticket replies. Use secure document upload links and restrict PII exports to least-privilege roles. Escalate Trust &amp; safety matters immediately.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm md:p-5">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="sup-search">
              Search
            </label>
            <input
              id="sup-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Reference, requester, subject, tags, links…"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="sup-status">
              Status
            </label>
            <select
              id="sup-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
            >
              <option value="all">All</option>
              <option value="inbox">First response inbox</option>
              <option value="active">Active (not resolved/closed)</option>
              <option value="Open">Open</option>
              <option value="In progress">In progress</option>
              <option value="Pending user">Pending user</option>
              <option value="Escalated">Escalated</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="sup-priority">
              Priority
            </label>
            <select
              id="sup-priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
            >
              <option value="all">All priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="sup-cat">
              Category
            </label>
            <select
              id="sup-cat"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
            >
              <option value="all">All categories</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of {rows.length} tickets
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { label: 'Total', value: stats.total, c: 'text-slate-900' },
          { label: 'First-response inbox', value: stats.inbox, c: 'text-sky-700' },
          { label: 'Active', value: stats.active, c: 'text-indigo-700' },
          { label: 'Urgent / high (active)', value: stats.urgent, c: 'text-red-700' },
          { label: 'Resolved', value: stats.resolved, c: 'text-emerald-700' },
          { label: 'Closed', value: stats.closed, c: 'text-slate-600' },
        ].map((x) => (
          <article key={x.label} className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{x.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${x.c}`}>{x.value}</p>
          </article>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 md:px-6">
          <h2 className="text-[15px] font-semibold text-slate-900">Ticket desk</h2>
          <p className="mt-0.5 text-sm text-slate-500">Requester, category, SLA clock, and owner — open a row for full thread summary, linked entities, and reply templates.</p>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-700">No tickets match your filters</p>
            <button type="button" onClick={resetFilters} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 md:px-6">Reference</th>
                    <th className="px-5 py-3 md:px-6">From</th>
                    <th className="px-5 py-3 md:px-6">Subject</th>
                    <th className="px-5 py-3 md:px-6">Category</th>
                    <th className="px-5 py-3 md:px-6">Prio</th>
                    <th className="px-5 py-3 md:px-6">Status</th>
                    <th className="px-5 py-3 md:px-6">Assignee</th>
                    <th className="px-5 py-3 md:px-6">SLA due</th>
                    <th className="px-5 py-3 md:px-6">Updated</th>
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
                      <td className="max-w-[140px] px-5 py-3.5 md:px-6">
                        <p className="truncate font-medium text-slate-900">{r.from}</p>
                        <p className="truncate text-xs text-slate-500">{r.fromRole}</p>
                      </td>
                      <td className="max-w-[220px] px-5 py-3.5 text-slate-700 md:px-6">
                        <p className="line-clamp-2">{r.subject}</p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 md:px-6">{r.category}</td>
                      <td className="px-5 py-3.5 md:px-6">
                        <PriorityBadge priority={r.priority} />
                      </td>
                      <td className="px-5 py-3.5 md:px-6">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="max-w-[120px] truncate px-5 py-3.5 text-xs text-slate-600 md:px-6">{r.assignee}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-slate-500 md:px-6">{r.slaDue?.split(' ')[0] ?? '—'}</td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 md:px-6">{r.updated}</td>
                      <td className="px-5 py-3.5 text-right md:px-6">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button type="button" onClick={() => openView(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50">
                            View
                          </button>
                          <button type="button" onClick={() => copyRef(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                            Copy ref
                          </button>
                          {isActiveQueue(r.status) ? (
                            <>
                              {r.status === 'Open' || r.status === 'Escalated' ? (
                                <button type="button" onClick={() => claimOrStart(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                                  {r.assignee === '—' || !r.assignee ? 'Claim' : 'Pick up'}
                                </button>
                              ) : null}
                              {r.status === 'In progress' || r.status === 'Escalated' ? (
                                <>
                                  <button type="button" onClick={() => setPendingUser(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-50">
                                    Pending user
                                  </button>
                                  <button type="button" onClick={() => escalate(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50">
                                    Escalate
                                  </button>
                                  <button type="button" onClick={() => openConfirm('resolve', r)} className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50">
                                    Resolve
                                  </button>
                                </>
                              ) : null}
                              {r.status === 'Pending user' ? (
                                <>
                                  <button type="button" onClick={() => resumeWork(r)} className="rounded-md px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
                                    Resume
                                  </button>
                                  <button type="button" onClick={() => openConfirm('resolve', r)} className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-50">
                                    Resolve
                                  </button>
                                </>
                              ) : null}
                            </>
                          ) : null}
                          {r.status === 'Resolved' ? (
                            <>
                              <button type="button" onClick={() => openConfirm('close', r)} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                                Close
                              </button>
                              <button type="button" onClick={() => openConfirm('reopen', r)} className="rounded-md px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50">
                                Reopen
                              </button>
                            </>
                          ) : null}
                          {r.status === 'Closed' ? (
                            <button type="button" onClick={() => openConfirm('reopen', r)} className="rounded-md px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-50">
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
        onClose={() => {
          setViewRow(null)
          setReplyDraft('')
        }}
        title="Ticket detail"
        subtitle={viewRow ? `${viewRow.reference} · ${viewRow.subject}` : ''}
        footer={
          <button type="button" onClick={() => setViewRow(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Close
          </button>
        }
      >
        {viewRow ? (
          <div className="space-y-8">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => pasteTemplate('ack')} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Copy acknowledgement
              </button>
              <button type="button" onClick={() => pasteTemplate('info')} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Copy info request
              </button>
              <button type="button" onClick={() => pasteTemplate('resolve')} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Copy resolution
              </button>
              <button type="button" onClick={() => logTouch(viewRow)} className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-900 hover:bg-indigo-100">
                Log internal touch
              </button>
            </div>

            <div>
              <SectionTitle>Routing</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Ticket ID" value={viewRow.id} />
                <Field label="Reference" value={viewRow.reference} />
                <Field label="Channel" value={viewRow.channel} />
                <Field label="Category" value={viewRow.category} />
                <Field label="Status" value={viewRow.status} />
                <Field label="Assignee" value={viewRow.assignee} />
                <Field label="Issue (admin note)" value={viewRow.adminIssueNote || '—'} />
              </div>
              <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="prio-draft">
                    Priority
                  </label>
                  <select
                    id="prio-draft"
                    value={priorityDraft}
                    onChange={(e) => setPriorityDraft(e.target.value)}
                    className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
                  >
                    <option value="Urgent">Urgent</option>
                    <option value="High">High</option>
                    <option value="Normal">Normal</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <button type="button" onClick={applyPriorityFromModal} className="h-9 rounded-lg bg-slate-800 px-3 text-sm font-semibold text-white hover:bg-slate-700">
                  Save priority
                </button>
              </div>
            </div>

            <div>
              <SectionTitle>Requester</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Name" value={viewRow.from} />
                <Field label="Email" value={viewRow.fromEmail} />
                <Field label="Role" value={viewRow.fromRole} />
                <Field label="Sentiment (auto)" value={viewRow.sentiment} />
                <Field label="Tags" value={viewRow.tags} />
                <Field label="Thread messages" value={viewRow.threadCount} />
              </div>
            </div>

            <div>
              <SectionTitle>SLA &amp; timeline</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Created" value={viewRow.createdAt} />
                <Field label="Last updated" value={viewRow.updatedAt} />
                <Field label="First response at" value={viewRow.firstResponseAt} />
                <Field label="SLA due" value={viewRow.slaDue} />
                <Field label="Relative updated" value={viewRow.updated} />
              </div>
            </div>

            <div>
              <SectionTitle>Linked records</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Listing" value={viewRow.linkedListing} />
                <Field label="Transaction / ref" value={viewRow.linkedTransaction} />
              </div>
            </div>

            <div>
              <SectionTitle>Latest customer message</SectionTitle>
              <p className="rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-sm leading-relaxed text-slate-800">{viewRow.messageExcerpt}</p>
            </div>

            <div>
              <SectionTitle>Admin issue summary</SectionTitle>
              <p className="mb-2 text-xs text-slate-500">One place for the team to record what went wrong (not sent to the customer).</p>
              <textarea
                value={issueDraft}
                onChange={(e) => setIssueDraft(e.target.value)}
                rows={3}
                placeholder="e.g. Wallet webhook delayed; Paystack idem key matched after manual replay."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none ring-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
              />
              <button
                type="button"
                onClick={saveAdminIssueNote}
                className="mt-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Save issue note
              </button>
            </div>

            {(viewRow.staffReplies || []).length > 0 ? (
              <div>
                <SectionTitle>Staff replies (thread)</SectionTitle>
                <ul className="space-y-3">
                  {(viewRow.staffReplies || []).map((m) => (
                    <li key={m.id} className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
                      <p className="text-[11px] font-semibold text-indigo-900">
                        {m.author} · {m.at}
                        {m.audience === 'customer' ? <span className="ml-2 font-normal text-indigo-700">(to customer)</span> : null}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{m.body}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {viewRow.status !== 'Closed' ? (
              <div>
                <SectionTitle>Reply to customer</SectionTitle>
                <p className="mb-2 text-xs text-slate-500">Logs an outbound message on the ticket (demo — connect email or in-app notify in production).</p>
                <textarea
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  rows={4}
                  placeholder="Write your reply to the requester…"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" onClick={sendStaffReply} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                    Send reply
                  </button>
                  <button type="button" onClick={() => setReplyDraft('')} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Clear
                  </button>
                </div>
              </div>
            ) : null}

            <div>
              <SectionTitle>Case summary (internal)</SectionTitle>
              <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700">{viewRow.body}</p>
            </div>

            {viewRow.resolutionSummary && viewRow.resolutionSummary !== '—' ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-900">Resolution summary</p>
                <p className="mt-1 text-sm text-emerald-950/90">{viewRow.resolutionSummary}</p>
              </div>
            ) : null}

            {viewRow.internalNotes ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Internal notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-amber-950/90">{viewRow.internalNotes}</p>
              </div>
            ) : null}

            {isActiveQueue(viewRow.status) ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                {viewRow.status === 'Open' || viewRow.status === 'Escalated' ? (
                  <button type="button" onClick={() => claimOrStart(viewRow)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                    {viewRow.assignee === '—' || !viewRow.assignee ? 'Claim ticket' : 'Pick up / in progress'}
                  </button>
                ) : null}
                {viewRow.status === 'In progress' || viewRow.status === 'Escalated' ? (
                  <>
                    <button type="button" onClick={() => setPendingUser(viewRow)} className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100">
                      Pending user
                    </button>
                    <button type="button" onClick={() => escalate(viewRow)} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-900 hover:bg-red-100">
                      Escalate
                    </button>
                    <button type="button" onClick={() => openConfirm('resolve', viewRow)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                      Resolve
                    </button>
                  </>
                ) : null}
                {viewRow.status === 'Pending user' ? (
                  <>
                    <button type="button" onClick={() => resumeWork(viewRow)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                      Resume
                    </button>
                    <button type="button" onClick={() => openConfirm('resolve', viewRow)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">
                      Resolve
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}
            {viewRow.status === 'Resolved' ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => openConfirm('close', viewRow)} className="rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-200">
                  Close ticket
                </button>
                <button type="button" onClick={() => openConfirm('reopen', viewRow)} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">
                  Reopen
                </button>
              </div>
            ) : null}
            {viewRow.status === 'Closed' ? (
              <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => openConfirm('reopen', viewRow)} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500">
                  Reopen
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </AdminModalShell>

      <AdminModalShell
        size="lg"
        open={Boolean(confirm)}
        onClose={() => {
          setConfirm(null)
          setConfirmCustomerMessage('')
          setConfirmInternalNote('')
        }}
        title={
          !confirm
            ? ''
            : confirm.type === 'resolve'
              ? 'Mark ticket resolved?'
              : confirm.type === 'close'
                ? 'Close ticket?'
                : 'Reopen ticket?'
        }
        subtitle={
          !confirm
            ? ''
            : confirm.type === 'resolve'
              ? `${confirm.row.reference} — add the customer-facing resolution below; optional internal note for the audit log.`
              : confirm.type === 'close'
                ? `${confirm.row.reference} will be archived as Closed. Add an internal note if needed.`
                : `${confirm.row.reference} returns to Open. Optional context for the team below.`
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setConfirm(null)
                setConfirmCustomerMessage('')
                setConfirmInternalNote('')
              }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="button"
              onClick={applyConfirm}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                !confirm
                  ? 'bg-slate-400'
                  : confirm.type === 'close'
                    ? 'bg-slate-700 hover:bg-slate-600'
                    : confirm.type === 'reopen'
                      ? 'bg-sky-600 hover:bg-sky-500'
                      : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {!confirm ? 'OK' : confirm.type === 'resolve' ? 'Confirm resolve' : confirm.type === 'close' ? 'Confirm close' : 'Confirm reopen'}
            </button>
          </>
        }
      >
        {confirm ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              <span className="font-semibold text-slate-800">{confirm.row.from}</span> · {confirm.row.category} · priority <span className="font-semibold">{confirm.row.priority}</span>
            </p>
            {confirm.type === 'resolve' ? (
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="confirm-resolve-customer">
                  Message to customer (resolution)
                </label>
                <textarea
                  id="confirm-resolve-customer"
                  value={confirmCustomerMessage}
                  onChange={(e) => setConfirmCustomerMessage(e.target.value)}
                  rows={4}
                  placeholder="Explain what you fixed or decided. This becomes the resolution summary and a staff reply on the thread."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-500/15"
                />
              </div>
            ) : null}
            {confirm.type === 'resolve' || confirm.type === 'close' || confirm.type === 'reopen' ? (
              <div>
                <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="confirm-internal">
                  Internal note (optional)
                </label>
                <textarea
                  id="confirm-internal"
                  value={confirmInternalNote}
                  onChange={(e) => setConfirmInternalNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Escalated to finance; refund queued in sheet R-12."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>
            ) : null}
          </div>
        ) : null}
      </AdminModalShell>
    </div>
  )
}
