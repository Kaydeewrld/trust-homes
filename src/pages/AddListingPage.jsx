import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import CustomDropdown from '../components/CustomDropdown'
import { loadListingDraft, saveListingDraft } from '../utils/listingDraftStorage'
import {
  MONTH_OPTIONS,
  composeIsoDate,
  dayOptionsFor,
  listingYearOptions,
  parseIsoDateParts,
} from '../utils/dateDropdownOptions'

const ADD_LISTING_PROPERTY_TYPES = ['Apartment', 'House', 'Duplex', 'Penthouse', 'Office', 'Commercial']
const ADD_LISTING_STATES = ['Lagos', 'Ogun', 'Abuja']
const ADD_LISTING_CITIES = ['Lekki', 'Ikoyi', 'Victoria Island']

const steps = [
  { id: 1, label: 'Basic Information' },
  { id: 2, label: 'Details & Features' },
  { id: 3, label: 'Photos & Videos' },
  { id: 4, label: 'Pricing & Availability' },
  { id: 5, label: 'Review & Publish' },
]

const PREVIEW_HERO_IMAGE =
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80'

const tips = [
  { icon: 'camera', text: 'Use high-quality photos' },
  { icon: 'pen', text: 'Write a detailed description' },
  { icon: 'tag', text: 'Set a competitive price' },
]

function StepIndicator({ stepNumber, active, done }) {
  if (done) {
    return (
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-600 text-white">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    )
  }
  if (active) {
    return (
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-100 text-xs font-bold text-violet-700 ring-2 ring-violet-500">
        {stepNumber}
      </span>
    )
  }
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-400">
      {stepNumber}
    </span>
  )
}

function TipIcon({ kind }) {
  const c = 'h-4 w-4 text-violet-600'
  if (kind === 'camera')
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeWidth="1.8" />
        <circle cx="12" cy="13" r="4" strokeWidth="1.8" />
      </svg>
    )
  if (kind === 'pen')
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor">
        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" className={c} fill="none" stroke="currentColor">
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function AddListingPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [step, setStep] = useState(1)
  const [propertyType, setPropertyType] = useState('Apartment')
  const [listingKind, setListingKind] = useState('Rent')
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [stateVal, setStateVal] = useState('Lagos')
  const [city, setCity] = useState('Lekki')
  const [area, setArea] = useState('')
  const [desc, setDesc] = useState('')
  const [beds, setBeds] = useState(4)
  const [baths, setBaths] = useState(3)
  const [sqm, setSqm] = useState(250)
  const [price, setPrice] = useState('')
  const defaultAvail = parseIsoDateParts('')
  const [availY, setAvailY] = useState(defaultAvail.y)
  const [availM, setAvailM] = useState(defaultAvail.mo)
  const [availD, setAvailD] = useState(defaultAvail.d)
  const [availableFrom, setAvailableFrom] = useState(() => composeIsoDate(defaultAvail.y, defaultAvail.mo, defaultAvail.d))
  const [features, setFeatures] = useState({
    pool: true,
    parking: true,
    security: false,
    gym: false,
  })

  const titleLen = title.length
  const descLen = desc.length

  const previewTitle = title.trim() || 'Your property title'
  const previewBadge = listingKind === 'Rent' ? 'For Rent' : 'For Sale'

  const yearOptions = useMemo(() => listingYearOptions(), [])
  const dayOpts = useMemo(() => dayOptionsFor(availY, availM), [availY, availM])

  const patchAvailableDate = (partial) => {
    const y = partial.y ?? availY
    const mo = partial.mo ?? availM
    const d = partial.d ?? availD
    const iso = composeIsoDate(y, mo, d)
    const p = parseIsoDateParts(iso)
    setAvailY(p.y)
    setAvailM(p.mo)
    setAvailD(p.d)
    setAvailableFrom(iso)
  }

  const toggleFeature = (key) => setFeatures((f) => ({ ...f, [key]: !f[key] }))

  useEffect(() => {
    if (searchParams.get('resume') !== '1') return
    const d = loadListingDraft()
    if (d && typeof d === 'object') {
      if (typeof d.propertyType === 'string') setPropertyType(d.propertyType)
      if (d.listingKind === 'Rent' || d.listingKind === 'Sale') setListingKind(d.listingKind)
      if (typeof d.title === 'string') setTitle(d.title)
      if (typeof d.location === 'string') setLocation(d.location)
      if (typeof d.stateVal === 'string') setStateVal(d.stateVal)
      if (typeof d.city === 'string') setCity(d.city)
      if (typeof d.area === 'string') setArea(d.area)
      if (typeof d.desc === 'string') setDesc(d.desc)
      if (typeof d.beds === 'number' && Number.isFinite(d.beds)) setBeds(d.beds)
      if (typeof d.baths === 'number' && Number.isFinite(d.baths)) setBaths(d.baths)
      if (typeof d.sqm === 'number' && Number.isFinite(d.sqm)) setSqm(d.sqm)
      if (typeof d.price === 'string') setPrice(d.price)
      if (typeof d.availableFrom === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.availableFrom)) {
        setAvailableFrom(d.availableFrom)
        const p = parseIsoDateParts(d.availableFrom)
        setAvailY(p.y)
        setAvailM(p.mo)
        setAvailD(p.d)
      }
      if (d.features && typeof d.features === 'object') {
        setFeatures((prev) => ({
          pool: Boolean(d.features.pool),
          parking: Boolean(d.features.parking),
          security: Boolean(d.features.security),
          gym: Boolean(d.features.gym),
        }))
      }
    }
    setSearchParams({}, { replace: true })
  }, [searchParams, setSearchParams])

  const buildListingDraft = () => ({
    propertyType,
    listingKind,
    title,
    location,
    stateVal,
    city,
    area,
    desc,
    beds,
    baths,
    sqm,
    price,
    availableFrom,
    features,
    imageUrl: PREVIEW_HERO_IMAGE,
  })

  const handlePreviewListing = () => {
    const draft = buildListingDraft()
    saveListingDraft(draft)
    navigate('/add-listing/preview', { state: draft })
  }

  return (
    <div className="min-h-screen bg-[#f4f2fb] text-slate-900">
      <div className="mx-auto max-w-[1440px] px-4 py-6 md:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Add New Listing</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Fill in the details below to list your property and reach thousands of potential buyers or renters.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-violet-500 bg-white px-4 py-2.5 text-sm font-semibold text-violet-700 shadow-sm hover:bg-violet-50"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeWidth="1.8" />
                <path d="M17 21v-8H7v8M7 3v5h8" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Save as Draft
            </button>
            <button
              type="button"
              onClick={handlePreviewListing}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-violet-500"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeWidth="1.8" />
                <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
              </svg>
              Preview Listing
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_300px] xl:grid-cols-[260px_minmax(0,1fr)_320px]">
          {/* Steps */}
          <aside className="h-fit space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Progress</p>
            <ol className="space-y-0">
              {steps.map((s, idx) => {
                const done = s.id < step
                const active = s.id === step
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setStep(s.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left transition ${
                        active ? 'bg-violet-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <StepIndicator stepNumber={s.id} active={active} done={done} />
                      <span className={`min-w-0 text-sm ${active ? 'font-semibold text-violet-900' : done ? 'font-medium text-slate-600' : 'text-slate-500'}`}>{s.label}</span>
                    </button>
                    {idx < steps.length - 1 && <div className="ml-[15px] mr-2 h-px bg-slate-100" />}
                  </li>
                )
              })}
            </ol>
            <div className="rounded-xl border border-violet-100 bg-violet-50/80 p-3">
              <p className="text-sm font-semibold text-violet-900">Need help?</p>
              <Link to="/messages" className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-violet-200 bg-white py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                  <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" strokeWidth="1.8" />
                </svg>
                Contact Support
              </Link>
            </div>
          </aside>

          {/* Main form */}
          <main className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            {step === 1 && (
              <>
                <h2 className="text-lg font-semibold text-slate-900">Basic Information</h2>
                <p className="mt-0.5 text-sm text-slate-500">Provide the basic details about your property.</p>

                <div className="mt-6 space-y-5">
                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Property Type</span>
                    <CustomDropdown
                      variant="addListing"
                      value={propertyType}
                      options={ADD_LISTING_PROPERTY_TYPES}
                      onChange={setPropertyType}
                    />
                  </label>

                  <div className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Listing Type</span>
                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                      <button
                        type="button"
                        onClick={() => setListingKind('Rent')}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                          listingKind === 'Rent' ? 'bg-white text-violet-700 shadow-sm ring-1 ring-violet-200' : 'text-slate-600 hover:text-violet-700'
                        }`}
                      >
                        For Rent
                      </button>
                      <button
                        type="button"
                        onClick={() => setListingKind('Sale')}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                          listingKind === 'Sale' ? 'bg-white text-violet-700 shadow-sm ring-1 ring-violet-200' : 'text-slate-600 hover:text-violet-700'
                        }`}
                      >
                        For Sale
                      </button>
                    </div>
                  </div>

                  <label className="block space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Property Title</span>
                      <span className="text-xs text-slate-400">
                        {titleLen}/100
                      </span>
                    </div>
                    <input
                      value={title}
                      onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                      maxLength={100}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                      placeholder="e.g. Modern 4-Bedroom Apartment in Ikoyi"
                    />
                  </label>

                  <label className="block space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Location</span>
                    <div className="flex gap-2">
                      <input
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                        placeholder="Street, district, or landmark"
                      />
                      <button
                        type="button"
                        onClick={() => setLocation('Current location · Lagos, Nigeria')}
                        className="shrink-0 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                      >
                        Use Current Location
                      </button>
                    </div>
                  </label>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <label className="space-y-1.5">
                      <span className="text-sm font-medium text-slate-700">State</span>
                      <CustomDropdown variant="addListing" value={stateVal} options={ADD_LISTING_STATES} onChange={setStateVal} />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-sm font-medium text-slate-700">City</span>
                      <CustomDropdown variant="addListing" value={city} options={ADD_LISTING_CITIES} onChange={setCity} />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-sm font-medium text-slate-700">Area / Neighborhood</span>
                      <input
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                        placeholder="e.g. Phase 1"
                      />
                    </label>
                  </div>

                  <label className="block space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">Short Description</span>
                      <span className="text-xs text-slate-400">{descLen}/200</span>
                    </div>
                    <textarea
                      value={desc}
                      onChange={(e) => setDesc(e.target.value.slice(0, 200))}
                      maxLength={200}
                      rows={4}
                      className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                      placeholder="Highlight what makes this property special..."
                    />
                  </label>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-lg font-semibold text-slate-900">Details & Features</h2>
                <p className="mt-0.5 text-sm text-slate-500">Select amenities and key specs buyers care about.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Bedrooms</span>
                    <input type="number" min={0} value={beds} onChange={(e) => setBeds(Number(e.target.value) || 0)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Bathrooms</span>
                    <input type="number" min={0} value={baths} onChange={(e) => setBaths(Number(e.target.value) || 0)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Area (m²)</span>
                    <input type="number" min={0} value={sqm} onChange={(e) => setSqm(Number(e.target.value) || 0)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" />
                  </label>
                </div>
                <div className="mt-6">
                  <p className="text-sm font-medium text-slate-700">Features</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries({ pool: 'Swimming pool', parking: 'Parking', security: '24/7 Security', gym: 'Gym' }).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleFeature(key)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          features[key] ? 'border-violet-500 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-lg font-semibold text-slate-900">Photos & Videos</h2>
                <p className="mt-0.5 text-sm text-slate-500">Upload clear photos — you can reorder before publishing.</p>
                <div className="mt-6 flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/50 px-4 py-10 text-center transition hover:border-violet-400 hover:bg-violet-50">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-violet-100 text-violet-600">
                    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                  <p className="mt-3 text-sm font-semibold text-slate-800">Drag & drop images here</p>
                  <p className="mt-1 text-xs text-slate-500">or click to browse (JPG, PNG up to 10MB each)</p>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="text-lg font-semibold text-slate-900">Pricing & Availability</h2>
                <p className="mt-0.5 text-sm text-slate-500">Set your price and when the property is available.</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Price (₦)</span>
                    <input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm" placeholder="e.g. 85000000" />
                  </label>
                  <div className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Available from</span>
                    <div className="grid grid-cols-3 gap-2">
                      <CustomDropdown
                        variant="addListing"
                        value={availY}
                        options={yearOptions}
                        onChange={(v) => patchAvailableDate({ y: v })}
                      />
                      <CustomDropdown
                        variant="addListing"
                        value={availM}
                        options={MONTH_OPTIONS}
                        onChange={(v) => patchAvailableDate({ mo: v })}
                      />
                      <CustomDropdown
                        variant="addListing"
                        value={availD}
                        options={dayOpts}
                        onChange={(v) => patchAvailableDate({ d: v })}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <h2 className="text-lg font-semibold text-slate-900">Review & Publish</h2>
                <p className="mt-0.5 text-sm text-slate-500">Confirm everything looks correct before publishing.</p>
                <div className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">Title</span><span className="font-medium text-slate-900">{previewTitle}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Type</span><span className="font-medium">{listingKind}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Property</span><span className="font-medium">{propertyType}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Location</span><span className="font-medium text-right">{location || `${area}, ${city}`}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Price</span><span className="font-medium">{price ? `₦${Number(price).toLocaleString('en-NG')}` : '—'}</span></div>
                </div>
                <button type="button" className="mt-4 w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 sm:w-auto sm:px-8">
                  Publish Listing
                </button>
              </>
            )}

            {step < 5 && (
              <div className="mt-8 flex justify-end border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.min(5, s + 1))}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-violet-500"
                >
                  Next
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                    <path d="M9 18l6-6-6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            )}
          </main>

          {/* Preview + tips */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900">Listing Preview</h3>
              <p className="mt-0.5 text-xs text-slate-500">This is how your listing will appear to others.</p>
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
                <div className="relative aspect-[4/3]">
                  <img
                    src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=600&q=80"
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded-md bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">{previewBadge}</span>
                </div>
                <div className="space-y-2 p-3">
                  <div className="h-3 w-3/4 max-w-full rounded bg-slate-200" />
                  <div className="h-2 w-1/2 max-w-full rounded bg-slate-200" />
                  <p className="pt-1 text-sm font-semibold text-slate-900">{previewTitle}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-violet-600" fill="none" stroke="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="1.6" /></svg>
                      {beds} Beds
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-violet-600" fill="none" stroke="currentColor"><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M9 6h6M9 6H7a2 2 0 0 0-2 2v10h14V8a2 2 0 0 0-2-2h-2" strokeWidth="1.6" /></svg>
                      {baths} Baths
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-violet-600" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.6" /></svg>
                      {sqm} m²
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-violet-100 bg-violet-50/90 p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-violet-900">Tips for a great listing</h3>
              <ul className="mt-3 space-y-3">
                {tips.map((t) => (
                  <li key={t.text} className="flex gap-3 text-sm text-slate-700">
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white shadow-sm">
                      <TipIcon kind={t.icon} />
                    </span>
                    <span className="pt-1">{t.text}</span>
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

export default AddListingPage
