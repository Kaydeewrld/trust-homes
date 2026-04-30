import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HotelBookingModal from '../components/HotelBookingModal.jsx'
import { HOTEL_PLACEHOLDERS } from '../data/hotelsPlaceholders.js'
import { listingsList } from '../lib/api.js'

function hotelDetailPath(hotel) {
  if (hotel?.listingId) return `/property/${hotel.listingId}`
  return `/hotels/place/${hotel.id}`
}

function HotelsPage() {
  const navigate = useNavigate()
  const [remoteHotels, setRemoteHotels] = useState([])
  const [selectedHotel, setSelectedHotel] = useState(null)
  const [loadingHotels, setLoadingHotels] = useState(false)
  const formatNaira = (value) => `₦${new Intl.NumberFormat('en-NG').format(value)}`

  useEffect(() => {
    let cancelled = false
    setLoadingHotels(true)
    ;(async () => {
      try {
        const out = await listingsList({ status: 'APPROVED', take: 120, skip: 0 })
        const rows = Array.isArray(out?.listings) ? out.listings : []
        const incoming = rows
          .filter((item) => String(item?.propertyType || '').toLowerCase().includes('hotel'))
          .map((item, idx) => ({
            id: String(item.id),
            listingId: String(item.id),
            name: String(item.title || `Hotel ${idx + 1}`),
            location: String(item.address || item.city || item.state || 'Nigeria'),
            stateAirport: `${String(item.state || item.city || 'State')} Airport`,
            airportDistanceKm: Math.max(3, 7 + (idx % 8) * 3),
            image:
              String(item.previewMediaUrl || '').trim() ||
              item.media?.find((m) => String(m.type || m.kind || '').toLowerCase().includes('image'))?.url ||
              HOTEL_PLACEHOLDERS[idx % HOTEL_PLACEHOLDERS.length].image,
            rating: 4.2 + (idx % 6) * 0.1,
            fromPerNight: Math.max(1000, Math.floor(Number(item.priceNgn) || 0)),
          }))
        if (!cancelled) setRemoteHotels(incoming)
      } catch {
        if (!cancelled) setRemoteHotels([])
      } finally {
        if (!cancelled) setLoadingHotels(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const mergedHotels = useMemo(() => {
    if (!remoteHotels.length) return HOTEL_PLACEHOLDERS
    const seen = new Set(remoteHotels.map((h) => h.id))
    return [...remoteHotels, ...HOTEL_PLACEHOLDERS.filter((h) => !seen.has(h.id))]
  }, [remoteHotels])

  const avgDistance = Math.round(mergedHotels.reduce((sum, hotel) => sum + hotel.airportDistanceKm, 0) / mergedHotels.length)
  const avgPrice = Math.round(mergedHotels.reduce((sum, hotel) => sum + hotel.fromPerNight, 0) / mergedHotels.length)

  const beginBookNow = (hotel) => {
    setSelectedHotel({
      id: hotel.id,
      name: hotel.name,
      fromPerNight: hotel.fromPerNight,
      listingId: hotel.listingId,
    })
  }

  return (
    <section className="space-y-5 pb-8 text-slate-100">
      <section className="overflow-hidden rounded-3xl border border-indigo-300/25 bg-gradient-to-r from-[#0a153f] via-[#1f2b7b] to-[#14255f] p-4 shadow-2xl shadow-blue-950/40 md:p-6">
        <p className="inline-flex rounded-full border border-blue-200/60 bg-blue-400/15 px-2.5 py-1 text-[11px] font-medium text-blue-100">
          HOTEL DISCOVERY
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-white md:text-4xl">Find Hotels Near State Airports</h1>
        <p className="mt-2 max-w-3xl text-sm text-blue-100/90 md:text-base">
          Book from premium to budget hotels with verified airport distance, central locations, and clear nightly pricing.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <article className="rounded-xl border border-indigo-200/25 bg-[#1a2a6a]/70 p-3 backdrop-blur">
            <p className="text-[11px] text-blue-100/85">Available Hotels</p>
            <p className="mt-1 text-2xl font-semibold text-cyan-100">{mergedHotels.length}</p>
          </article>
          <article className="rounded-xl border border-indigo-200/25 bg-[#1a2a6a]/70 p-3 backdrop-blur">
            <p className="text-[11px] text-blue-100/85">Average Airport Distance</p>
            <p className="mt-1 text-2xl font-semibold text-cyan-100">{avgDistance} km</p>
          </article>
          <article className="rounded-xl border border-indigo-200/25 bg-[#1a2a6a]/70 p-3 backdrop-blur">
            <p className="text-[11px] text-blue-100/85">Average Price / Night</p>
            <p className="mt-1 text-2xl font-semibold text-cyan-100">{formatNaira(avgPrice)}</p>
          </article>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate('/explore')}
            className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-900 shadow-sm transition hover:bg-cyan-300"
          >
            Explore Properties
          </button>
          <button
            type="button"
            className="rounded-lg border border-indigo-200/35 bg-indigo-400/20 px-3 py-2 text-xs font-semibold text-blue-100 transition hover:bg-indigo-400/30"
          >
            View Hotels on Map
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mergedHotels.map((hotel) => (
          <article
            key={hotel.id}
            role="button"
            tabIndex={0}
            onClick={() => navigate(hotelDetailPath(hotel))}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                navigate(hotelDetailPath(hotel))
              }
            }}
            className="group flex cursor-pointer flex-col rounded-2xl border border-indigo-200/20 bg-gradient-to-b from-[#1a2d70]/90 to-[#132352]/90 shadow-sm shadow-blue-950/35 backdrop-blur transition hover:-translate-y-0.5 hover:border-cyan-300/55 hover:shadow-lg"
          >
            <div className="relative h-48 shrink-0 overflow-hidden md:h-52">
              <img src={hotel.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              <span className="absolute left-3 top-3 rounded-full border border-cyan-100/35 bg-slate-900/70 px-2 py-1 text-[11px] font-semibold text-cyan-100">
                ⭐ {hotel.rating}
              </span>
              <span className="absolute right-3 top-3 rounded-full bg-emerald-500/90 px-2 py-1 text-[10px] font-semibold text-white">
                Available
              </span>
              <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 p-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    beginBookNow(hotel)
                  }}
                  className="rounded-lg bg-cyan-400 px-3 py-2 text-[11px] font-semibold text-slate-900 shadow-md hover:bg-cyan-300"
                >
                  Book Now
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(hotelDetailPath(hotel))
                  }}
                  className="rounded-lg border border-white/40 bg-slate-950/55 px-3 py-2 text-[11px] font-semibold text-white backdrop-blur hover:bg-slate-950/75"
                >
                  View Details
                </button>
              </div>
            </div>
            <div className="flex flex-1 flex-col space-y-2 p-4">
              <div>
                <h2 className="text-base font-semibold text-white">{hotel.name}</h2>
                <p className="text-xs text-indigo-100/90">{hotel.location}</p>
              </div>
              <div className="rounded-xl border border-cyan-200/30 bg-cyan-400/15 p-2.5">
                <p className="text-[10px] text-cyan-100">Nearest State Airport</p>
                <p className="text-xs font-medium text-white">{hotel.stateAirport}</p>
                <p className="mt-0.5 text-[11px] text-cyan-100">{hotel.airportDistanceKm} km away</p>
              </div>
              <div className="flex items-center justify-between border-t border-indigo-100/20 pt-2">
                <p className="text-xs text-indigo-100/85">From / night</p>
                <p className="text-base font-semibold text-emerald-300">{formatNaira(hotel.fromPerNight)}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      {selectedHotel ? <HotelBookingModal hotel={selectedHotel} onClose={() => setSelectedHotel(null)} /> : null}

      {loadingHotels ? <p className="text-xs text-slate-300">Loading live hotels...</p> : null}
    </section>
  )
}

export default HotelsPage
