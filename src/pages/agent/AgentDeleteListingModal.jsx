import { useEffect, useState } from 'react'

const fmtPrice = (naira) => `₦${Number(naira).toLocaleString('en-NG')}`

export default function AgentDeleteListingModal({ listing, open, onClose, onConfirm }) {
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    if (open) setAcknowledged(false)
  }, [open, listing?.id])

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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-listing-title"
        aria-describedby="delete-listing-desc"
        className="relative w-full max-w-md rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>

        <div className="px-6 pb-2 pt-8 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-red-50">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-red-500" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" strokeLinejoin="round" />
              <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
            </svg>
          </div>
          <h2 id="delete-listing-title" className="mt-4 text-lg font-bold tracking-tight text-[#111827]">
            Delete this listing?
          </h2>
          <p id="delete-listing-desc" className="mt-2 text-[13px] leading-relaxed text-slate-500">
            This listing will be permanently removed and cannot be recovered. Any active promotions or leads linked to this property will be
            lost.
          </p>
        </div>

        <div className="px-6 pb-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-left">
            <div className="flex gap-3">
              <img src={listing.image} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover ring-1 ring-slate-200/80" />
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
          </div>

          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-transparent px-0 py-1 text-left">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 accent-red-600 focus:ring-red-500/30"
            />
            <span className="text-[13px] leading-snug text-slate-600">I understand this action cannot be undone.</span>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-[#111827] shadow-sm transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!acknowledged}
            onClick={() => {
              if (!acknowledged) return
              onConfirm?.(listing)
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-red-600"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" strokeLinecap="round" />
            </svg>
            Delete Listing
          </button>
        </div>
      </div>
    </div>
  )
}
