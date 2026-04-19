import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useWallet } from '../context/WalletContext'

const links = [
  { to: '/', label: 'Home' },
  { to: '/explore', label: 'Explore' },
  { to: '/auctions', label: 'Auctions' },
  { to: '/saved', label: 'Saved' },
  { to: '/messages', label: 'Messages', badge: 3 },
]

function SiteHeader() {
  const { balance } = useWallet()
  const { user } = useAuth()
  const [showWalletBalance, setShowWalletBalance] = useState(true)
  const location = useLocation()
  const isAddListingRoute = location.pathname.startsWith('/add-listing')
  const isProfileRoute = location.pathname === '/profile'
  const lightHeader = isProfileRoute || isAddListingRoute

  const formattedBalance = `₦${new Intl.NumberFormat('en-NG').format(balance)}`

  return (
    <header
      className={`sticky top-0 z-40 px-4 py-3 backdrop-blur md:px-6 ${
        lightHeader ? 'border-b border-slate-200 bg-white/95 text-slate-900' : 'border-b border-white/15 bg-[#081746]/95'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <NavLink to="/" className="flex items-center gap-2 rounded-lg outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-blue-400/60">
          <div className={`grid h-8 w-8 place-items-center rounded-lg ${lightHeader ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/25 text-blue-100'}`}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
              <path d="M3 10.5 12 3l9 7.5M6 9v11h12V9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className={`text-base font-semibold ${lightHeader ? 'text-slate-900' : 'text-white'}`}>
            Trusted<span className={lightHeader ? 'text-blue-600' : 'text-blue-300'}>Home</span>
          </p>
        </NavLink>

        <div className="flex flex-wrap items-center gap-2">
          <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 ${lightHeader ? 'border border-slate-200 bg-slate-50' : 'border border-white/20 bg-white/10'}`}>
            <span className={`text-[10px] font-medium uppercase tracking-wide ${lightHeader ? 'text-slate-500' : 'text-blue-200/90'}`}>Wallet</span>
            <span className={`min-w-[5.5rem] text-xs font-semibold tabular-nums ${lightHeader ? 'text-slate-800' : 'text-white'}`}>
              {showWalletBalance ? formattedBalance : '••••••••'}
            </span>
            <button
              type="button"
              onClick={() => setShowWalletBalance((v) => !v)}
              aria-label={showWalletBalance ? 'Hide wallet balance' : 'Show wallet balance'}
              className={`rounded p-0.5 transition ${lightHeader ? 'text-slate-500 hover:bg-slate-200 hover:text-slate-800' : 'text-blue-100 hover:bg-white/15 hover:text-white'}`}
            >
              {showWalletBalance ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="m1 1 22 22" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>

          <nav className="flex flex-wrap items-center gap-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs transition ${
                    isActive
                      ? lightHeader
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-blue-500/25 text-white'
                      : lightHeader
                        ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {link.label}
                {link.badge != null && (
                  <span className="min-w-[1rem] rounded-full bg-blue-500 px-1 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            ))}
            {!user && (
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-xs transition ${
                    isActive
                      ? lightHeader
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-blue-500/25 text-white'
                      : lightHeader
                        ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                Profile
              </NavLink>
            )}
            {user ? (
              <NavLink
                to="/profile"
                title={user.displayName}
                className="ml-1 inline-flex shrink-0 items-center rounded-full p-0.5 ring-2 ring-transparent transition hover:ring-blue-300/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
              >
                <img
                  src={user.avatarUrl}
                  alt=""
                  className={`h-8 w-8 rounded-full object-cover ${lightHeader ? 'ring-2 ring-slate-200' : 'ring-2 ring-white/30'}`}
                />
              </NavLink>
            ) : (
              <NavLink
                to="/login"
                className={`ml-1 inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                  lightHeader
                    ? 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50'
                    : 'border-white/25 bg-white/10 text-white hover:bg-white/15'
                }`}
              >
                Log in
              </NavLink>
            )}
            <NavLink
              to="/add-listing"
              className={`ml-1 inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                lightHeader
                  ? 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-white text-blue-700 hover:bg-blue-50'
              }`}
            >
              <svg viewBox="0 0 24 24" className="mr-1 h-3.5 w-3.5" fill="none" stroke="currentColor">
                <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Add Listing
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
