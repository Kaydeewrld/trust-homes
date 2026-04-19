import { Link, useLocation, useNavigate } from 'react-router-dom'
import { clearListingDraft, loadListingDraft } from '../utils/listingDraftStorage'

const GALLERY = {
  main: 'https://images.unsplash.com/photo-1600585154340-6efcd41ef336?auto=format&fit=crop&w=1600&q=82',
  t1: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80',
  t2: 'https://images.unsplash.com/photo-1631670786646-8585d800a53f?auto=format&fit=crop&w=600&q=80',
  t3: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=600&q=80',
  t4: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=600&q=80',
}

const FEATURE_LABELS = {
  pool: 'Swimming pool',
  parking: 'Parking',
  security: '24/7 Security',
  gym: 'Gym',
}

function formatPrice(nairaDigits) {
  if (!nairaDigits) return null
  const n = Number(nairaDigits)
  if (!Number.isFinite(n) || n <= 0) return null
  return `₦${n.toLocaleString('en-NG')}`
}

function buildLocationDisplay(draft) {
  const area = draft.area ? String(draft.area) : ''
  const city = draft.city ? String(draft.city) : 'Lekki'
  const state = draft.stateVal ? String(draft.stateVal) : 'Lagos'
  const loc = draft.location ? String(draft.location) : ''
  if (loc && !area) return loc.includes('Nigeria') ? loc : `${loc}, Nigeria`
  const core = [area, city, state].filter(Boolean).join(', ')
  return core ? `${core}, Nigeria` : 'Lekki Phase 1, Lagos, Nigeria'
}

function buildBulletList(features) {
  const f = features && typeof features === 'object' ? features : {}
  const items = []
  if (f.security) items.push('CCTV & Gated Estate')
  if (f.pool) items.push('Swimming Pool')
  items.push('All Rooms En-suite', 'Fitted Kitchen', 'POP Ceilings & LED Lighting')
  if (f.parking) items.push('Ample Parking (3+ cars)')
  if (f.gym) items.push('Resident Gym Access')
  items.push('Walk-in Closets', 'Balcony Access', 'Water Treatment Plant', 'Guest WC')
  return [...new Set(items)].slice(0, 10)
}

function StatCard({ icon, label, value }) {
  return (
    <div className="flex flex-1 min-w-[140px] items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="truncate text-sm font-semibold text-slate-900">{value}</p>
      </div>
    </div>
  )
}

function ListingPreviewPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const fromNav = location.state && typeof location.state === 'object' ? location.state : null
  const draft = fromNav ?? loadListingDraft()

  const handlePublish = () => {
    window.alert('Your listing was published successfully. It is now live on Explore.')
    clearListingDraft()
    navigate('/explore')
  }

  if (!draft || typeof draft !== 'object') {
    return (
      <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
        <div className="mx-auto max-w-lg px-4 py-16 text-center md:py-20">
          <h1 className="text-xl font-bold text-slate-900">Nothing to preview yet</h1>
          <p className="mt-2 text-sm text-slate-600">Open Add Listing and tap “Preview Listing” to see your draft here.</p>
          <Link to="/add-listing" className="mt-6 inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500">
            Create a listing
          </Link>
        </div>
      </div>
    )
  }

  const title =
    (draft.title && String(draft.title).trim()) || 'Modern 4 - Bedroom Duplex with Rooftop Terrace'
  const listingKind = draft.listingKind === 'Sale' ? 'Sale' : 'Rent'
  const badge = listingKind === 'Rent' ? 'For Rent' : 'For Sale'
  const propertyType = draft.propertyType ? String(draft.propertyType) : 'Duplex'
  const locationDisplay = buildLocationDisplay(draft)
  const beds = Number(draft.beds) || 4
  const baths = Number(draft.baths) || 4
  const sqm = Number(draft.sqm) || 250
  const desc = draft.desc ? String(draft.desc) : ''
  const priceFormatted = formatPrice(draft.price)
  const priceDisplay =
    priceFormatted != null
      ? `${priceFormatted}${listingKind === 'Rent' ? ' / year' : ''}`
      : listingKind === 'Rent'
        ? '₦4,500,000 / year'
        : 'Price on request'
  const features = draft.features && typeof draft.features === 'object' ? draft.features : {}
  const bullets = buildBulletList(features)

  const aboutText =
    desc.trim() ||
    `Experience elevated living in this stunning ${propertyType.toLowerCase()} located in the heart of ${locationDisplay.replace(', Nigeria', '')}. This property offers spacious living areas, premium finishes, and access to top-tier amenities including ${Object.entries(features)
      .filter(([, v]) => v)
      .map(([k]) => FEATURE_LABELS[k] || k)
      .join(', ') || 'modern conveniences'} — ideal for families or professionals seeking comfort and style.`

  const mainImg = typeof draft.imageUrl === 'string' && draft.imageUrl ? draft.imageUrl : GALLERY.main

  const iconPrice = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
  const iconBed = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="1.6" />
    </svg>
  )
  const iconBath = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M9 6h6M9 6H7a2 2 0 0 0-2 2v10h14V8a2 2 0 0 0-2-2h-2" strokeWidth="1.6" />
    </svg>
  )
  const iconSize = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.6" />
    </svg>
  )
  const iconType = (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
      <path d="M3 10.5 12 3l9 7.5M6 9v11h12V9" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )

  const nearby = [
    { name: 'Lekki Conservation Centre', time: '5 mins drive' },
    { name: 'Novare Lekki Mall', time: '8 mins drive' },
    { name: 'Elegushi Beach', time: '12 mins drive' },
    { name: 'Lekki-Ikoyi Link Bridge', time: '15 mins drive' },
  ]

  return (
    <div className="min-h-screen bg-[#f4f6f8] text-slate-900">
      <div className="mx-auto max-w-[1200px] px-4 py-5 md:px-6 lg:max-w-[1320px]">
        <Link
          to="/add-listing?resume=1"
          className="inline-flex items-center gap-1 text-sm font-medium text-violet-700 hover:text-violet-600"
        >
          <span aria-hidden>←</span> Back to Edit Listing
        </Link>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">{title}</h1>
              <span
                className={`shrink-0 rounded-full px-3 py-0.5 text-xs font-bold ${
                  listingKind === 'Rent' ? 'bg-emerald-100 text-emerald-800' : 'bg-violet-100 text-violet-800'
                }`}
              >
                {badge}
              </span>
            </div>
            <p className="mt-2 flex items-start gap-2 text-sm text-slate-500">
              <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" fill="none" stroke="currentColor">
                <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" strokeWidth="1.8" />
                <circle cx="12" cy="10" r="2.5" strokeWidth="1.8" />
              </svg>
              {locationDisplay}
            </p>
          </div>
          <button
            type="button"
            onClick={handlePublish}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-violet-500 lg:self-center"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeWidth="1.8" />
              <path d="M12 11v6M9 14h6" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Publish
          </button>
        </div>

        {/* Gallery */}
        <div className="mt-6 grid gap-2 md:grid-cols-[1.2fr_1fr] md:gap-3 lg:grid-cols-[1.35fr_1fr]">
          <div className="relative min-h-[220px] overflow-hidden rounded-2xl bg-slate-200 md:min-h-[320px] lg:min-h-[380px]">
            <img src={mainImg} alt="" className="h-full w-full object-cover" />
            <span className="absolute left-3 top-3 rounded-lg bg-violet-600 px-2.5 py-1 text-xs font-bold text-white shadow">Featured</span>
          </div>
          <div className="grid grid-cols-2 grid-rows-2 gap-2 md:gap-3">
            {[GALLERY.t1, GALLERY.t2, GALLERY.t3, GALLERY.t4].map((src, i) => (
              <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200">
                <img src={src} alt="" className="h-full w-full object-cover" />
                {i === 3 ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                    <span className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-900 shadow">+ 12 Photos</span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex flex-wrap gap-3">
          <StatCard icon={iconPrice} label="Price" value={priceDisplay} />
          <StatCard icon={iconBed} label="Beds" value={`${beds} Beds`} />
          <StatCard icon={iconBath} label="Baths" value={`${baths} Baths`} />
          <StatCard icon={iconSize} label="Size" value={`${sqm} sqm`} />
          <StatCard icon={iconType} label="Type" value={propertyType} />
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-8">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold text-slate-900">About this property</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{aboutText}</p>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold text-slate-900">Property Features</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {bullets.map((text) => (
                  <li key={text} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-600">
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold text-slate-900">Location</h2>
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                <div className="relative aspect-[21/9] min-h-[200px] bg-slate-200">
                  <img
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0f?auto=format&fit=crop&w=1200&q=70"
                    alt=""
                    className="h-full w-full object-cover opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-lg bg-white/95 px-3 py-2 text-sm font-semibold text-slate-900 shadow">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-violet-600" fill="none" stroke="currentColor">
                      <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z" strokeWidth="1.8" />
                      <circle cx="12" cy="10" r="2.5" strokeWidth="1.8" />
                    </svg>
                    {locationDisplay.replace(', Nigeria', '').split(',')[0] || 'Lekki Phase 1'}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="text-lg font-semibold text-slate-900">Nearby Places</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {nearby.map((p) => (
                  <div key={p.name} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <span className="text-sm font-medium text-slate-800">{p.name}</span>
                    <span className="shrink-0 text-xs font-semibold text-violet-700">{p.time}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-md">
              <p className="text-sm font-semibold leading-snug text-slate-900">Interested in this property? Get in touch with the agent</p>
              <div className="mt-4 flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=96&q=70"
                  alt=""
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-violet-100"
                />
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-sm font-bold text-slate-900">
                    Kayode Ibrahim
                    <span className="inline-grid h-4 w-4 place-items-center rounded-full bg-blue-500 text-[10px] text-white" title="Verified">
                      ✓
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">Verified Real Estate Agent</p>
                </div>
              </div>
              <button type="button" className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                  <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" strokeWidth="1.8" />
                </svg>
                Send Inquiry
              </button>
              <button
                type="button"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-violet-500 bg-white py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" strokeWidth="1.8" />
                </svg>
                Call Agent
              </button>
              <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-violet-500" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="9" strokeWidth="1.6" />
                  <path d="M12 7v5l3 2" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
                Response time: Within a few hours
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Property Highlights</h3>
              <ul className="mt-3 space-y-2">
                {[
                  { t: 'Newly Built', s: 'Completed in 2024' },
                  { t: 'Rooftop Terrace', s: 'Perfect for relaxation' },
                  { t: 'Modern Finishes', s: 'High-quality materials' },
                  { t: '24/7 Security', s: 'Gated estate' },
                  { t: 'Ample Parking', s: 'Space for up to 3 cars' },
                ].map((h) => (
                  <li key={h.t} className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-600">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                        <path d="M12 2l2 4 4.5.5-3 3.5 1 4.5L12 13l-4.5 2 1-4.5-3-3.5L10 6l2-4z" strokeWidth="1.4" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{h.t}</p>
                      <p className="text-xs text-slate-500">{h.s}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default ListingPreviewPage
