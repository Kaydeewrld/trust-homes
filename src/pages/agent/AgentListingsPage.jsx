import { Link } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import AgentListingDetailModal from './AgentListingDetailModal'
import AgentShareListingModal from './AgentShareListingModal'
import AgentDuplicateListingModal from './AgentDuplicateListingModal'
import AgentChangeVisibilityModal from './AgentChangeVisibilityModal'
import AgentListingPerformanceModal from './AgentListingPerformanceModal'
import AgentDeleteListingModal from './AgentDeleteListingModal'
import { agentListingRows } from '../../data/agentListingsSeed'

const fmtPrice = (naira) => `₦${Number(naira).toLocaleString('en-NG')}`

const tabs = [
  { id: 'all', label: 'All Listings', count: 24 },
  { id: 'active', label: 'Active', count: 15 },
  { id: 'pending', label: 'Pending Verification', count: 6 },
  { id: 'sold', label: 'Sold', count: 2 },
  { id: 'drafts', label: 'Drafts', count: 1 },
  { id: 'rejected', label: 'Rejected', count: 0 },
]

function listingThumbUrl(url) {
  if (!url || typeof url !== 'string') return url
  return url.replace(/w=\d+/i, 'w=200').replace(/q=\d+/i, 'q=80')
}

const statusConfig = {
  active: { label: 'Active', dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
  pending: { label: 'Pending Verification', dot: 'bg-amber-500', text: 'text-amber-800', bg: 'bg-amber-50' },
  sold: { label: 'Sold', dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
  draft: { label: 'Draft', dot: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100' },
  rejected: { label: 'Rejected', dot: 'bg-red-500', text: 'text-red-700', bg: 'bg-red-50' },
}

function StatusPill({ status }) {
  const c = statusConfig[status] || statusConfig.draft
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${c.bg} ${c.text}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  )
}

const actionBtn =
  'flex w-full min-w-[5.5rem] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50'

const MENU_W = 228

function RowActions({
  sold,
  listingId,
  listing,
  onView,
  onShare,
  onDuplicate,
  onChangeVisibility,
  onViewPerformance,
  onDeleteListing,
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const placeMenu = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const left = Math.min(window.innerWidth - MENU_W - 12, Math.max(12, r.right - MENU_W))
    setMenuPos({ top: r.bottom + 8, left })
  }, [])

  const toggleMenu = () => {
    if (menuOpen) {
      setMenuOpen(false)
      return
    }
    placeMenu()
    setMenuOpen(true)
  }

  useEffect(() => {
    if (!menuOpen) return
    const onScroll = () => setMenuOpen(false)
    const onResize = () => placeMenu()
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    const onDown = (e) => {
      const t = triggerRef.current
      const m = menuRef.current
      if (t?.contains(e.target) || m?.contains(e.target)) return
      setMenuOpen(false)
    }
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [menuOpen, placeMenu])

  const menuItem =
    'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 transition hover:bg-slate-50'

  const dropdown = menuOpen ? (
    <div
      ref={menuRef}
      className="fixed z-[300] w-[228px] overflow-visible rounded-xl border border-slate-200/90 bg-white py-1 shadow-[0_10px_40px_-10px_rgba(15,23,42,0.25)]"
      style={{ top: menuPos.top, left: menuPos.left }}
      role="menu"
    >
      <div
        className="pointer-events-none absolute -top-1.5 right-4 h-3 w-3 rotate-45 border-l border-t border-slate-200/90 bg-white"
        aria-hidden
      />
      <button
        type="button"
        role="menuitem"
        className={menuItem}
        onClick={() => {
          setMenuOpen(false)
          onShare?.(listing)
        }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="2.5" />
          <circle cx="6" cy="12" r="2.5" />
          <circle cx="18" cy="19" r="2.5" />
          <path d="m8.5 10.5 7-3M8.5 13.5l7 3M15.5 7.5v9" strokeLinecap="round" />
        </svg>
        Share Listing
      </button>
      <button type="button" role="menuitem" className={`${menuItem} pr-2`} onClick={() => setMenuOpen(false)}>
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m3 11 18-5v12L3 14v-3z" strokeLinejoin="round" />
          <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" strokeLinecap="round" />
        </svg>
        <span className="min-w-0 flex-1">Promote Listing</span>
        <span className="shrink-0 rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">New</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className={menuItem}
        onClick={() => {
          setMenuOpen(false)
          onDuplicate?.(listing)
        }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" strokeLinecap="round" />
        </svg>
        Duplicate Listing
      </button>
      <button
        type="button"
        role="menuitem"
        className={menuItem}
        onClick={() => {
          setMenuOpen(false)
          onChangeVisibility?.(listing)
        }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" />
          <circle cx="12" cy="12" r="3" strokeLinecap="round" />
        </svg>
        Change Visibility
      </button>
      <button
        type="button"
        role="menuitem"
        className={menuItem}
        onClick={() => {
          setMenuOpen(false)
          onViewPerformance?.(listing)
        }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18" strokeLinecap="round" />
          <path d="M7 16V9M12 16V5M17 16v-5" strokeLinecap="round" />
        </svg>
        View Performance
      </button>
      <div className="my-1 border-t border-slate-100" role="separator" />
      <button
        type="button"
        role="menuitem"
        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] font-medium text-red-600 transition hover:bg-red-50"
        onClick={() => {
          setMenuOpen(false)
          onDeleteListing?.(listing)
        }}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-red-500" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" strokeLinecap="round" />
        </svg>
        Delete Listing
      </button>
    </div>
  ) : null

  return (
    <div className="flex items-start justify-end gap-2">
      <div className="flex flex-col gap-1">
        <button type="button" onClick={onView} className={actionBtn}>
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" />
            <circle cx="12" cy="12" r="3" strokeLinecap="round" />
          </svg>
          View
        </button>
        {sold ? (
          <span
            className={`${actionBtn} cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 hover:bg-slate-50`}
            title="Sold listings cannot be edited"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Edit
          </span>
        ) : (
          <Link to={`/agent/listings/edit/${listingId}`} className={actionBtn}>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Edit
          </Link>
        )}
      </div>
      <div className="relative shrink-0 pt-0.5">
        <button
          ref={triggerRef}
          type="button"
          onClick={toggleMenu}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className="grid h-[4.25rem] w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50"
          aria-label="More actions"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
            <circle cx="12" cy="6" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="18" r="1.5" />
          </svg>
        </button>
      </div>
      {menuOpen && typeof document !== 'undefined' ? createPortal(dropdown, document.body) : null}
    </div>
  )
}

export default function AgentListingsPage() {
  const [listingsData, setListingsData] = useState(() => [...agentListingRows])
  const [activeTab, setActiveTab] = useState('all')
  const [viewing, setViewing] = useState(null)
  const [sharing, setSharing] = useState(null)
  const [duplicateListing, setDuplicateListing] = useState(null)
  const [visibilityListing, setVisibilityListing] = useState(null)
  const [performanceListing, setPerformanceListing] = useState(null)
  const [deleteListing, setDeleteListing] = useState(null)

  const handleDeleteConfirm = useCallback((listing) => {
    setListingsData((prev) => prev.filter((r) => r.id !== listing.id))
    setDeleteListing(null)
    if (viewing?.id === listing.id) setViewing(null)
    if (sharing?.id === listing.id) setSharing(null)
    if (duplicateListing?.id === listing.id) setDuplicateListing(null)
    if (visibilityListing?.id === listing.id) setVisibilityListing(null)
    if (performanceListing?.id === listing.id) setPerformanceListing(null)
  }, [viewing, sharing, duplicateListing, visibilityListing, performanceListing])

  const filtered = useMemo(() => {
    if (activeTab === 'all') return listingsData
    const map = {
      active: 'active',
      pending: 'pending',
      sold: 'sold',
      drafts: 'draft',
      rejected: 'rejected',
    }
    const key = map[activeTab]
    return listingsData.filter((r) => r.status === key)
  }, [activeTab, listingsData])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden px-4 py-3 text-slate-800 md:px-6 md:py-4">
      <AgentListingDetailModal listing={viewing} open={Boolean(viewing)} onClose={() => setViewing(null)} />
      <AgentShareListingModal listing={sharing} open={Boolean(sharing)} onClose={() => setSharing(null)} />
      <AgentDuplicateListingModal
        listing={duplicateListing}
        open={Boolean(duplicateListing)}
        onClose={() => setDuplicateListing(null)}
      />
      <AgentChangeVisibilityModal
        listing={visibilityListing}
        open={Boolean(visibilityListing)}
        onClose={() => setVisibilityListing(null)}
      />
      <AgentListingPerformanceModal
        listing={performanceListing}
        open={Boolean(performanceListing)}
        onClose={() => setPerformanceListing(null)}
      />
      <AgentDeleteListingModal
        listing={deleteListing}
        open={Boolean(deleteListing)}
        onClose={() => setDeleteListing(null)}
        onConfirm={handleDeleteConfirm}
      />
      <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold leading-tight tracking-tight text-[#111827]">My Listings</h1>
          <p className="mt-1 text-[13px] text-slate-500">Manage all the properties you&apos;ve listed on TrustedHome.</p>
        </div>
        <Link
          to="/agent/add-listing"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600"
        >
          <span className="text-base font-bold leading-none">+</span>
          Add New Listing
        </Link>
      </div>

      <div className="mt-4 shrink-0 border-b border-slate-200">
        <div className="-mb-px flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-medium transition ${
                  isActive
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                    isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-3 flex shrink-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1 lg:max-w-md">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="search"
            placeholder="Search listings by title, location..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-[13px] text-[#111827] shadow-sm placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 shadow-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15">
            <option>Property Type</option>
            <option>House</option>
            <option>Apartment</option>
            <option>Office</option>
            <option>Commercial</option>
          </select>
          <select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 shadow-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15">
            <option>Status</option>
            <option>Active</option>
            <option>Pending Verification</option>
            <option>Sold</option>
            <option>Draft</option>
          </select>
          <button
            type="button"
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            More Filters
          </button>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <span className="text-[12px] font-medium text-slate-500">Sort by:</span>
            <select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15">
              <option>Newest</option>
              <option>Oldest</option>
              <option>Price: High to Low</option>
              <option>Price: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="thin-scroll h-full overflow-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/90">
                {['PROPERTY', 'STATUS', 'PRICE', 'VIEWS', 'LEADS', 'DATE ADDED', 'ACTIONS'].map((h) => (
                  <th
                    key={h}
                    className={`whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 ${
                      h === 'ACTIONS' ? 'text-right' : ''
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-[13px] text-slate-500">
                    No listings in this category.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2 align-middle">
                    <div className="flex items-center gap-3">
                      <img
                        src={listingThumbUrl(row.image)}
                        alt=""
                        className="h-11 w-[72px] shrink-0 rounded-lg object-cover ring-1 ring-slate-100"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[#111827]">{row.title}</p>
                        <p className="truncate text-[11px] text-slate-500">{row.location}</p>
                        <p className="mt-0.5 text-[10px] font-medium text-slate-400">ID: {row.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <span className="text-[13px] font-semibold tabular-nums text-[#111827]">{fmtPrice(row.price)}</span>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <span className="inline-flex items-center gap-1 text-[13px] font-medium tabular-nums text-slate-700">
                      {row.views}
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" />
                        <circle cx="12" cy="12" r="3" strokeLinecap="round" />
                      </svg>
                    </span>
                  </td>
                  <td className="px-3 py-2 align-middle">
                    <span className="inline-flex items-center gap-1 text-[13px] font-medium tabular-nums text-slate-700">
                      {row.leads}
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </td>
                  <td className="px-3 py-2 align-middle whitespace-nowrap text-[12px] text-slate-600">{row.dateAdded}</td>
                  <td className="px-3 py-2 align-middle">
                    <RowActions
                      sold={row.status === 'sold'}
                      listingId={row.id}
                      listing={row}
                      onView={() => setViewing(row)}
                      onShare={setSharing}
                      onDuplicate={setDuplicateListing}
                      onChangeVisibility={setVisibilityListing}
                      onViewPerformance={setPerformanceListing}
                      onDeleteListing={setDeleteListing}
                    />
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
