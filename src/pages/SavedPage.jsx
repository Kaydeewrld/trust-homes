import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CustomDropdown from '../components/CustomDropdown'
import { useFavorites } from '../context/FavoritesContext'
import { properties } from '../data/properties'

const sortOptions = ['Recently Saved', 'Price: Low to High', 'Price: High to Low']

const savedSearches = [
  { id: 's1', label: '3 bedroom apartments in Victoria Island', results: 120, daysAgo: 5, icon: 'home', tint: 'bg-blue-100 text-blue-600' },
  { id: 's2', label: 'Houses for sale under ₦50M in Lekki', results: 42, daysAgo: 12, icon: 'search', tint: 'bg-emerald-100 text-emerald-600' },
  { id: 's3', label: 'Office space in Ikoyi', results: 18, daysAgo: 3, icon: 'brief', tint: 'bg-violet-100 text-violet-600' },
  { id: 's4', label: 'Short stay near Eko Atlantic', results: 64, daysAgo: 1, icon: 'clock', tint: 'bg-amber-100 text-amber-600' },
]

const collectionPresets = [
  { id: 'col1', name: 'Dream Home', count: 8 },
  { id: 'col2', name: 'Investment Properties', count: 6 },
  { id: 'col3', name: 'Family Homes', count: 5 },
  { id: 'col4', name: 'Waterfront', count: 4 },
  { id: 'col5', name: 'Commercial', count: 3 },
]

function formatNaira(amount, purpose) {
  const v = `₦${new Intl.NumberFormat('en-NG').format(amount)}`
  if (purpose === 'Rent') return `${v} / yr`
  if (purpose === 'Lease') return `${v} / m²`
  return v
}

function daysAgoLabel(id) {
  const n = (id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 21) + 1
  if (n < 7) return `${n} days ago`
  return `${Math.floor(n / 7)} week${Math.floor(n / 7) > 1 ? 's' : ''} ago`
}

function SavedPage() {
  const navigate = useNavigate()
  const { favoriteIds, toggleFavorite } = useFavorites()
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortBy, setSortBy] = useState('Recently Saved')
  const [viewMode, setViewMode] = useState('grid')
  const [sidebarNav, setSidebarNav] = useState('all')

  const savedProperties = useMemo(
    () => properties.filter((p) => favoriteIds.includes(p.id)),
    [favoriteIds],
  )

  const collections = useMemo(
    () =>
      collectionPresets.map((c, i) => ({
        ...c,
        image: properties[i % properties.length]?.image,
      })),
    [],
  )

  const counts = {
    properties: savedProperties.length,
    searches: savedSearches.length,
    collections: collections.length,
    all: savedProperties.length + savedSearches.length + collections.length,
  }

  const sortedProperties = useMemo(() => {
    const list = [...savedProperties]
    if (sortBy === 'Price: Low to High') list.sort((a, b) => a.price - b.price)
    else if (sortBy === 'Price: High to Low') list.sort((a, b) => b.price - a.price)
    else list.sort((a, b) => (b.id > a.id ? 1 : -1))
    return list
  }, [savedProperties, sortBy])

  const showProperties = activeFilter === 'all' || activeFilter === 'properties'
  const showSearches = activeFilter === 'all' || activeFilter === 'searches'
  const showCollections = activeFilter === 'all' || activeFilter === 'collections'

  const gridClass =
    viewMode === 'grid'
      ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-4'
      : 'flex flex-col gap-3'

  return (
    <div className="flex flex-col gap-6 pb-8 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 space-y-4 lg:sticky lg:top-24 lg:w-[260px]">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Saved</p>
          <nav className="space-y-0.5">
            {[
              { key: 'all', label: 'All Saved', icon: 'heart', count: counts.all },
              { key: 'properties', label: 'Properties', icon: 'house', count: counts.properties },
              { key: 'searches', label: 'Searches', icon: 'search', count: counts.searches },
              { key: 'collections', label: 'Collections', icon: 'folder', count: counts.collections },
              { key: 'recent', label: 'Viewed Recently', icon: 'clock', count: null },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setSidebarNav(item.key)
                  if (item.key === 'recent') navigate('/explore')
                  else setActiveFilter(item.key === 'all' ? 'all' : item.key)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-2.5 py-2 text-left text-sm transition ${
                  sidebarNav === item.key && item.key !== 'recent'
                    ? 'bg-blue-50 font-medium text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2">
                  <SidebarIcon type={item.icon} />
                  {item.label}
                </span>
                {item.count != null && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{item.count}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-xs font-semibold text-slate-700">Your Collections</p>
            <button type="button" className="text-xs font-medium text-blue-600 hover:text-blue-700">
              + New
            </button>
          </div>
          <div className="space-y-2">
            {collections.slice(0, 4).map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => setActiveFilter('collections')}
                className="flex w-full items-center gap-2 rounded-lg border border-transparent p-1.5 text-left transition hover:border-slate-200 hover:bg-slate-50"
              >
                <img src={col.image} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-800">{col.name}</p>
                  <p className="text-[11px] text-slate-500">{col.count} properties</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-4">
          <p className="text-sm font-medium text-slate-800">Not sure what to choose?</p>
          <p className="mt-1 text-xs text-slate-600">Our agents can shortlist options for you.</p>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-medium text-white"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
              <path d="M5 4h3l2 5-2 1.5a14 14 0 0 0 5.5 5.5L15 14l5 2v3a2 2 0 0 1-2 2h-1C10.4 21 3 13.6 3 7V6a2 2 0 0 1 2-2z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Talk to an Agent
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">All Saved</h1>
          <p className="mt-1 text-sm text-slate-500">Your saved properties, searches and collections in one place.</p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All', count: counts.all },
                { key: 'properties', label: 'Properties', count: counts.properties },
                { key: 'searches', label: 'Searches', count: counts.searches },
                { key: 'collections', label: 'Collections', count: counts.collections },
              ].map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => {
                    setActiveFilter(chip.key)
                    setSidebarNav(chip.key === 'all' ? 'all' : chip.key)
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    activeFilter === chip.key
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {chip.label} ({chip.count})
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="shrink-0 font-medium">Sort by:</span>
                <CustomDropdown
                  value={sortBy}
                  onChange={setSortBy}
                  options={sortOptions}
                  variant="light"
                  className="min-w-[200px] sm:min-w-[220px]"
                />
              </div>
              <div className="flex rounded-lg border border-slate-200 bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`rounded-md px-2 py-1 text-xs ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
                >
                  Grid
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`rounded-md px-2 py-1 text-xs ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        {showProperties && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Saved Properties</h2>
              <Link to="/explore" className="text-xs font-medium text-blue-600 hover:underline">
                View all
              </Link>
            </div>
            {sortedProperties.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center text-sm text-slate-500">
                No saved properties yet.{' '}
                <Link to="/explore" className="font-medium text-blue-600">
                  Explore listings
                </Link>
              </div>
            ) : (
              <div className={gridClass}>
                {sortedProperties.slice(0, activeFilter === 'all' ? 4 : undefined).map((property) => (
                  <article
                    key={property.id}
                    className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${
                      viewMode === 'list' ? 'flex gap-3' : ''
                    }`}
                  >
                    <div className={`relative ${viewMode === 'list' ? 'h-32 w-44 shrink-0' : ''}`}>
                      <Link to={`/property/${property.id}`} className="block">
                        <img
                          src={property.image}
                          alt={property.title}
                          className={`w-full object-cover ${viewMode === 'list' ? 'h-full' : 'h-40'}`}
                        />
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(property.id)}
                        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-rose-500 shadow"
                        aria-label="Remove from saved"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" stroke="none">
                          <path d="M12 21s-7-4.35-9.5-8.03C.62 10.24 1.12 6.63 4.07 4.98c2.3-1.28 4.78-.54 6.26 1.1l1.67 1.85 1.67-1.85c1.48-1.64 3.96-2.38 6.26-1.1 2.95 1.65 3.45 5.26 1.57 7.99C19 16.65 12 21 12 21z" />
                        </svg>
                      </button>
                      <div className="absolute bottom-2 left-2 rounded-md bg-slate-900/75 px-2 py-1 text-[11px] font-semibold text-white">
                        {formatNaira(property.price, property.purpose)}
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <Link to={`/property/${property.id}`} className="text-sm font-semibold text-slate-900 hover:text-blue-700">
                        {property.title}
                      </Link>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                        <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" fill="none" stroke="currentColor">
                          <path d="M12 21s-6-4.35-8-8a5 5 0 0 1 8-4 5 5 0 0 1 8 4c-2 3.65-8 8-8 8z" strokeWidth="1.5" />
                          <circle cx="12" cy="11" r="2" strokeWidth="1.5" />
                        </svg>
                        {property.location}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                        <span>{property.bedrooms || 0} Beds</span>
                        <span>{property.bathrooms} Baths</span>
                        <span>{property.area} m²</span>
                      </div>
                      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-2">
                        <span className="text-[11px] text-slate-400">Saved {daysAgoLabel(property.id)}</span>
                        <button type="button" className="text-slate-400 hover:text-slate-600" aria-label="More options">
                          ⋯
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {showSearches && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Saved Searches</h2>
              <button type="button" className="text-xs font-medium text-blue-600">
                View all
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {savedSearches.map((s) => (
                <article key={s.id} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg ${s.tint}`}>
                    <SearchIcon kind={s.icon} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium leading-snug text-slate-800">{s.label}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{s.results} results</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">{s.daysAgo}d ago</span>
                      <button type="button" className="text-slate-400">
                        ⋯
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {showCollections && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Your Collections</h2>
              <button type="button" className="text-xs font-medium text-blue-600">
                View all
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {collections.map((col) => (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => navigate('/explore')}
                  className="group relative h-36 overflow-hidden rounded-xl border border-slate-200 text-left shadow-sm"
                >
                  <img src={col.image} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 text-center">
                    <p className="text-sm font-semibold text-white">{col.name}</p>
                    <p className="text-[11px] text-blue-100/90">{col.count} properties</p>
                  </div>
                  <div className="absolute left-2 top-2 rounded-md bg-white/20 p-1 backdrop-blur">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor">
                      <path d="M4 6h16v12H4zM4 10h16" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="absolute right-2 top-2 text-white/90">⋯</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/90 via-white to-slate-50 px-4 py-4 sm:flex-row sm:items-center md:px-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" aria-hidden>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-slate-800">Stay ahead on your shortlist</p>
              <p className="mt-1 text-sm text-slate-600">
                Turn on alerts for price drops and new matches to your saved searches—so you never miss a deal.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="shrink-0 rounded-xl border border-emerald-200 bg-white px-5 py-2.5 text-sm font-medium text-emerald-800 shadow-sm transition hover:bg-emerald-50"
          >
            Set up alerts
          </button>
        </div>
      </main>
    </div>
  )
}

function SidebarIcon({ type }) {
  const c = 'h-4 w-4'
  if (type === 'heart')
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor">
        <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.45A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (type === 'house')
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor">
        <path d="m3 11 9-7 9 7M6 9.5V20h12V9.5M10 20v-6h4v6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (type === 'search')
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor">
        <path d="M11 4a7 7 0 1 0 4.95 11.95L20 20" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  if (type === 'folder')
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor">
        <path d="M4 6h6l2 3h8v11H4z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor">
      <path d="M12 7v6l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function SearchIcon({ kind }) {
  const c = 'h-5 w-5'
  if (kind === 'home')
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor">
        <path d="m3 11 9-7 9 7M6 9.5V20h12V9.5" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  if (kind === 'brief')
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor">
        <path d="M8 7V5h8v2M4 9h16v10H4z" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  if (kind === 'clock')
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor">
        <path d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor">
      <path d="M11 4a7 7 0 1 0 4.95 11.95L20 20" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export default SavedPage
