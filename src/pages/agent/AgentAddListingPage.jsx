import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import { listingsCreate } from '../../lib/api'

const fmtPrice = (naira) => {
  const n = Number(String(naira).replace(/\D/g, ''))
  if (!n) return null
  return `₦${n.toLocaleString('en-NG')}`
}

const STEPS = ['Basic Info', 'Description', 'Features', 'Media', 'Pricing', 'Location', 'Preview']

const DEFAULT_HERO =
  'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80'

function FieldLabel({ children, required }) {
  return (
    <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
      {children}
      {required ? <span className="text-red-500">*</span> : null}
    </label>
  )
}

function NumberStepper({ label, value, min, max, onChange }) {
  return (
    <div>
      <FieldLabel required>{label}</FieldLabel>
      <div className="flex h-11 items-stretch overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          className="w-11 shrink-0 border-r border-slate-200 text-lg font-medium text-slate-600 transition hover:bg-slate-50"
        >
          −
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-center tabular-nums text-[14px] font-semibold text-[#111827]">{value}</div>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="w-11 shrink-0 border-l border-slate-200 text-lg font-medium text-slate-600 transition hover:bg-slate-50"
        >
          +
        </button>
      </div>
    </div>
  )
}

function PurposeToggle({ value, onChange }) {
  return (
    <div>
      <FieldLabel required>Purpose</FieldLabel>
      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50/80 p-1 shadow-sm">
        {['For Sale', 'For Rent', 'Auction'].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`rounded-lg px-4 py-2 text-[13px] font-semibold transition ${
              value === p ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/80' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function AgentAddListingPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { token } = useAuth()
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [propertyType, setPropertyType] = useState('')
  const [purpose, setPurpose] = useState('For Sale')
  const [bedrooms, setBedrooms] = useState(4)
  const [bathrooms, setBathrooms] = useState(3)
  const [parking, setParking] = useState(2)
  const [size, setSize] = useState('1200')
  const [sizeUnit, setSizeUnit] = useState('Sqft')
  const [furnishing, setFurnishing] = useState('')
  const [propertyStatus, setPropertyStatus] = useState('')
  const [availability, setAvailability] = useState('')
  const [yearBuilt, setYearBuilt] = useState('2022')
  const [price, setPrice] = useState('')
  const [paySmallSmallOpen, setPaySmallSmallOpen] = useState(false)
  const [payPlan, setPayPlan] = useState('monthly')
  const [payDurationMonths, setPayDurationMonths] = useState('12')
  const [payInitialPct, setPayInitialPct] = useState('20')
  const [location, setLocation] = useState('Lekki Phase 1, Lagos')
  const [latitude, setLatitude] = useState(null)
  const [longitude, setLongitude] = useState(null)
  const [locationSuggestions, setLocationSuggestions] = useState([])
  const [description, setDescription] = useState(
    'A stunning modern home with premium finishes, generous living spaces, and excellent natural light—perfect for families seeking comfort and style.'
  )
  const [isDistressSale, setIsDistressSale] = useState(false)
  const [isInvestmentProperty, setIsInvestmentProperty] = useState(false)
  const [mediaFiles, setMediaFiles] = useState([])
  const [isPublishing, setIsPublishing] = useState(false)
  const mediaInputRef = useRef(null)
  const [descExpanded, setDescExpanded] = useState(false)

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Unable to read selected media file'))
      reader.readAsDataURL(file)
    })

  const titleLen = title.length
  const previewTitle = title.trim() || 'Luxury 4 Bedroom Duplex'
  const previewPrice = fmtPrice(price) || '₦120,000,000'
  const progressPct = ((step + 1) / STEPS.length) * 100
  const previewMedia = mediaFiles[0] || null
  const numericPrice = Number(String(price).replace(/\D/g, '')) || 0
  const initialPctNum = Math.min(90, Math.max(0, Number(payInitialPct) || 0))
  const durationNum = Math.max(1, Number(payDurationMonths) || 1)
  const financedAmount = Math.max(0, numericPrice - (numericPrice * initialPctNum) / 100)
  const perInstallment = financedAmount / durationNum

  const shortDesc = useMemo(() => {
    const t = description.trim()
    if (!t) return 'Add a compelling description to help buyers imagine living here.'
    if (t.length <= 120 || descExpanded) return t
    return `${t.slice(0, 120)}…`
  }, [description, descExpanded])

  const goNext = () => setStep((s) => Math.min(STEPS.length - 1, s + 1))
  const goBack = () => setStep((s) => Math.max(0, s - 1))
  const submitListing = async () => {
    if (isPublishing) return
    if (!token) {
      toast.error('Sign in required', 'Please sign in again to publish your listing.')
      navigate('/login')
      return
    }
    const payload = {
      title: previewTitle,
      description: description.trim(),
      location: location.trim(),
      priceNgn: Number(String(price).replace(/\D/g, '')) || 0,
      purpose: purpose === 'For Rent' ? 'Rent' : purpose === 'Auction' ? 'Auction' : 'Sale',
      propertyType: propertyType || 'Residential',
      bedrooms,
      bathrooms,
      areaSqm: Number(size) || undefined,
      media: mediaFiles.length
        ? mediaFiles.map((item) => ({ url: item.uploadUrl, kind: item.kind }))
        : [{ url: DEFAULT_HERO, kind: 'image' }],
      latitude: latitude != null ? Number(latitude) : undefined,
      longitude: longitude != null ? Number(longitude) : undefined,
      isDistressSale,
      isInvestmentProperty,
    }
    if (payload.priceNgn <= 0) {
      toast.error('Invalid price', 'Enter a valid property price before publishing.')
      return
    }
    try {
      setIsPublishing(true)
      const out = await listingsCreate(token, payload)
      const isApproved = out?.listing?.status === 'APPROVED'
      toast.success(
        'Listing created',
        isApproved ? 'Your verified-agent listing is live.' : 'Listing submitted for moderation.',
      )
      navigate('/agent/listings')
    } catch (error) {
      toast.error('Publish failed', error?.message || 'Unable to create listing.')
    } finally {
      setIsPublishing(false)
    }
  }
  const openMediaPicker = () => mediaInputRef.current?.click()
  const pickSuggestion = (s) => {
    setLocation(s.name)
    setLatitude(Number(s.lat))
    setLongitude(Number(s.lon))
    setLocationSuggestions([])
  }
  const searchLocationSuggestions = async (q) => {
    const term = String(q || '').trim()
    if (term.length < 3) {
      setLocationSuggestions([])
      return
    }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(term)}`)
      const json = await res.json()
      const suggestions = Array.isArray(json)
        ? json.map((item) => ({ name: item.display_name, lat: Number(item.lat), lon: Number(item.lon) }))
        : []
      setLocationSuggestions(suggestions.filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lon)))
    } catch {
      setLocationSuggestions([])
    }
  }
  const useCurrentLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = Number(position.coords.latitude)
        const lon = Number(position.coords.longitude)
        setLatitude(lat)
        setLongitude(lon)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`)
          const out = await res.json()
          const name = String(out?.display_name || '').trim()
          setLocation(name || 'Current location')
        } catch {
          setLocation('Current location')
        }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }
  const handleMediaPick = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    const validFiles = files.filter((file) => file.type.startsWith('image/') || file.type.startsWith('video/'))
    const nextRaw = await Promise.all(
      validFiles.map(async (file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        name: file.name,
        kind: file.type.startsWith('video/') ? 'video' : 'image',
        previewUrl: URL.createObjectURL(file),
        uploadUrl: await fileToDataUrl(file),
      })),
    )
    const next = nextRaw.filter((item) => Boolean(item.uploadUrl))
    setMediaFiles((current) => {
      const merged = [...current, ...next]
      const uniq = []
      const seen = new Set()
      for (const item of merged) {
        if (seen.has(item.id)) continue
        seen.add(item.id)
        uniq.push(item)
      }
      return uniq.slice(0, 20)
    })
    event.target.value = ''
  }

  return (
    <div className="flex w-full min-w-0 flex-col bg-[#F9FAFB]">
      <div className="mx-auto w-full max-w-[1360px] px-4 py-4 md:px-6 md:py-5">
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-[22px] font-bold tracking-tight text-[#111827] md:text-2xl">Add New Listing</h1>
              <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-slate-500">
                Fill in each step to create your listing. Your live preview updates as you go.
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
              <span className="text-right text-[12px] font-medium text-emerald-600">Auto-saved just now</span>
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Save as Draft
              </button>
            </div>
          </div>

          {/* Stepper */}
          <div className="mt-5 overflow-x-auto pb-1">
            <div className="flex min-w-[760px] items-start">
              {STEPS.map((label, i) => {
                const active = i === step
                const done = i < step
                return (
                  <div key={label} className="flex min-w-0 flex-1 items-center">
                    <button
                      type="button"
                      onClick={() => setStep(i)}
                      className="flex shrink-0 flex-col items-center gap-1.5"
                    >
                      <span
                        className={`grid h-9 w-9 place-items-center rounded-full text-[12px] font-bold transition ${
                          active
                            ? 'bg-[#6366F1] text-white shadow-md shadow-indigo-500/25'
                            : done
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'border-2 border-slate-200 bg-white text-slate-400'
                        }`}
                      >
                        {done ? (
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span
                        className={`max-w-[92px] text-center text-[11px] font-semibold leading-tight sm:text-[12px] ${
                          active ? 'text-indigo-600' : done ? 'text-indigo-600/90' : 'text-slate-400'
                        }`}
                      >
                        {label}
                      </span>
                    </button>
                    {i < STEPS.length - 1 ? (
                      <div
                        className={`mx-1 mt-[18px] h-0.5 min-w-[6px] flex-1 rounded-full ${i < step ? 'bg-indigo-400' : 'bg-slate-200'}`}
                      />
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
            {/* Form column */}
            <div className="min-w-0 flex-1 space-y-5 pb-28 lg:pb-8">
              {step === 0 && (
                <>
                  <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-6">
                    <h2 className="text-[15px] font-bold text-[#111827]">Basic Information</h2>
                    <div className="mt-5 grid gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <FieldLabel required>Property Title</FieldLabel>
                          <span className="text-[11px] font-medium text-slate-400 tabular-nums">
                            {titleLen}/80
                          </span>
                        </div>
                        <input
                          value={title}
                          maxLength={80}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Luxury 4 Bedroom Duplex"
                          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-[13px] text-[#111827] outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                        />
                      </div>
                      <div>
                        <FieldLabel required>Property Type</FieldLabel>
                        <select
                          value={propertyType}
                          onChange={(e) => setPropertyType(e.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                        >
                          <option value="">Select type</option>
                          {['Duplex', 'Apartment', 'House', 'Penthouse', 'Hotel', 'Townhouse', 'Commercial', 'Land'].map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <PurposeToggle value={purpose} onChange={setPurpose} />
                      </div>
                      <NumberStepper label="Bedrooms" value={bedrooms} min={0} max={20} onChange={setBedrooms} />
                      <NumberStepper label="Bathrooms" value={bathrooms} min={0} max={20} onChange={setBathrooms} />
                      <NumberStepper label="Parking Spaces" value={parking} min={0} max={10} onChange={setParking} />
                      <div className="sm:col-span-2">
                        <FieldLabel>Category</FieldLabel>
                        <div className="grid gap-2 sm:grid-cols-2">
                          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5 text-[13px] font-medium text-slate-700">
                            <input type="checkbox" checked={isDistressSale} onChange={(e) => setIsDistressSale(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30" />
                            Distress Sale
                          </label>
                          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5 text-[13px] font-medium text-slate-700">
                            <input type="checkbox" checked={isInvestmentProperty} onChange={(e) => setIsInvestmentProperty(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30" />
                            Investment Property
                          </label>
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <FieldLabel required>Property Size</FieldLabel>
                        <div className="flex gap-2">
                          <input
                            value={size}
                            onChange={(e) => setSize(e.target.value.replace(/[^\d.]/g, ''))}
                            className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-[13px] tabular-nums outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                            inputMode="decimal"
                          />
                          <select
                            value={sizeUnit}
                            onChange={(e) => setSizeUnit(e.target.value)}
                            className="h-11 w-32 shrink-0 rounded-xl border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                          >
                            {['Sqft', 'sqm', 'acres', 'plots'].map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div>
                        <FieldLabel required>Furnishing</FieldLabel>
                        <select
                          value={furnishing}
                          onChange={(e) => setFurnishing(e.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                        >
                          <option value="">Select furnishing</option>
                          {['Fully Furnished', 'Semi Furnished', 'Unfurnished'].map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <FieldLabel required>Property Status</FieldLabel>
                        <select
                          value={propertyStatus}
                          onChange={(e) => setPropertyStatus(e.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                        >
                          <option value="">Select status</option>
                          {['New Listing', 'Renovated', 'Off-plan', 'Resale'].map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <FieldLabel required>Availability</FieldLabel>
                        <select
                          value={availability}
                          onChange={(e) => setAvailability(e.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                        >
                          <option value="">Select availability</option>
                          {['Available now', 'From next month', 'Under offer', 'Coming soon'].map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <FieldLabel>Year Built</FieldLabel>
                        <div className="relative">
                          <input
                            value={yearBuilt}
                            onChange={(e) => setYearBuilt(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="h-11 w-full rounded-xl border border-slate-200 pr-10 pl-3 text-[13px] tabular-nums outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                            placeholder="YYYY"
                          />
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="3" y="4" width="18" height="18" rx="2" />
                              <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
                            </svg>
                          </span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 px-4 py-3 text-[12px] leading-relaxed text-indigo-950">
                    <span className="font-semibold text-indigo-800">Tip:</span> Complete all basic details to make your listing more attractive to
                    buyers.
                  </div>
                </>
              )}

              {step === 1 && (
                <section className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-6">
                  <h2 className="text-[15px] font-bold text-[#111827]">Description</h2>
                  <p className="mt-1 text-[13px] text-slate-500">Describe the property in detail. This appears on your public listing page.</p>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={8}
                    className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-3 text-[13px] leading-relaxed text-[#111827] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                    placeholder="Highlight what makes this property special…"
                  />
                </section>
              )}

              {step === 2 && (
                <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                  <h2 className="text-[15px] font-bold text-[#111827]">Features</h2>
                  <p className="mt-2 text-[13px] text-slate-500">Select amenities and standout features (full checklist coming next).</p>
                  <div className="mt-6 grid gap-2 sm:grid-cols-2">
                    {['Swimming pool', '24/7 security', 'Gym', 'Smart home', 'BQ', 'Rooftop terrace'].map((f) => (
                      <label key={f} className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5 text-[13px] font-medium text-slate-700">
                        <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/30" />
                        {f}
                      </label>
                    ))}
                  </div>
                </section>
              )}

              {step === 3 && (
                <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                  <h2 className="text-[15px] font-bold text-[#111827]">Media</h2>
                  <p className="mt-2 text-[13px] text-slate-500">Upload photos and videos. Drag and drop or browse files.</p>
                  <input ref={mediaInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={handleMediaPick} />
                  <button type="button" onClick={openMediaPicker} className="mt-6 flex min-h-[180px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 transition hover:border-indigo-300 hover:bg-indigo-50/30">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-indigo-100 text-indigo-600">
                      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <p className="mt-3 text-[13px] font-semibold text-slate-700">Drop files here or click to upload</p>
                    <p className="mt-1 text-[12px] text-slate-500">PNG, JPG up to 20MB each</p>
                  </button>
                  {mediaFiles.length ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {mediaFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
                          <span className="truncate text-slate-700">{file.name}</span>
                          <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase text-slate-600">{file.kind}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </section>
              )}

              {step === 4 && (
                <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                  <h2 className="text-[15px] font-bold text-[#111827]">Pricing</h2>
                  <p className="mt-1 text-[13px] text-slate-500">Set your asking price and commission.</p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <FieldLabel required>Price (₦)</FieldLabel>
                      <input
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="h-11 w-full max-w-md rounded-xl border border-slate-200 px-3 text-[13px] tabular-nums outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                        placeholder="120000000"
                        inputMode="numeric"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-[13px] font-semibold text-slate-800">Pay Small Small</p>
                            <p className="mt-0.5 text-[12px] text-slate-500">Enable installment options instead of one-off payment.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPaySmallSmallOpen((v) => !v)}
                            className={`inline-flex h-10 items-center justify-center rounded-xl px-4 text-[13px] font-semibold shadow-sm transition ${
                              paySmallSmallOpen
                                ? 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-200/70'
                                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {paySmallSmallOpen ? 'Disable Plan' : 'Enable Plan'}
                          </button>
                        </div>

                        {paySmallSmallOpen ? (
                          <div className="mt-4 grid gap-3 rounded-xl border border-indigo-100 bg-white p-3 sm:grid-cols-2">
                            <div>
                              <FieldLabel required>Plan Type</FieldLabel>
                              <select
                                value={payPlan}
                                onChange={(e) => setPayPlan(e.target.value)}
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 pr-9 text-[13px] font-medium text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.65rem center' }}
                              >
                                <option value="monthly">Monthly Installments</option>
                                <option value="bi-monthly">Every 2 Months</option>
                                <option value="quarterly">Quarterly</option>
                              </select>
                            </div>
                            <div>
                              <FieldLabel required>Duration (Months)</FieldLabel>
                              <input
                                value={payDurationMonths}
                                onChange={(e) => setPayDurationMonths(e.target.value.replace(/\D/g, ''))}
                                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-[13px] tabular-nums outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                                placeholder="12"
                                inputMode="numeric"
                              />
                            </div>
                            <div>
                              <FieldLabel required>Initial Deposit (%)</FieldLabel>
                              <input
                                value={payInitialPct}
                                onChange={(e) => setPayInitialPct(e.target.value.replace(/\D/g, ''))}
                                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-[13px] tabular-nums outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                                placeholder="20"
                                inputMode="numeric"
                              />
                            </div>
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 px-3 py-2.5">
                              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">Estimated per installment</p>
                              <p className="mt-1 text-[16px] font-bold tabular-nums text-indigo-700">{fmtPrice(perInstallment) || '₦0'}</p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {step === 5 && (
                <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                  <h2 className="text-[15px] font-bold text-[#111827]">Location</h2>
                  <p className="mt-1 text-[13px] text-slate-500">Where is the property located?</p>
                  <div className="mt-5">
                    <FieldLabel required>Address / Area</FieldLabel>
                    <div className="flex gap-2">
                      <input
                        value={location}
                        onChange={(e) => {
                          setLocation(e.target.value)
                          void searchLocationSuggestions(e.target.value)
                        }}
                        className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-[13px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                        placeholder="e.g. Lekki Phase 1, Lagos"
                      />
                      <button type="button" onClick={useCurrentLocation} className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 text-[12px] font-semibold text-indigo-700 hover:bg-indigo-100">
                        Use current
                      </button>
                    </div>
                    {locationSuggestions.length ? (
                      <div className="mt-2 max-h-44 overflow-auto rounded-xl border border-slate-200 bg-white p-1.5">
                        {locationSuggestions.map((s) => (
                          <button key={`${s.lat}-${s.lon}-${s.name}`} type="button" onClick={() => pickSuggestion(s)} className="block w-full rounded-lg px-2.5 py-2 text-left text-[12px] text-slate-700 hover:bg-slate-50">
                            {s.name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {latitude != null && longitude != null ? (
                      <p className="mt-1 text-[11px] text-slate-500">Coordinates: {latitude.toFixed(6)}, {longitude.toFixed(6)}</p>
                    ) : null}
                  </div>
                </section>
              )}

              {step === 6 && (
                <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
                  <h2 className="text-[15px] font-bold text-[#111827]">Preview</h2>
                  <p className="mt-2 text-[13px] text-slate-500">Review how your listing will appear. Use the live panel on the right as you scroll.</p>
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-[13px] text-slate-600">
                    <p className="font-semibold text-slate-800">Summary</p>
                    <ul className="mt-2 list-inside list-disc space-y-1">
                      <li>{previewTitle}</li>
                      <li>
                        {propertyType || 'Property type'} · {purpose}
                      </li>
                      <li>{location}</li>
                      <li>{previewPrice}</li>
                      <li>Distress Sale: {isDistressSale ? 'Yes' : 'No'}</li>
                      <li>Investment Property: {isInvestmentProperty ? 'Yes' : 'No'}</li>
                    </ul>
                  </div>
                </section>
              )}
            </div>

            {/* Live preview */}
            <aside className="w-full shrink-0 lg:sticky lg:top-4 lg:w-[340px]">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-[14px] font-bold text-[#111827]">Live Preview</h2>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Buyer view</span>
                </div>
                <div className="relative mt-3 overflow-hidden rounded-xl bg-slate-100">
                  {previewMedia ? (
                    previewMedia.kind === 'video' ? (
                      <div className="grid aspect-[4/3] w-full place-items-center bg-slate-100 text-center">
                        <div>
                          <p className="text-xs font-semibold text-slate-700">Video uploaded</p>
                          <p className="mt-1 text-[11px] text-slate-500">{previewMedia.name}</p>
                        </div>
                      </div>
                    ) : (
                      <img src={previewMedia.previewUrl} alt="" className="aspect-[4/3] w-full object-cover" />
                    )
                  ) : (
                    <div className="grid aspect-[4/3] w-full place-items-center bg-slate-100 text-center">
                      <div>
                        <p className="text-xs font-semibold text-slate-700">No media uploaded yet</p>
                        <p className="mt-1 text-[11px] text-slate-500">Upload photos or video in Media step</p>
                      </div>
                    </div>
                  )}
                  <span
                    className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-sm ${
                      purpose === 'For Rent' ? 'bg-sky-600' : 'bg-emerald-600'
                    }`}
                  >
                    {purpose}
                  </span>
                  <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                    1 / 8
                  </span>
                </div>
                <h3 className="mt-3 text-[16px] font-bold leading-snug text-[#111827]">{previewTitle}</h3>
                <p className="mt-1 flex items-center gap-1 text-[12px] text-slate-500">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {location || 'Add location'}
                </p>
                <p className="mt-2 text-xl font-bold text-[#6366F1] tabular-nums">{previewPrice}</p>
                {paySmallSmallOpen ? (
                  <div className="mt-2 rounded-xl border border-indigo-100 bg-indigo-50/80 px-3 py-2">
                    <p className="text-[11px] font-semibold text-indigo-700">
                      Pay Small Small · {payPlan === 'bi-monthly' ? 'Every 2 Months' : payPlan === 'quarterly' ? 'Quarterly' : 'Monthly'}
                    </p>
                    <p className="mt-0.5 text-[12px] font-bold tabular-nums text-indigo-700">
                      {fmtPrice(perInstallment) || '₦0'} x {durationNum} months ({initialPctNum}% upfront)
                    </p>
                  </div>
                ) : null}
                <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
                  {[
                    { k: 'Beds', v: bedrooms },
                    { k: 'Baths', v: bathrooms },
                    { k: sizeUnit, v: size || '—' },
                    { k: 'Parking', v: parking },
                  ].map((c) => (
                    <div key={c.k} className="rounded-lg border border-slate-100 bg-slate-50/90 py-2">
                      <p className="text-[10px] font-medium text-slate-500">{c.k}</p>
                      <p className="text-[12px] font-bold text-slate-900">{c.v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <p className="text-[12px] leading-relaxed text-slate-600">{shortDesc}</p>
                  {description.length > 120 ? (
                    <button
                      type="button"
                      onClick={() => setDescExpanded((e) => !e)}
                      className="mt-1 text-[12px] font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      {descExpanded ? 'View less' : 'View more'}
                    </button>
                  ) : null}
                </div>
                <div className="mt-5 rounded-xl bg-slate-50 px-3 py-3">
                  <p className="text-[11px] font-medium text-slate-500">Complete all steps to publish your listing</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-[#6366F1] transition-all duration-300" style={{ width: `${progressPct}%` }} />
                  </div>
                  <p className="mt-1.5 text-right text-[11px] font-semibold text-indigo-600">
                    Step {step + 1} of {STEPS.length}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>

      {/* Sticky footer */}
      <div className="sticky bottom-0 z-20 border-t border-slate-200 bg-[#F9FAFB]/95 px-4 py-3 backdrop-blur-md md:px-6">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/agent/listings')}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Cancel
          </button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Save as Draft
            </button>
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Back
              </button>
            ) : null}
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600"
              >
                Next
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : (
              <button
                type="button"
                disabled={isPublishing}
                onClick={submitListing}
                className="rounded-xl bg-[#6366F1] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPublishing ? 'Publishing...' : 'Publish listing'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
