import { useEffect, useState } from 'react'
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'

const navGroups = [
  {
    label: 'Overview',
    items: [
      { to: '/admin/overview', label: 'Dashboard', icon: 'dash' },
      { to: '/admin/admins', label: 'Admin management', icon: 'shield' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/admin/users', label: 'Users', icon: 'users' },
      { to: '/admin/agents', label: 'Agents', icon: 'agents' },
      { to: '/admin/listings', label: 'Listings', icon: 'listings' },
      { to: '/admin/promotions', label: 'Promotions', icon: 'promo' },
      { to: '/admin/transactions', label: 'Transactions', icon: 'tx' },
      { to: '/admin/payouts', label: 'Payouts', icon: 'payout' },
      { to: '/admin/auctions', label: 'Auctions', icon: 'auction' },
      { to: '/admin/home-loans', label: 'Home loans', icon: 'loan' },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/admin/analytics', label: 'Analytics', icon: 'chart' },
      { to: '/admin/support', label: 'Support', icon: 'support' },
      { to: '/admin/settings', label: 'Settings', icon: 'gear' },
    ],
  },
]

function NavIcon({ name }) {
  const c = 'h-[18px] w-[18px] shrink-0'
  switch (name) {
    case 'dash':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <rect x="3" y="3" width="8" height="8" rx="1.5" />
          <rect x="13" y="3" width="8" height="8" rx="1.5" />
          <rect x="3" y="13" width="8" height="8" rx="1.5" />
          <rect x="13" y="13" width="8" height="8" rx="1.5" />
        </svg>
      )
    case 'users':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
        </svg>
      )
    case 'agents':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-2-3.45M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    case 'listings':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <path d="M9 22V12h6v10" />
        </svg>
      )
    case 'promo':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'tx':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </svg>
      )
    case 'payout':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
        </svg>
      )
    case 'auction':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M14.5 4h2.85l1.78 6.5-8.2 8.2a2.12 2.12 0 0 1-3-3l8.2-8.2z" />
          <path d="M12 15l3 3M5 19l4-4" strokeLinecap="round" />
        </svg>
      )
    case 'loan':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M3 3h18v18H3zM9 9h6v10H9zM9 3v6M15 3v6" />
        </svg>
      )
    case 'chart':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M3 3v18h18M7 16l4-6 4 3 5-8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'support':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M21 15a4 4 0 0 1-4 4H8l-6 4V7a4 4 0 0 1 4-4h11a4 4 0 0 1 4 4v8z" />
        </svg>
      )
    case 'gear':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
        </svg>
      )
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" />
        </svg>
      )
    default:
      return <span className={c} />
  }
}

export default function AdminLayout() {
  const { isAuthenticated, adminEmail, refreshSession, logout } = useAdminAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    void refreshSession()
  }, [isAuthenticated, refreshSession])

  if (!isAuthenticated) return <Navigate to="/admin/login" replace />

  const onLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 overflow-hidden bg-[#eef0f4] text-[14px] leading-normal text-slate-800 antialiased">
      {/* Mobile overlay */}
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full min-h-0 w-[268px] shrink-0 flex-col border-r border-slate-200/90 bg-white shadow-sm transition-transform duration-200 lg:static lg:h-full lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-7H10v7H5a1 1 0 0 1-1-1v-9.5z" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold tracking-tight text-slate-900">TrustedHome</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Admin</p>
          </div>
        </div>

        <nav className="thin-scroll flex min-h-0 flex-1 flex-col gap-6 overflow-x-hidden overflow-y-auto overscroll-y-contain px-3 py-4 pr-2">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.label}</p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition ${
                          isActive
                            ? 'bg-indigo-50 text-indigo-700 shadow-sm shadow-indigo-500/5'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`
                      }
                    >
                      <NavIcon name={item.icon} />
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
            <p className="truncate text-xs font-semibold text-slate-800">{adminEmail || 'Admin'}</p>
            <p className="text-[11px] text-slate-500">Internal staff</p>
            <button
              type="button"
              onClick={onLogout}
              className="mt-2 w-full rounded-md border border-slate-200 bg-white py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-16 w-full min-w-0 shrink-0 items-center gap-3 border-b border-slate-200/90 bg-white px-4 shadow-sm md:px-6">
          <button
            type="button"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 lg:hidden"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle sidebar"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search users, listings, tickets…"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-10 pr-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
            <button
              type="button"
              className="relative grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50"
              aria-label="Notifications"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
              </svg>
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </header>

        <div className="thin-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
