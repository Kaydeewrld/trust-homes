import { useEffect, useState } from 'react'

const fmtPrice = (naira) => `₦${Number(naira).toLocaleString('en-NG')}`

function VisibilityCard({ selected, onSelect, value, children, leading }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition ${
        selected
          ? 'border-[#6366F1] bg-indigo-50/90 shadow-sm shadow-indigo-500/10'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80'
      }`}
    >
      <span className="mt-0.5 shrink-0">{leading}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  )
}

export default function AgentChangeVisibilityModal({ listing, open, onClose }) {
  const [visibility, setVisibility] = useState('public')

  useEffect(() => {
    if (!open || !listing) return
    if (listing.status === 'draft') setVisibility('draft')
    else setVisibility('public')
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

  const publicLeading =
    visibility === 'public' ? (
      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-[#6366F1] bg-white">
        <span className="h-2.5 w-2.5 rounded-full bg-[#6366F1]" />
      </span>
    ) : (
      <span className="h-[18px] w-[18px] shrink-0 rounded-full border-2 border-slate-300 bg-white" />
    )

  const privateLeading = (
    <span className={`grid h-[18px] w-[18px] place-items-center ${visibility === 'private' ? 'text-indigo-600' : 'text-slate-500'}`}>
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
      </svg>
    </span>
  )

  const draftLeading = (
    <span className={`grid h-[18px] w-[18px] place-items-center ${visibility === 'draft' ? 'text-indigo-600' : 'text-slate-500'}`}>
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinejoin="round" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round" />
      </svg>
    </span>
  )

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="visibility-modal-title"
        className="relative flex max-h-[min(92vh,760px)] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15"
      >
        <div className="shrink-0 border-b border-slate-100 px-6 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="visibility-modal-title" className="text-lg font-bold tracking-tight text-[#111827]">
                Change Visibility
              </h2>
              <p className="mt-1 text-[13px] text-slate-500">Choose who can see this listing.</p>
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

          <fieldset className="mt-6 space-y-3 border-0 p-0">
            <legend className="sr-only">Listing visibility</legend>

            <VisibilityCard value="public" selected={visibility === 'public'} onSelect={setVisibility} leading={publicLeading}>
              <span className="flex flex-wrap items-center gap-2">
                <span className={`text-[14px] font-bold ${visibility === 'public' ? 'text-indigo-950' : 'text-[#111827]'}`}>Public</span>
                <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
                  Recommended
                </span>
              </span>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-500">Anyone can view this listing on TrustedHome.</p>
            </VisibilityCard>

            <VisibilityCard value="private" selected={visibility === 'private'} onSelect={setVisibility} leading={privateLeading}>
              <span className={`text-[14px] font-bold ${visibility === 'private' ? 'text-indigo-950' : 'text-[#111827]'}`}>Private</span>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                Only you and people with the link can view this listing.
              </p>
            </VisibilityCard>

            <VisibilityCard value="draft" selected={visibility === 'draft'} onSelect={setVisibility} leading={draftLeading}>
              <span className={`text-[14px] font-bold ${visibility === 'draft' ? 'text-indigo-950' : 'text-[#111827]'}`}>Draft</span>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-500">This listing will be hidden and not visible to anyone.</p>
            </VisibilityCard>
          </fieldset>

          <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-slate-100/90 px-3 py-3">
            <span className="mt-0.5 shrink-0 text-sky-600">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <p className="text-[12px] leading-relaxed text-slate-600">You can change the visibility at any time.</p>
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
            className="rounded-xl bg-[#6366F1] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
