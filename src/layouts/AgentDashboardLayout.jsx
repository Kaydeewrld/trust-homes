import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import AgentDashboardSidebar from '../components/agent/AgentDashboardSidebar'
import { useToast } from '../context/ToastContext'

export default function AgentDashboardLayout() {
  const location = useLocation()
  const toast = useToast()
  /** Full-height shell handles its own scrolling (no double scrollbar with window). */
  const outletIsScrollLocked = location.pathname === '/agent/leads'
  const [activePopover, setActivePopover] = useState(null)
  const actionsRef = useRef(null)

  useEffect(() => {
    const onDown = (e) => {
      if (!actionsRef.current?.contains(e.target)) setActivePopover(null)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') setActivePopover(null)
    }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    setActivePopover(null)
  }, [location.pathname])

  const notificationItems = [
    { id: 'n1', title: 'New lead message', detail: 'Chioma Eze sent a message · 2m ago' },
    { id: 'n2', title: 'Payout processed', detail: '₦120,000 was paid to GTBank · 1h ago' },
    { id: 'n3', title: 'Listing approved', detail: 'Waterfront Penthouse is now live · 3h ago' },
  ]

  const messageItems = [
    { id: 'm1', name: 'Chioma Eze', snippet: 'Can we schedule a viewing tomorrow?' },
    { id: 'm2', name: 'Ibrahim Bello', snippet: 'Is the listing still available?' },
    { id: 'm3', name: 'Nkechi Obi', snippet: 'Thanks, I have made the payment.' },
  ]

  return (
    <div className="flex h-full min-h-0 w-full flex-1 items-stretch bg-[#F9FAFB] font-agent text-[14px] leading-normal text-slate-800 antialiased">
      <AgentDashboardSidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden">
        <header className="flex shrink-0 items-center gap-4 border-b border-slate-200/90 bg-white px-5 py-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] md:gap-6 md:px-8">
          <div className="relative min-w-0 flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="search"
              placeholder="Search properties, leads, or anything..."
              className="h-12 w-full rounded-2xl border border-slate-200/90 bg-white pl-11 pr-[4.5rem] text-[14px] text-slate-800 shadow-sm placeholder:text-slate-400 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 font-mono text-[11px] font-medium text-slate-400 sm:flex">
              <span className="opacity-70">[</span>
              <kbd className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5">/</kbd>
              <span className="opacity-70">]</span>
            </span>
          </div>
          <div ref={actionsRef} className="flex shrink-0 items-center gap-2 md:gap-3">
            <div className="relative">
              <button
                type="button"
                className={`relative grid h-10 w-10 place-items-center rounded-xl border bg-white text-slate-600 transition hover:bg-slate-50 ${
                  activePopover === 'notifications' ? 'border-indigo-300 ring-2 ring-indigo-500/15' : 'border-slate-200'
                }`}
                aria-label="Notifications"
                aria-expanded={activePopover === 'notifications'}
                onClick={() => setActivePopover((p) => (p === 'notifications' ? null : 'notifications'))}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 7h18s-3 0-3-7M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
                </svg>
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  3
                </span>
              </button>
              {activePopover === 'notifications' ? (
                <div className="absolute right-0 top-[calc(100%+0.55rem)] z-50 w-[320px] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)]">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <p className="text-[13px] font-bold text-[#111827]">Notifications</p>
                    <button
                      type="button"
                      onClick={() => toast.success('Notifications cleared', 'All notifications have been marked as read.')}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      Mark all read
                    </button>
                  </div>
                  <ul className="max-h-[320px] overflow-y-auto">
                    {notificationItems.map((n) => (
                      <li key={n.id} className="border-b border-slate-100 last:border-0">
                        <button type="button" className="w-full px-4 py-3 text-left transition hover:bg-slate-50">
                          <p className="text-[13px] font-semibold text-slate-800">{n.title}</p>
                          <p className="mt-0.5 text-[12px] text-slate-500">{n.detail}</p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="relative">
              <button
                type="button"
                className={`relative grid h-10 w-10 place-items-center rounded-xl border bg-white text-slate-600 transition hover:bg-slate-50 ${
                  activePopover === 'messages' ? 'border-indigo-300 ring-2 ring-indigo-500/15' : 'border-slate-200'
                }`}
                aria-label="Messages"
                aria-expanded={activePopover === 'messages'}
                onClick={() => setActivePopover((p) => (p === 'messages' ? null : 'messages'))}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" strokeLinejoin="round" />
                </svg>
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  6
                </span>
              </button>
              {activePopover === 'messages' ? (
                <div className="absolute right-0 top-[calc(100%+0.55rem)] z-50 w-[320px] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)]">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-[13px] font-bold text-[#111827]">Recent Messages</p>
                  </div>
                  <ul className="max-h-[320px] overflow-y-auto">
                    {messageItems.map((m) => (
                      <li key={m.id} className="border-b border-slate-100 last:border-0">
                        <Link to="/agent/leads" className="block px-4 py-3 transition hover:bg-slate-50">
                          <p className="text-[13px] font-semibold text-slate-800">{m.name}</p>
                          <p className="mt-0.5 text-[12px] text-slate-500">{m.snippet}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <div className="relative flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-[13px] font-semibold leading-tight text-[#111827]">John Doe</p>
                <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] font-semibold text-emerald-600">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Verified Agent
                </p>
              </div>
              <button
                type="button"
                aria-label="Open account menu"
                aria-expanded={activePopover === 'account'}
                onClick={() => setActivePopover((p) => (p === 'account' ? null : 'account'))}
                className={`relative rounded-full outline-none transition ${activePopover === 'account' ? 'ring-2 ring-indigo-400/60 ring-offset-2' : ''}`}
              >
                <img
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=96&q=80"
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-slate-100"
                />
              </button>
              {activePopover === 'account' ? (
                <div className="absolute right-0 top-[calc(100%+0.55rem)] z-50 w-[220px] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)]">
                  <div className="border-b border-slate-100 px-4 py-3">
                    <p className="text-[13px] font-bold text-[#111827]">John Doe</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">Verified Agent</p>
                  </div>
                  <div className="p-1.5">
                    <Link to="/agent/profile" className="block rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50">
                      My Profile
                    </Link>
                    <Link to="/agent/settings" className="block rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 transition hover:bg-slate-50">
                      Settings
                    </Link>
                    <Link to="/login" className="block rounded-xl px-3 py-2 text-[13px] font-medium text-red-600 transition hover:bg-red-50">
                      Log out
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <div
          className={
            outletIsScrollLocked
              ? 'flex min-h-0 flex-1 flex-col overflow-hidden'
              : 'thin-scroll min-h-0 flex-1 overflow-y-auto overscroll-y-contain'
          }
        >
          <Outlet key={location.pathname} />
        </div>
      </div>
    </div>
  )
}
