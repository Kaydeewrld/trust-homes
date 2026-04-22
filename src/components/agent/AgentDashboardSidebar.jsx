import { useCallback, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useWallet } from '../../context/WalletContext'

const navItems = [
  { to: '/agent', label: 'Overview', end: true, icon: 'grid' },
  { to: '/agent/listings', label: 'My Listings', icon: 'layers' },
  { to: '/agent/add-listing', label: 'Add Listing', icon: 'plus' },
  { to: '/agent/promotions', label: 'Promote Listings', icon: 'rocket' },
  { to: '/agent/view-performance', label: 'View Performance', icon: 'trend' },
  { to: '/agent/leads', label: 'Leads & Messages', icon: 'chat', badge: '8' },
  { to: '/agent/earnings', label: 'Earnings & Payouts', icon: 'wallet' },
  { to: '/agent/transactions', label: 'Transactions', icon: 'swap' },
  { to: '/agent/profile', label: 'Profile', icon: 'user' },
  { to: '/agent/settings', label: 'Settings', icon: 'gear' },
]

const AGENT_REF_LINK = 'trustedhome.com?ref=agent_john'

function NavIcon({ kind, className }) {
  const c = className || 'h-5 w-5'
  switch (kind) {
    case 'grid':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" strokeLinejoin="round" />
        </svg>
      )
    case 'layers':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 2 2 7l10 5 10-5-10-5ZM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'plus-sq':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M12 8v8M8 12h8" strokeLinecap="round" />
        </svg>
      )
    case 'plus':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      )
    case 'rocket':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M4.5 16.5c-1-4 1-9 5-12 1 3 2 5 4 7 2 2 4 3 7 4 3-4 8-6 12-5-3 4-6 6-10 7-.5 3-2 6-4 8l-2-4-4-2-4 2 2-4Z" strokeLinejoin="round" />
          <path d="M9 15a3 3 0 1 0 0 .1" strokeLinecap="round" />
        </svg>
      )
    case 'chat':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" strokeLinejoin="round" />
        </svg>
      )
    case 'wallet':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M19 7V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1" />
          <path d="M3 10h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H3" />
          <path d="M16 14h.01" strokeLinecap="round" />
        </svg>
      )
    case 'trend':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M3 3v18h18" strokeLinecap="round" />
          <path d="m7 14 3-3 4 4 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'chart':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M3 3v18h18" strokeLinecap="round" />
          <path d="M7 12v5M12 8v9M17 5v12" strokeLinecap="round" />
        </svg>
      )
    case 'swap':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M7 7h13l-3-3M17 17H4l3 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'user':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    case 'gear':
      return (
        <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor" strokeWidth="1.75">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

function navItemIsActive(item, pathname, routeMatchActive) {
  const promotionsArea =
    item.to === '/agent/promotions' &&
    pathname.startsWith('/agent/promotions') &&
    !pathname.startsWith('/agent/promotions/performance/')
  const viewPerfArea =
    item.to === '/agent/view-performance' &&
    (pathname === '/agent/view-performance' || pathname.startsWith('/agent/promotions/performance/'))
  if (item.to === '/agent/view-performance') return routeMatchActive || viewPerfArea
  if (item.to === '/agent/promotions') return routeMatchActive || promotionsArea
  return routeMatchActive
}

/**
 * Agent dashboard left rail — single source of truth for all /agent/* routes.
 */
export default function AgentDashboardSidebar() {
  const location = useLocation()
  const pathname = location.pathname
  const { balance, openFundWallet } = useWallet()
  const [copied, setCopied] = useState(false)
  const walletDisplay = `₦${Number(balance).toLocaleString('en-NG')}`

  const copyRefLink = useCallback(() => {
    const text = `https://${AGENT_REF_LINK}`
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  return (
    <aside className="flex h-full min-h-0 w-[272px] shrink-0 flex-col self-stretch border-r border-slate-200/90 bg-white px-4 pb-5 pt-6 shadow-[2px_0_24px_rgba(15,23,42,0.04)]">
      <Link to="/" className="flex items-center gap-2.5 px-1 outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-indigo-400/60">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-500 text-white shadow-sm shadow-indigo-500/25">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 10.5 12 3l9 7.5M6 9v11h12V9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-lg font-bold tracking-tight text-indigo-600">TrustedHome</span>
      </Link>

      <p className="mt-8 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Agent dashboard</p>
      <nav className="mt-3 flex max-h-[min(560px,calc(100dvh-15rem))] shrink-0 flex-col gap-0.5 overflow-y-auto overflow-x-hidden thin-scroll pr-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className="block w-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2"
          >
            {({ isActive }) => {
              const navActive = navItemIsActive(item, pathname, isActive)
              return (
                <span
                  className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition ${
                    navActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {navActive ? (
                    <span
                      className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-indigo-500"
                      aria-hidden
                    />
                  ) : null}
                  <span className={navActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-500'}>
                    <NavIcon kind={item.icon} />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-indigo-600">
                      {item.badge}
                    </span>
                  ) : null}
                </span>
              )
            }}
          </NavLink>
        ))}
      </nav>

      <div className="mt-4 shrink-0 rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 p-4 text-white shadow-lg shadow-indigo-600/25">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/90">Wallet balance</p>
        <p className="mt-1.5 text-[22px] font-bold leading-none tabular-nums tracking-tight">{walletDisplay}</p>
        <p className="mt-2 text-[11px] leading-snug text-indigo-100/95">Available to spend or withdraw</p>
        <button
          type="button"
          onClick={openFundWallet}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
        >
          <span className="text-base font-bold leading-none">+</span>
          Fund Wallet
        </button>
      </div>

      <div className="mt-4 shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-4 text-white shadow-lg shadow-indigo-500/20">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">Your Agent Link</p>
          <button type="button" className="rounded-lg p-1 text-indigo-100 hover:bg-white/10" aria-label="About referral link">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#312e81]/90 px-3 py-2.5 shadow-inner ring-1 ring-black/10">
          <span className="min-w-0 flex-1 truncate text-[11px] font-medium leading-snug text-indigo-100">{AGENT_REF_LINK}</span>
          <button
            type="button"
            onClick={copyRefLink}
            className="shrink-0 rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20"
            aria-label="Copy link"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </div>
        <p className="mt-3 text-[12px] leading-snug text-indigo-100/95">Share your link and earn commission on every sale!</p>
        {copied ? <p className="mt-2 text-[11px] font-medium text-indigo-100">Copied to clipboard</p> : null}
        <button
          type="button"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-semibold text-indigo-600 shadow-sm transition hover:bg-indigo-50"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" strokeLinecap="round" />
          </svg>
          Share Link
        </button>
      </div>

      <Link
        to="/messages"
        className="mt-4 flex shrink-0 items-start gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 shadow-sm transition hover:bg-slate-50"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6" strokeLinecap="round" />
            <path
              d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="min-w-0 text-[13px] leading-snug text-slate-600">
          <span className="font-semibold text-slate-900">Need help?</span> Contact our support team.
        </p>
      </Link>

      <Link
        to="/login"
        className="mt-3 flex shrink-0 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Log out
      </Link>
    </aside>
  )
}
