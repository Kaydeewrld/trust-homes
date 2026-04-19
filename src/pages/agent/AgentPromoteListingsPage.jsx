import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { promotionRows } from '../../data/agentPromotionsSeed'

const fmtPrice = (naira) => `₦${Number(naira).toLocaleString('en-NG')}`

function IconFacebook({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className || 'h-4 w-4'} fill="#1877F2">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function IconInstagram({ className }) {
  const gid = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 24 24" className={className || 'h-4 w-4'} fill={`url(#ig-${gid})`}>
      <defs>
        <linearGradient id={`ig-${gid}`} x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#F58529" />
          <stop offset="50%" stopColor="#DD2A7B" />
          <stop offset="100%" stopColor="#8134AF" />
        </linearGradient>
      </defs>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  )
}

function IconGoogle({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className || 'h-4 w-4'}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

function PlatformIcons({ platforms }) {
  return (
    <div className="flex items-center gap-1">
      {platforms.includes('facebook') ? <IconFacebook /> : null}
      {platforms.includes('instagram') ? <IconInstagram /> : null}
      {platforms.includes('google') ? <IconGoogle /> : null}
    </div>
  )
}

const statusStyles = {
  active: { dot: 'bg-emerald-500', text: 'text-emerald-800', label: 'Active' },
  scheduled: { dot: 'bg-indigo-500', text: 'text-indigo-800', label: 'Scheduled' },
  ended: { dot: 'bg-slate-400', text: 'text-slate-600', label: 'Ended' },
  draft: { dot: 'bg-slate-400', text: 'text-slate-600', label: 'Draft' },
}

function StatusCell({ row }) {
  const s = statusStyles[row.status] || statusStyles.draft
  return (
    <div>
      <span className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${s.text}`}>
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
        {s.label}
      </span>
      <p className="mt-0.5 text-[11px] text-slate-500">{row.statusDetail}</p>
    </div>
  )
}

function BudgetCell({ budget, spent }) {
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0
  return (
    <div className="min-w-[120px]">
      <p className="text-[13px] font-bold tabular-nums text-[#111827]">{fmtPrice(budget)}</p>
      <p className="text-[11px] text-slate-500">
        {fmtPrice(spent)} spent
      </p>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#6366F1] transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function MetricCard({ icon, title, value, trend, trendUp }) {
  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-2 text-slate-500">{icon}</div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-[#111827] sm:text-2xl">{value}</p>
      <p className={`mt-1 flex items-center gap-0.5 text-[11px] font-semibold ${trendUp ? 'text-emerald-600' : 'text-slate-500'}`}>
        {trendUp ? (
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
        {trend}
      </p>
    </div>
  )
}

const MENU_W = 200

export default function AgentPromoteListingsPage() {
  const [rows] = useState(() => [...promotionRows])
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
  const triggerRefs = useRef({})

  const tabCounts = useMemo(() => {
    const all = rows.length
    const active = rows.filter((r) => r.status === 'active').length
    const scheduled = rows.filter((r) => r.status === 'scheduled').length
    const ended = rows.filter((r) => r.status === 'ended').length
    const drafts = rows.filter((r) => r.status === 'draft').length
    return { all, active, scheduled, ended, drafts }
  }, [rows])

  const tabs = [
    { id: 'all', label: 'All Promotions', count: tabCounts.all },
    { id: 'active', label: 'Active', count: tabCounts.active },
    { id: 'scheduled', label: 'Scheduled', count: tabCounts.scheduled },
    { id: 'ended', label: 'Ended', count: tabCounts.ended },
    { id: 'draft', label: 'Drafts', count: tabCounts.drafts },
  ]

  const filtered = useMemo(() => {
    let list = [...rows]
    if (tab !== 'all') {
      list = list.filter((r) => r.status === tab)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((r) => r.title.toLowerCase().includes(q))
    }
    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter)
    }
    if (platformFilter !== 'all') {
      list = list.filter((r) => r.platforms.includes(platformFilter))
    }
    if (sort === 'newest') {
      list.sort((a, b) => b.id.localeCompare(a.id))
    }
    return list
  }, [rows, tab, search, statusFilter, platformFilter, sort])

  const openMenu = (id) => {
    const el = triggerRefs.current[id]
    if (!el) return
    const r = el.getBoundingClientRect()
    setMenuPos({ top: r.bottom + 6, left: Math.min(window.innerWidth - MENU_W - 12, r.right - MENU_W) })
    setMenuOpenId(menuOpenId === id ? null : id)
  }

  const menuRow = rows.find((r) => r.id === menuOpenId)

  useEffect(() => {
    setMenuOpenId(null)
  }, [tab])

  useEffect(() => {
    if (!menuOpenId) return
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpenId(null)
    }
    const onScroll = () => setMenuOpenId(null)
    window.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [menuOpenId])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden px-4 py-3 text-slate-800 md:px-6 md:py-4">
      <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[22px] font-bold leading-tight tracking-tight text-[#111827]">Promote Listings</h1>
          <p className="mt-1 max-w-xl text-[13px] text-slate-500">
            Boost your listings and get more visibility to generate leads faster.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600"
        >
          <span className="text-base font-bold leading-none">+</span>
          Promote New Listing
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-5 lg:gap-3">
        <MetricCard
          title="Active Promotions"
          value="12"
          trend="+2 this week"
          trendUp
          icon={
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinejoin="round" />
              </svg>
            </span>
          }
        />
        <MetricCard
          title="Total Views"
          value="24,560"
          trend="+18.6% this week"
          trendUp
          icon={
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-50 text-sky-600">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
          }
        />
        <MetricCard
          title="Leads Generated"
          value="156"
          trend="+12.4% this week"
          trendUp
          icon={
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </span>
          }
        />
        <MetricCard
          title="Total Spent"
          value={fmtPrice(128450)}
          trend="+8.3% this week"
          trendUp
          icon={
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-50 text-amber-600">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
              </svg>
            </span>
          }
        />
        <MetricCard
          title="Avg. CTR"
          value="7.48%"
          trend="+2.1% this week"
          trendUp
          icon={
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50 text-violet-600">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4l7 7M11 11l9-9M15 4h6v6M9 20H3v-6" strokeLinecap="round" />
              </svg>
            </span>
          }
        />
      </div>

      <div className="mt-5 shrink-0 border-b border-slate-200">
        <div className="-mb-px flex flex-wrap gap-1">
          {tabs.map((t) => {
            const isActive = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`relative flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-medium transition ${
                  isActive ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums ${
                    isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {t.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-3 flex shrink-0 flex-col gap-2 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:gap-3 lg:p-3">
        <div className="relative min-w-0 flex-1 lg:max-w-xs">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            placeholder="Search by listing title..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-[13px] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 shadow-sm outline-none focus:border-indigo-300"
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="ended">Ended</option>
            <option value="draft">Draft</option>
          </select>
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-medium text-slate-700 shadow-sm outline-none focus:border-indigo-300"
          >
            <option value="all">Platform: All</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="google">Google</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-300"
          >
            <option value="newest">Sort: Newest</option>
            <option value="oldest">Sort: Oldest</option>
          </select>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" strokeLinecap="round" />
              <path d="M7 16V9M12 16V5M17 16v-5" strokeLinecap="round" />
            </svg>
            View Performance Analytics
          </button>
        </div>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        <div className="thin-scroll h-full overflow-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/90">
                {['LISTING', 'PLATFORM', 'STATUS', 'DURATION', 'BUDGET', 'VIEWS', 'LEADS', 'CTR', 'ACTIONS'].map((h) => (
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
                  <td colSpan={9} className="px-3 py-12 text-center text-[13px] text-slate-500">
                    No promotions match your filters.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2.5 align-middle">
                      <div className="flex items-center gap-3">
                        <img src={row.image} alt="" className="h-11 w-[72px] shrink-0 rounded-lg object-cover ring-1 ring-slate-100" />
                        <p className="text-[13px] font-semibold text-[#111827]">{row.title}</p>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <PlatformIcons platforms={row.platforms} />
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <StatusCell row={row} />
                    </td>
                    <td className="px-3 py-2.5 align-middle whitespace-nowrap text-[12px] text-slate-600">{row.duration}</td>
                    <td className="px-3 py-2.5 align-middle">
                      <BudgetCell budget={row.budget} spent={row.spent} />
                    </td>
                    <td className="px-3 py-2.5 align-middle text-[13px] font-medium tabular-nums text-slate-700">
                      {row.views != null ? row.views.toLocaleString('en-NG') : '—'}
                    </td>
                    <td className="px-3 py-2.5 align-middle text-[13px] font-medium tabular-nums text-slate-700">
                      {row.leads != null ? row.leads : '—'}
                    </td>
                    <td className="px-3 py-2.5 align-middle text-[13px] font-medium tabular-nums text-slate-700">
                      {row.ctr != null ? `${row.ctr}%` : '—'}
                    </td>
                    <td className="px-3 py-2.5 align-middle">
                      <div className="flex items-center justify-end gap-1.5">
                        {row.action === 'performance' ? (
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            View Performance
                          </button>
                        ) : row.action === 'edit' ? (
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            Edit Campaign
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                          >
                            View Report
                          </button>
                        )}
                        <button
                          type="button"
                          ref={(el) => {
                            triggerRefs.current[row.id] = el
                          }}
                          onClick={() => openMenu(row.id)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm hover:bg-slate-50"
                          aria-label="More actions"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                            <circle cx="12" cy="6" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="12" cy="18" r="1.5" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {menuOpenId && menuRow && typeof document !== 'undefined'
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-[350]"
                aria-label="Close menu"
                onClick={() => setMenuOpenId(null)}
              />
              <div
                className="fixed z-[360] w-[200px] rounded-xl border border-slate-200/90 bg-white py-1 shadow-xl"
                style={{ top: menuPos.top, left: menuPos.left }}
                role="menu"
              >
                <button type="button" className="w-full px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50">
                  Duplicate campaign
                </button>
                <button type="button" className="w-full px-3 py-2.5 text-left text-[13px] font-medium text-slate-700 hover:bg-slate-50">
                  Pause promotion
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button type="button" className="w-full px-3 py-2.5 text-left text-[13px] font-medium text-red-600 hover:bg-red-50">
                  End campaign
                </button>
              </div>
            </>,
            document.body
          )
        : null}

      <div className="mt-4 flex shrink-0 flex-col gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/90 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-600">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18" strokeLinecap="round" />
              <path d="M7 16V9M12 16V5M17 16v-5" strokeLinecap="round" />
            </svg>
          </span>
          <p className="min-w-0 text-[13px] leading-relaxed text-indigo-950">
            <span className="font-semibold text-indigo-900">Want better results?</span> Listings with premium promotion get{' '}
            <span className="font-semibold">3x more visibility</span> and generate more quality leads.
          </p>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-xl border border-indigo-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
        >
          Boost Another Listing
        </button>
      </div>
    </div>
  )
}
