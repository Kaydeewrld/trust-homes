import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { properties } from '../data/properties'

const auctionItems = [
  {
    tag: 'LIVE',
    tagColor: 'bg-emerald-500',
    title: 'Luxury 5 Bedroom Duplex',
    location: 'Lekki Phase 1, Lagos',
    price: '₦85,000,000',
    next: '₦87,000,000',
    bids: '12 Bids',
    cta: 'Place a Bid',
    timerLabel: 'Closes in',
    timerSeconds: 10247,
  },
  {
    tag: 'ENDING SOON',
    tagColor: 'bg-orange-500',
    title: '3 Bedroom Apartment',
    location: 'Victoria Island, Lagos',
    price: '₦42,500,000',
    next: '₦44,000,000',
    bids: '8 Bids',
    cta: 'Place a Bid',
    timerLabel: 'Closes in',
    timerSeconds: 2719,
  },
  {
    tag: 'UPCOMING',
    tagColor: 'bg-violet-500',
    title: 'Prime Office Space',
    location: 'Ikeja GRA, Lagos',
    price: '₦120,000,000',
    next: 'May 18, 2026',
    bids: 'Auction Starts Soon',
    cta: 'Remind Me',
    timerLabel: 'Starts in',
    timerSeconds: 4953,
  },
  {
    tag: 'LIVE',
    tagColor: 'bg-emerald-500',
    title: 'Waterfront 4 Bedroom Penthouse',
    location: 'Banana Island, Lagos',
    price: '₦96,000,000',
    next: '₦98,500,000',
    bids: '16 Bids',
    cta: 'Place a Bid',
    timerLabel: 'Closes in',
    timerSeconds: 8340,
  },
  {
    tag: 'LIVE',
    tagColor: 'bg-emerald-500',
    title: 'Serviced 3 Bedroom Maisonette',
    location: 'Oniru, Lagos',
    price: '₦58,500,000',
    next: '₦60,000,000',
    bids: '10 Bids',
    cta: 'Place a Bid',
    timerLabel: 'Closes in',
    timerSeconds: 6388,
  },
  {
    tag: 'UPCOMING',
    tagColor: 'bg-violet-500',
    title: 'Contemporary Smart Home',
    location: 'Chevron, Lagos',
    price: '₦73,000,000',
    next: 'May 20, 2026',
    bids: 'Auction Starts Soon',
    cta: 'Remind Me',
    timerLabel: 'Starts in',
    timerSeconds: 12750,
  },
]

function formatAuctionTimer(totalSeconds) {
  const safe = Math.max(0, totalSeconds)
  const hours = String(Math.floor(safe / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((safe % 3600) / 60)).padStart(2, '0')
  const seconds = String(safe % 60).padStart(2, '0')
  return { hours, minutes, seconds }
}

function PropertyMarketingSections({ className = 'mt-8 space-y-4' }) {
  const navigate = useNavigate()
  const auctionStartRef = useRef(Date.now())
  const [auctionNowMs, setAuctionNowMs] = useState(Date.now())
  const [loanTenure, setLoanTenure] = useState('10 yrs')
  const [auctionOffset, setAuctionOffset] = useState(0)

  const rotatedAuctions = auctionItems.map((_, index) => auctionItems[(index + auctionOffset + auctionItems.length) % auctionItems.length])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setAuctionNowMs(Date.now())
    }, 1000)
    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <div className={className}>
      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-r from-[#e9f2ff] via-[#edf4ff] to-[#e6f0ff] p-4 shadow-sm md:p-6">
        <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr_0.9fr] xl:items-center">
          <div>
            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700">
              HOME LOAN
            </span>
            <h3 className="mt-3 text-5xl font-semibold leading-tight tracking-tight text-slate-800">
              Own your dream home
              <br />
              with <span className="text-blue-600">easy financing</span>
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              Get pre-approved for a home loan in minutes and take the first step towards owning a home that&apos;s truly yours.
            </p>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              {[
                { title: 'Low Interest Rates', text: 'Competitive rates that save you more' },
                { title: 'Quick Approval', text: 'Get approved in as little as 24 hours' },
                { title: 'Flexible Repayment', text: 'Plans that fit your budget' },
              ].map((item) => (
                <article key={item.title} className="rounded-xl border border-white/70 bg-white/70 p-3">
                  <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{item.text}</p>
                </article>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => navigate('/profile')} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500">
                Check Loan Eligibility
              </button>
              <button onClick={() => navigate('/explore')} className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                Learn More
              </button>
            </div>
          </div>

          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=85"
              alt="Modern financed home"
              className="mx-auto h-[320px] w-full max-w-[560px] rounded-2xl object-cover shadow-xl shadow-blue-200/50"
            />
          </div>

          <aside className="rounded-2xl border border-blue-100 bg-white p-4">
            <h4 className="text-sm font-semibold text-slate-800">Estimate your loan</h4>
            <div className="mt-3 space-y-3 text-xs">
              <div>
                <p className="text-slate-500">Property Price</p>
                <p className="mt-0.5 text-lg font-semibold text-slate-800">₦25,000,000</p>
                <div className="mt-2 h-1 rounded-full bg-slate-200">
                  <div className="h-1 w-[70%] rounded-full bg-blue-600" />
                </div>
                <div className="mt-1 flex justify-between text-[11px] text-slate-400">
                  <span>NGN</span>
                  <span>₦100M+</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-slate-500">Initial Deposit (20%)</p>
                <p className="font-medium text-slate-700">₦5,000,000</p>
              </div>

              <div>
                <p className="text-slate-500">Loan Tenure</p>
                <div className="mt-2 flex gap-1">
                  {['5 yrs', '10 yrs', '15 yrs', '20 yrs'].map((term) => (
                    <button
                      type="button"
                      key={term}
                      onClick={() => setLoanTenure(term)}
                      className={`rounded-md px-2 py-1 ${term === loanTenure ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600'}`}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-slate-500">Estimated Monthly Payment</p>
                <p className="mt-1 text-2xl font-semibold text-emerald-600">₦215,340<span className="text-sm text-slate-600"> / month</span></p>
                <p className="text-[11px] text-slate-400">Interest Rate: 12.5% p.a</p>
              </div>
            </div>
          </aside>
        </div>

        <div className="mt-5 rounded-xl border border-white/80 bg-white/70 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
            <p>All loans are processed securely with our trusted partners</p>
            <div className="flex flex-wrap items-center gap-5 text-base font-semibold text-slate-600">
              <span>ALAT</span>
              <span>access</span>
              <span>Stanbic IBTC</span>
              <span>FirstBank</span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-[#17388f] bg-gradient-to-r from-[#061e66] via-[#07257a] to-[#0b2f91] p-4 text-white shadow-xl md:p-5">
          <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <aside className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="inline-flex rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-blue-100">AUCTIONS</p>
              <h3 className="mt-3 text-5xl font-semibold leading-tight">
                Bid. Win. Own.
                <br />
                Your next <span className="text-blue-300">property.</span>
              </h3>
              <p className="mt-3 text-sm text-blue-100/85">
                Discover amazing properties up for auction.
                <br />
                Transparent process. Great opportunities.
              </p>

              <div className="mt-4 space-y-3">
                {[
                  { title: 'Verified Properties', text: 'All properties are legally verified and authenticated.' },
                  { title: 'Transparent Bidding', text: 'Real-time bidding with no hidden fees.' },
                  { title: 'Secure Ownership', text: 'Safe transactions and quick ownership transfer.' },
                ].map((item) => (
                  <article key={item.title} className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-500/20 text-blue-100">✓</span>
                    <div>
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-xs text-blue-100/75">{item.text}</p>
                    </div>
                  </article>
                ))}
              </div>

              <button onClick={() => navigate('/explore')} className="mt-4 rounded-xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-400">
                View All Auctions →
              </button>
            </aside>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-blue-100">Live Auctions</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => navigate('/explore')} className="text-xs text-blue-100/80 hover:text-white">View all auctions →</button>
                  <button type="button" onClick={() => setAuctionOffset((offset) => (offset - 1 + auctionItems.length) % auctionItems.length)} className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-xs">‹</button>
                  <button type="button" onClick={() => setAuctionOffset((offset) => (offset + 1) % auctionItems.length)} className="rounded-full border border-white/20 bg-white/10 px-2 py-1 text-xs">›</button>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {rotatedAuctions.map((item, index) => {
                  const elapsedSeconds = Math.floor((auctionNowMs - auctionStartRef.current) / 1000)
                  const countdown = formatAuctionTimer(item.timerSeconds - elapsedSeconds)
                  return (
                    <article key={`${item.title}-${index}`} className="overflow-hidden rounded-xl border border-white/15 bg-white text-slate-800 shadow-sm">
                      <div className="relative">
                        <img src={properties[index]?.image} alt={item.title} className="h-36 w-full object-cover" />
                        <span className={`absolute left-2 top-2 rounded-full ${item.tagColor} px-2 py-0.5 text-[10px] font-semibold text-white`}>
                          {item.tag}
                        </span>
                        <div className="absolute bottom-2 left-2 rounded-lg bg-[#0a1738]/90 px-2 py-1 text-white shadow-lg">
                          <p className="text-[10px] text-blue-100/90">{item.timerLabel}</p>
                          <p className="text-xs font-semibold tracking-wide">
                            {countdown.hours} : {countdown.minutes} : {countdown.seconds}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 p-3">
                        <p className="text-sm font-semibold">{item.title}</p>
                        <p className="text-[11px] text-slate-500">{item.location}</p>
                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          <div>
                            <p className="text-slate-400">Current Bid</p>
                            <p className="font-semibold text-blue-700">{item.price}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">{index === 2 ? 'Auction Starts' : 'Next Minimum Bid'}</p>
                            <p className="font-semibold text-slate-700">{item.next}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] text-slate-500">
                          <span>{item.bids}</span>
                          <button
                            type="button"
                            onClick={() => navigate(`/property/${properties[index % properties.length]?.id || 'th-001'}`)}
                            className="rounded-md bg-blue-600 px-2 py-1 text-white"
                          >
                            {item.cta}
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 md:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-slate-200 p-5 md:border-b-0 md:border-r">
              <h4 className="text-4xl font-semibold leading-tight text-slate-800">
                How Property
                <br />
                Auctions Work
              </h4>
              <p className="mt-3 text-sm text-slate-500">Simple steps to owning your dream property.</p>
            </div>
            <div className="grid gap-0 md:grid-cols-4">
              {[
                { step: '01', title: 'Browse Auctions', text: 'Explore a wide range of verified properties up for auction.' },
                { step: '02', title: 'Register & Verify', text: 'Create an account and complete verification to start bidding.' },
                { step: '03', title: 'Place Your Bids', text: 'Bid in real-time and compete to secure the best deals.' },
                { step: '04', title: 'Win & Own', text: 'Win the auction and complete payment to own your property.' },
              ].map((item) => (
                <article key={item.step} className="border-b border-slate-200 p-4 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
                  <p className="inline-grid h-6 w-6 place-items-center rounded-full bg-blue-600 text-[11px] font-semibold text-white">{item.step}</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-2 border-t border-slate-200 px-5 py-3 text-sm text-slate-600 md:grid-cols-4">
            <p><span className="font-semibold text-slate-800">500+</span> Properties Auctioned</p>
            <p><span className="font-semibold text-slate-800">2,000+</span> Happy Investors</p>
            <p><span className="font-semibold text-slate-800">100%</span> Secure & Transparent</p>
            <p><span className="font-semibold text-slate-800">Fast</span> Quick Ownership Transfer</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default PropertyMarketingSections
