import { useEffect, useState } from 'react'

const fmtPrice = (naira) => `₦${Number(naira).toLocaleString('en-NG')}`

const initialStatuses = ['Draft', 'Active', 'Pending Verification', 'Private']

function CheckRow({ checked, onChange, title, description }) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-100 bg-white p-3.5 transition hover:border-slate-200 hover:bg-slate-50/60">
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        className={`mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded border-2 transition ${
          checked ? 'border-[#6366F1] bg-[#6366F1]' : 'border-slate-300 bg-white'
        }`}
      >
        {checked ? (
          <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-bold text-[#111827]">{title}</span>
        <span className="mt-0.5 block text-[12px] leading-snug text-slate-500">{description}</span>
      </span>
    </label>
  )
}

export default function AgentDuplicateListingModal({ listing, open, onClose }) {
  const [dupTitle, setDupTitle] = useState('')
  const [dupStatus, setDupStatus] = useState('Draft')
  const [copyDetails, setCopyDetails] = useState(true)
  const [copyMedia, setCopyMedia] = useState(true)
  const [copyPricing, setCopyPricing] = useState(true)
  const [copyLeads, setCopyLeads] = useState(false)

  useEffect(() => {
    if (!open || !listing) return
    setDupTitle(`Copy of ${listing.title}`)
    setDupStatus('Draft')
    setCopyDetails(true)
    setCopyMedia(true)
    setCopyPricing(true)
    setCopyLeads(false)
  }, [open, listing])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !listing) return null

  const isRent = (listing.purpose || '').toLowerCase().includes('rent')

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dup-listing-title"
        className="relative flex max-h-[min(92vh,820px)] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15"
      >
        <div className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="dup-listing-title" className="text-lg font-bold tracking-tight text-[#111827]">
                Duplicate Listing
              </h2>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                Create a new listing by duplicating this property. You can edit the details before publishing.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className="thin-scroll flex-1 overflow-y-auto px-6 py-5">
          <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
            <img
              src={listing.image}
              alt=""
              className="h-[76px] w-[92px] shrink-0 rounded-lg object-cover ring-1 ring-slate-200/80"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold leading-snug text-[#111827]">{listing.title}</p>
              <p className="mt-0.5 text-[12px] text-slate-500">{listing.location}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-bold tabular-nums text-[#111827]">{fmtPrice(listing.price)}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                    isRent ? 'bg-sky-600' : 'bg-emerald-600'
                  }`}
                >
                  {listing.purpose || 'For Sale'}
                </span>
              </div>
              <p className="mt-2 text-[11px] font-medium text-slate-400">ID: {listing.id}</p>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-[14px] font-bold text-[#111827]">Duplicate Settings</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="dup-title" className="mb-1.5 block text-[12px] font-bold text-slate-800">
                  Listing Title
                </label>
                <input
                  id="dup-title"
                  value={dupTitle}
                  onChange={(e) => setDupTitle(e.target.value)}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-[#111827] outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>
              <div>
                <label htmlFor="dup-status" className="mb-1.5 block text-[12px] font-bold text-slate-800">
                  Status
                </label>
                <p className="mb-2 text-[11px] leading-relaxed text-slate-500">Choose the initial status for the duplicated listing.</p>
                <div className="relative">
                  <select
                    id="dup-status"
                    value={dupStatus}
                    onChange={(e) => setDupStatus(e.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-10 text-[13px] text-[#111827] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                  >
                    {initialStatuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7">
            <h3 className="text-[14px] font-bold text-[#111827]">What would you like to duplicate?</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
              Choose the information you want to carry over to the new listing.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <CheckRow
                checked={copyDetails}
                onChange={setCopyDetails}
                title="Property Details"
                description="Title, type, location, size, rooms, etc."
              />
              <CheckRow
                checked={copyMedia}
                onChange={setCopyMedia}
                title="Photos & Videos"
                description="All property media will be copied"
              />
              <CheckRow
                checked={copyPricing}
                onChange={setCopyPricing}
                title="Pricing & Commission"
                description="Price and commission settings"
              />
              <CheckRow
                checked={copyLeads}
                onChange={setCopyLeads}
                title="Leads & Messages"
                description="Lead history and conversations"
              />
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeLinecap="round" />
            </svg>
            Duplicate Listing
          </button>
        </div>
      </div>
    </div>
  )
}
