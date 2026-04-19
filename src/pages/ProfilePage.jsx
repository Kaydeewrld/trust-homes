import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { properties } from '../data/properties'

function formatNaira(amount, purpose) {
  const value = `₦${new Intl.NumberFormat('en-NG').format(amount)}`
  if (purpose === 'Rent') return `${value} / year`
  if (purpose === 'Lease') return `${value} / m²`
  return value
}

const statItems = [
  { label: 'Saved Properties', value: 12, tone: 'bg-blue-100 text-blue-600', icon: 'heart' },
  { label: 'Inquiries', value: 3, tone: 'bg-indigo-100 text-indigo-600', icon: 'chat' },
  { label: 'Scheduled Visits', value: 2, tone: 'bg-emerald-100 text-emerald-600', icon: 'cal' },
  { label: 'Active Bids', value: 1, tone: 'bg-amber-100 text-amber-600', icon: 'bid' },
]

const tabItems = ['Overview', 'Saved Properties', 'Inquiries', 'Scheduled Visits', 'Bids', 'Settings']

const activityItems = [
  { id: 'a1', text: 'Saved a property in Ikoyi, Lagos', time: '2 hours ago', kind: 'heart' },
  { id: 'a2', text: 'Sent an inquiry for Luxury 4-Bedroom Duplex', time: '1 day ago', kind: 'chat' },
  { id: 'a3', text: 'Scheduled a visit for Modern Apartment', time: '3 days ago', kind: 'cal' },
]

const inquiryItems = [
  { id: 'iq-1', propertyId: 'th-001', text: 'Is this still available and can we negotiate on closing price?', status: 'Awaiting reply', time: '5h ago' },
  { id: 'iq-2', propertyId: 'th-002', text: 'Can I schedule a tour this Friday evening?', status: 'Agent replied', time: '1d ago' },
  { id: 'iq-3', propertyId: 'th-004', text: 'Please share service charge and title details.', status: 'Awaiting reply', time: '2d ago' },
]

const visitItems = [
  { id: 'vs-1', propertyId: 'th-001', day: 'Fri, Apr 19', time: '10:30 AM', status: 'Confirmed' },
  { id: 'vs-2', propertyId: 'th-006', day: 'Mon, Apr 22', time: '1:00 PM', status: 'Pending' },
]

const bidItems = [
  { id: 'bd-1', propertyId: 'th-009', myBid: 338000000, currentBid: 342000000, ends: 'Ends in 1d 5h' },
]

function TinyIcon({ kind, className = 'h-4 w-4' }) {
  if (kind === 'overview') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
        <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" strokeWidth="1.8" />
      </svg>
    )
  }
  if (kind === 'heart') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeWidth="1.8" />
      </svg>
    )
  }
  if (kind === 'chat') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" strokeWidth="1.8" />
      </svg>
    )
  }
  if (kind === 'cal') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
        <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="1.8" />
        <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  if (kind === 'settings') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" strokeWidth="1.8" />
    </svg>
  )
}

function ProfilePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const displayName = user?.displayName ?? 'Kaydee Wisdom'
  const emailDisplay = user?.email ?? 'kaydeewrld@gmail.com'
  const avatarSrc =
    user?.avatarUrl ??
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=220&q=80'

  const viewed = properties.slice(0, 4)
  const inquiries = inquiryItems
    .map((item) => ({ ...item, property: properties.find((p) => p.id === item.propertyId) }))
    .filter((item) => item.property)
  const visits = visitItems
    .map((item) => ({ ...item, property: properties.find((p) => p.id === item.propertyId) }))
    .filter((item) => item.property)
  const bids = bidItems
    .map((item) => ({ ...item, property: properties.find((p) => p.id === item.propertyId) }))
    .filter((item) => item.property)
  const fallbackHeroImage =
    properties[0]?.image ||
    'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1800&q=80'
  const [heroImage, setHeroImage] = useState(fallbackHeroImage)
  const [activeTab, setActiveTab] = useState('Overview')
  const filteredActivity = useMemo(() => activityItems, [])
  const showViewed = activeTab === 'Overview' || activeTab === 'Saved Properties'
  const showActivity = activeTab === 'Overview'
  const showAccount = activeTab === 'Overview'
  const showCta = activeTab === 'Overview'
  const isSplitLayout = activeTab === 'Overview'

  return (
    <section className="w-full bg-[#f6f7fb] px-0 pb-8 pt-2 text-slate-900">
      <div className="mx-auto w-full max-w-[1500px] space-y-3">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="relative h-40 overflow-hidden bg-slate-200 md:h-44">
            <img
              src={heroImage}
              alt=""
              className="block h-full w-full object-cover object-center"
              onError={() =>
                setHeroImage(
                  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1800&q=80',
                )
              }
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/94 via-white/70 to-white/18" />

            <div className="absolute inset-0 flex items-start justify-between p-4 md:p-5">
              <div className="flex items-start gap-4">
                <div className="relative shrink-0">
                  <img src={avatarSrc} alt="" className="h-16 w-16 rounded-full border-2 border-white object-cover shadow-sm md:h-20 md:w-20" />
                  <span className="absolute bottom-0 right-0 grid h-5 w-5 place-items-center rounded-full bg-blue-600 ring-2 ring-white">
                    <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </span>
                </div>
                <div className="pt-0.5">
                  <h1 className="flex items-center gap-1 text-lg font-semibold leading-tight text-slate-900 md:text-2xl">
                    {displayName}
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-600 md:h-5 md:w-5" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                  </h1>
                  <p className="mt-0.5 text-xs text-slate-600 md:text-sm">{emailDisplay}</p>
                  <p className="mt-1 line-clamp-1 max-w-xl text-xs text-slate-600 md:line-clamp-none md:text-sm">
                    Real estate enthusiast. Exploring opportunities and building my future space.
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500 md:mt-2 md:text-xs">
                    <span className="inline-flex items-center gap-1">
                      <TinyIcon kind="overview" className="h-3.5 w-3.5" />
                      Lagos, Nigeria
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <TinyIcon kind="cal" className="h-3.5 w-3.5" />
                      Joined April 2024
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
                {user && (
                  <button
                    type="button"
                    onClick={() => {
                      logout()
                      navigate('/')
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm hover:bg-slate-50 md:px-4 md:py-2 md:text-sm"
                  >
                    Log out
                  </button>
                )}
                <button type="button" className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 md:px-4 md:py-2 md:text-sm">
                  Edit Profile
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 md:grid-cols-4 md:divide-y-0">
            {statItems.map((item) => (
              <article key={item.label} className="flex items-center gap-2.5 p-3">
                <span className={`grid h-9 w-9 place-items-center rounded-lg ${item.tone}`}>
                  <TinyIcon kind={item.icon} className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-xl font-semibold leading-none text-slate-900">{item.value}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{item.label}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-3 shadow-sm">
          <div className="thin-scroll flex items-center gap-2 overflow-x-auto py-2">
            {tabItems.map((tab, index) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${
                  activeTab === tab ? 'bg-amber-50 text-amber-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <TinyIcon kind={index === 0 ? 'overview' : index === 1 ? 'heart' : index === 2 ? 'chat' : index === 3 ? 'cal' : index === 4 ? 'bid' : 'settings'} className="h-3.5 w-3.5" />
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className={`grid gap-4 ${isSplitLayout ? 'lg:grid-cols-[1.8fr_1fr]' : 'grid-cols-1'}`}>
          <div className="space-y-4">
            {showViewed && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Recently Viewed</h3>
                <Link to="/saved" className="text-sm font-medium text-blue-600 hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {viewed.map((p) => (
                  <Link key={p.id} to={`/property/${p.id}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow">
                    <div className="relative">
                      <img src={p.image} alt={p.title} className="h-28 w-full object-cover" />
                      <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                        {p.purpose === 'Sale' ? 'For Sale' : p.purpose === 'Rent' ? 'For Rent' : p.purpose}
                      </span>
                    </div>
                    <div className="space-y-1.5 p-2.5">
                      <p className="line-clamp-1 text-sm font-medium text-slate-900">{p.title}</p>
                      <p className="line-clamp-1 text-xs text-slate-500">{p.location}</p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-800">{formatNaira(p.price, p.purpose)}</p>
                        <TinyIcon kind="heart" className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
            )}

            {showActivity && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
                <Link to="/messages" className="text-sm font-medium text-blue-600 hover:underline">
                  View all
                </Link>
              </div>
              <ul className="divide-y divide-slate-100">
                {filteredActivity.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-slate-50">
                      <TinyIcon kind={item.kind} className="h-4 w-4 text-blue-600" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-700">{item.text}</p>
                      <p className="text-xs text-slate-400">{item.time}</p>
                    </div>
                    <span className="text-slate-300">›</span>
                  </li>
                ))}
              </ul>
            </section>
            )}

            {activeTab === 'Inquiries' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Inquiries</h3>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">{inquiries.length} open</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {inquiries.map((item) => (
                  <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <img src={item.property.image} alt={item.property.title} className="h-28 w-full object-cover" />
                    <div className="space-y-2 p-3">
                      <p className="line-clamp-1 text-sm font-semibold text-slate-900">{item.property.title}</p>
                      <p className="line-clamp-1 text-xs text-slate-500">{item.property.location}</p>
                      <p className="line-clamp-2 rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-600">{item.text}</p>
                      <div className="flex items-center justify-between">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${item.status.includes('replied') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {item.status}
                        </span>
                        <span className="text-[11px] text-slate-400">{item.time}</span>
                      </div>
                      <Link to="/messages" className="inline-flex rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                        Open chat
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            )}

            {activeTab === 'Scheduled Visits' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Scheduled Visits</h3>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">{visits.length} visits</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {visits.map((item) => (
                  <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <img src={item.property.image} alt={item.property.title} className="h-28 w-full object-cover" />
                    <div className="space-y-2 p-3">
                      <p className="line-clamp-1 text-sm font-semibold text-slate-900">{item.property.title}</p>
                      <p className="line-clamp-1 text-xs text-slate-500">{item.property.location}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">{item.day}</span>
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">{item.time}</span>
                        <span className={`rounded-md px-2 py-1 font-medium ${item.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {item.status}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            )}

            {activeTab === 'Bids' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Your Bids</h3>
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">{bids.length} active</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {bids.map((item) => (
                  <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <img src={item.property.image} alt={item.property.title} className="h-28 w-full object-cover" />
                    <div className="space-y-2 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.property.title}</p>
                        <p className="text-xs text-slate-500">{item.property.location}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{item.ends}</span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-lg bg-blue-50 p-2.5">
                        <p className="text-[11px] text-blue-600">Your bid</p>
                        <p className="text-sm font-semibold text-blue-700">{formatNaira(item.myBid, 'Sale')}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2.5">
                        <p className="text-[11px] text-slate-500">Current highest</p>
                        <p className="text-sm font-semibold text-slate-700">{formatNaira(item.currentBid, 'Sale')}</p>
                      </div>
                    </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            )}

            {activeTab === 'Settings' && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Settings</h3>
                <button type="button" className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500">
                  Save Changes
                </button>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <article className="rounded-xl border border-slate-200 p-3">
                  <h4 className="text-sm font-semibold text-slate-800">Account Preferences</h4>
                  <ul className="mt-3 divide-y divide-slate-100">
                    {[
                      'Personal Information',
                      'Change Password',
                      'Connected Accounts',
                      'Privacy & Security',
                    ].map((label) => (
                      <li key={label}>
                        <button type="button" className="flex w-full items-center justify-between py-2.5 text-left text-sm text-slate-700 hover:text-blue-600">
                          <span>{label}</span>
                          <span className="text-slate-300">›</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </article>

                <article className="rounded-xl border border-slate-200 p-3">
                  <h4 className="text-sm font-semibold text-slate-800">Notifications</h4>
                  <div className="mt-3 space-y-2">
                    {[
                      ['Price drop alerts', true],
                      ['New property matches', true],
                      ['Visit reminders', true],
                      ['Bid updates', false],
                    ].map(([label, on]) => (
                      <div key={label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-sm text-slate-700">{label}</p>
                        <span className={`inline-flex h-5 w-9 items-center rounded-full p-0.5 ${on ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'}`}>
                          <span className="h-4 w-4 rounded-full bg-white" />
                        </span>
                      </div>
                    ))}
                  </div>
                </article>
              </div>
            </section>
            )}
          </div>

          {isSplitLayout && <div className="space-y-4">
            {showAccount && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">Account Information</h3>
              <div className="mt-3 divide-y divide-slate-100 text-sm">
                {[
                  ['Full Name', 'Kaydee Wisdom'],
                  ['Email', 'kaydeewrld@gmail.com'],
                  ['Phone', '+234 810 123 4567'],
                  ['Location', 'Lagos, Nigeria'],
                  ['Member Since', 'April 2024'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between py-2.5">
                    <p className="text-slate-500">{k}</p>
                    <p className="font-medium text-slate-700">{v}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between py-2.5">
                  <p className="text-slate-500">Account Status</p>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Active</span>
                </div>
              </div>
            </section>
            )}

            {showCta && (
            <section className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-100 p-5 shadow-sm">
              <h3 className="text-3xl font-semibold tracking-tight text-slate-900">List your property</h3>
              <p className="mt-2 text-sm text-slate-600">Reach thousands of verified buyers and renters today.</p>
              <Link to="/add-listing" className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
                List Property
              </Link>
            </section>
            )}
          </div>}
        </div>
      </div>
    </section>
  )
}

export default ProfilePage
