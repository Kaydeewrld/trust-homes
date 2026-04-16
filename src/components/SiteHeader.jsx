import { useState } from 'react'
import { NavLink } from 'react-router-dom'
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
  const [showWalletBalance, setShowWalletBalance] = useState(true)

  const formattedBalance = `₦${new Intl.NumberFormat('en-NG').format(balance)}`

  return (
    <header className="sticky top-0 z-40 border-b border-white/15 bg-[#081746]/95 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/25 text-blue-100">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
              <path d="M3 10.5 12 3l9 7.5M6 9v11h12V9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-base font-semibold text-white">
            Trusted<span className="text-blue-300">Home</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-blue-200/90">Wallet</span>
            <span className="min-w-[5.5rem] text-xs font-semibold tabular-nums text-white">
              {showWalletBalance ? formattedBalance : '••••••••'}
            </span>
            <button
              type="button"
              onClick={() => setShowWalletBalance((v) => !v)}
              aria-label={showWalletBalance ? 'Hide wallet balance' : 'Show wallet balance'}
              className="rounded p-0.5 text-blue-100 transition hover:bg-white/15 hover:text-white"
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
                    isActive ? 'bg-blue-500/25 text-white' : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
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
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-xs transition ${
                  isActive ? 'bg-blue-500/25 text-white' : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              Profile
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
