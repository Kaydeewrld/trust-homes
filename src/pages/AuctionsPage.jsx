import { useEffect, useMemo, useRef, useState } from 'react'
import { properties } from '../data/properties'
import { BID_PLACEMENT_FEE_NGN, useWallet } from '../context/WalletContext'

const auctionFilters = ['All Auctions', 'Live Now', 'Ending Soon', 'Upcoming', 'Closed']

const auctionItems = [
  { id: 'a1', tag: 'LIVE NOW', status: 'Live Now', title: 'Luxury 5 Bedroom Duplex', location: 'Lekki Phase 1, Lagos', currentBid: 85000000, nextBid: 87000000, beds: 5, baths: 6, area: 450, timerLabel: 'Ends in', timerSeconds: 8147 },
  { id: 'a2', tag: 'ENDING SOON', status: 'Ending Soon', title: '3 Bedroom Apartment', location: 'Victoria Island, Lagos', currentBid: 42500000, nextBid: 44000000, beds: 3, baths: 3, area: 200, timerLabel: 'Ends in', timerSeconds: 2719 },
  { id: 'a3', tag: 'UPCOMING', status: 'Upcoming', title: 'Prime Office Space', location: 'Ikeja, Lagos', currentBid: 120000000, nextBid: 0, beds: 0, baths: 2, area: 500, timerLabel: 'Starts in', timerSeconds: 4953 },
  { id: 'a4', tag: 'UPCOMING', status: 'Upcoming', title: '4 Bedroom Terrace Duplex', location: 'Chevron Drive, Lagos', currentBid: 60000000, nextBid: 0, beds: 4, baths: 5, area: 300, timerLabel: 'Starts in', timerSeconds: 7855 },
  { id: 'a5', tag: 'LIVE NOW', status: 'Live Now', title: 'Fully Furnished Penthouse', location: 'Ikoyi, Lagos', currentBid: 95000000, nextBid: 97500000, beds: 4, baths: 4, area: 350, timerLabel: 'Ends in', timerSeconds: 3922 },
  { id: 'a6', tag: 'ENDING SOON', status: 'Ending Soon', title: 'Commercial Plaza', location: 'Ajah, Lagos', currentBid: 230000000, nextBid: 235000000, beds: 0, baths: 10, area: 1200, timerLabel: 'Ends in', timerSeconds: 2205 },
  { id: 'a7', tag: 'ENDING SOON', status: 'Ending Soon', title: '6 Bedroom Detached House', location: 'Lekki, Lagos', currentBid: 77000000, nextBid: 79000000, beds: 6, baths: 6, area: 550, timerLabel: 'Ends in', timerSeconds: 5805 },
  { id: 'a8', tag: 'UPCOMING', status: 'Upcoming', title: '2 Bedroom Luxury Apartment', location: 'Eko Atlantic, Lagos', currentBid: 35000000, nextBid: 0, beds: 2, baths: 2, area: 150, timerLabel: 'Starts in', timerSeconds: 11730 },
]

const auctionMediaBank = {
  a1: [{ type: 'image', src: properties[0]?.image }, { type: 'image', src: properties[3]?.image }, { type: 'video', src: 'https://www.w3schools.com/html/mov_bbb.mp4' }],
  a2: [{ type: 'image', src: properties[1]?.image }, { type: 'image', src: properties[7]?.image }],
  a3: [{ type: 'image', src: properties[2]?.image }, { type: 'image', src: properties[10]?.image }, { type: 'video', src: 'https://www.w3schools.com/html/movie.mp4' }],
  a4: [{ type: 'image', src: properties[9]?.image }, { type: 'image', src: properties[5]?.image }],
  a5: [{ type: 'image', src: properties[5]?.image }, { type: 'image', src: properties[8]?.image }, { type: 'video', src: 'https://www.w3schools.com/html/mov_bbb.mp4' }],
  a6: [{ type: 'image', src: properties[4]?.image }, { type: 'image', src: properties[2]?.image }],
  a7: [{ type: 'image', src: properties[0]?.image }, { type: 'image', src: properties[11]?.image }],
  a8: [{ type: 'image', src: properties[11]?.image }, { type: 'image', src: properties[1]?.image }, { type: 'video', src: 'https://www.w3schools.com/html/movie.mp4' }],
}

function AuctionsPage() {
  const { balance, deductBidFee } = useWallet()
  const startRef = useRef(0)
  const [timerNowMs, setTimerNowMs] = useState(0)
  const [filter, setFilter] = useState('All Auctions')
  const [auctionListings, setAuctionListings] = useState(auctionItems)
  const [notifiedAuctions, setNotifiedAuctions] = useState([])
  const [bidModalState, setBidModalState] = useState({ open: false, auctionId: null })
  const [bidAmount, setBidAmount] = useState('')
  const [bidError, setBidError] = useState('')
  const [replayIndex, setReplayIndex] = useState(0)
  const [replaySweepOffset, setReplaySweepOffset] = useState(-120)
  const [mediaTick, setMediaTick] = useState(0)
  const [latestAuctionReply, setLatestAuctionReply] = useState(() => {
    const liveAuction = auctionItems.find((item) => item.status === 'Live Now') || auctionItems[0]
    return liveAuction
      ? {
          auctionTitle: liveAuction.title,
          amount: liveAuction.currentBid,
          at: new Date(),
        }
      : null
  })
  const formatNaira = (amount) => `₦${new Intl.NumberFormat('en-NG').format(amount)}`

  const filteredAuctions = useMemo(() => {
    if (filter === 'All Auctions') return auctionListings
    if (filter === 'Closed') return []
    return auctionListings.filter((item) => item.status === filter)
  }, [auctionListings, filter])
  const liveReplayFeed = useMemo(() => {
    const endingSoon = auctionListings.find((item) => item.status === 'Ending Soon')
    const upcoming = auctionListings.find((item) => item.status === 'Upcoming')
    return [
      latestAuctionReply
        ? {
            id: 'latest-reply',
            label: 'LIVE REPLY',
            tone: 'emerald',
            text: `${latestAuctionReply.auctionTitle} got a fresh bid at ${formatNaira(latestAuctionReply.amount)}`,
          }
        : null,
      endingSoon
        ? {
            id: 'just-sold',
            label: 'JUST SOLD',
            tone: 'amber',
            text: `${endingSoon.title} just closed around ${formatNaira(endingSoon.currentBid)}`,
          }
        : null,
      upcoming
        ? {
            id: 'next-wave',
            label: 'NEXT WAVE',
            tone: 'blue',
            text: `${upcoming.title} opens soon - watchers are lining up`,
          }
        : null,
    ].filter(Boolean)
  }, [auctionListings, latestAuctionReply])
  const activeReplay = liveReplayFeed[replayIndex % Math.max(1, liveReplayFeed.length)] || null

  useEffect(() => {
    startRef.current = Date.now()
    setTimerNowMs(Date.now())
    const timer = setInterval(() => setTimerNowMs(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    if (!liveReplayFeed.length) return
    const timer = setInterval(() => {
      setReplayIndex((current) => (current + 1) % liveReplayFeed.length)
    }, 3200)
    return () => clearInterval(timer)
  }, [liveReplayFeed.length])
  useEffect(() => {
    const gradientTimer = setInterval(() => {
      setReplaySweepOffset((current) => (current >= 120 ? -120 : current + 6))
    }, 70)
    return () => clearInterval(gradientTimer)
  }, [])
  useEffect(() => {
    const rotateTimer = setInterval(() => {
      setMediaTick((current) => current + 1)
    }, 2200)
    return () => clearInterval(rotateTimer)
  }, [])

  const formatAuctionReplyTime = (date) =>
    new Intl.DateTimeFormat('en-NG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(date)
  const getBuyNowAmount = (item) => {
    const base = item.nextBid || item.currentBid
    return Math.round(base * 1.1)
  }
  const mediaForAuction = (itemId, fallbackIndex) => {
    const media = (auctionMediaBank[itemId] || []).filter((m) => m?.src)
    if (media.length) return media
    return [{ type: 'image', src: properties[fallbackIndex % properties.length]?.image }]
  }
  const formatTimer = (seconds) => {
    const elapsed = Math.floor((timerNowMs - startRef.current) / 1000)
    const safe = Math.max(0, seconds - elapsed)
    const h = String(Math.floor(safe / 3600)).padStart(2, '0')
    const m = String(Math.floor((safe % 3600) / 60)).padStart(2, '0')
    const s = String(safe % 60).padStart(2, '0')
    return `${h} : ${m} : ${s}`
  }
  const selectedBidAuction = auctionListings.find((item) => item.id === bidModalState.auctionId)

  const openBidModal = (auctionId) => {
    const selectedAuction = auctionListings.find((item) => item.id === auctionId)
    if (!selectedAuction) return
    setBidError('')
    setBidAmount(String(selectedAuction.nextBid || selectedAuction.currentBid + 1000000))
    setBidModalState({ open: true, auctionId })
  }

  const submitBid = () => {
    const amount = Number(String(bidAmount).replace(/[^\d]/g, ''))
    if (!selectedBidAuction || Number.isNaN(amount)) return
    const minimumAccepted = selectedBidAuction.nextBid || selectedBidAuction.currentBid + 1
    if (amount < minimumAccepted) {
      setBidError(`Your bid must be at least ${formatNaira(minimumAccepted)}.`)
      return
    }
    if (balance < BID_PLACEMENT_FEE_NGN) {
      setBidError(`Insufficient wallet balance. A fee of ${formatNaira(BID_PLACEMENT_FEE_NGN)} is required to place each bid.`)
      return
    }
    const feeOk = deductBidFee()
    if (!feeOk) {
      setBidError(`Could not deduct bid fee (${formatNaira(BID_PLACEMENT_FEE_NGN)}). Please top up your wallet.`)
      return
    }

    setAuctionListings((current) =>
      current.map((item) =>
        item.id === selectedBidAuction.id
          ? {
              ...item,
              currentBid: amount,
              nextBid: amount + 2000000,
            }
          : item,
      ),
    )
    setLatestAuctionReply({
      auctionTitle: selectedBidAuction.title,
      amount,
      at: new Date(),
    })
    setBidModalState({ open: false, auctionId: null })
    setBidError('')
  }

  const toggleNotify = (auctionId) => {
    setNotifiedAuctions((current) =>
      current.includes(auctionId) ? current.filter((id) => id !== auctionId) : [...current, auctionId],
    )
  }

  return (
    <section className="space-y-4 pb-8 text-slate-800">
      <section className="overflow-hidden rounded-2xl border border-[#17388f] bg-gradient-to-r from-[#061e66] via-[#07257a] to-[#0b2f91] p-4 text-white shadow-xl">
        <div className="grid gap-4 xl:grid-cols-[1fr_280px] xl:items-start">
          <div>
            <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-medium">PROPERTY AUCTIONS</span>
            <h1 className="mt-2 text-5xl font-semibold leading-tight">Bid. Win. Own.</h1>
            <p className="mt-2 text-sm text-blue-100/85">Discover and bid on amazing properties at the best prices.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <article className="rounded-lg border border-white/15 bg-white/10 p-2.5 text-xs">Verified Properties</article>
              <article className="rounded-lg border border-white/15 bg-white/10 p-2.5 text-xs">Transparent Bidding</article>
              <article className="rounded-lg border border-white/15 bg-white/10 p-2.5 text-xs">Secure Transactions</article>
            </div>
          </div>
          <aside className="flex h-full flex-col overflow-hidden rounded-xl border border-white/25 bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)]">
            <div className="border-b border-slate-100 bg-slate-50/90 px-4 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Auction snapshot</p>
            </div>
            <div className="grid flex-1 grid-cols-3 divide-x divide-slate-100 bg-white">
              <div className="flex flex-col items-center justify-center gap-1 px-2 py-4 text-center sm:px-3">
                <span className="text-[10px] font-medium uppercase leading-tight tracking-wide text-slate-500">Live</span>
                <span className="text-3xl font-bold tabular-nums leading-none text-emerald-600">12</span>
                <span className="text-[10px] text-slate-400">auctions</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1 px-2 py-4 text-center sm:px-3">
                <span className="text-[10px] font-medium uppercase leading-tight tracking-wide text-slate-500">Ending</span>
                <span className="text-3xl font-bold tabular-nums leading-none text-amber-600">5</span>
                <span className="text-[10px] text-slate-400">today</span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1 px-2 py-4 text-center sm:px-3">
                <span className="text-[10px] font-medium uppercase leading-tight tracking-wide text-slate-500">Total</span>
                <span className="text-3xl font-bold tabular-nums leading-none text-blue-700">128</span>
                <span className="text-[10px] text-slate-400">properties</span>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section
        className="relative overflow-hidden rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 via-blue-50 to-indigo-50 px-4 py-3 shadow-sm"
      >
        <div
          className="pointer-events-none absolute inset-y-0 z-0"
          style={{
            left: `${replaySweepOffset}%`,
            width: '68%',
            background:
              'linear-gradient(90deg, rgba(56,189,248,0) 0%, rgba(56,189,248,0.65) 40%, rgba(59,130,246,0.92) 50%, rgba(56,189,248,0.65) 60%, rgba(56,189,248,0) 100%)',
            filter: 'blur(1px)',
            opacity: 0.95,
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(14,116,144,0.1) 0%, rgba(37,99,235,0.14) 50%, rgba(79,70,229,0.1) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute left-0 top-0 z-0 h-1 rounded-full"
          style={{
            width: '36%',
            transform: `translateX(${replaySweepOffset}%)`,
            background: 'linear-gradient(90deg, rgba(34,211,238,0.95), rgba(59,130,246,1), rgba(99,102,241,0.95))',
            boxShadow: '0 0 18px rgba(37,99,235,0.7)',
          }}
        />
        <div
          className="relative z-10"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-800">
              <span className="inline-flex h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
              Live Auction Replay
            </p>
            {latestAuctionReply?.at && <p className="text-[11px] text-slate-600">Updated {formatAuctionReplyTime(latestAuctionReply.at)}</p>}
          </div>
          <div className="mt-2 rounded-xl border border-white/80 bg-white/85 px-3 py-2">
            <p className="text-sm font-semibold text-slate-900">
              {activeReplay?.text || 'No live auction replay yet.'}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {liveReplayFeed.map((entry, idx) => (
                <span
                  key={entry.id}
                  className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                    idx === replayIndex
                      ? 'bg-slate-900 text-white'
                      : entry.tone === 'amber'
                        ? 'bg-amber-100 text-amber-800'
                        : entry.tone === 'blue'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {entry.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1">
                {auctionFilters.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`rounded-md px-2.5 py-1.5 text-xs ${
                      filter === item ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setFilter('All Auctions')} className="rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600">
                Filters
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {filteredAuctions.map((item, index) => (
              <article key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="relative">
                  <div className="relative h-32 w-full overflow-hidden">
                    {mediaForAuction(item.id, index).map((mediaItem, mediaIdx, allMedia) => {
                      const activeIndex = mediaTick % allMedia.length
                      const isActive = mediaIdx === activeIndex
                      return (
                        <div
                          key={`${item.id}-${mediaItem.type}-${mediaIdx}`}
                          className={`absolute inset-0 transition-opacity duration-700 ${isActive ? 'opacity-100' : 'opacity-0'}`}
                        >
                          {mediaItem.type === 'video' ? (
                            <video className="h-full w-full object-cover" src={mediaItem.src} autoPlay muted loop playsInline preload="metadata" />
                          ) : (
                            <img src={mediaItem.src} alt={item.title} className="h-full w-full object-cover" />
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <span className="absolute left-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold text-white">{item.tag}</span>
                  <div className="absolute bottom-2 left-2 rounded bg-[#0a1738]/90 px-2 py-1 text-white">
                    <p className="text-[10px] text-blue-100">{item.timerLabel}</p>
                    <p className="text-xs font-semibold">{formatTimer(item.timerSeconds)}</p>
                  </div>
                </div>
                <div className="space-y-1.5 p-2.5">
                  <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                  <p className="text-[11px] text-slate-500">{item.location}</p>
                  <div className="grid grid-cols-2 text-[11px]">
                    <div>
                      <p className="text-slate-400">Current Bid</p>
                      <p className="font-semibold text-blue-700">{formatNaira(item.currentBid)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">{item.status === 'Upcoming' ? 'Auction Starts' : 'Next Minimum Bid'}</p>
                      <p className="font-semibold text-slate-700">{item.status === 'Upcoming' ? 'May 20, 2026' : formatNaira(item.nextBid)}</p>
                    </div>
                  </div>
                  <div className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-[11px]">
                    <p className="text-emerald-700">Buy Now Amount</p>
                    <p className="font-semibold text-emerald-800">{formatNaira(getBuyNowAmount(item))}</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <div className="text-[11px] text-slate-500">
                      {item.beds} Bed • {item.baths} Bath • {item.area} m²
                    </div>
                    {item.status === 'Upcoming' ? (
                      <button
                        type="button"
                        onClick={() => toggleNotify(item.id)}
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] ${
                          notifiedAuctions.includes(item.id)
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                          <path d="M15 17h5l-1.4-1.4a2 2 0 0 1-.6-1.4V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0a3 3 0 1 1-6 0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        {notifiedAuctions.includes(item.id) ? 'Notified' : 'Notify Me'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openBidModal(item.id)}
                        className="rounded-md bg-blue-600 px-2 py-1 text-[11px] text-white"
                      >
                        Place a Bid
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-800">How Auctions Work</h3>
              <button type="button" className="text-xs text-blue-600">View Process</button>
            </div>
            <div className="mt-2 space-y-2">
              {['Browse Properties', 'Register & Verify', 'Place Your Bids', 'Win & Own'].map((step, idx) => (
                <article key={step} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
                  <p className="text-xs font-medium text-slate-800">{idx + 1}. {step}</p>
                </article>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800">Want to list your property for auction?</h3>
            <p className="mt-1 text-xs text-slate-500">Reach thousands of serious buyers and get the best value.</p>
            <button type="button" className="mt-2 rounded-md bg-blue-600 px-3 py-2 text-xs text-white">List Your Property</button>
          </article>
        </aside>
      </div>

      {bidModalState.open && selectedBidAuction && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">Place a Bid</p>
                <p className="text-xs text-slate-500">{selectedBidAuction.title}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setBidError('')
                  setBidModalState({ open: false, auctionId: null })
                }}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <p>Current Bid: <span className="font-semibold text-slate-800">{formatNaira(selectedBidAuction.currentBid)}</span></p>
              <p className="mt-1">Minimum Next Bid: <span className="font-semibold text-slate-800">{formatNaira(selectedBidAuction.nextBid || selectedBidAuction.currentBid + 1)}</span></p>
            </div>

            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-950">
              <p className="font-semibold text-amber-900">Disclaimer</p>
              <p className="mt-1 text-amber-900/90">
                Every bid placement attracts a non-refundable platform fee of{' '}
                <span className="font-semibold">{formatNaira(BID_PLACEMENT_FEE_NGN)}</span>, which will be deducted from your wallet when you submit this bid.
                Your bid amount itself is not charged to your wallet here — only the fee applies per bid action.
              </p>
            </div>

            <p className="mt-2 text-[11px] text-slate-500">
              Wallet balance: <span className="font-semibold text-slate-700">{formatNaira(balance)}</span>
              {' · '}
              After fee: <span className="font-semibold text-slate-700">{formatNaira(Math.max(0, balance - BID_PLACEMENT_FEE_NGN))}</span>
            </p>

            <label className="mt-3 block text-xs font-medium text-slate-700">Your Bid Amount (₦)</label>
            <input
              value={bidAmount}
              onChange={(event) => setBidAmount(event.target.value.replace(/[^\d]/g, ''))}
              placeholder="Enter your bid"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
            />

            {bidError && (
              <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-[11px] text-red-800">{bidError}</p>
            )}

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setBidError('')
                  setBidModalState({ open: false, auctionId: null })
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitBid}
                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-500"
              >
                Submit Bid
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default AuctionsPage
