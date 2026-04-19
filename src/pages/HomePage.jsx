import { NavLink, useNavigate } from 'react-router-dom'
import { properties } from '../data/properties'
import { useEffect, useRef, useState } from 'react'
import CustomDropdown from '../components/CustomDropdown'
import { useAuth } from '../context/AuthContext'
import { useWallet } from '../context/WalletContext'

function HomePageIcon({ type, className = 'h-5 w-5' }) {
  const common = { className, fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }
  if (type === 'building')
    return (
      <svg {...common}>
        <path d="M4 20h16M7 20V7l5-3 5 3v13M9 10h.01M12 10h.01M15 10h.01M9 13h.01M12 13h.01M15 13h.01" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  if (type === 'home')
    return (
      <svg {...common}>
        <path d="m3 11 9-7 9 7M6 9.5V20h12V9.5M10 20v-5h4v5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (type === 'briefcase')
    return (
      <svg {...common}>
        <path d="M8 7V5h8v2M4 9h16v10H4zM4 13h16" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (type === 'calendar')
    return (
      <svg {...common}>
        <path d="M7 3v3M17 3v3M4 8h16M5 6h14v14H5z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (type === 'spark')
    return (
      <svg {...common}>
        <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8ZM5 17l1 2 2 1-2 1-1 2-1-2-2-1 2-1zM19 15l.7 1.5L21 17l-1.3.5L19 19l-.7-1.5L17 17l1.3-.5z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (type === 'shield')
    return (
      <svg {...common}>
        <path d="m12 3 7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (type === 'clock')
    return (
      <svg {...common}>
        <path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (type === 'safe')
    return (
      <svg {...common}>
        <path d="M4 6h16v12H4zM9 12h6M12 9v6M6 9h.01M18 9h.01M6 15h.01M18 15h.01" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (type === 'support')
    return (
      <svg {...common}>
        <path d="M5 12a7 7 0 0 1 14 0v3a2 2 0 0 1-2 2h-2v-4h4M5 13h4v4H7a2 2 0 0 1-2-2zM12 21v-2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  return (
    <svg {...common}>
      <path d="M4 12h4l3 3 6-6 3 3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const headerNavLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/explore', label: 'Explore' },
  { to: '/auctions', label: 'Auctions' },
  { to: '/saved', label: 'Saved' },
  { to: '/messages', label: 'Messages', badge: 3 },
  { to: '/profile', label: 'Profile' },
]

function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { balance } = useWallet()
  const [showWalletBalance, setShowWalletBalance] = useState(true)
  const [listingType, setListingType] = useState('Rent')
  const [propertyType, setPropertyType] = useState('House')
  const [roomCount, setRoomCount] = useState('2 Rooms')
  const [minPrice, setMinPrice] = useState(4500000)
  const [maxPrice, setMaxPrice] = useState(12000000)
  const [priceDisplayCurrency, setPriceDisplayCurrency] = useState('NGN (₦)')
  const featured = properties.filter((property) => property.isFeatured).slice(0, 4)
  const nearby = properties.filter((property) => property.isNearby).slice(0, 4)
  const heroImage = featured[0]?.image?.replace('w=1000', 'w=2200')
  const categories = [
    { label: 'Apartments', count: '12,456 properties', icon: 'building' },
    { label: 'Houses', count: '8,920 properties', icon: 'home' },
    { label: 'Office Spaces', count: '2,340 properties', icon: 'briefcase' },
    { label: 'Short Stays', count: '4,560 properties', icon: 'calendar' },
    { label: 'New Developments', count: '1,240 properties', icon: 'spark' },
  ]
  const locations = [
    { name: 'Lekki', count: '8,456 properties', image: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=900&q=80' },
    { name: 'Victoria Island', count: '6,320 properties', image: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=900&q=80' },
    { name: 'Ikoyi', count: '4,230 properties', image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=900&q=80' },
    { name: 'Ajah', count: '3,120 properties', image: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=900&q=80' },
    { name: 'Yaba', count: '2,450 properties', image: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=900&q=80' },
    { name: 'Surulere', count: '1,850 properties', image: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=900&q=80' },
  ]
  const trustItems = [
    { title: 'Verified Listings', text: 'Every property is verified for your safety and peace of mind.', icon: 'shield' },
    { title: 'Fast & Easy', text: 'Find and secure your next property in just a few clicks.', icon: 'clock' },
    { title: 'Secure Payments', text: 'Safe and secure payment process for all transactions.', icon: 'safe' },
    { title: '24/7 Support', text: 'Our team is here to help you anytime, anywhere.', icon: 'support' },
  ]
  const testimonials = [
    {
      name: 'Adesuwa A.',
      location: 'Lekki, Lagos',
      quote: 'TrustedHome made finding my dream apartment so easy. The process was smooth and the agent was super helpful.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    },
    {
      name: 'Emeka N.',
      location: 'Victoria Island, Lagos',
      quote: 'I got the best office space for my team thanks to their fast response and professional service. Highly recommended!',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    },
    {
      name: 'Chidinma K.',
      location: 'Ajah, Lagos',
      quote: 'From browsing to booking, everything was seamless. I felt supported every step of the way.',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80',
    },
  ]
  const minBound = 500000
  const maxBound = 30000000
  const formatNaira = (amount) => `₦ ${new Intl.NumberFormat('en-NG').format(amount)}`
  const walletDisplay = `₦${new Intl.NumberFormat('en-NG').format(balance)}`

  return (
    <section className="space-y-0 pb-0">
      <div className="border-y border-[#e8d39a]/60 bg-gradient-to-br from-[#f4fbff] via-[#f7f0db] to-[#efd58b] px-4 py-4 shadow-[0_22px_70px_rgba(232,188,74,0.28)] md:px-6 md:py-5">
        <div className="rounded-2xl border border-[#d8e6ff]/80 bg-white/70 p-3 backdrop-blur-xl md:px-4">
          <div className="grid items-center gap-3 md:grid-cols-[170px_1fr_auto]">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-100">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-700" fill="none" stroke="currentColor">
                  <path d="M3 10.5 12 3l9 7.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M6 9v11h12V9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-blue-950">TrustedHome</p>
            </div>

            <button
              onClick={() => navigate('/explore')}
              className="hidden w-full items-center gap-2 rounded-full border border-blue-100/90 bg-white/85 px-4 py-2 text-left text-xs text-slate-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] lg:flex"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                <path d="M11 4a7 7 0 1 0 4.95 11.95L20 20" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Search location, property...
            </button>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="hidden items-center gap-1.5 rounded-lg border border-blue-100/90 bg-white/90 px-2.5 py-1.5 shadow-sm sm:flex">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Wallet</span>
                <span className="min-w-[5.5rem] text-xs font-semibold tabular-nums text-slate-800">
                  {showWalletBalance ? walletDisplay : '••••••••'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowWalletBalance((v) => !v)}
                  aria-label={showWalletBalance ? 'Hide wallet balance' : 'Show wallet balance'}
                  className="rounded p-0.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  {showWalletBalance ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                      <path
                        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path d="m1 1 22 22" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </div>

              <nav className="flex flex-wrap items-center justify-end gap-1">
                {headerNavLinks
                  .filter((link) => !(user && link.to === '/profile'))
                  .map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      end={link.end}
                      className={({ isActive }) =>
                        `inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          isActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-700 hover:bg-white/80'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {link.label}
                          {link.badge != null && (
                            <span
                              className={`min-w-[1rem] rounded-full px-1 py-0.5 text-center text-[10px] font-bold leading-none text-white ${
                                isActive ? 'bg-white/25' : 'bg-blue-500'
                              }`}
                            >
                              {link.badge}
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  ))}
              </nav>

              {user ? (
                <NavLink
                  to="/profile"
                  title={user.displayName}
                  className="inline-flex shrink-0 rounded-full p-0.5 ring-2 ring-transparent transition hover:ring-blue-300/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover ring-2 ring-slate-200"
                  />
                </NavLink>
              ) : (
                <NavLink
                  to="/login"
                  className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Log in
                </NavLink>
              )}

              <NavLink
                to="/add-listing"
                className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-500"
              >
                <svg viewBox="0 0 24 24" className="mr-1 h-3.5 w-3.5" fill="none" stroke="currentColor">
                  <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Add Listing
              </NavLink>
            </div>
          </div>
        </div>

        <div className="mt-3 grid gap-3 xl:grid-cols-[1fr_280px]">
          <div className="rounded-2xl border border-blue-100/80 bg-white/78 p-4 backdrop-blur-xl">
            <div className="grid gap-3 lg:grid-cols-[1.05fr_0.95fr]">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-blue-600/85">Premium Real Estate Platform</p>
                <h1 className="mt-2 max-w-xl text-3xl font-semibold leading-tight text-slate-900 md:text-[2.25rem]">
                  Find Your Next Home, Office, Or Investment In Minutes
                </h1>
                <p className="mt-2 max-w-lg text-2xl text-slate-800">
                  Discover premium listings around Lagos with transparent pricing, verified agents, and fast scheduling.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['Rent', 'Sale', 'Lease', 'Office', 'Short Stay'].map((pill) => (
                    <button
                      key={pill}
                      type="button"
                      onClick={() => setListingType(pill)}
                      className={`rounded-full px-3 py-1.5 text-xs ${
                        listingType === pill ? 'bg-blue-600 text-white' : 'border border-blue-100 bg-white text-slate-700'
                      }`}
                    >
                      {pill}
                    </button>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-blue-100 bg-white/95 p-3 text-slate-700 shadow-sm backdrop-blur">
                  <div className="grid gap-2 md:grid-cols-[110px_1fr_110px]">
                    <CustomDropdown
                      variant="hero"
                      value={listingType}
                      onChange={setListingType}
                      options={['Rent', 'Sale', 'Lease', 'Short Stay']}
                    />
                    <div className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs text-slate-500">
                      Your desired location goes here
                    </div>
                    <CustomDropdown
                      variant="hero"
                      value={propertyType}
                      onChange={setPropertyType}
                      options={['House', 'Apartment', 'Office', 'Commercial']}
                    />
                  </div>

                  <div className="mt-2 grid items-center gap-2 md:grid-cols-[110px_1fr_110px]">
                    <button
                      type="button"
                      onClick={() =>
                        setPriceDisplayCurrency((current) => (current === 'NGN (₦)' ? 'USD ($)' : 'NGN (₦)'))
                      }
                      className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-left text-xs text-slate-700"
                    >
                      {priceDisplayCurrency}
                    </button>

                    <div className="px-2">
                      <div className="relative h-6">
                        <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-blue-100" />
                        <div
                          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-blue-500"
                          style={{
                            left: `${((minPrice - minBound) / (maxBound - minBound)) * 100}%`,
                            right: `${100 - ((maxPrice - minBound) / (maxBound - minBound)) * 100}%`,
                          }}
                        />
                        <input
                          type="range"
                          min={minBound}
                          max={maxBound}
                          step={100000}
                          value={minPrice}
                          onChange={(event) => {
                            const value = Number(event.target.value)
                            setMinPrice(Math.min(value, maxPrice - 100000))
                          }}
                          className="range-thumb absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 appearance-none bg-transparent"
                        />
                        <input
                          type="range"
                          min={minBound}
                          max={maxBound}
                          step={100000}
                          value={maxPrice}
                          onChange={(event) => {
                            const value = Number(event.target.value)
                            setMaxPrice(Math.max(value, minPrice + 100000))
                          }}
                          className="range-thumb absolute left-0 top-1/2 h-1 w-full -translate-y-1/2 appearance-none bg-transparent"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-white">{formatNaira(minPrice)}</span>
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-white">{formatNaira(maxPrice)}</span>
                      </div>
                    </div>

                    <CustomDropdown
                      variant="hero"
                      value={roomCount}
                      onChange={setRoomCount}
                      options={['1 Room', '2 Rooms', '3 Rooms', '4+ Rooms']}
                    />
                  </div>
                </div>
              </div>

              <article className="relative overflow-hidden rounded-2xl border border-blue-100/80 shadow-sm">
                <img src={heroImage} alt="Featured property" className="h-full min-h-[250px] w-full object-cover lg:min-h-[270px]" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-white/40 bg-slate-900/55 px-3 py-2 text-xs text-white backdrop-blur">
                  <p className="font-semibold">{featured[0]?.title || 'Ocean Crest Smart Villa'}</p>
                  <p className="text-slate-200">{featured[0]?.location || 'Lekki Phase 1, Lagos'}</p>
                </div>
              </article>
            </div>

            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_120px]">
              <button
                onClick={() => navigate('/explore')}
                className="flex w-full items-center justify-between rounded-xl border border-blue-100 bg-white px-4 py-3 text-left text-sm text-slate-600"
              >
                <span>Search location, property...</span>
                <span className="rounded-lg bg-blue-600 px-2 py-1 text-xs text-white">3 filters</span>
              </button>
              <button
                onClick={() => navigate('/explore')}
                className="rounded-xl bg-[#f5b700] px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-[#e5ab00]"
              >
                Search
              </button>
            </div>
          </div>

          <aside className="rounded-2xl border border-[#ecd79f] bg-[#fff5dc]/85 p-3 text-slate-900 backdrop-blur-xl xl:mt-0.5 xl:flex xl:self-stretch">
            <div className="flex w-full flex-col">
            <div className="flex items-center justify-between px-1 py-1">
              <h3 className="text-xs text-slate-600">Market Insights</h3>
              <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">Live</span>
            </div>
            <div className="space-y-2 xl:mt-1 xl:grid xl:h-full xl:auto-rows-fr xl:space-y-0 xl:gap-2">
              <article className="rounded-xl border border-amber-100 bg-white/75 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-blue-700">
                      <HomePageIcon type="building" className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[11px] text-slate-500">Active Listings</p>
                      <p className="mt-0.5 text-2xl font-semibold leading-none">2,438</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">+8.2%</span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-blue-100">
                  <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
                </div>
              </article>

              <article className="rounded-xl border border-amber-100 bg-white/75 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-100 text-amber-700">
                      <HomePageIcon type="clock" className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-[11px] text-slate-500">Average Rent</p>
                      <p className="mt-0.5 text-2xl font-semibold leading-none">N 4,260</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-700">/month</span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <img
                    src="https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=120&q=70"
                    alt="Rental trend"
                    className="h-8 w-10 rounded-md object-cover"
                  />
                  <p className="text-[11px] text-slate-600">Most demand in Lekki and Victoria Island this week.</p>
                </div>
              </article>

              <article className="rounded-xl border border-amber-100 bg-white/75 p-3">
                <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-blue-700">
                      <HomePageIcon type="spark" className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-500">Top Zone</p>
                      <p className="mt-0.5 truncate text-sm font-semibold">Victoria Island</p>
                    </div>
                  </div>
                  <img
                    src="https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=180&q=70"
                    alt="Victoria Island"
                    className="h-10 w-14 flex-shrink-0 rounded-lg border border-amber-100 object-cover"
                  />
                </div>
                <p className="mt-2 text-[11px] text-slate-600">Premium waterfront listings and strongest conversion rate.</p>
              </article>
            </div>
            </div>
          </aside>
        </div>

        <div className="mt-3 space-y-3 rounded-2xl border border-blue-300/20 bg-[#163cae]/85 p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-blue-100/95">Featured Listings</h3>
            <button onClick={() => navigate('/explore')} className="text-xs text-blue-100/80 hover:text-white">
              View all
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {featured.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-xl border border-blue-200/20 bg-[#0f2f96]/85">
                <img src={item.image} alt={item.title} className="h-32 w-full object-cover" />
                <div className="space-y-1 p-2.5 text-white">
                  <p className="text-[11px] text-blue-100/75">{item.location}</p>
                  <p className="truncate text-xs font-semibold">{item.title}</p>
                  <button
                    onClick={() => navigate(`/property/${item.id}`)}
                    className="mt-1 rounded-md border border-blue-200/25 bg-white/10 px-2 py-1 text-[11px] text-blue-100"
                  >
                    View Property
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-3 space-y-3 rounded-2xl border border-blue-300/20 bg-[#163cae]/85 p-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-blue-100/95">Nearby Listings</h3>
            <button onClick={() => navigate('/explore')} className="text-xs text-blue-100/80 hover:text-white">
              View all
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {nearby.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-xl border border-blue-200/20 bg-[#0f2f96]/85">
                <img src={item.image} alt={item.title} className="h-28 w-full object-cover" />
                <div className="space-y-1 p-2.5 text-white">
                  <p className="truncate text-xs font-semibold">{item.title}</p>
                  <p className="text-[11px] text-blue-100/75">{item.location}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#f3f5f9] px-4 py-6 text-slate-900 md:px-6 md:py-8">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-800">Featured Properties</h2>
              <p className="text-sm text-slate-500">Handpicked premium properties for you</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/explore')}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-blue-600"
            >
              View all properties
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {featured.map((item, index) => (
              <article key={item.id} className="group relative overflow-hidden rounded-2xl">
                <img src={item.image} alt={item.title} className="h-52 w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />
                <div className="absolute left-3 top-3 rounded-full bg-blue-500/90 px-2 py-1 text-[11px] text-white">
                  {index === 0 ? 'For Rent' : index === 1 ? 'For Sale' : index === 2 ? 'Office Space' : 'Short Stay'}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <p className="text-2xl font-semibold">N{item.price.toLocaleString()}</p>
                  <p className="text-sm text-blue-100/90">{item.location}</p>
                  <div className="mt-2 flex gap-3 text-xs text-blue-100/90">
                    <span>{item.bedrooms || 0} Beds</span>
                    <span>{item.bathrooms} Baths</span>
                    <span>{item.area} m²</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 space-y-3">
          <div>
            <h3 className="text-2xl font-semibold text-slate-800">Browse by Category</h3>
            <p className="text-sm text-slate-500">Explore properties that fit your needs</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
            {categories.map((category) => (
              <article key={category.label} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-600">
                    <HomePageIcon type={category.icon} className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{category.label}</p>
                    <p className="text-xs text-slate-500">{category.count}</p>
                  </div>
                </div>
                <span className="text-slate-400">›</span>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-slate-800">Popular Locations</h3>
              <p className="text-sm text-slate-500">Discover properties in top locations</p>
            </div>
            <button type="button" onClick={() => navigate('/explore')} className="text-sm text-blue-600">
              View all locations
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {locations.map((location) => (
              <article key={location.name} className="relative overflow-hidden rounded-xl">
                <img src={location.image} alt={location.name} className="h-32 w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-2 left-3 text-white">
                  <p className="font-medium">{location.name}</p>
                  <p className="text-xs text-blue-100">{location.count}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-[#1e3a9e] via-[#2748bd] to-[#1f3ca3] p-4 text-white md:p-5">
          <div className="grid items-center gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-blue-100">
                NEED HELP?
              </span>
              <h3 className="mt-2 text-3xl font-semibold leading-tight md:text-[2rem]">Talk to a verified agent today</h3>
              <p className="mt-2 max-w-xl text-sm text-blue-100/90">
                Get personalized guidance, schedule property visits, and make informed decisions with ease.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => (window.location.href = 'tel:+2348093001123')}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-blue-900/30"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                    <path d="M5 4h3l2 5-2 1.5a14 14 0 0 0 5.5 5.5L15 14l5 2v3a2 2 0 0 1-2 2h-1C10.4 21 3 13.6 3 7V6a2 2 0 0 1 2-2z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Call Agent Now
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/explore')}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm text-blue-100"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                    <path d="M7 3v3M17 3v3M4 8h16M5 6h14v14H5z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Schedule a Visit
                </button>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-5 text-xs text-blue-100/90">
                <span className="inline-flex items-center gap-1.5"><HomePageIcon type="shield" className="h-4 w-4" />Verified Agents</span>
                <span className="inline-flex items-center gap-1.5"><HomePageIcon type="clock" className="h-4 w-4" />Fast Response</span>
                <span className="inline-flex items-center gap-1.5"><HomePageIcon type="safe" className="h-4 w-4" />Secure & Safe</span>
              </div>
            </div>
            <div className="relative h-[240px] overflow-hidden rounded-2xl border border-white/20 md:h-[250px]">
              <img
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=1200&q=80"
                alt="Verified agent"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/70 via-transparent to-transparent" />
              <article className="absolute bottom-4 right-4 rounded-xl border border-white/20 bg-white/90 px-3 py-2 text-slate-800">
                <p className="text-[11px] text-emerald-600">● Available Now</p>
                <p className="text-sm font-semibold">John Okafor</p>
                <p className="text-[11px] text-slate-500">Senior Property Consultant</p>
              </article>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
          <div className="mb-4 text-center">
            <p className="mx-auto inline-block rounded-full bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-600">OUR ADVANTAGES</p>
            <h3 className="mt-2 text-3xl font-semibold text-slate-800">Why choose TrustedHome?</h3>
            <p className="mt-1 text-sm text-slate-500">We make real estate simple, transparent, and rewarding.</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {trustItems.map((item) => (
              <article key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <HomePageIcon type={item.icon} className="h-5 w-5" />
                </div>
                <p className="font-medium text-slate-800">{item.title}</p>
                <p className="mt-2 text-sm text-slate-500">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-2xl bg-[#eef1f7] p-4 md:p-6">
          <div className="text-center">
            <p className="mx-auto inline-block rounded-full bg-blue-100 px-3 py-1 text-[11px] font-medium text-blue-700">TESTIMONIALS</p>
            <h3 className="mt-2 text-4xl font-semibold text-slate-800">What our clients say</h3>
            <p className="mt-1 text-sm text-slate-500">Real experiences from people who found their perfect space.</p>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.name} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-blue-600">❝</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.quote}</p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <img src={item.avatar} alt={item.name} className="h-9 w-9 rounded-full object-cover" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.location}</p>
                    </div>
                  </div>
                  <p className="text-xs text-amber-500">★★★★★</p>
                </div>
              </article>
            ))}
          </div>
        </section>

      </div>
    </section>
  )
}

export default HomePage
