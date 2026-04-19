import { useCallback, useEffect, useMemo, useState } from 'react'

const fmtPrice = (naira) => `₦${Number(naira).toLocaleString('en-NG')}`

function buildListingUrl(listing) {
  if (!listing) return ''
  return `https://trustedhome.com/property/${listing.id}`
}

function ShareChannel({ label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-xl p-1.5 text-center transition hover:bg-slate-50"
    >
      {children}
      <span className="text-[11px] font-medium text-slate-500">{label}</span>
    </button>
  )
}

export default function AgentShareListingModal({ listing, open, onClose }) {
  const [copied, setCopied] = useState(false)

  const listingUrl = useMemo(() => buildListingUrl(listing), [listing])
  const shareText = useMemo(() => {
    if (!listing) return ''
    return `${listing.title} — ${listingUrl}`
  }, [listing, listingUrl])

  const commissionAmount = useMemo(() => {
    if (!listing) return 0
    const pct = Number(listing.commissionPct) || 0
    return Math.round((listing.price || 0) * (pct / 100))
  }, [listing])

  const qrSrc = useMemo(() => {
    if (!listingUrl) return ''
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(listingUrl)}`
  }, [listingUrl])

  const copyLink = useCallback(() => {
    if (!listingUrl) return
    void navigator.clipboard?.writeText(listingUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [listingUrl])

  const openShare = useCallback((href) => {
    if (href.startsWith('mailto:')) {
      window.location.href = href
      return
    }
    window.open(href, '_blank', 'noopener,noreferrer')
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !listing) return null

  const wa = `https://wa.me/?text=${encodeURIComponent(shareText)}`
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(listingUrl)}`
  const tw = `https://twitter.com/intent/tweet?text=${encodeURIComponent(listing.title)}&url=${encodeURIComponent(listingUrl)}`
  const tg = `https://t.me/share/url?url=${encodeURIComponent(listingUrl)}&text=${encodeURIComponent(listing.title)}`
  const mail = `mailto:?subject=${encodeURIComponent(listing.title)}&body=${encodeURIComponent(shareText)}`

  const onMore = () => {
    if (navigator.share) {
      void navigator.share({ title: listing.title, text: shareText, url: listingUrl }).catch(() => {})
    } else {
      copyLink()
    }
  }

  const downloadQr = () => {
    const a = document.createElement('a')
    a.href = qrSrc
    a.download = `${listing.id}-qr.png`
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-listing-title"
        className="relative flex max-h-[min(92vh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-6 pb-4 pt-5">
          <h2 id="share-listing-title" className="text-lg font-bold tracking-tight text-[#111827]">
            Share Listing
          </h2>
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

        <div className="thin-scroll flex-1 overflow-y-auto px-6 pb-6 pt-5">
          <div className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <img
              src={listing.image}
              alt=""
              className="h-[72px] w-[88px] shrink-0 rounded-lg object-cover ring-1 ring-slate-200/80"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-bold leading-snug text-[#111827]">{listing.title}</p>
              <p className="mt-0.5 text-[12px] text-slate-500">{listing.location}</p>
              <p className="mt-1 text-[14px] font-bold tabular-nums text-[#111827]">{fmtPrice(listing.price)}</p>
              <span
                className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                  (listing.purpose || '').toLowerCase().includes('rent') ? 'bg-sky-600' : 'bg-emerald-600'
                }`}
              >
                {listing.purpose || 'For Sale'}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[13px] font-bold text-[#111827]">Listing Link</p>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500">Anyone with this link can view this property.</p>
            <div className="relative mt-3">
              <input
                readOnly
                value={listingUrl}
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 pr-[4.5rem] pl-3 text-[12px] text-slate-800 outline-none ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={copyLink}
                className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-indigo-600 transition hover:bg-indigo-50"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="mt-7">
            <p className="text-[13px] font-bold text-[#111827]">Share via</p>
            <div className="mt-3 grid grid-cols-6 gap-1">
              <ShareChannel label="WhatsApp" onClick={() => openShare(wa)}>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#25D366] text-white shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.883 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </span>
              </ShareChannel>
              <ShareChannel label="Facebook" onClick={() => openShare(fb)}>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#1877F2] text-white shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </span>
              </ShareChannel>
              <ShareChannel label="Twitter" onClick={() => openShare(tw)}>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#0f1419] text-white shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </span>
              </ShareChannel>
              <ShareChannel label="Telegram" onClick={() => openShare(tg)}>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#26A5E4] text-white shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </span>
              </ShareChannel>
              <ShareChannel label="Email" onClick={() => openShare(mail)}>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#6366F1] text-white shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </ShareChannel>
              <ShareChannel label="More" onClick={onMore}>
                <span className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-slate-100 text-slate-600 shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </span>
              </ShareChannel>
            </div>
          </div>

          <div className="mt-7">
            <p className="text-[13px] font-bold text-[#111827]">Share with QR Code</p>
            <p className="mt-1 text-[12px] text-slate-500">Scan to view this listing on mobile.</p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                <img src={qrSrc} alt="" className="h-[140px] w-[140px] object-contain" width={140} height={140} />
              </div>
              <button
                type="button"
                onClick={downloadQr}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-[13px] font-semibold text-indigo-600 shadow-sm transition hover:bg-slate-50"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Download QR Code
              </button>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-t border-indigo-100 bg-indigo-50/90 px-6 py-4">
          <div className="flex gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#6366F1] text-white shadow-sm">
              <span className="text-lg font-bold leading-none">₦</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-indigo-950">Earn commission</p>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-600">
                Earn up to {fmtPrice(commissionAmount)} when this property is sold through your referral link.
              </p>
              <button type="button" className="mt-2 text-[12px] font-semibold text-indigo-600 transition hover:text-indigo-500">
                Learn more →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
