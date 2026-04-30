import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import CustomDropdown from '../components/CustomDropdown'
import PropertyMarketingSections from '../components/PropertyMarketingSections'
import { properties as demoProperties } from '../data/properties'
import { listingsList } from '../lib/api'
import { mapApiListingToProperty } from '../utils/listingAdapters'

const initialFilters = {
  type: 'All',
  purpose: 'All',
  location: '',
  bedrooms: 'Any',
  bathrooms: 'Any',
  minPrice: '',
  maxPrice: '',
}

function ExplorePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({
    ...initialFilters,
    type: searchParams.get('type') || 'All',
  })
  const [activeBedrooms, setActiveBedrooms] = useState('Any')
  const [activeBathrooms, setActiveBathrooms] = useState('Any')
  const [showPerPage, setShowPerPage] = useState('8 per page')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState('Grid')
  const [sortBy, setSortBy] = useState('Newest')
  const [selectedMapPropertyId, setSelectedMapPropertyId] = useState('')
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [likedPropertyIds, setLikedPropertyIds] = useState([])
  const [remoteProperties, setRemoteProperties] = useState([])
  const minBound = 0
  const maxBound = 50000000
  const sliderStep = 100000

  const formatNaira = (amount, purpose) => {
    const value = `₦${new Intl.NumberFormat('en-NG').format(amount)}`
    if (purpose === 'Rent') return `${value} / year`
    if (purpose === 'Lease') return `${value} / m²`
    return value
  }

  const toggleLikeProperty = (propertyId) => {
    setLikedPropertyIds((current) =>
      current.includes(propertyId) ? current.filter((id) => id !== propertyId) : [...current, propertyId],
    )
  }

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const out = await listingsList({ take: 80, skip: 0 })
        const incoming = Array.isArray(out?.listings) ? out.listings.map((item, idx) => mapApiListingToProperty(item, idx)) : []
        if (!cancelled) setRemoteProperties(incoming)
      } catch {
        if (!cancelled) setRemoteProperties([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const properties = useMemo(() => {
    const dedup = new Set()
    const merged = [...remoteProperties, ...demoProperties]
    return merged.filter((item) => {
      if (dedup.has(item.id)) return false
      dedup.add(item.id)
      return true
    })
  }, [remoteProperties])

  const filteredProperties = useMemo(() => {
    const result = properties.filter((property) => {
      const matchesQuery =
        property.title.toLowerCase().includes(query.toLowerCase()) ||
        property.location.toLowerCase().includes(query.toLowerCase()) ||
        property.purpose.toLowerCase().includes(query.toLowerCase())

      const matchesType = filters.type === 'All' || property.type === filters.type
      const matchesPurpose = filters.purpose === 'All' || property.purpose === filters.purpose
      const matchesLocation =
        !filters.location || property.location.toLowerCase().includes(filters.location.toLowerCase())
      const minPrice = filters.minPrice ? Number(filters.minPrice) : 0
      const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : Number.POSITIVE_INFINITY
      const matchesPrice = property.price >= minPrice && property.price <= maxPrice
      const minBedrooms = filters.bedrooms === 'Any' ? 0 : Number(filters.bedrooms)
      const matchesBedrooms = property.bedrooms >= minBedrooms
      const minBathrooms = filters.bathrooms === 'Any' ? 0 : Number(filters.bathrooms)
      const matchesBathrooms = property.bathrooms >= minBathrooms

      return matchesQuery && matchesType && matchesPurpose && matchesLocation && matchesPrice && matchesBedrooms && matchesBathrooms
    })

    if (sortBy === 'Price: Low to High') return [...result].sort((a, b) => a.price - b.price)
    if (sortBy === 'Price: High to Low') return [...result].sort((a, b) => b.price - a.price)
    if (sortBy === 'Most Popular') return [...result].sort((a, b) => b.rating - a.rating)
    return [...result].sort((a, b) => (b.id > a.id ? 1 : -1))
  }, [filters, query, sortBy])

  const parsedMinPrice = Number(filters.minPrice || minBound)
  const parsedMaxPrice = Number(filters.maxPrice || maxBound)
  const minPriceValue = Math.max(minBound, Math.min(parsedMinPrice, parsedMaxPrice))
  const maxPriceValue = Math.min(maxBound, Math.max(parsedMaxPrice, minPriceValue))

  const perPage = Number(showPerPage.split(' ')[0]) || 8
  const totalPages = Math.max(1, Math.ceil(filteredProperties.length / perPage))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const pageStart = (safeCurrentPage - 1) * perPage
  const propertiesForGrid = filteredProperties.slice(pageStart, pageStart + perPage)
  const locationOptions = useMemo(() => {
    return Array.from(new Set(properties.map((property) => property.location.split(',')[0].trim()))).sort()
  }, [])
  const matchingLocations = useMemo(() => {
    const term = filters.location.trim().toLowerCase()
    if (!term) return locationOptions.slice(0, 6)
    return locationOptions.filter((location) => location.toLowerCase().includes(term)).slice(0, 6)
  }, [filters.location, locationOptions])
  const mapPositions = {
    'Victoria Island': { left: '61%', top: '44%' },
    Lekki: { left: '72%', top: '58%' },
    Ikoyi: { left: '54%', top: '40%' },
    Ajah: { left: '84%', top: '66%' },
    Yaba: { left: '39%', top: '50%' },
    Surulere: { left: '32%', top: '58%' },
    Chevron: { left: '78%', top: '61%' },
    Oniru: { left: '67%', top: '50%' },
    Banana: { left: '58%', top: '33%' },
    Ikeja: { left: '26%', top: '38%' },
  }
  const chipBtn = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition hover:bg-slate-50'
  const sectionTitle = 'mb-2 flex items-center justify-between font-medium text-slate-700'
  const verifiedBadge = (property) =>
    property?.isVerifiedListing ? (
      <span className="absolute right-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
        Verified
      </span>
    ) : null
  const paymentStatusBadge = (property) => {
    const s = String(property?.listingStatus || '').toUpperCase()
    if (s === 'SOLD') {
      return (
        <span className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 bg-rose-700/95 py-1 text-center text-[11px] font-extrabold tracking-[0.25em] text-white">
          SOLD
        </span>
      )
    }
    if (s === 'APPROVED') {
      return <span className="absolute left-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">Available</span>
    }
    return null
  }

  useEffect(() => {
    setCurrentPage(1)
  }, [filters, query, sortBy, showPerPage])

  return (
    <section className="space-y-4 pb-8 text-slate-800">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[1fr_0.45fr] md:items-center">
          <div>
            <h1 className="text-5xl font-semibold tracking-tight text-slate-800">
              Explore <span className="text-blue-600">properties</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">Find your perfect property from thousands of verified listings.</p>
          </div>
          <article className="rounded-xl border border-blue-100 bg-blue-50 p-3">
            <p className="text-sm font-semibold text-slate-800">Not sure what you&apos;re looking for?</p>
            <p className="mt-1 text-xs text-slate-500">Let our agents help you find the perfect property.</p>
            <button onClick={() => navigate('/agents')} className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white">Talk to an Agent</button>
          </article>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_1fr]">
        <aside className="self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-800">Filters</h3>
            <button
              onClick={() => {
                setFilters(initialFilters)
                setActiveBedrooms('Any')
                setActiveBathrooms('Any')
              }}
              className="text-xs text-blue-600"
            >
              Reset all
            </button>
          </div>
          <div className="space-y-5 text-sm">
            <div>
              <p className={sectionTitle}>
                <span>Property Type</span>
                <span className="text-slate-400">⌃</span>
              </p>
              <div className="space-y-2 text-xs text-slate-600">
                {['All', 'Apartment', 'House', 'Office', 'Short Stay', 'New Development'].map((type) => (
                  <label key={type} className="flex items-center gap-2">
              <input
                      type="radio"
                      checked={type === 'New Development' ? filters.type === 'Commercial' : filters.type === type || (type === 'All' && filters.type === 'All')}
                      onChange={() => setFilters((current) => ({ ...current, type: type === 'New Development' ? 'Commercial' : type }))}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className={sectionTitle}>
                <span>Price Range</span>
                <span className="text-slate-400">⌃</span>
              </p>
              <div className="space-y-2">
                <div className="h-1 rounded-full bg-slate-200">
                  <div
                    className="h-1 rounded-full bg-blue-600"
                    style={{
                      marginLeft: `${((minPriceValue - minBound) / (maxBound - minBound)) * 100}%`,
                      width: `${((maxPriceValue - minPriceValue) / (maxBound - minBound)) * 100}%`,
                    }}
                  />
            </div>
                <div className="relative h-1">
                  <input
                    type="range"
                    min={minBound}
                    max={maxBound}
                    step={sliderStep}
                    value={minPriceValue}
                    onChange={(event) => {
                      const next = Number(event.target.value)
                      setFilters((current) => {
                        const currentMax = Number(current.maxPrice || maxBound)
                        const clamped = Math.min(Math.max(next, minBound), currentMax - sliderStep)
                        return { ...current, minPrice: String(clamped) }
                      })
                    }}
                    className="range-thumb absolute -top-2 left-0 z-20 w-full cursor-pointer appearance-none bg-transparent"
                  />
                  <input
                    type="range"
                    min={minBound}
                    max={maxBound}
                    step={sliderStep}
                    value={maxPriceValue}
                    onChange={(event) => {
                      const next = Number(event.target.value)
                      setFilters((current) => {
                        const currentMin = Number(current.minPrice || minBound)
                        const clamped = Math.max(Math.min(next, maxBound), currentMin + sliderStep)
                        return { ...current, maxPrice: String(clamped) }
                      })
                    }}
                    className="range-thumb absolute -top-2 left-0 z-10 w-full cursor-pointer appearance-none bg-transparent"
                  />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={filters.minPrice}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        minPrice: event.target.value.replace(/[^\d]/g, ''),
                      }))
                    }
                    onBlur={() =>
                      setFilters((current) => {
                        const min = Number(current.minPrice || minBound)
                        const max = Number(current.maxPrice || maxBound)
                        const clamped = Math.max(minBound, Math.min(min, max - sliderStep))
                        return { ...current, minPrice: String(clamped) }
                      })
                    }
                    placeholder="₦0"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs"
              />
              <input
                value={filters.maxPrice}
                    onChange={(event) =>
                      setFilters((current) => ({
                        ...current,
                        maxPrice: event.target.value.replace(/[^\d]/g, ''),
                      }))
                    }
                    onBlur={() =>
                      setFilters((current) => {
                        const min = Number(current.minPrice || minBound)
                        const max = Number(current.maxPrice || maxBound)
                        const clamped = Math.min(maxBound, Math.max(max, min + sliderStep))
                        return { ...current, maxPrice: String(clamped) }
                      })
                    }
                    placeholder="₦50,000,000+"
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 font-medium text-slate-700">Location</p>
              <div className="relative">
                <input
                  value={filters.location}
                  onFocus={() => setShowLocationSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 120)}
                  onChange={(event) => {
                    setFilters((current) => ({ ...current, location: event.target.value }))
                    setShowLocationSuggestions(true)
                  }}
                  placeholder="Enter location or select on map"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                />
                {showLocationSuggestions && matchingLocations.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                    {matchingLocations.map((location) => (
                      <button
                        key={location}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          setFilters((current) => ({ ...current, location }))
                          setShowLocationSuggestions(false)
                        }}
                        className="block w-full px-3 py-2 text-left text-xs text-slate-700 transition hover:bg-slate-50"
                      >
                        {location}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 font-medium text-slate-700">Bedrooms</p>
              <div className="grid grid-cols-5 gap-1 text-xs">
                {['Any', '1+', '2+', '3+', '4+'].map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setActiveBedrooms(item)
                      setFilters((current) => ({ ...current, bedrooms: item === 'Any' ? 'Any' : item.replace('+', '') }))
                    }}
                    className={`rounded-lg px-2 py-1.5 ${activeBedrooms === item ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-slate-50 text-slate-600'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 font-medium text-slate-700">Bathrooms</p>
              <div className="grid grid-cols-5 gap-1 text-xs">
                {['Any', '1+', '2+', '3+', '4+'].map((item) => (
            <button
                    key={item}
                    onClick={() => {
                      setActiveBathrooms(item)
                      setFilters((current) => ({ ...current, bathrooms: item === 'Any' ? 'Any' : item.replace('+', '') }))
                    }}
                    className={`rounded-lg px-2 py-1.5 ${activeBathrooms === item ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-slate-50 text-slate-600'}`}
                  >
                    {item}
            </button>
                ))}
              </div>
            </div>

            <div>
              <p className={sectionTitle}>
                <span>Amenities</span>
                <span className="text-slate-400">⌃</span>
              </p>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input type="checkbox" />
                Swimming Pool
              </label>
            </div>
          </div>
        </aside>

        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-slate-700">Showing {filteredProperties.length.toLocaleString()} properties</p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search..."
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                />
                <CustomDropdown
                  value={sortBy}
                  onChange={setSortBy}
                  options={['Newest', 'Most Popular', 'Price: Low to High', 'Price: High to Low']}
                  className="min-w-[140px]"
                />
                <CustomDropdown
                  value={filters.type}
                  onChange={(value) => setFilters((current) => ({ ...current, type: value }))}
                  options={['All', 'House', 'Apartment', 'Hotel', 'Office', 'Commercial']}
                  className="min-w-[120px]"
                />
                <CustomDropdown
                  value={filters.purpose}
                  onChange={(value) => setFilters((current) => ({ ...current, purpose: value }))}
                  options={['All', 'Rent', 'Sale', 'Lease']}
                  className="min-w-[120px]"
                />
                <CustomDropdown
                  value={filters.location || 'Location'}
                  onChange={(value) => setFilters((current) => ({ ...current, location: value === 'Location' ? '' : value }))}
                  options={['Location', 'Lekki', 'Victoria Island', 'Ikoyi', 'Ajah', 'Yaba', 'Surulere']}
                  className="min-w-[110px]"
                />
                <CustomDropdown
                  value="More Filters"
                  onChange={() => {}}
                  options={['Swimming Pool', 'Gym', 'Parking', 'Furnished']}
                  className="min-w-[110px]"
                />
                <button
                  onClick={() => setViewMode('Grid')}
                  className={`rounded-lg px-3 py-2 text-xs ${viewMode === 'Grid' ? 'bg-blue-600 text-white' : chipBtn}`}
                >
                  Grid
                </button>
            <button
                  onClick={() => setViewMode('Map')}
                  className={`rounded-lg px-3 py-2 text-xs ${viewMode === 'Map' ? 'bg-blue-600 text-white' : chipBtn}`}
                >
                  Map
            </button>
              </div>
            </div>
          </div>

          {viewMode === 'Grid' ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {propertiesForGrid.map((property) => (
                <article
                  key={property.id}
                  onClick={() => navigate(`/property/${property.id}`)}
                  className="cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative">
                    <img src={property.image} alt={property.title} className="h-36 w-full object-cover" />
                    {verifiedBadge(property)}
                    {paymentStatusBadge(property)}
                    <span className="absolute left-2 top-8 rounded-full bg-blue-600 px-2 py-0.5 text-[11px] text-white">
                      {property.purpose || 'For Sale'}
                    </span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleLikeProperty(property.id)
                      }}
                      aria-label={likedPropertyIds.includes(property.id) ? 'Remove from saved' : 'Save property'}
                      className={`absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm transition ${
                        likedPropertyIds.includes(property.id)
                          ? 'border-rose-200 bg-rose-50 text-rose-500'
                          : 'border-white/80 bg-white/95 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="h-[15px] w-[15px]"
                        fill={likedPropertyIds.includes(property.id) ? 'currentColor' : 'none'}
                        stroke="currentColor"
                      >
                        <path
                          d="M12 21s-7-4.35-9.5-8.03C.62 10.24 1.12 6.63 4.07 4.98c2.3-1.28 4.78-.54 6.26 1.1l1.67 1.85 1.67-1.85c1.48-1.64 3.96-2.38 6.26-1.1 2.95 1.65 3.45 5.26 1.57 7.99C19 16.65 12 21 12 21z"
                          strokeWidth="1.7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-2 p-3">
                    <p className="text-lg font-semibold text-slate-800">{formatNaira(property.price, property.purpose)}</p>
                    <h3 className="text-sm font-semibold text-slate-800">{property.title}</h3>
                    <p className="text-xs text-slate-500">{property.location}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500">
                      <span>{property.bedrooms || 0} Beds</span>
                      <span>{property.bathrooms} Baths</span>
                      <span>{property.area} m²</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-[1fr_330px]">
              <div className="relative h-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-[#dde7ff] via-[#eaf1ff] to-[#d7e5ff] shadow-sm">
                <img
                  src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1800&q=70"
                  alt="Map"
                  className="h-full w-full object-cover opacity-30"
                />
                {propertiesForGrid.map((property, index) => {
                  const key = Object.keys(mapPositions).find((name) => property.location.includes(name)) || 'Lekki'
                  const pos = mapPositions[key]
                  return (
                    <button
                      key={property.id}
                      onClick={() => setSelectedMapPropertyId(property.id)}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 py-1 text-[11px] font-medium shadow ${
                        selectedMapPropertyId === property.id
                          ? 'border-blue-700 bg-blue-700 text-white'
                          : 'border-white bg-white text-blue-700'
                      }`}
                      style={{ left: pos.left, top: pos.top }}
                    >
                      {formatNaira(property.price, property.purpose)}
                    </button>
                  )
                })}
              </div>
              <div className="max-h-[560px] space-y-2 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm thin-scroll">
                {propertiesForGrid.map((property) => (
                  <article
                    key={property.id}
                    onClick={() => setSelectedMapPropertyId(property.id)}
                    className={`cursor-pointer rounded-xl border p-2.5 transition ${
                      selectedMapPropertyId === property.id ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex gap-2">
                      <img src={property.image} alt={property.title} className="h-14 w-20 rounded-lg object-cover" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{property.title}</p>
                        <p className="text-[11px] text-slate-500">{property.location}</p>
                        <p className="text-xs font-medium text-blue-700">{formatNaira(property.price, property.purpose)}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-500 shadow-sm">
            <p>
              Showing {filteredProperties.length === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + perPage, filteredProperties.length)} of {filteredProperties.length.toLocaleString()} properties
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="rounded-md border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={safeCurrentPage === 1}
              >
                ‹
              </button>
              {Array.from({ length: Math.min(totalPages, 3) }, (_, index) => index + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`rounded-md px-2 py-1 ${safeCurrentPage === page ? 'bg-blue-600 text-white' : 'border border-slate-200'}`}
                >
                  {page}
                </button>
              ))}
              {totalPages > 3 && <span className="px-1">…</span>}
              {totalPages > 3 && (
                <button type="button" onClick={() => setCurrentPage(totalPages)} className="rounded-md border border-slate-200 px-2 py-1">
                  {totalPages}
                </button>
              )}
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                className="rounded-md border border-slate-200 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={safeCurrentPage === totalPages}
              >
                ›
              </button>
            </div>
            <CustomDropdown
              value={showPerPage}
              onChange={setShowPerPage}
              options={['8 per page', '12 per page', '16 per page']}
              className="min-w-[120px]"
            />
          </div>

        </div>
      </div>

      <PropertyMarketingSections className="mt-4 space-y-4" />
    </section>
  )
}

export default ExplorePage
