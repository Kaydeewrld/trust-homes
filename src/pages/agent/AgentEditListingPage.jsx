import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { listingsGetById, listingsUpdate } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1000&q=80'

const fmtPrice = (naira) => `₦${Number(naira).toLocaleString('en-NG')}`

function uiPurposeFromApi(p) {
  const s = String(p || '').toLowerCase()
  if (s.includes('rent')) return 'For Rent'
  return 'For Sale'
}

function apiPurposeFromUi(p) {
  return p === 'For Rent' ? 'Rent' : 'Sale'
}

const formTabs = ['Basic Details', 'Description', 'Features', 'Media', 'Pricing & Commission', 'Location', 'Preview']

function FieldLabel({ children, optional }) {
  return (
    <label className="mb-1.5 block text-[12px] font-semibold text-slate-700">
      {children}
      {optional ? <span className="font-normal text-slate-400"> (optional)</span> : null}
    </label>
  )
}

function SpecMini({ icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-slate-100 bg-slate-50/80 px-2 py-2 text-center">
      <span className="text-slate-500">{icon}</span>
      <span className="text-[10px] font-medium text-slate-500">{label}</span>
      <span className="text-[12px] font-bold text-slate-900">{value}</span>
    </div>
  )
}

export default function AgentEditListingPage() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const toast = useToast()
  const [apiListing, setApiListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadErr, setLoadErr] = useState('')
  const [saving, setSaving] = useState(false)

  const [activeTab, setActiveTab] = useState('Basic Details')
  const [title, setTitle] = useState('')
  const [propertyType, setPropertyType] = useState('Duplex')
  const [purpose, setPurpose] = useState('For Sale')
  const [bedrooms, setBedrooms] = useState('4')
  const [bathrooms, setBathrooms] = useState('5')
  const [livingRooms, setLivingRooms] = useState('2')
  const [parking, setParking] = useState('2')
  const [furnishing, setFurnishing] = useState('Fully Furnished')
  const [sqm, setSqm] = useState('350')
  const [sqmUnit, setSqmUnit] = useState('sqm')
  const [yearBuilt, setYearBuilt] = useState('2022')
  const [titleDoc, setTitleDoc] = useState("Governor's Consent")
  const [listingStatus, setListingStatus] = useState('Active')
  const [visibility, setVisibility] = useState('public')
  const [commissionPct, setCommissionPct] = useState('3')
  const [price, setPrice] = useState('')

  useEffect(() => {
    if (!listingId) {
      setLoading(false)
      setLoadErr('Missing listing.')
      return
    }
    let cancelled = false
    setLoadErr('')
    setLoading(true)
    ;(async () => {
      try {
        const out = await listingsGetById(listingId)
        if (cancelled) return
        setApiListing(out.listing || null)
      } catch (e) {
        if (!cancelled) setLoadErr(e.message || 'Could not load listing.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [listingId])

  useEffect(() => {
    if (!apiListing) return
    setTitle(apiListing.title || '')
    setPropertyType(apiListing.propertyType || 'Duplex')
    setPurpose(uiPurposeFromApi(apiListing.purpose))
    setBedrooms(String(apiListing.bedrooms ?? 4))
    setBathrooms(String(apiListing.bathrooms ?? 5))
    setLivingRooms(String(apiListing.livingRooms ?? 2))
    setParking(String(apiListing.parkingSpaces ?? 2))
    setFurnishing(apiListing.furnishing || 'Fully Furnished')
    setSqm(String(apiListing.areaSqm ?? 350))
    setYearBuilt(String(apiListing.yearBuilt ?? 2022))
    setTitleDoc(apiListing.titleDoc || "Governor's Consent")
    const st = String(apiListing.status || '').toUpperCase()
    if (st === 'APPROVED') setListingStatus('Active')
    else if (st === 'PENDING') setListingStatus('Pending Verification')
    else if (st === 'SOLD') setListingStatus('Sold')
    else if (st === 'REJECTED') setListingStatus('Rejected')
    else if (st === 'DRAFT') setListingStatus('Draft')
    else setListingStatus('Active')
    setCommissionPct(String(apiListing.commissionPct ?? 3))
    setPrice(String(apiListing.priceNgn ?? ''))
  }, [apiListing])

  const previewImage = apiListing?.previewMediaUrl || apiListing?.media?.[0]?.url || FALLBACK_IMAGE
  const galleryUrls = useMemo(() => {
    const m = apiListing?.media
    if (Array.isArray(m) && m.length) return m.map((x) => String(x.url || '').trim()).filter(Boolean)
    return [previewImage]
  }, [apiListing, previewImage])

  const previewPrice = Number(price.replace(/\D/g, '')) || Number(apiListing?.priceNgn) || 0
  const commissionNum = Number(commissionPct) || 0
  const potentialCommission = Math.round(previewPrice * (commissionNum / 100))

  const saveChanges = useCallback(async () => {
    if (!token || !listingId || !apiListing) return
    const priceNgn = Math.floor(Number(String(price).replace(/\D/g, '')) || 0)
    if (!title.trim() || priceNgn <= 0) {
      toast.error('Invalid listing', 'Title and a positive price are required.')
      return
    }
    setSaving(true)
    try {
      await listingsUpdate(token, listingId, {
        title: title.trim(),
        description: String(apiListing.description || ''),
        location: String(apiListing.location || ''),
        priceNgn,
        purpose: apiPurposeFromUi(purpose),
        propertyType,
        bedrooms: Math.floor(Number(bedrooms) || 0),
        bathrooms: Math.floor(Number(bathrooms) || 0),
        areaSqm: Math.floor(Number(String(sqm).replace(/\D/g, '')) || 0) || undefined,
      })
      toast.success('Listing updated', 'Your changes were saved.')
      const out = await listingsGetById(listingId)
      setApiListing(out.listing || null)
    } catch (e) {
      toast.error('Save failed', e.message || 'Could not update listing.')
    } finally {
      setSaving(false)
    }
  }, [
    token,
    listingId,
    apiListing,
    title,
    price,
    purpose,
    propertyType,
    bedrooms,
    bathrooms,
    sqm,
    toast,
  ])

  const forbidden =
    Boolean(apiListing && user?.id && String(apiListing.ownerId) !== String(user.id))

  if (loading) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600">Loading listing…</p>
      </div>
    )
  }

  if (loadErr || !apiListing) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600">{loadErr || 'Listing not found.'}</p>
        <Link to="/agent/listings" className="mt-4 inline-block font-semibold text-indigo-600">
          Back to My Listings
        </Link>
      </div>
    )
  }

  if (forbidden) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600">You can only edit your own listings.</p>
        <Link to="/agent/listings" className="mt-4 inline-block font-semibold text-indigo-600">
          Back to My Listings
        </Link>
      </div>
    )
  }

  const galleryThumbs = galleryUrls.length ? galleryUrls : [previewImage]
  const extraMediaCount = Math.max(0, (apiListing.media?.length || 0) - 4)

  return (
    <div className="flex w-full min-w-0 flex-col bg-[#F9FAFB]">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-4 lg:flex-row lg:items-start lg:gap-6 lg:px-6 lg:py-5">
          {/* Main form column */}
          <div className="min-w-0 flex-1 space-y-4">
            <Link
              to="/agent/listings"
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-indigo-600 hover:text-indigo-500"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to My Listings
            </Link>

            <div>
              <h1 className="text-[22px] font-bold tracking-tight text-[#111827]">Edit Listing</h1>
              <p className="mt-1 text-[13px] text-slate-500">Update your listing details. Changes sync to the preview on the right.</p>
            </div>

            <div className="border-b border-slate-200">
              <div className="-mb-px flex flex-wrap gap-1 overflow-x-auto">
                {formTabs.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveTab(t)}
                    className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-[12px] font-semibold transition ${
                      activeTab === t ? 'border-[#6366F1] text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'Basic Details' && (
              <div className="space-y-4">
                <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
                  <h2 className="text-[14px] font-bold text-[#111827]">Basic Information</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <FieldLabel>Property Title</FieldLabel>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 px-3 text-[13px] text-[#111827] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                      />
                    </div>
                    <div>
                      <FieldLabel>Property Type</FieldLabel>
                      <select
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                      >
                        {['Duplex', 'Apartment', 'House', 'Penthouse', 'Office', 'Commercial'].map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel>Listing Purpose</FieldLabel>
                      <div className="mt-2 flex flex-wrap gap-4">
                        {['For Sale', 'For Rent'].map((p) => (
                          <label key={p} className="inline-flex cursor-pointer items-center gap-2 text-[13px] font-medium text-slate-700">
                            <input
                              type="radio"
                              name="purpose"
                              checked={purpose === p}
                              onChange={() => setPurpose(p)}
                              className="h-4 w-4 border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            {p}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Bedrooms</FieldLabel>
                      <select
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px]"
                      >
                        {['1', '2', '3', '4', '5', '6', '7'].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel>Bathrooms</FieldLabel>
                      <select value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-[13px]">
                        {['1', '2', '3', '4', '5', '6', '7'].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel>Living Rooms</FieldLabel>
                      <select value={livingRooms} onChange={(e) => setLivingRooms(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-[13px]">
                        {['0', '1', '2', '3'].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel>Parking Space</FieldLabel>
                      <select value={parking} onChange={(e) => setParking(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-[13px]">
                        {['0', '1', '2', '3', '4', '5'].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <FieldLabel>Furnishing</FieldLabel>
                      <select value={furnishing} onChange={(e) => setFurnishing(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-[13px]">
                        {['Fully Furnished', 'Semi Furnished', 'Unfurnished'].map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <FieldLabel>Property Size</FieldLabel>
                      <div className="flex gap-2">
                        <input
                          value={sqm}
                          onChange={(e) => setSqm(e.target.value)}
                          className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-[13px]"
                        />
                        <select value={sqmUnit} onChange={(e) => setSqmUnit(e.target.value)} className="h-10 w-28 shrink-0 rounded-lg border border-slate-200 px-2 text-[13px]">
                          <option value="sqm">sqm</option>
                          <option value="sqft">sqft</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Year Built</FieldLabel>
                      <input value={yearBuilt} onChange={(e) => setYearBuilt(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-[13px]" />
                    </div>
                    <div>
                      <FieldLabel>Title</FieldLabel>
                      <input value={titleDoc} onChange={(e) => setTitleDoc(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-[13px]" />
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
                  <h2 className="text-[14px] font-bold text-[#111827]">Property Status</h2>
                  <div className="mt-4">
                    <FieldLabel>Listing Status</FieldLabel>
                    <select value={listingStatus} onChange={(e) => setListingStatus(e.target.value)} className="h-10 w-full max-w-xs rounded-lg border border-slate-200 px-3 text-[13px]">
                      {['Active', 'Pending Verification', 'Sold', 'Draft'].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {listingStatus === 'Active' && (
                    <div className="mt-4 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/90 px-3 py-3">
                      <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <path d="M22 4 12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <p className="text-[13px] font-medium leading-snug text-emerald-900">Your property is live and visible to users.</p>
                    </div>
                  )}

                  <div className="mt-5">
                    <FieldLabel>Listing Visibility</FieldLabel>
                    <div className="mt-2 flex flex-wrap gap-6">
                      <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] font-medium text-slate-700">
                        <input
                          type="radio"
                          name="vis"
                          checked={visibility === 'public'}
                          onChange={() => setVisibility('public')}
                          className="h-4 w-4 text-indigo-600"
                        />
                        Public
                      </label>
                      <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] font-medium text-slate-700">
                        <input type="radio" name="vis" checked={visibility === 'private'} onChange={() => setVisibility('private')} className="h-4 w-4 text-indigo-600" />
                        Private
                      </label>
                    </div>
                  </div>
                </section>

              </div>
            )}

            {activeTab === 'Pricing & Commission' && (
              <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
                <h2 className="text-[14px] font-bold text-[#111827]">Pricing & Commission</h2>
                <p className="mt-1 text-[12px] text-slate-500">Set your listing price and the commission rate shown on your preview card.</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Price (₦)</FieldLabel>
                    <input
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-[13px] tabular-nums outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <FieldLabel>Commission rate (%)</FieldLabel>
                    <input
                      value={commissionPct}
                      onChange={(e) => setCommissionPct(e.target.value)}
                      className="h-10 w-full rounded-lg border border-slate-200 px-3 text-[13px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                    />
                  </div>
                </div>
                <div className="mt-4 rounded-xl bg-indigo-50/90 px-3 py-3 text-[12px] ring-1 ring-indigo-100">
                  <p className="font-medium text-slate-700">
                    Potential commission at current values:{' '}
                    <span className="font-bold text-indigo-700">{fmtPrice(potentialCommission)}</span>
                  </p>
                </div>
              </section>
            )}

            {activeTab !== 'Basic Details' && activeTab !== 'Pricing & Commission' && (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-[13px] text-slate-500">
                <strong className="text-slate-800">{activeTab}</strong> — form sections can be expanded here to match your full flow.
              </div>
            )}

            <div className="sticky bottom-0 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 bg-[#F9FAFB]/95 py-4 backdrop-blur-sm">
              <button type="button" onClick={() => navigate('/agent/listings')} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" className="rounded-xl bg-indigo-100 px-4 py-2.5 text-[13px] font-semibold text-indigo-700 hover:bg-indigo-200/80">
                Save as Draft
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveChanges()}
                className="rounded-xl bg-[#6366F1] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>

          {/* Preview column */}
          <aside className="w-full shrink-0 lg:sticky lg:top-4 lg:w-[340px]">
            <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.08)]">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-[14px] font-bold text-[#111827]">Listing Preview</h2>
                <Link
                  to={`/property/${listingId}`}
                  className="inline-flex shrink-0 items-center gap-1 text-[12px] font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Preview Full Listing
                </Link>
              </div>

              <div className="relative mt-3 overflow-hidden rounded-xl bg-slate-100">
                <img src={previewImage} alt="" className="aspect-[4/3] w-full object-cover" />
                <span className="absolute left-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-emerald-700 shadow-sm">{listingStatus}</span>
                <button type="button" className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-slate-500 shadow-sm hover:text-rose-500" aria-label="Favorite">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.45A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                {galleryThumbs.slice(0, 4).map((src, i) => (
                  <img key={i} src={src} alt="" className="h-12 w-16 shrink-0 rounded-md object-cover ring-1 ring-slate-200" />
                ))}
                <div className="relative grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-md bg-slate-200 text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
                  <img src={previewImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
                  <span className="relative">{extraMediaCount > 0 ? `+${extraMediaCount}` : '+'}</span>
                </div>
              </div>

              <h3 className="mt-3 text-[15px] font-bold leading-snug text-[#111827]">{title || apiListing.title}</h3>
              <p className="mt-1 flex items-center gap-1 text-[12px] text-slate-500">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {apiListing.location}
              </p>
              <p className="mt-2 text-xl font-bold tabular-nums text-[#111827]">{fmtPrice(previewPrice)}</p>
              <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">{purpose}</span>

              <div className="mt-3 grid grid-cols-4 gap-1.5">
                <SpecMini
                  label="Beds"
                  value={bedrooms}
                  icon={
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                  }
                />
                <SpecMini
                  label="Baths"
                  value={bathrooms}
                  icon={
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M4 12h16M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
                    </svg>
                  }
                />
                <SpecMini
                  label="Living"
                  value={livingRooms}
                  icon={
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                  }
                />
                <SpecMini
                  label="Size"
                  value={`${sqm} ${sqmUnit}`}
                  icon={
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M9 3v18" />
                    </svg>
                  }
                />
              </div>

              <div className="mt-4 flex items-start justify-between gap-3 rounded-xl bg-indigo-50/90 px-3 py-3 ring-1 ring-indigo-100">
                <div className="min-w-0 text-[12px] leading-snug">
                  <p className="font-medium text-slate-700">
                    Commission rate: <span className="font-bold text-indigo-700">{commissionNum}%</span>
                  </p>
                  <p className="mt-1 font-medium text-slate-700">
                    Potential commission: <span className="font-bold text-indigo-700">{fmtPrice(potentialCommission)}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('Pricing & Commission')}
                  className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#6366F1] px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm hover:bg-indigo-600"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Edit
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                <span>
                  ID: <span className="font-semibold text-slate-700">{listingId}</span>
                </span>
                <span>Listed on {String(apiListing.createdAt || '').slice(0, 10) || '—'}</span>
              </div>

              <a
                href={`${typeof window !== 'undefined' ? window.location.origin : ''}/property/${listingId}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-800 shadow-sm hover:bg-slate-50"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                View on Website
              </a>
            </div>
          </aside>
        </div>
    </div>
  )
}
