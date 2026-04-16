import { Link, NavLink } from 'react-router-dom'
import { properties } from '../data/properties'

function formatNaira(amount, purpose) {
  const value = `₦${new Intl.NumberFormat('en-NG').format(amount)}`
  if (purpose === 'Rent') return `${value} / year`
  if (purpose === 'Lease') return `${value} / m²`
  return value
}

const savedSearches = [
  { id: 's1', label: '3 bedroom apartments in Victoria Island', results: 120, daysAgo: 5 },
  { id: 's2', label: 'Houses for sale under ₦50M in Lekki', results: 42, daysAgo: 12 },
  { id: 's3', label: 'Office space in Ikoyi', results: 18, daysAgo: 3 },
]

const recentActivity = [
  {
    id: 'a1',
    text: 'You saved Luxury 5 Bedroom Duplex',
    sub: 'Lekki Phase 1',
    time: '2 hours ago',
    thumb: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=120&q=60',
    icon: 'heart',
  },
  {
    id: 'a2',
    text: 'You scheduled a viewing',
    sub: 'Marina Glassfront Residence',
    time: 'Yesterday',
    thumb: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=120&q=60',
    icon: 'cal',
  },
  {
    id: 'a3',
    text: 'You placed a bid',
    sub: 'Auction · Skyline Trade Tower',
    time: '3 days ago',
    thumb: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=120&q=60',
    icon: 'bid',
  },
  {
    id: 'a4',
    text: 'You contacted John Okafor',
    sub: 'Messages',
    time: '5 days ago',
    thumb: null,
    icon: 'msg',
  },
]

const stats = [
  { label: 'Saved Properties', value: 18 },
  { label: 'Saved Searches', value: 4 },
  { label: 'Upcoming Viewings', value: 3 },
  { label: 'Active Bids', value: 2 },
  { label: 'Properties Listed', value: 1 },
]

function NavIcon({ type, className = 'h-4 w-4' }) {
  switch (type) {
    case 'overview':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'building':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <path d="M3 21h18M6 21V7l6-4 6 4v14M10 21v-4h4v4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'heart':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'search':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <circle cx="11" cy="11" r="7" strokeWidth="1.8" />
          <path d="M20 20l-3-3" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'message':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'eye':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
        </svg>
      )
    case 'hammer':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'card':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="1.8" />
          <path d="M2 10h20" strokeWidth="1.8" />
        </svg>
      )
    case 'star':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    default:
      return <span className={className} />
  }
}

function ActivityIcon({ type }) {
  const c = 'h-4 w-4 text-blue-600'
  if (type === 'heart')
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="1.8" />
      </svg>
    )
  if (type === 'cal')
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor">
        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.8" />
        <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  if (type === 'bid')
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeWidth="1.8" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" strokeWidth="1.8" />
    </svg>
  )
}

function ProfilePage() {
  const savedStrip = properties.slice(0, 6)

  return (
    <div className="flex w-full max-w-[1440px] flex-col gap-6 pb-10 lg:flex-row lg:items-start">
      {/* Sidebar */}
      <aside className="w-full shrink-0 space-y-4 lg:sticky lg:top-24 lg:w-[260px]">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Account</p>
          <nav className="space-y-0.5">
            <NavLink
              to="/profile"
              end
              className={({ isActive }) =>
                `flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <NavIcon type="overview" />
              Profile Overview
            </NavLink>
            <Link
              to="/explore"
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <NavIcon type="building" />
              My Properties
            </Link>
            <Link
              to="/saved"
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <NavIcon type="heart" />
              Saved
            </Link>
            <a
              href="#your-searches"
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <NavIcon type="search" />
              Searches
            </a>
            <Link
              to="/messages"
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <span className="flex items-center gap-2.5">
                <NavIcon type="message" />
                Messages
              </span>
              <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">3</span>
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <NavIcon type="eye" />
              Viewings
            </button>
            <Link
              to="/auctions"
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <NavIcon type="hammer" />
              Bids
            </Link>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <NavIcon type="card" />
              Transactions
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <NavIcon type="star" />
              Reviews
            </button>
            <a
              href="#account-settings"
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50"
            >
              <NavIcon type="settings" />
              Settings
            </a>
          </nav>
        </div>

        <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-600 to-indigo-700 p-4 text-white shadow-sm">
          <p className="text-sm font-semibold">TrustedHome Pro</p>
          <ul className="mt-2 space-y-1.5 text-[11px] text-blue-100">
            <li>• Unlimited saved searches</li>
            <li>• Priority support</li>
            <li>• Featured listing boosts</li>
          </ul>
          <button
            type="button"
            className="mt-3 w-full rounded-lg bg-white py-2 text-xs font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
          >
            Upgrade Now
          </button>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-900">Need help?</p>
          <p className="mt-1 text-xs text-slate-500">Our team is here for account and listing questions.</p>
          <Link
            to="/messages"
            className="mt-3 block w-full rounded-lg border border-slate-200 bg-white py-2 text-center text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Contact Support
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Hero */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-[#0f172a] shadow-sm">
          <div className="flex flex-col md:flex-row md:items-stretch">
            <div className="relative flex flex-1 flex-col justify-between p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex gap-4">
                  <div className="relative shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80"
                      alt=""
                      className="h-20 w-20 rounded-full object-cover ring-4 ring-white/10"
                    />
                    <span
                      className="absolute bottom-0 right-0 grid h-6 w-6 place-items-center rounded-full bg-blue-600 ring-2 ring-[#0f172a]"
                      title="Verified"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-white" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    </span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">Daniel Emmanuel</h1>
                    <p className="mt-1 text-sm text-slate-300">daniel.emmanuel@trustedhome.app</p>
                    <p className="text-sm text-slate-300">+234 803 456 7890</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeWidth="1.8" />
                        <circle cx="12" cy="10" r="3" strokeWidth="1.8" />
                      </svg>
                      Lagos, Nigeria
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
                >
                  Edit Profile
                </button>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/10 pt-6 sm:grid-cols-3 lg:grid-cols-5">
                {stats.map((s) => (
                  <div key={s.label} className="text-center md:text-left">
                    <p className="text-2xl font-bold tabular-nums text-white">{s.value}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative min-h-[200px] md:w-[38%] md:min-h-[280px]">
              <img
                src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=900&q=80"
                alt=""
                className="h-full w-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f172a]/80 via-transparent to-transparent md:bg-gradient-to-l" />
            </div>
          </div>
        </div>

        {/* Saved properties */}
        <section id="saved-properties" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">Saved Properties</h2>
            <Link to="/saved" className="text-xs font-medium text-blue-600 hover:underline">
              View all
            </Link>
          </div>
          <div className="thin-scroll flex gap-4 overflow-x-auto pb-1">
            {savedStrip.map((p) => (
              <Link
                key={p.id}
                to={`/property/${p.id}`}
                className="w-[260px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="relative aspect-[4/3]">
                  <img src={p.image} alt="" className="h-full w-full object-cover" />
                  <span className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-red-500 shadow-sm">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </span>
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-blue-600">{formatNaira(p.price, p.purpose)}</p>
                  <p className="mt-0.5 line-clamp-1 text-sm font-medium text-slate-900">{p.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{p.location}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-slate-500">
                    {p.bedrooms > 0 ? (
                      <>
                        <span>{p.bedrooms} beds</span>
                        <span>·</span>
                      </>
                    ) : null}
                    <span>{p.bathrooms} baths</span>
                    <span>·</span>
                    <span>{p.area.toLocaleString()} ft²</span>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-400">Saved 2 weeks ago</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent activity */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
            <ul className="mt-4 divide-y divide-slate-100">
              {recentActivity.map((a) => (
                <li key={a.id} className="flex gap-3 py-3 first:pt-0">
                  {a.thumb ? (
                    <img src={a.thumb} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-50">
                      <ActivityIcon type={a.icon} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">{a.text}</p>
                    <p className="text-xs text-slate-500">{a.sub}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{a.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Your searches */}
          <section id="your-searches" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Your Searches</h2>
            <ul className="mt-4 space-y-3">
              {savedSearches.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm text-slate-800">{s.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {s.results} results · Saved {s.daysAgo} {s.daysAgo === 1 ? 'day' : 'days'} ago
                    </p>
                  </div>
                  <Link to="/explore" className="shrink-0 text-xs font-medium text-blue-600 hover:underline">
                    Run
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Account settings */}
          <section id="account-settings" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Account Settings</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {[
                { label: 'Personal Information', icon: 'user' },
                { label: 'Change Password', icon: 'lock' },
                { label: 'Notification Preferences', icon: 'bell' },
                { label: 'Privacy & Security', icon: 'shield' },
                { label: 'Connected Accounts', icon: 'link' },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-3 text-left text-sm text-slate-700 transition hover:text-blue-600"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-slate-400">→</span>
                      {item.label}
                    </span>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-300" fill="none" stroke="currentColor">
                      <path d="M9 18l6-6-6-6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {/* Verification */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Verification Status</h2>
            <p className="mt-1 text-xs text-slate-500">Your account is verified for safer transactions.</p>
            <ul className="mt-4 space-y-3">
              {[
                'Email Address',
                'Phone Number',
                'Identity Verification',
                'Payment Method · **** **** **** 2345',
              ].map((label) => (
                <li key={label} className="flex items-center gap-2 text-sm text-slate-700">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* List CTA */}
        <div className="flex flex-col items-stretch justify-between gap-4 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 shadow-sm sm:flex-row sm:items-center">
          <div>
            <h3 className="text-base font-semibold text-slate-900">List your property</h3>
            <p className="mt-1 text-sm text-slate-600">Reach thousands of buyers and renters across Nigeria.</p>
          </div>
          <Link
            to="/explore"
            className="inline-flex shrink-0 items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500"
          >
            List a Property
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
