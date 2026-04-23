import { Link, useNavigate, useParams } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'
import { properties } from '../data/properties'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { paymentListingInit } from '../lib/api.js'

function PropertyDetailsPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const property = properties.find((item) => item.id === id)
  const { isFavorite, toggleFavorite } = useFavorites()
  const { token, user } = useAuth()
  const toast = useToast()
  const gallery = useMemo(
    () => [
      property?.image,
      `${property?.image}&sat=-20`,
      `${property?.image}&brightness=0.95`,
    ].filter(Boolean),
    [property],
  )
  const [activeImage, setActiveImage] = useState(gallery[0])
  const similarListings = useMemo(
    () =>
      properties
        .filter((item) => item.id !== property?.id && (item.type === property?.type || item.purpose === property?.purpose))
        .slice(0, 4),
    [property],
  )
  const nearbyPlaces = useMemo(
    () =>
      properties
        .filter((item) => item.id !== property?.id && item.location.split(',')[1]?.trim() === property?.location.split(',')[1]?.trim())
        .slice(0, 4),
    [property],
  )

  useEffect(() => {
    setActiveImage(gallery[0])
  }, [gallery])

  const [paying, setPaying] = useState(false)

  const formatNaira = (amount, purpose) => {
    const value = `₦${new Intl.NumberFormat('en-NG').format(amount)}`
    if (purpose === 'Rent') return `${value} / year`
    if (purpose === 'Lease') return `${value} / m²`
    return value
  }

  if (!property) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-700">
        <p>Property not found.</p>
        <Link to="/explore" className="mt-4 inline-block rounded-xl bg-blue-600 px-4 py-2 text-white">
          Back to Explore
        </Link>
      </section>
    )
  }

  const startPaystackListingPayment = async () => {
    if (!user || !token) {
      const next = `/property/${encodeURIComponent(property.id)}`
      toast.warning('Login required', 'Please log in first to continue with secure payment.')
      navigate(`/login?next=${encodeURIComponent(next)}`)
      return
    }
    setPaying(true)
    try {
      const callbackUrl = `${window.location.origin}/payments/callback`
      const data = await paymentListingInit(token, { listingId: property.id, callbackUrl })
      const checkoutUrl = data?.authorization_url
      if (!checkoutUrl) {
        toast.error('Payment could not start', 'No checkout URL returned from server.')
        return
      }
      window.location.assign(checkoutUrl)
    } catch (err) {
      toast.error('Payment failed', err.message || 'Unable to start Paystack checkout for this property.')
    } finally {
      setPaying(false)
    }
  }

  return (
    <section className="space-y-4 pb-8 text-slate-800">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <Link to="/" className="hover:text-slate-700">Home</Link>
            <span>›</span>
            <Link to="/explore" className="hover:text-slate-700">Properties</Link>
            <span>›</span>
            <span>{property.location}</span>
            <span>›</span>
            <span className="font-medium text-slate-700">{property.title}</span>
          </div>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-600">
            {property.purpose === 'Sale' ? 'For Sale' : property.purpose}
          </span>
        </div>

        <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">{property.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
              <span>{property.location}</span>
              <button type="button" className="font-medium text-blue-600">View on Map</button>
              <span>{property.bedrooms || 0} Bedrooms</span>
              <span>{property.bathrooms} Living Rooms</span>
              <span>{Math.max(1, Math.floor(property.area / 1000))} Garages</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-50">Share</button>
            <button
              type="button"
              onClick={() => toggleFavorite(property.id)}
              className={`rounded-lg border px-3 py-2 text-xs transition ${
                isFavorite(property.id) ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              {isFavorite(property.id) ? 'Saved' : 'Save'}
            </button>
            <button type="button" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-50">Compare</button>
            <button type="button" className="rounded-lg bg-blue-600 px-3 py-2 text-xs text-white transition hover:bg-blue-500">
              Schedule a Visit
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_350px] xl:items-start">
        <div className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_132px]">
            <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <img src={activeImage} alt={property.title} className="h-[420px] w-full object-cover xl:h-[460px]" />
              <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white">
                Verified Property
              </span>
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <button className="rounded-lg bg-slate-950/70 px-2.5 py-1.5 text-[11px] text-white backdrop-blur">View Photos</button>
                <span className="rounded-lg bg-slate-950/70 px-2.5 py-1.5 text-[11px] text-white backdrop-blur">1 / {gallery.length}</span>
              </div>
            </article>
            <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
              {gallery.map((image, index) => (
                <button
                  key={image}
                  onClick={() => setActiveImage(image)}
                  className={`group relative overflow-hidden rounded-xl border ${
                    activeImage === image ? 'border-blue-400' : 'border-slate-200'
                  }`}
                >
                  <img src={image} alt={`${property.title} ${index + 1}`} className="h-24 w-full object-cover lg:h-[109px]" />
                  {index === gallery.length - 1 && (
                    <span className="absolute inset-0 grid place-items-center bg-slate-900/55 text-[11px] font-medium text-white">
                      +{Math.max(9, similarListings.length + 8)} More
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Overview</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {property.description} Located in {property.location}, this listing combines secure estate living, premium finishing, and quick access to major routes.
            </p>
            <button type="button" className="mt-1 text-xs font-medium text-blue-600">Read more</button>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ['Property ID', property.id.toUpperCase()],
                ['Property Type', property.type],
                ['Property Status', property.purpose === 'Sale' ? 'For Sale' : property.purpose],
                ['Year Built', '2023'],
                ['Furnishing', 'Fully Furnished'],
                ['Title', 'Governor\'s Consent'],
                ['Parking', `${Math.max(1, Math.floor(property.area / 1000))} Garages`],
                ['Serviced', 'Yes'],
              ].map(([label, value]) => (
                <article key={label} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <p className="text-[11px] text-slate-500">{label}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-700">{value}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Amenities</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-3 xl:grid-cols-6">
              {property.features?.map((item) => (
                <article key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-center text-[11px] text-slate-600">
                  {item}
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Description</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  This stunning {property.bedrooms ? `${property.bedrooms}-bedroom` : 'premium'} {property.type.toLowerCase()} combines modern finishing with practical layouts.
                  It offers bright living areas, quality fixtures, and premium estate-level infrastructure suitable for both families and investors.
                </p>
                <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs text-slate-600">
                  <li>Spacious main living area with premium finishing</li>
                  <li>Fitted modern kitchen with quality cabinetry</li>
                  <li>All rooms ensuite with quality wardrobe storage</li>
                  <li>Reliable power and water infrastructure</li>
                </ul>
              </div>
              <article className="overflow-hidden rounded-xl border border-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1577086664693-894d8405334a?auto=format&fit=crop&w=900&q=80"
                  alt="Map location"
                  className="h-44 w-full object-cover"
                />
                <div className="bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-700">{property.location}</p>
                  <p className="mt-1 text-[11px] text-slate-500">Prime location in a secure and serene environment.</p>
                  <button type="button" className="mt-1 text-xs font-medium text-blue-600">View on Google Map</button>
                </div>
              </article>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Nearby Places</h3>
            <p className="mt-1 text-xs text-slate-500">Explore what&apos;s around this property.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {(nearbyPlaces.length ? nearbyPlaces : similarListings).slice(0, 4).map((item, index) => (
                <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200">
                  <img src={item.image} alt={item.title} className="h-24 w-full object-cover" />
                  <div className="p-2">
                    <p className="truncate text-xs font-semibold text-slate-700">{item.title}</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{5 + index * 2} mins drive</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 xl:sticky xl:top-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-4xl font-semibold tracking-tight text-slate-900">{formatNaira(property.price, property.purpose)}</p>
            <p className="mt-1 text-xs text-slate-500">Asking Price</p>
            <div className="mt-3 rounded-xl bg-blue-50 p-3">
              <p className="text-[11px] text-slate-500">Estimated Monthly Payment</p>
              <p className="mt-1 text-lg font-semibold text-blue-700">
                ₦{new Intl.NumberFormat('en-NG').format(Math.max(50000, Math.round(property.price / 520)))}
                <span className="text-xs font-medium text-slate-500"> / month</span>
              </p>
            </div>
            <button
              type="button"
              disabled={paying}
              onClick={startPaystackListingPayment}
              className="mt-3 w-full rounded-lg bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {paying ? 'Redirecting…' : 'Pay Securely with Paystack'}
            </button>
            <p className="mt-2 text-[11px] text-slate-500">
              Payments are processed on TrustedHome via Paystack. Funds are handled on-platform.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-900">{property.agent?.name}</p>
              <p className="text-xs text-slate-500">{property.agent?.role}</p>
              <p className="mt-1 text-[11px] text-amber-500">★ {property.rating} ({40 + Number(property.id.split('-')[1])} Reviews)</p>
            </div>
            <a
              href={`https://wa.me/${property.agent?.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello, I want to inquire about ${property.title}`)}`}
              target="_blank"
              rel="noreferrer"
              className="mt-3 block w-full rounded-lg bg-blue-600 px-3 py-2.5 text-center text-xs font-medium text-white transition hover:bg-blue-500"
            >
              Call Agent
            </a>
            <button type="button" className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 transition hover:bg-slate-50">
              Send Message
            </button>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Secure & Verified</h3>
            <p className="mt-2 text-xs text-slate-600">All properties are professionally reviewed for authenticity and legality.</p>
            <ul className="mt-2 space-y-1 text-[11px] text-slate-500">
              <li>• Verified Documents</li>
              <li>• Legal Ownership</li>
              <li>• Secure Payments</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Key Details</h3>
            <div className="mt-3 space-y-2 text-xs">
              {[
                ['Property Type', property.type],
                ['Bedrooms', property.bedrooms || 'Open'],
                ['Bathrooms', property.bathrooms],
                ['Garage', Math.max(1, Math.floor(property.area / 1000))],
                ['Living Rooms', Math.max(1, Math.floor(property.bathrooms / 2))],
                ['Property Size', `${property.area.toLocaleString()} m²`],
                ['Price', formatNaira(property.price, property.purpose)],
                ['Property Status', property.purpose === 'Sale' ? 'For Sale' : property.purpose],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-slate-100 pb-1.5 last:border-b-0 last:pb-0">
                  <p className="text-slate-500">{label}</p>
                  <p className="font-medium text-slate-700">{value}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Request More Info</h3>
            <p className="mt-1 text-[11px] text-slate-500">Interested in this property? Get more details or schedule a private viewing.</p>
            <div className="mt-3 space-y-2">
              <input placeholder="Full Name" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
              <input placeholder="Email Address" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
              <input placeholder="Phone Number" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
              <textarea placeholder="Your Message" rows={3} className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
              <button type="button" className="w-full rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-medium text-white transition hover:bg-blue-500">
                Request Information
              </button>
            </div>
          </article>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">Similar Properties</h3>
          <Link to="/explore" className="text-xs font-medium text-blue-600">View all</Link>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {similarListings.map((item) => (
            <Link
              key={item.id}
              to={`/property/${item.id}`}
              className="block overflow-hidden rounded-xl border border-slate-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <img src={item.image} alt={item.title} className="h-32 w-full object-cover" />
              <div className="space-y-1.5 p-2.5">
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                  {item.purpose === 'Sale' ? 'For Sale' : item.purpose}
                </span>
                <p className="text-sm font-semibold text-slate-800">{formatNaira(item.price, item.purpose)}</p>
                <p className="truncate text-xs font-medium text-slate-700">{item.title}</p>
                <p className="text-[11px] text-slate-500">{item.location}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>{item.bedrooms || 0} Beds</span>
                  <span>{item.bathrooms} Baths</span>
                  <span>{Math.round(item.area / 10)} m²</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </section>
  )
}

export default PropertyDetailsPage
