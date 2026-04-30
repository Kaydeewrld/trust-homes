import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useFavorites } from '../context/FavoritesContext'
import { properties } from '../data/properties'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { paymentListingInit, paymentPropertyInit, visitsCreate, walletPayments } from '../lib/api.js'
import { listingsGetById } from '../lib/api.js'
import { listingsRequestInfo } from '../lib/api.js'
import { mapApiListingToProperty } from '../utils/listingAdapters.js'
import { addPropertyToCollection, createUserCollection, getUserCollections } from '../utils/collections.js'
import { trackRecentlyViewedProperty } from '../utils/recentlyViewed.js'

function PropertyDetailsPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const localProperty = properties.find((item) => item.id === id)
  const [property, setProperty] = useState(localProperty || null)
  const [loadingProperty, setLoadingProperty] = useState(!localProperty)
  useEffect(() => {
    let cancelled = false
    if (localProperty) {
      setProperty(localProperty)
      setLoadingProperty(false)
      return () => {
        cancelled = true
      }
    }
    ;(async () => {
      const timeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      })
      try {
        const out = await Promise.race([listingsGetById(id), timeout])
        const mapped = out?.listing ? mapApiListingToProperty(out.listing, 0) : null
        if (!cancelled) setProperty(mapped)
      } catch {
        if (!cancelled) setProperty(null)
      } finally {
        if (!cancelled) setLoadingProperty(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id, localProperty])

  const { isFavorite, toggleFavorite } = useFavorites()
  const { token, user } = useAuth()
  const toast = useToast()
  const gallery = useMemo(() => {
    const base = property?.image ? String(property.image) : ''
    if (!base) return []
    if (base.startsWith('data:')) return [base]
    return [base, `${base}${base.includes('?') ? '&' : '?'}sat=-20`, `${base}${base.includes('?') ? '&' : '?'}brightness=0.95`]
  }, [property])
  const [activeImage, setActiveImage] = useState(gallery[0])
  const similarListings = useMemo(() => {
    if (!property) return []
    return properties
      .filter((item) => item.id !== property.id && (item.type === property.type || item.purpose === property.purpose))
      .slice(0, 4)
  }, [property])

  const nearbyPlaces = useMemo(() => {
    if (!property?.location) return []
    const part = String(property.location).split(',')[1]?.trim() || ''
    if (!part) return []
    return properties
      .filter((item) => item.id !== property.id && String(item.location || '').split(',')[1]?.trim() === part)
      .slice(0, 4)
  }, [property])

  useEffect(() => {
    setActiveImage(gallery[0])
  }, [gallery])

  useEffect(() => {
    if (!property?.id) return
    trackRecentlyViewedProperty(property)
  }, [property?.id, property])

  const [paying, setPaying] = useState(false)
  const [checkingInspection, setCheckingInspection] = useState(false)
  const [inspectionPaid, setInspectionPaid] = useState(false)
  const [propertyPaid, setPropertyPaid] = useState(false)
  const [requestName, setRequestName] = useState('')
  const [requestEmail, setRequestEmail] = useState('')
  const [requestPhone, setRequestPhone] = useState('')
  const [requestNote, setRequestNote] = useState('')
  const [requestSending, setRequestSending] = useState(false)
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [visitModalOpen, setVisitModalOpen] = useState(false)
  const [visitDate, setVisitDate] = useState('')
  const [visitTime, setVisitTime] = useState('10:00')
  const [visitSubmitting, setVisitSubmitting] = useState(false)
  const [showCollectionPicker, setShowCollectionPicker] = useState(false)
  const [collectionChoice, setCollectionChoice] = useState('')
  const [collectionOptions, setCollectionOptions] = useState([])
  const safeArea = Number.isFinite(Number(property?.area)) ? Number(property.area) : 0
  const safeBathrooms = Number.isFinite(Number(property?.bathrooms)) ? Number(property.bathrooms) : 0
  const safeType = String(property?.type || 'Property')
  const inspectionRequired = Boolean(property?.ownerRole === 'AGENT' && !property?.hasVideo && !localProperty)
  const scheduleVisitRequested = searchParams.get('scheduleVisit') === '1'
  const mapEmbedUrl = useMemo(() => {
    const lat = Number(property?.latitude)
    const lon = Number(property?.longitude)
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return `https://maps.google.com/maps?q=${lat},${lon}&z=15&output=embed`
    }
    return `https://maps.google.com/maps?q=${encodeURIComponent(String(property?.location || 'Nigeria'))}&z=14&output=embed`
  }, [property?.latitude, property?.longitude, property?.location])
  const googleMapUrl = useMemo(() => {
    const lat = Number(property?.latitude)
    const lon = Number(property?.longitude)
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return `https://www.google.com/maps?q=${lat},${lon}`
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(property?.location || 'Nigeria'))}`
  }, [property?.latitude, property?.longitude, property?.location])

  useEffect(() => {
    let cancelled = false
    if (!inspectionRequired || !token || !property?.id) {
      setInspectionPaid(false)
      return () => {
        cancelled = true
      }
    }
    ;(async () => {
      setCheckingInspection(true)
      try {
        const out = await walletPayments(token, 50)
        const payments = Array.isArray(out?.payments) ? out.payments : []
        const paid = payments.some(
          (p) =>
            String(p?.status || '').toUpperCase() === 'SUCCESS' &&
            String(p?.kind || '').toLowerCase() === 'property_payment' &&
            String(p?.listingId || '') === String(property.id) &&
            Number(p?.amountNgn || 0) === 15000,
        )
        if (!cancelled) setInspectionPaid(paid)
      } catch {
        if (!cancelled) setInspectionPaid(false)
      } finally {
        if (!cancelled) setCheckingInspection(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [inspectionRequired, property?.id, token])

  useEffect(() => {
    if (!scheduleVisitRequested) return
    if (inspectionRequired && !inspectionPaid) return
    setVisitModalOpen(true)
    const next = new URLSearchParams(searchParams)
    next.delete('scheduleVisit')
    setSearchParams(next, { replace: true })
  }, [scheduleVisitRequested, inspectionRequired, inspectionPaid, searchParams, setSearchParams])

  useEffect(() => {
    let cancelled = false
    if (!token || !property?.id || localProperty) {
      setPropertyPaid(false)
      return () => {
        cancelled = true
      }
    }
    ;(async () => {
      try {
        const out = await walletPayments(token, 100)
        const payments = Array.isArray(out?.payments) ? out.payments : []
        const paid = payments.some(
          (p) =>
            String(p?.status || '').toUpperCase() === 'SUCCESS' &&
            String(p?.kind || '').toLowerCase() === 'listing_purchase' &&
            String(p?.listingId || '') === String(property.id),
        )
        if (!cancelled) setPropertyPaid(paid)
      } catch {
        if (!cancelled) setPropertyPaid(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, property?.id, localProperty])

  const addToCollection = () => {
    if (!user) {
      toast.warning('Login required', 'Please log in first to use collections.')
      navigate(`/login?next=${encodeURIComponent(`/property/${property.id}`)}`)
      return
    }
    const collections = getUserCollections(user.id)
    if (!collections.length) {
      try {
        const created = createUserCollection(user.id, 'General')
        setCollectionOptions([created])
        setCollectionChoice(created.name)
      } catch (err) {
        toast.error('Create collection failed', err?.message || 'Unable to create collection.')
        return
      }
    } else {
      setCollectionOptions(collections)
      setCollectionChoice(collections[0]?.name || '')
    }
    setShowCollectionPicker(true)
  }

  const confirmAddToCollection = () => {
    if (!user) return
    const collections = collectionOptions.length ? collectionOptions : getUserCollections(user.id)
    const target = collections.find((c) => c.name.toLowerCase() === collectionChoice.trim().toLowerCase())
    if (!target) {
      toast.error('Collection not found', 'Please select a valid collection.')
      return
    }
    try {
      addPropertyToCollection(user.id, target.id, property)
      toast.success('Saved to collection', `${property.title} was added to "${target.name}".`)
      setShowCollectionPicker(false)
    } catch (err) {
      toast.error('Save failed', err?.message || 'Unable to save property to collection.')
    }
  }

  const formatNaira = (amount, purpose) => {
    const value = `₦${new Intl.NumberFormat('en-NG').format(amount)}`
    if (purpose === 'Rent') return `${value} / year`
    if (purpose === 'Lease') return `${value} / m²`
    return value
  }

  if (loadingProperty) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-700">
        <p>Loading property details...</p>
      </section>
    )
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
    if (inspectionRequired && !inspectionPaid) {
      toast.warning('Inspection fee required', 'Pay the ₦15,000 inspection fee first for image-only agent listings.')
      return
    }
    setPaying(true)
    try {
      const callbackUrl = `${window.location.origin}/payments/callback?next=${encodeURIComponent(`/property/${property.id}`)}`
      const isRemoteListing = !localProperty
      const data = isRemoteListing
        ? await paymentListingInit(token, { listingId: property.id, callbackUrl })
        : await paymentPropertyInit(token, {
            amountNgn: Math.max(100, Math.floor(Number(property.price) || 0)),
            title: property.title,
            paymentType: 'property_full_payment',
            callbackUrl,
          })
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

  const startInspectionPayment = async (opts = {}) => {
    if (!user || !token) {
      const next = `/property/${encodeURIComponent(property.id)}`
      toast.warning('Login required', 'Please log in first to pay for inspection.')
      navigate(`/login?next=${encodeURIComponent(next)}`)
      return
    }
    setPaying(true)
    try {
      const scheduleSuffix = opts.afterSchedule ? '?scheduleVisit=1' : ''
      const callbackUrl = `${window.location.origin}/payments/callback?next=${encodeURIComponent(`/property/${property.id}${scheduleSuffix}`)}`
      const data = await paymentPropertyInit(token, {
        amountNgn: 15000,
        title: `Inspection fee for ${property.title}`,
        listingId: property.id,
        paymentType: 'inspection_fee',
        callbackUrl,
      })
      const checkoutUrl = data?.authorization_url
      if (!checkoutUrl) {
        toast.error('Inspection payment failed', 'No checkout URL returned from server.')
        return
      }
      window.location.assign(checkoutUrl)
    } catch (err) {
      toast.error('Inspection payment failed', err.message || 'Unable to start inspection payment.')
    } finally {
      setPaying(false)
    }
  }

  const handleScheduleVisitClick = async () => {
    if (!user || !token) {
      const next = `/property/${encodeURIComponent(property.id)}`
      toast.warning('Login required', 'Please log in first to schedule a visit.')
      navigate(`/login?next=${encodeURIComponent(next)}`)
      return
    }
    if (inspectionRequired && !inspectionPaid) {
      toast.info('Inspection required', 'Pay inspection fee first, then select your visit date.')
      await startInspectionPayment({ afterSchedule: true })
      return
    }
    setVisitModalOpen(true)
  }

  const submitVisitSchedule = async () => {
    if (!token || !user) return
    if (!visitDate) {
      toast.warning('Date required', 'Please choose a visit date.')
      return
    }
    setVisitSubmitting(true)
    try {
      const out = await visitsCreate(token, {
        listingId: String(property.id),
        visitDate,
        visitTime,
      })
      toast.success('Visit request sent', 'Your preferred visit date has been sent to the agent.')
      setVisitModalOpen(false)
      if (out?.conversationId) navigate(`/messages?conversation=${encodeURIComponent(out.conversationId)}`)
    } catch (err) {
      toast.error('Could not schedule visit', err?.message || 'Please try again.')
    } finally {
      setVisitSubmitting(false)
    }
  }

  const submitRequestInfo = async () => {
    if (!requestName.trim() || !requestEmail.trim()) {
      toast.warning('Missing details', 'Please provide your name and email.')
      return
    }
    setRequestSending(true)
    try {
      await listingsRequestInfo(property.id, {
        name: requestName.trim(),
        email: requestEmail.trim(),
        phone: requestPhone.trim() || undefined,
        note: requestNote.trim() || undefined,
        property: {
          id: property.id,
          title: property.title,
          location: property.location,
          purpose: property.purpose,
          propertyType: property.type,
          priceNgn: Number(property.price || 0),
          bedrooms: Number(property.bedrooms || 0),
          bathrooms: Number(property.bathrooms || 0),
          areaSqm: Number(property.area || 0),
        },
      })
      setRequestModalOpen(true)
      setRequestNote('')
      toast.success('Request received', 'We sent the property details and insight to your email.')
    } catch (err) {
      toast.error('Request failed', err?.message || 'Unable to submit request now.')
    } finally {
      setRequestSending(false)
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
                  <a href={googleMapUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-600">View on Map</a>
              <span>{property.bedrooms || 0} Bedrooms</span>
              <span>{property.bathrooms} Living Rooms</span>
              <span>{Math.max(1, Math.floor(safeArea / 1000))} Garages</span>
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
            <button
              type="button"
              onClick={addToCollection}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-50"
            >
              Add to Collection
            </button>
            <button type="button" onClick={() => void handleScheduleVisitClick()} className="rounded-lg bg-blue-600 px-3 py-2 text-xs text-white transition hover:bg-blue-500">
              Schedule a Visit
            </button>
          </div>
        </div>
        {showCollectionPicker ? (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <label className="text-xs font-medium text-slate-600">
              Choose collection:
              <select
                value={collectionChoice}
                onChange={(e) => setCollectionChoice(e.target.value)}
                className="ml-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800"
              >
                {collectionOptions.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={confirmAddToCollection}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500"
            >
              Save to selected collection
            </button>
            <button
              type="button"
              onClick={() => setShowCollectionPicker(false)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        ) : null}
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
                ['Parking', `${Math.max(1, Math.floor(safeArea / 1000))} Garages`],
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
                  This stunning {property.bedrooms ? `${property.bedrooms}-bedroom` : 'premium'} {safeType.toLowerCase()} combines modern finishing with practical layouts.
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
                <iframe title="Map location" src={mapEmbedUrl} className="h-44 w-full border-0" loading="lazy" />
                <div className="bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-700">{property.location}</p>
                  <p className="mt-1 text-[11px] text-slate-500">Prime location in a secure and serene environment.</p>
                  <a href={googleMapUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-medium text-blue-600">View on Google Map</a>
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
            {String(property.purpose || '').toLowerCase() === 'sale' ? (
              <div className="mt-3 rounded-xl bg-blue-50 p-3">
                <p className="text-[11px] text-slate-500">Purchase type</p>
                <p className="mt-1 text-sm font-semibold text-blue-700">Outright purchase</p>
              </div>
            ) : null}
            <button
              type="button"
              disabled={paying || propertyPaid}
              onClick={startPaystackListingPayment}
              className="mt-3 w-full rounded-lg bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {propertyPaid ? 'Property already paid' : paying ? 'Redirecting…' : 'Pay Securely with Paystack'}
            </button>
            {propertyPaid ? <p className="mt-2 text-[11px] font-semibold text-emerald-700">Payment confirmed for this property.</p> : null}
            <p className="mt-2 text-[11px] text-slate-500">
              Payments are processed on TrustedHome via Paystack. Funds are handled on-platform.
            </p>
            {inspectionRequired ? (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900">
                <p className="font-semibold">Inspection Required (₦15,000)</p>
                <p className="mt-1">
                  This agent listing has images only (no video). Pay inspection before paying for the property.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    disabled={paying || inspectionPaid || checkingInspection}
                    onClick={startInspectionPayment}
                    className="rounded-lg bg-amber-600 px-3 py-2 text-[11px] font-semibold text-white hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {checkingInspection ? 'Checking payment…' : inspectionPaid ? 'Inspection paid' : 'Pay inspection fee'}
                  </button>
                  {inspectionPaid ? <span className="text-emerald-700">You can now pay for this property.</span> : null}
                </div>
              </div>
            ) : null}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{property.agent?.name}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    property.agent?.online ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {property.agent?.online ? 'Online' : 'Offline'}
                </span>
              </div>
              <p className="text-xs text-slate-500">{property.agent?.role}</p>
              <p className="mt-1 text-[11px] text-amber-500">★ {property.rating} ({Number(property.agent?.reviews || 0).toLocaleString('en-NG')} Reviews)</p>
              <p className="mt-1 text-[11px] text-slate-500">
                Properties sold: <span className="font-semibold text-slate-700">{Number(property.agent?.soldListings || 0).toLocaleString('en-NG')}</span>
              </p>
            </div>
            <a
              href={property.agent?.phone ? `tel:${property.agent.phone.replace(/\D/g, '')}` : undefined}
              className={`mt-3 block w-full rounded-lg px-3 py-2.5 text-center text-xs font-medium transition ${
                property.agent?.phone ? 'bg-blue-600 text-white hover:bg-blue-500' : 'cursor-not-allowed bg-slate-200 text-slate-500'
              }`}
            >
              Call Agent
            </a>
            <button
              type="button"
              onClick={() => {
                const qs = new URLSearchParams()
                if (property?.ownerId) qs.set('agentId', String(property.ownerId))
                qs.set('listingId', String(property.id || ''))
                navigate(`/messages?${qs.toString()}`)
              }}
              className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 transition hover:bg-slate-50"
            >
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
                ['Garage', Math.max(1, Math.floor(safeArea / 1000))],
                ['Living Rooms', Math.max(1, Math.floor(safeBathrooms / 2))],
                ['Property Size', `${safeArea.toLocaleString()} m²`],
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
              <input value={requestName} onChange={(e) => setRequestName(e.target.value)} placeholder="Full Name" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
              <input value={requestEmail} onChange={(e) => setRequestEmail(e.target.value)} placeholder="Email Address" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
              <input value={requestPhone} onChange={(e) => setRequestPhone(e.target.value)} placeholder="Phone Number" className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
              <textarea value={requestNote} onChange={(e) => setRequestNote(e.target.value)} placeholder="Your Message" rows={3} className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs" />
              <button type="button" onClick={submitRequestInfo} disabled={requestSending} className="w-full rounded-lg bg-blue-600 px-3 py-2.5 text-xs font-medium text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
                {requestSending ? 'Sending...' : 'Request Information'}
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

      {requestModalOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-900">Request received</h3>
            <p className="mt-2 text-sm text-slate-600">
              We have sent the property details, support contact, and AI market insight to your email.
            </p>
            <button
              type="button"
              onClick={() => setRequestModalOpen(false)}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}

      {visitModalOpen ? (
        <div className="fixed inset-0 z-[250] grid place-items-center bg-slate-950/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Schedule a Visit</h3>
            <p className="mt-1 text-xs text-slate-500">Choose your preferred date and time. This will be sent to the agent in chat.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-700">
                Visit date
                <input type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
              </label>
              <label className="text-xs font-semibold text-slate-700">
                Preferred time
                <input type="time" value={visitTime} onChange={(e) => setVisitTime(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setVisitModalOpen(false)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700">
                Cancel
              </button>
              <button
                type="button"
                disabled={visitSubmitting}
                onClick={() => void submitVisitSchedule()}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
              >
                {visitSubmitting ? 'Sending...' : 'Send Visit Request'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

    </section>
  )
}

export default PropertyDetailsPage
