import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { adminListings as adminListingsSeed } from '../../data/adminSeed'
import AdminModalShell from './AdminModalShell'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { adminListingsModerationList, adminModerateListing } from '../../lib/api'

const PAGE_SIZE = 6

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function StatusBadge({ status }) {
  const map = {
    Pending: 'bg-amber-50 text-amber-900 ring-amber-100',
    Approved: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
    Rejected: 'bg-red-50 text-red-800 ring-red-100',
    Paused: 'bg-slate-100 text-slate-700 ring-slate-200',
    Flagged: 'bg-orange-50 text-orange-900 ring-orange-200',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${map[status] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
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

function mapApiListingToAdminRow(l) {
  const statusMap = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    DRAFT: 'Paused',
    SOLD: 'Paused',
  }
  const location = String(l?.location || '')
  const cityArea = location.split(',')[0]?.trim() || location || '—'
  const type = String(l?.purpose || 'Sale')
  const propertyType = String(l?.propertyType || 'Residential')
  const agentName = l?.ownerRole === 'AGENT' ? 'Verified Agent' : 'User Listing'
  const status = statusMap[String(l?.status || '').toUpperCase()] || 'Pending'
  const createdAt = l?.createdAt ? new Date(l.createdAt).toISOString().slice(0, 10) : todayIso()
  return {
    id: l.id,
    slug: l.id,
    title: l.title || 'Untitled Listing',
    location,
    cityArea,
    type,
    propertyType,
    status,
    priceDisplay: `₦${Number(l?.priceNgn || 0).toLocaleString('en-NG')}`,
    agent: agentName,
    agentId: l.ownerId || '—',
    ownerName: agentName,
    ownerEmail: '—',
    views30d: 0,
    bedrooms: Number(l?.bedrooms || 0),
    bathrooms: Number(l?.bathrooms || 0),
    areaSqm: Number(l?.areaSqm || 0),
    furnished: false,
    photosCount: Number(l?.mediaCount || 0),
    videoTour: Number(l?.videoCount || 0) > 0,
    amenitiesCount: 0,
    mapHint: '—',
    descriptionSnippet: l.description || 'No description provided.',
    savesCount: 0,
    leadsCount: 0,
    agencyFeePercent: '10%',
    serviceCharge: '—',
    submittedAt: createdAt,
    reviewedAt: '—',
    publishedAt: status === 'Approved' ? createdAt : '—',
    lastEditedAt: l?.updatedAt ? new Date(l.updatedAt).toISOString().slice(0, 10) : createdAt,
    complianceFlags: status === 'Pending' ? ['Awaiting moderation review'] : [],
    featuredRequest: false,
    internalNotes: l?.verificationBadge ? 'Auto verified listing badge enabled.' : '',
    isDistressSale: Boolean(l?.isDistressSale),
    isInvestmentProperty: Boolean(l?.isInvestmentProperty),
  }
}

export default function AdminListingsPage() {
  const toast = useToast()
  const { adminToken } = useAdminAuth()
  const [listings, setListings] = useState(() => adminListingsSeed.map((r) => ({ ...r, complianceFlags: [...(r.complianceFlags || [])] })))
  const [liveMode, setLiveMode] = useState(false)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [agentFilter, setAgentFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [viewListing, setViewListing] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const agentOptions = useMemo(() => {
    const s = new Set(listings.map((l) => l.agent).filter(Boolean))
    return Array.from(s).sort()
  }, [listings])

  const stats = useMemo(() => {
    const total = listings.length
    const pending = listings.filter((l) => l.status === 'Pending').length
    const live = listings.filter((l) => l.status === 'Approved').length
    const issues = listings.filter((l) => l.status === 'Rejected' || l.status === 'Flagged' || l.status === 'Paused').length
    return { total, pending, live, issues }
  }, [listings])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return listings.filter((l) => {
      if (typeFilter !== 'all' && l.type !== typeFilter) return false
      if (statusFilter !== 'all' && l.status !== statusFilter) return false
      if (agentFilter !== 'all' && l.agent !== agentFilter) return false
      if (!q) return true
      const blob = [l.title, l.id, l.location, l.cityArea, l.agent, l.ownerName, l.ownerEmail, l.slug].filter(Boolean).join(' ').toLowerCase()
      return blob.includes(q)
    })
  }, [listings, search, typeFilter, statusFilter, agentFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  useEffect(() => {
    setPage(1)
  }, [search, typeFilter, statusFilter, agentFilter])

  useEffect(() => {
    if (!adminToken) return
    ;(async () => {
      try {
        const out = await adminListingsModerationList(adminToken, { status: 'ALL', take: 200, skip: 0 })
        const rows = Array.isArray(out?.listings) ? out.listings.map(mapApiListingToAdminRow) : []
        setListings(rows)
        setLiveMode(true)
      } catch (error) {
        setLiveMode(false)
        toast.info('Using demo listings', error?.message || 'Could not load backend listings queue.')
      }
    })()
  }, [adminToken, toast])

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const resetFilters = () => {
    setSearch('')
    setTypeFilter('all')
    setStatusFilter('all')
    setAgentFilter('all')
    toast.info('Filters cleared', 'Showing the full catalogue again.')
  }

  const exportListings = () => {
    toast.success('Export queued', `${filtered.length} listing row(s) prepared (demo CSV).`)
  }

  const copyListingId = (row) => {
    const text = row.id
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => toast.success('Copied', `${text} is on the clipboard.`),
        () => toast.info('Listing ID', text),
      )
    } else {
      toast.info('Listing ID', text)
    }
  }

  const applyConfirm = () => {
    if (!confirm) return
    const { type, listing } = confirm
    const t = todayIso()
    const liveStatus =
      type === 'approve' ? 'APPROVED' : type === 'reject' ? 'REJECTED' : type === 'republish' ? 'APPROVED' : type === 'pause' ? 'PENDING' : null
    if (liveMode && adminToken && liveStatus) {
      ;(async () => {
        try {
          await adminModerateListing(adminToken, listing.id, liveStatus)
          const out = await adminListingsModerationList(adminToken, { status: 'ALL', take: 200, skip: 0 })
          const rows = Array.isArray(out?.listings) ? out.listings.map(mapApiListingToAdminRow) : []
          if (rows.length) setListings(rows)
        } catch (error) {
          toast.error('Moderation failed', error?.message || 'Could not update listing status.')
        }
      })()
    }
    if (type === 'approve') {
      setListings((prev) =>
        prev.map((x) =>
          x.id === listing.id
            ? { ...x, status: 'Approved', reviewedAt: t, publishedAt: x.publishedAt === '—' ? t : x.publishedAt }
            : x,
        ),
      )
      toast.success('Listing approved', `${listing.title} is now live on the marketplace (demo).`)
    }
    if (type === 'reject') {
      setListings((prev) =>
        prev.map((x) => (x.id === listing.id ? { ...x, status: 'Rejected', reviewedAt: t, publishedAt: '—' } : x)),
      )
      toast.success('Listing rejected', `${listing.title} will not appear publicly.`)
    }
    if (type === 'pause') {
      setListings((prev) => prev.map((x) => (x.id === listing.id ? { ...x, status: 'Paused' } : x)))
      toast.info('Listing paused', `${listing.title} is hidden from search until republished.`)
    }
    if (type === 'republish') {
      setListings((prev) => prev.map((x) => (x.id === listing.id ? { ...x, status: 'Approved' } : x)))
      toast.success('Republished', `${listing.title} is visible again.`)
    }
    if (type === 'resolveFlag') {
      setListings((prev) =>
        prev.map((x) =>
          x.id === listing.id
            ? {
                ...x,
                status: 'Approved',
                complianceFlags: ['Trust & safety: resolved', 'Monitoring: standard'],
              }
            : x,
        ),
      )
      toast.success('Flag cleared', `${listing.title} is back to approved with a clean compliance note (demo).`)
    }
    setConfirm(null)
    setViewListing((v) => {
      if (!v || v.id !== listing.id) return v
      if (type === 'approve') return { ...v, status: 'Approved', reviewedAt: t, publishedAt: v.publishedAt === '—' ? t : v.publishedAt }
      if (type === 'reject') return { ...v, status: 'Rejected', reviewedAt: t, publishedAt: '—' }
      if (type === 'pause') return { ...v, status: 'Paused' }
      if (type === 'republish') return { ...v, status: 'Approved' }
      if (type === 'resolveFlag')
        return { ...v, status: 'Approved', complianceFlags: ['Trust & safety: resolved', 'Monitoring: standard'] }
      return v
    })
  }

  const flagListing = (row) => {
    setListings((prev) =>
      prev.map((x) =>
        x.id === row.id
          ? {
              ...x,
              status: 'Flagged',
              complianceFlags: [...(x.complianceFlags || []).filter((f) => !f.startsWith('Flagged:')), 'Flagged: manual review by admin'],
            }
          : x,
      ),
    )
    toast.warning('Listing flagged', `${row.title} is marked for trust & safety follow-up (demo).`)
    setViewListing((v) => {
      if (!v || v.id !== row.id) return v
      return {
        ...v,
        status: 'Flagged',
        complianceFlags: [...(v.complianceFlags || []).filter((f) => !String(f).startsWith('Flagged:')), 'Flagged: manual review by admin'],
      }
    })
  }

  const openView = (row) => {
    setConfirm(null)
    setViewListing(row)
  }

  const typeOptions = ['Sale', 'Rent', 'Lease', 'Short stay']

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1760px] space-y-7 px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-6 lg:px-8 lg:py-8 xl:px-11 xl:py-9">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Listings</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Moderate every property before it reaches buyers and renters. Use <span className="font-semibold text-slate-700">View</span> for the full
            listing dossier — specs, parties, engagement, compliance, and timeline (demo data).
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
            onClick={exportListings}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Export catalogue
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-5 py-4">
        <p className="text-sm font-semibold text-indigo-950">Moderation checklist</p>
        <p className="mt-1 text-sm leading-relaxed text-indigo-900/85">
          Confirm title deed / survey alignment for sales, lease terms for rentals, and short-stay calendar sync. Production builds should attach document
          hashes and reviewer identity to every transition.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm md:p-5">
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="ls-search">
              Search
            </label>
            <input
              id="ls-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title, ID, area, agent, owner email…"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="ls-type">
              Listing type
            </label>
            <select
              id="ls-type"
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
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="ls-status">
              Status
            </label>
            <select
              id="ls-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
            >
              <option value="all">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Paused">Paused</option>
              <option value="Flagged">Flagged</option>
            </select>
          </div>
          <div className="lg:col-span-2">
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="ls-agent">
              Agent
            </label>
            <select
              id="ls-agent"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
            >
              <option value="all">All agents</option>
              {agentOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of {listings.length} listings
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total listings', value: stats.total, c: 'text-slate-900' },
          { label: 'Pending review', value: stats.pending, c: 'text-amber-700' },
          { label: 'Live (approved)', value: stats.live, c: 'text-emerald-700' },
          { label: 'Issues / paused', value: stats.issues, c: 'text-red-700' },
        ].map((x) => (
          <article key={x.label} className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{x.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${x.c}`}>{x.value}</p>
          </article>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 md:px-6">
          <h2 className="text-[15px] font-semibold text-slate-900">Catalogue queue</h2>
          <p className="mt-0.5 text-sm text-slate-500">Sort, filter, and act on individual properties.</p>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-700">No listings match your filters</p>
            <button type="button" onClick={resetFilters} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 md:px-6">Listing</th>
                    <th className="px-5 py-3 md:px-6">Area</th>
                    <th className="px-5 py-3 md:px-6">Type</th>
                    <th className="px-5 py-3 md:px-6">Price</th>
                    <th className="px-5 py-3 md:px-6">Agent</th>
                    <th className="px-5 py-3 md:px-6">Status</th>
                    <th className="px-5 py-3 md:px-6">30d views</th>
                    <th className="px-5 py-3 text-right md:px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="max-w-[240px] px-5 py-3.5 md:px-6">
                        <p className="line-clamp-2 font-medium text-slate-900">{row.title}</p>
                        <p className="text-xs text-slate-400">{row.id}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 md:px-6">{row.cityArea || row.location}</td>
                      <td className="px-5 py-3.5 text-slate-700 md:px-6">
                        <span className="font-medium">{row.type}</span>
                        <span className="text-slate-400"> · </span>
                        <span className="text-slate-500">{row.propertyType}</span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 font-semibold text-slate-800 md:px-6">{row.priceDisplay}</td>
                      <td className="max-w-[160px] truncate px-5 py-3.5 text-slate-600 md:px-6">{row.agent}</td>
                      <td className="px-5 py-3.5 md:px-6">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-5 py-3.5 tabular-nums text-slate-600 md:px-6">{row.views30d?.toLocaleString?.() ?? row.views30d}</td>
                      <td className="px-5 py-3.5 text-right md:px-6">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button type="button" onClick={() => openView(row)} className="rounded-md px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50">
                            View
                          </button>
                          <button type="button" onClick={() => copyListingId(row)} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                            Copy ID
                          </button>
                          {row.status === 'Pending' ? (
                            <>
                              <button type="button" onClick={() => setConfirm({ type: 'approve', listing: row })} className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                                Approve
                              </button>
                              <button type="button" onClick={() => setConfirm({ type: 'reject', listing: row })} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                                Reject
                              </button>
                            </>
                          ) : null}
                          {row.status === 'Approved' ? (
                            <>
                              <button type="button" onClick={() => flagListing(row)} className="rounded-md px-2 py-1 text-xs font-semibold text-orange-700 hover:bg-orange-50">
                                Flag
                              </button>
                              <button type="button" onClick={() => setConfirm({ type: 'pause', listing: row })} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                                Pause
                              </button>
                            </>
                          ) : null}
                          {row.status === 'Paused' ? (
                            <button type="button" onClick={() => setConfirm({ type: 'republish', listing: row })} className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                              Go live
                            </button>
                          ) : null}
                          {row.status === 'Flagged' ? (
                            <button type="button" onClick={() => setConfirm({ type: 'resolveFlag', listing: row })} className="rounded-md px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
                              Resolve
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
        open={Boolean(viewListing)}
        onClose={() => setViewListing(null)}
        title="Listing dossier"
        subtitle={viewListing ? `${viewListing.title} · ${viewListing.id}` : ''}
        footer={
          <button type="button" onClick={() => setViewListing(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Close
          </button>
        }
      >
        {viewListing ? (
          <div className="space-y-8">
            <div>
              <SectionTitle>Overview & pricing</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Listing ID" value={viewListing.id} />
                <Field label="URL slug" value={viewListing.slug} />
                <Field label="Status" value={viewListing.status} />
                <Field label="Deal type" value={viewListing.type} />
                <Field label="Property type" value={viewListing.propertyType} />
                <Field label="Price" value={viewListing.priceDisplay} />
                <Field label="State / region" value={viewListing.location} />
                <Field label="City / area" value={viewListing.cityArea} />
                <Field label="Featured request" value={viewListing.featuredRequest ? 'Yes' : 'No'} />
              </div>
            </div>

            <div>
              <SectionTitle>Property specifications</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Bedrooms" value={String(viewListing.bedrooms)} />
                <Field label="Bathrooms" value={String(viewListing.bathrooms)} />
                <Field label="Area (approx. sqm)" value={String(viewListing.areaSqm)} />
                <Field label="Furnished" value={viewListing.furnished ? 'Yes' : 'No'} />
                <Field label="Photo count" value={String(viewListing.photosCount)} />
                <Field label="Video tour" value={viewListing.videoTour ? 'Yes' : 'No'} />
                <Field label="Amenity tags (count)" value={String(viewListing.amenitiesCount)} />
                <Field label="Map hint (lat,lng)" value={viewListing.mapHint} />
              </div>
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-600">{viewListing.descriptionSnippet}</p>
            </div>

            <div>
              <SectionTitle>Parties</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Listing agent" value={viewListing.agent} />
                <Field label="Agent account ID" value={viewListing.agentId} />
                <Field label="Owner / poster" value={viewListing.ownerName} />
                <Field label="Owner email" value={viewListing.ownerEmail} />
              </div>
            </div>

            <div>
              <SectionTitle>Engagement (30 days)</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Views" value={String(viewListing.views30d ?? 0)} />
                <Field label="Saves" value={String(viewListing.savesCount ?? 0)} />
                <Field label="Leads / inquiries" value={String(viewListing.leadsCount ?? 0)} />
              </div>
            </div>

            <div>
              <SectionTitle>Commercial & fees</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Agency fee" value={viewListing.agencyFeePercent} />
                <Field label="Service charge / notes" value={viewListing.serviceCharge} />
              </div>
            </div>

            <div>
              <SectionTitle>Timeline</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Submitted" value={viewListing.submittedAt} />
                <Field label="Reviewed" value={viewListing.reviewedAt} />
                <Field label="Published" value={viewListing.publishedAt} />
                <Field label="Last edited" value={viewListing.lastEditedAt} />
              </div>
            </div>

            <div>
              <SectionTitle>Compliance & risk flags</SectionTitle>
              <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
                {(viewListing.complianceFlags || []).length === 0 ? <li className="text-slate-500">No flags recorded.</li> : null}
                {(viewListing.complianceFlags || []).map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>

            {viewListing.internalNotes ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Internal notes</p>
                <p className="mt-1 text-sm text-amber-950/90">{viewListing.internalNotes}</p>
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
              ? 'Approve listing?'
              : confirm.type === 'reject'
                ? 'Reject listing?'
                : confirm.type === 'pause'
                  ? 'Pause listing?'
                  : confirm.type === 'republish'
                    ? 'Republish listing?'
                    : 'Resolve flag?'
        }
        subtitle={
          !confirm
            ? ''
            : confirm.type === 'approve'
              ? `${confirm.listing.title} will go live for the public catalogue.`
              : confirm.type === 'reject'
                ? `${confirm.listing.title} will remain off the marketplace.`
                : confirm.type === 'pause'
                  ? `${confirm.listing.title} will be hidden from search and feeds.`
                  : confirm.type === 'republish'
                    ? `${confirm.listing.title} will return as an approved listing.`
                    : `${confirm.listing.title} will be cleared from flagged status (demo).`
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
                !confirm ? 'bg-slate-400' : confirm.type === 'reject' ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {!confirm
                ? 'OK'
                : confirm.type === 'approve'
                  ? 'Approve'
                  : confirm.type === 'reject'
                    ? 'Reject'
                    : confirm.type === 'pause'
                      ? 'Pause'
                      : confirm.type === 'republish'
                        ? 'Go live'
                        : 'Resolve'}
            </button>
          </>
        }
      >
        {confirm ? (
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{confirm.listing.id}</span> — confirm this matches the property you intend to update.
          </p>
        ) : null}
      </AdminModalShell>
    </div>
  )
}
