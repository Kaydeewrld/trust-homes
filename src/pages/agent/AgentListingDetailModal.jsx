import { Link } from 'react-router-dom'
import { useCallback, useEffect, useState } from 'react'

const fmtPrice = (naira) => `₦${Number(naira).toLocaleString('en-NG')}`

const statusConfig = {
  active: { label: 'Active', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700' },
  pending: { label: 'Pending Verification', dot: 'bg-amber-500', pill: 'bg-amber-50 text-amber-800' },
  sold: { label: 'Sold', dot: 'bg-blue-500', pill: 'bg-blue-50 text-blue-700' },
  draft: { label: 'Draft', dot: 'bg-slate-400', pill: 'bg-slate-100 text-slate-600' },
  rejected: { label: 'Rejected', dot: 'bg-red-500', pill: 'bg-red-50 text-red-700' },
}

const defaultDetail = {
  lastUpdated: 'Apr 22, 2026',
  bedrooms: 4,
  bathrooms: 5,
  livingRooms: 2,
  sqm: 350,
  propertyType: 'Duplex',
  purpose: 'For Sale',
  furnishing: 'Fully Furnished',
  parking: '2 Cars',
  yearBuilt: 2022,
  titleDoc: "Governor's Consent",
  commissionPct: 3,
  mediaCount: 16,
  leadsCount: 18,
  conversionPct: 6.2,
  galleryExtra: 12,
}

const subTabs = ['Details', 'Description', 'Features', 'Media', 'Leads', 'Promotion', 'Activity']

function SpecIcon({ children }) {
  return <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">{children}</span>
}

export default function AgentListingDetailModal({ listing, open, onClose }) {
  const [mainTab, setMainTab] = useState('Details')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (open) setMainTab('Details')
  }, [open, listing?.id])

  const d = { ...defaultDetail, ...listing?.detail }
  const sc = statusConfig[listing?.status] || statusConfig.draft
  const statusLabel = sc.label
  const publicId = listing?.propertyRouteId || 'th-001'
  const gallery = listing?.gallery || [listing?.image, listing?.image, listing?.image, listing?.image, listing?.image].filter(Boolean)
  const potentialCommission = Math.round((listing?.price || 0) * (d.commissionPct / 100))

  const copyId = useCallback(() => {
    if (!listing?.id) return
    void navigator.clipboard?.writeText(listing.id).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [listing?.id])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !listing) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]" aria-label="Close modal" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="listing-modal-title"
        className="relative flex max-h-[min(92vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/20"
      >
        {/* Header */}
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <h2 id="listing-modal-title" className="text-lg font-bold tracking-tight text-[#111827]">
              {listing.title}
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-slate-500">
              <span>{listing.location}</span>
              <span className="hidden sm:inline">·</span>
              <span className="inline-flex items-center gap-1.5 font-medium text-slate-600">
                ID: {listing.id}
                <button
                  type="button"
                  onClick={copyId}
                  className="rounded p-0.5 text-indigo-500 hover:bg-indigo-50"
                  aria-label="Copy listing ID"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>
                {copied ? <span className="text-[11px] text-emerald-600">Copied</span> : null}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to={`/agent/listings/edit/${listing.id}`}
              className="rounded-xl bg-[#6366F1] px-3 py-2 text-[12px] font-semibold text-white shadow-sm hover:bg-indigo-600"
            >
              Edit Listing
            </Link>
            <button type="button" className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label="More options">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                <circle cx="12" cy="6" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="18" r="1.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {/* Media + price row */}
          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div>
              <div className="relative overflow-hidden rounded-xl bg-slate-100">
                <img src={listing.image} alt="" className="aspect-[16/10] w-full object-cover" />
                <span
                  className={`absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-0.5 text-[11px] font-semibold shadow-sm ${listing.status === 'active' ? 'text-emerald-700' : 'text-slate-700'}`}
                >
                  {statusLabel}
                </span>
                <button
                  type="button"
                  className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/95 text-slate-500 shadow-sm hover:text-rose-500"
                  aria-label="Save"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.45A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {gallery.slice(0, 4).map((src, i) => (
                  <img key={i} src={src} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover ring-1 ring-slate-200" />
                ))}
                <div className="relative grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-slate-200 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200">
                  <img src={gallery[0]} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
                  <span className="relative">+{d.galleryExtra}</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums text-[#111827]">{fmtPrice(listing.price)}</span>
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">{d.purpose}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-2 py-2">
                  <SpecIcon>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <path d="M9 22V12h6v10" />
                    </svg>
                  </SpecIcon>
                  <div>
                    <p className="text-[10px] font-medium text-slate-500">Bedrooms</p>
                    <p className="text-[13px] font-semibold text-slate-900">{d.bedrooms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-2 py-2">
                  <SpecIcon>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M4 12h16M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6M4 12V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4" />
                    </svg>
                  </SpecIcon>
                  <div>
                    <p className="text-[10px] font-medium text-slate-500">Bathrooms</p>
                    <p className="text-[13px] font-semibold text-slate-900">{d.bathrooms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-2 py-2">
                  <SpecIcon>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M9 21V9" />
                    </svg>
                  </SpecIcon>
                  <div>
                    <p className="text-[10px] font-medium text-slate-500">Living Rooms</p>
                    <p className="text-[13px] font-semibold text-slate-900">{d.livingRooms}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-2 py-2">
                  <SpecIcon>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M3 9h18M9 3v18" />
                    </svg>
                  </SpecIcon>
                  <div>
                    <p className="text-[10px] font-medium text-slate-500">Size</p>
                    <p className="text-[13px] font-semibold text-slate-900">{d.sqm} sqm</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4 cards */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500">Listing Status</p>
              <div className="mt-2 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${sc.dot}`} />
                <span className="text-[13px] font-semibold text-slate-800">{sc.label}</span>
              </div>
              <button
                type="button"
                className="mt-3 w-full rounded-lg border border-slate-200 bg-white py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                Change Status ▾
              </button>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500">Performance (This Month)</p>
              <p className="mt-2 text-[13px] text-slate-700">
                <span className="font-semibold text-slate-900">{listing.views}</span> Views ·{' '}
                <span className="font-semibold text-slate-900">{listing.leads}</span> Leads
              </p>
              <p className="mt-1 text-[12px] font-semibold text-emerald-600">▲ {d.conversionPct}% Conversion Rate</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500">Timestamps</p>
              <p className="mt-2 text-[12px] text-slate-700">
                <span className="text-slate-500">Added</span> {listing.dateAdded}
              </p>
              <p className="mt-1 text-[12px] text-slate-700">
                <span className="text-slate-500">Updated</span> {d.lastUpdated}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
              <p className="text-[11px] font-semibold text-slate-500">Listing Visibility</p>
              <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-slate-800">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20" />
                </svg>
                Public
              </p>
              <Link
                to={`/property/${publicId}`}
                className="mt-3 block w-full rounded-lg border border-indigo-200 bg-indigo-50 py-1.5 text-center text-[11px] font-semibold text-indigo-700 hover:bg-indigo-100"
              >
                Preview Listing
              </Link>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="mt-4 border-b border-slate-200">
            <div className="-mb-px flex flex-wrap gap-1 overflow-x-auto">
              {subTabs.map((t) => {
                const is = mainTab === t
                const extra =
                  t === 'Media'
                    ? ` (${d.mediaCount})`
                    : t === 'Leads'
                      ? ` (${listing.leads})`
                      : ''
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setMainTab(t)}
                    className={`whitespace-nowrap border-b-2 px-3 py-2 text-[12px] font-semibold transition ${
                      is ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t}
                    {t === 'Details' && is ? ' (Active)' : ''}
                    {extra}
                  </button>
                )
              })}
            </div>
          </div>

          {mainTab === 'Details' && (
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-[12px] font-bold text-slate-800">Property details</p>
                <ul className="mt-3 space-y-2 text-[12px]">
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">Property Type</span>
                    <span className="font-medium text-slate-900">{d.propertyType}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">Purpose</span>
                    <span className="font-medium text-slate-900">{d.purpose}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">Furnishing</span>
                    <span className="font-medium text-slate-900">{d.furnishing}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">Parking</span>
                    <span className="font-medium text-slate-900">{d.parking}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">Year Built</span>
                    <span className="font-medium text-slate-900">{d.yearBuilt}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">Title</span>
                    <span className="text-right font-medium text-slate-900">{d.titleDoc}</span>
                  </li>
                </ul>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-[12px] font-bold text-slate-800">Location</p>
                <div className="relative mt-3 aspect-[4/3] overflow-hidden rounded-lg bg-gradient-to-br from-slate-200 via-slate-100 to-indigo-100 ring-1 ring-slate-200">
                  <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 50% 45%, #6366f155 0%, transparent 55%)' }} />
                  <div className="absolute left-1/2 top-1/2 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#6366F1] text-white shadow-lg">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z" />
                    </svg>
                  </div>
                </div>
                <p className="mt-2 text-[12px] text-slate-600">{listing.location}, Nigeria</p>
                <a href="https://maps.google.com" target="_blank" rel="noreferrer" className="mt-2 inline-block text-[12px] font-semibold text-indigo-600 hover:underline">
                  View on Google Maps
                </a>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-[12px] font-bold text-slate-800">Pricing & commission</p>
                <ul className="mt-3 space-y-2 text-[12px]">
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">Price</span>
                    <span className="font-semibold text-slate-900">{fmtPrice(listing.price)}</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">Commission rate</span>
                    <span className="font-semibold text-slate-900">{d.commissionPct}%</span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-500">Potential commission</span>
                    <span className="font-semibold text-indigo-600">{fmtPrice(potentialCommission)}</span>
                  </li>
                </ul>
                <div className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-[11px] leading-snug text-indigo-900 ring-1 ring-indigo-100">
                  Earn up to <strong>{fmtPrice(potentialCommission)}</strong> when this listing sells through your referral link.
                </div>
              </div>
            </div>
          )}

          {mainTab !== 'Details' && (
            <p className="mt-6 text-center text-[13px] text-slate-500">
              {mainTab} content — connect to your backend when ready.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/80 px-5 py-3">
          <button
            type="button"
            className="rounded-xl border border-red-200 bg-white px-4 py-2 text-[12px] font-semibold text-red-600 hover:bg-red-50"
          >
            Delete Listing
          </button>
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            Duplicate Listing
          </button>
          <Link
            to="/agent/promotions"
            className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2 text-[12px] font-semibold text-white shadow-sm hover:bg-indigo-600"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m22 2-7 20-4-9-9-4 20-7z" strokeLinejoin="round" />
            </svg>
            Promote This Listing
          </Link>
        </div>
      </div>
    </div>
  )
}
