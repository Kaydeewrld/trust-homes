import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import HotelBookingModal from '../components/HotelBookingModal.jsx'
import { findPlaceholderHotel } from '../data/hotelsPlaceholders.js'

function formatNaira(value) {
  return `₦${new Intl.NumberFormat('en-NG').format(value)}`
}

export default function HotelDetailPage() {
  const { placeId } = useParams()
  const [bookingOpen, setBookingOpen] = useState(false)
  const hotel = findPlaceholderHotel(placeId)

  if (!placeId) {
    return <Navigate to="/hotels" replace />
  }

  if (!hotel) {
    if (String(placeId).startsWith('h-')) {
      return (
        <section className="rounded-2xl border border-white/20 bg-white/10 p-6 text-center text-slate-100 backdrop-blur-xl">
          <p className="font-medium">This demo hotel was not found.</p>
          <Link to="/hotels" className="mt-4 inline-block rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-900">
            Back to hotels
          </Link>
        </section>
      )
    }
    return <Navigate to={`/property/${encodeURIComponent(placeId)}`} replace />
  }

  const modalHotel = {
    id: hotel.id,
    name: hotel.name,
    fromPerNight: hotel.fromPerNight,
  }

  return (
    <section className="space-y-4 pb-10 text-slate-100">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link to="/hotels" className="font-medium text-cyan-200 hover:text-white">
          ← All hotels
        </Link>
        <span className="text-slate-400">/</span>
        <span className="text-slate-200">{hotel.name}</span>
      </div>

      <article className="overflow-hidden rounded-3xl border border-indigo-200/25 bg-gradient-to-b from-[#1a2d70]/95 to-[#132352]/95 shadow-xl">
        <div className="relative h-56 w-full md:h-72">
          <img src={hotel.image} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-transparent" />
          <span className="absolute left-4 top-4 rounded-full border border-cyan-100/35 bg-slate-900/80 px-2.5 py-1 text-[11px] font-semibold text-cyan-100">
            ⭐ {hotel.rating}
          </span>
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 p-4">
            <button
              type="button"
              onClick={() => setBookingOpen(true)}
              className="rounded-lg bg-cyan-400 px-4 py-2 text-xs font-semibold text-slate-900 shadow-sm hover:bg-cyan-300"
            >
              Book now
            </button>
            <Link
              to="/hotels"
              className="rounded-lg border border-white/30 bg-slate-900/60 px-4 py-2 text-xs font-semibold text-white backdrop-blur hover:bg-slate-900/80"
            >
              Browse more
            </Link>
          </div>
        </div>
        <div className="space-y-4 p-5 md:p-6">
          <div>
            <h1 className="text-2xl font-semibold text-white md:text-3xl">{hotel.name}</h1>
            <p className="mt-1 text-sm text-indigo-100/90">{hotel.location}</p>
            <p className="mt-3 text-2xl font-semibold text-emerald-300">{formatNaira(hotel.fromPerNight)} / night</p>
          </div>
          <div className="rounded-xl border border-cyan-200/30 bg-cyan-400/10 p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-cyan-100">Nearest state airport</p>
            <p className="mt-1 text-sm font-medium text-white">{hotel.stateAirport}</p>
            <p className="mt-1 text-xs text-cyan-100">{hotel.airportDistanceKm} km away</p>
          </div>
          <p className="text-sm leading-relaxed text-indigo-100/90">
            Reserve this stay securely through TrustedHome. Choose your number of nights, then complete payment with Paystack.
            You will receive a confirmation after payment succeeds.
          </p>
        </div>
      </article>

      {bookingOpen ? <HotelBookingModal hotel={modalHotel} onClose={() => setBookingOpen(false)} /> : null}
    </section>
  )
}
