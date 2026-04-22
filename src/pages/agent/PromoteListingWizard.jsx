import { Fragment, useEffect, useMemo, useState } from 'react'
import { promotionRows, referralListingsForPromote } from '../../data/agentPromotionsSeed'

const fmtPrice = (naira) => `₦${Number(naira).toLocaleString('en-NG')}`
const BRAND = '#6366F1'

const statusStyles = {
  active: { dot: 'bg-emerald-500', text: 'text-emerald-800', label: 'Active' },
  scheduled: { dot: 'bg-indigo-500', text: 'text-indigo-800', label: 'Scheduled' },
  ended: { dot: 'bg-slate-400', text: 'text-slate-600', label: 'Ended' },
  draft: { dot: 'bg-slate-400', text: 'text-slate-600', label: 'Draft' },
}

const STEP_LABELS = ['Select Listing', 'Choose Promotion Plan', 'Set Budget & Duration', 'Review & Pay']

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 10000,
    days: 7,
    blurb: 'Great for testing the waters',
    features: ['Basic reach across platforms', 'Standard placement in search', '7-day analytics snapshot'],
    cta: 'Choose Basic',
    featured: false,
    icon: 'plane',
  },
  {
    id: 'standard',
    name: 'Standard',
    price: 25000,
    days: 14,
    blurb: 'Balanced visibility for serious sellers',
    features: ['Priority placement in search & feeds', 'Multi-channel distribution', '14-day performance insights', 'Lead notifications'],
    cta: 'Choose Standard',
    featured: true,
    badge: 'Most Popular',
    icon: 'crown',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 50000,
    days: 30,
    blurb: 'Maximum exposure for premium listings',
    features: ['Top placement & featured slots', 'Extended 30-day promotion window', 'Dedicated performance dashboard', 'Priority support'],
    cta: 'Choose Premium',
    featured: false,
    icon: 'rocket',
  },
  {
    id: 'custom',
    name: 'Custom',
    price: null,
    days: null,
    blurb: 'Set your own budget and timeline',
    features: ['Flexible budget controls', 'Custom duration windows', 'Tailored channel mix', 'Account manager review'],
    cta: 'Create Custom Plan',
    featured: false,
    icon: 'sliders',
  },
]

function StatusPill({ row }) {
  const s = statusStyles[row.status] || statusStyles.draft
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${s.text} bg-white ring-1 ring-slate-200`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}

function IconUser({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconUsers({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
    </svg>
  )
}

function PlanIcon({ type, className }) {
  const c = className || 'h-6 w-6'
  if (type === 'plane')
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke={BRAND} strokeWidth="2">
        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (type === 'crown')
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke={BRAND} strokeWidth="2">
        <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zM3 20h18v2H3z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  if (type === 'rocket')
    return (
      <svg viewBox="0 0 24 24" className={c} fill="none" stroke={BRAND} strokeWidth="2">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09zM12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  return (
    <svg viewBox="0 0 24 24" className={c} fill="none" stroke={BRAND} strokeWidth="2">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="2" y1="14" x2="6" y2="14" />
      <line x1="10" y1="8" x2="14" y2="8" />
      <line x1="18" y1="16" x2="22" y2="16" />
    </svg>
  )
}

function Stepper({ step }) {
  return (
    <div className="mt-6 border-b border-slate-100 pb-6">
      <div className="flex w-full items-center">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1
          const done = step > n
          const active = step === n
          return (
            <Fragment key={label}>
              <div className="flex min-w-0 flex-1 flex-col items-center text-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-bold sm:h-10 sm:w-10 ${
                    done ? 'bg-[#6366F1] text-white' : active ? 'bg-[#6366F1] text-white ring-4 ring-indigo-100' : 'border-2 border-slate-200 bg-white text-slate-400'
                  }`}
                >
                  {done ? (
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    n
                  )}
                </div>
                <p className={`mt-2 hidden text-[11px] font-semibold leading-tight sm:block sm:px-1 ${active ? 'text-[#6366F1]' : done ? 'text-slate-700' : 'text-slate-400'}`}>{label}</p>
                <p className={`mt-1 text-[10px] font-semibold leading-tight sm:hidden ${active ? 'text-[#6366F1]' : 'text-slate-400'}`}>Step {n}</p>
                {active ? <span className="mt-2 h-1 w-full max-w-[5rem] rounded-full bg-[#6366F1]" /> : <span className="mt-2 h-1 w-full max-w-[5rem]" />}
              </div>
              {i < STEP_LABELS.length - 1 ? (
                <div className={`mx-1 h-px min-w-[8px] flex-1 shrink sm:mx-2 ${step > n ? 'bg-[#6366F1]' : 'bg-slate-200'}`} aria-hidden />
              ) : null}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

export default function PromoteListingWizard({ onClose }) {
  const [scope, setScope] = useState('mine')
  const [step, setStep] = useState(1)

  const mineRows = useMemo(() => promotionRows.filter((r) => r.image && r.listingPrice != null).slice(0, 5), [])
  const [selectedMineId, setSelectedMineId] = useState(() => mineRows[0]?.id ?? '')
  const [searchMine, setSearchMine] = useState('')
  const [sortMine, setSortMine] = useState('newest')

  const [selectedOtherId, setSelectedOtherId] = useState(() => referralListingsForPromote[0]?.id ?? '')
  const [searchOther, setSearchOther] = useState('')
  const [locFilter, setLocFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortOther, setSortOther] = useState('newest')
  const [otherPage, setOtherPage] = useState(1)
  const pageSize = 5

  const [planId, setPlanId] = useState('standard')
  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[1]
  const budgetAmount = plan.price ?? 25000
  const durationDays = plan.days ?? 14

  const [budgetPreset, setBudgetPreset] = useState('25000')
  const [customBudget, setCustomBudget] = useState('')
  const [durationPreset, setDurationPreset] = useState('14')
  const [startDate, setStartDate] = useState('2026-05-16')
  const [endDate, setEndDate] = useState('2026-05-30')

  const [paymentMethod, setPaymentMethod] = useState('wallet')
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)

  useEffect(() => {
    setStep(1)
  }, [scope])

  const filteredMine = useMemo(() => {
    let list = [...mineRows]
    if (searchMine.trim()) {
      const q = searchMine.trim().toLowerCase()
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          (r.listingLocation ?? '').toLowerCase().includes(q) ||
          String(r.listingPrice ?? '').includes(q),
      )
    }
    list.sort((a, b) => (sortMine === 'newest' ? (b.id || '').localeCompare(a.id || '') : (a.id || '').localeCompare(b.id || '')))
    return list
  }, [mineRows, searchMine, sortMine])

  const filteredOther = useMemo(() => {
    let list = [...referralListingsForPromote]
    if (searchOther.trim()) {
      const q = searchOther.trim().toLowerCase()
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.listingLocation.toLowerCase().includes(q) ||
          fmtPrice(r.listingPrice).toLowerCase().includes(q),
      )
    }
    if (locFilter !== 'all') list = list.filter((r) => r.listingLocation.toLowerCase().includes(locFilter.toLowerCase()))
    if (typeFilter !== 'all') list = list.filter((r) => r.propertyType === typeFilter)
    list.sort((a, b) => (sortOther === 'newest' ? b.id.localeCompare(a.id) : a.id.localeCompare(b.id)))
    return list
  }, [searchOther, locFilter, typeFilter, sortOther])

  const otherTotalPages = Math.max(1, Math.ceil(filteredOther.length / pageSize))
  const otherSlice = useMemo(() => {
    const start = (otherPage - 1) * pageSize
    return filteredOther.slice(start, start + pageSize)
  }, [filteredOther, otherPage])

  useEffect(() => {
    setOtherPage(1)
  }, [searchOther, locFilter, typeFilter, sortOther])

  useEffect(() => {
    if (otherPage > otherTotalPages) setOtherPage(otherTotalPages)
  }, [otherPage, otherTotalPages])

  const selectedMine = mineRows.find((r) => r.id === selectedMineId) ?? mineRows[0]
  const selectedOther = referralListingsForPromote.find((r) => r.id === selectedOtherId) ?? referralListingsForPromote[0]
  const listing = scope === 'mine' ? selectedMine : selectedOther

  const effectiveBudget =
    step >= 3
      ? budgetPreset === 'custom'
        ? Math.max(5000, Number(customBudget.replace(/\D/g, '')) || 5000)
        : Number(budgetPreset)
      : budgetAmount
  const effectiveDays =
    step >= 3 ? (durationPreset === 'custom' ? 14 : Number(durationPreset)) : durationDays
  const platformFee = Math.round(effectiveBudget * 0.02)
  const totalPay = effectiveBudget + platformFee - (promoApplied ? 0 : 0)

  const planLabel = planId === 'custom' ? 'Custom' : plan.name
  const fmtDate = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const goNext = () => setStep((s) => Math.min(4, s + 1))
  const goPrev = () => setStep((s) => Math.max(1, s - 1))

  useEffect(() => {
    if (step !== 3 || planId === 'custom') return
    const p = PLANS.find((x) => x.id === planId)
    if (p?.price != null) setBudgetPreset(String(p.price))
    if (p?.days != null) setDurationPreset(String(p.days))
  }, [step, planId])

  const renderAside = () => {
    if (step === 1 && scope === 'mine') {
      return (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {listing?.image ? <img src={listing.image} alt="" className="aspect-[16/10] w-full object-cover" /> : null}
            <div className="p-4">
              <p className="text-[13px] font-bold leading-snug text-[#111827]">{listing?.title}</p>
              <p className="mt-1 text-[12px] text-slate-500">{listing?.listingLocation ?? ''}</p>
              <p className="mt-3 text-lg font-bold text-[#6366F1]">{fmtPrice(listing?.listingPrice ?? 0)}</p>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-[13px] font-bold text-[#111827]">Why promote your listing?</h3>
            <ul className="mt-3 space-y-3">
              {[
                { t: 'Visibility', d: 'Reach buyers across search, social, and agent networks.', icon: 'eye' },
                { t: 'Leads', d: 'Turn views into inquiries with stronger placement.', icon: 'users' },
                { t: 'Close deals', d: 'Shorten time-on-market with targeted exposure.', icon: 'clock' },
              ].map((x) => (
                <li key={x.t} className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-50 text-[#6366F1]">
                    {x.icon === 'eye' ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : x.icon === 'users' ? (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 2" strokeLinecap="round" />
                      </svg>
                    )}
                  </span>
                  <div>
                    <p className="text-[12px] font-bold text-slate-800">{x.t}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">{x.d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-violet-100 bg-violet-50/90 p-4">
            <h3 className="text-[13px] font-bold text-violet-950">How it works</h3>
            <ol className="mt-3 space-y-2 text-[12px] leading-relaxed text-violet-950/90">
              {STEP_LABELS.map((l, i) => (
                <li key={l} className="flex gap-2">
                  <span className="font-bold text-[#6366F1]">{i + 1}.</span>
                  {l}
                </li>
              ))}
            </ol>
          </div>
        </>
      )
    }
    if (step === 1 && scope === 'other') {
      return (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-violet-100 text-[#6366F1]">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 11v3a1 1 0 0 0 1 1h3l6 6V4l-6 6H4a1 1 0 0 0-1 1z" />
                </svg>
              </span>
              <div>
                <h3 className="text-[13px] font-bold text-[#111827]">Earn while you promote</h3>
                <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-slate-600">
                  <li className="flex gap-1.5">
                    <span className="text-[#6366F1]">•</span> Choose a listing you want to promote.
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-[#6366F1]">•</span> Run ads and share across your channels.
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-[#6366F1]">•</span> Get leads attributed to you.
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-[#6366F1]">•</span> Earn commission when the deal closes.
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-[13px] font-bold text-[#111827]">Commission rates</h3>
            <ul className="mt-3 space-y-2.5 text-[11px]">
              <li className="flex flex-wrap items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-800">1.0% – 1.5%</span>
                <span className="text-slate-500">Standard</span>
              </li>
              <li className="flex flex-wrap items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#6366F1]" />
                <span className="font-semibold text-slate-800">1.6% – 2.0%</span>
                <span className="text-slate-500">Premium</span>
              </li>
              <li className="flex flex-wrap items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                <span className="font-semibold text-slate-800">2.1% – 3.0%</span>
                <span className="text-slate-500">Featured</span>
              </li>
            </ul>
          </div>
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" strokeLinecap="round" />
              <circle cx="12" cy="12" r="4" />
            </svg>
            <div>
              <p className="text-[12px] font-bold text-amber-950">Note</p>
              <p className="mt-1 text-[11px] leading-relaxed text-amber-950/90">
                You cannot promote your own listings. Promote other agents&apos; listings and earn commission when the deal is closed.
              </p>
            </div>
          </div>
        </>
      )
    }

    const previewCard = (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {listing?.image ? <img src={listing.image} alt="" className="aspect-[16/10] w-full object-cover" /> : null}
        <div className="p-4">
          <p className="text-[13px] font-bold text-[#111827]">{listing?.title}</p>
          <p className="mt-1 text-[12px] text-slate-500">{listing?.listingLocation ?? ''}</p>
          <p className="mt-2 text-lg font-bold text-[#6366F1]">{fmtPrice(listing?.listingPrice ?? 0)}</p>
          {step >= 2 ? (
            <p className="mt-3 border-t border-slate-100 pt-3 text-[12px] text-slate-600">
              <span className="font-semibold text-slate-800">{planLabel}</span>
              <span className="text-slate-400"> · </span>
              {fmtPrice(effectiveBudget)} / {effectiveDays} days
            </p>
          ) : null}
        </div>
      </div>
    )

    const promotionSummary = (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-[13px] font-bold text-[#111827]">Promotion summary</h3>
        <dl className="mt-3 space-y-2 text-[12px]">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Plan</dt>
            <dd className="font-semibold text-slate-800">{planLabel}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Budget</dt>
            <dd className="font-semibold text-slate-800">{fmtPrice(effectiveBudget)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Duration</dt>
            <dd className="font-semibold text-slate-800">{effectiveDays} days</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Start date</dt>
            <dd className="font-semibold text-slate-800">{fmtDate(startDate)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">End date</dt>
            <dd className="font-semibold text-slate-800">{fmtDate(endDate)}</dd>
          </div>
          <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-[13px]">
            <dt className="font-bold text-slate-800">Total</dt>
            <dd className="font-bold text-[#6366F1]">{fmtPrice(step === 4 ? totalPay : effectiveBudget)}</dd>
          </div>
        </dl>
      </div>
    )

    if (step === 2) {
      return (
        <>
          {previewCard}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-[13px] font-bold text-[#111827]">Why promote?</h3>
            <ul className="mt-3 space-y-2 text-[11px] leading-relaxed text-slate-600">
              <li className="flex gap-2">
                <span className="text-[#6366F1]">✓</span> Stronger visibility in search & feeds
              </li>
              <li className="flex gap-2">
                <span className="text-[#6366F1]">✓</span> More qualified leads to your inbox
              </li>
              <li className="flex gap-2">
                <span className="text-[#6366F1]">✓</span> Faster path from viewing to offer
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
            <p className="text-[12px] font-semibold text-slate-700">Need help choosing?</p>
            <button type="button" className="mt-3 w-full rounded-lg border border-slate-200 py-2.5 text-[12px] font-semibold text-[#6366F1] transition hover:bg-slate-50">
              Chat with Support
            </button>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4">
            <p className="text-[12px] font-bold text-emerald-900">Secure payment</p>
            <p className="mt-1 text-[11px] text-emerald-800/90">Your payments are 100% secure.</p>
            <p className="mt-3 text-[10px] font-semibold tracking-wide text-emerald-800/70">VISA · MASTERCARD · VERVE · GTBANK</p>
          </div>
        </>
      )
    }

    if (step === 3) {
      return (
        <>
          {previewCard}
          {promotionSummary}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h3 className="text-[13px] font-bold text-[#111827]">How it works</h3>
            <ul className="mt-3 space-y-2 text-[11px] text-slate-600">
              <li>1. Select your listing and plan.</li>
              <li>2. Set budget and duration.</li>
              <li>3. Review and pay securely.</li>
              <li>4. Track performance in analytics.</li>
            </ul>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/90 p-4">
            <p className="text-[12px] font-semibold text-emerald-900">Questions?</p>
            <button type="button" className="mt-2 w-full rounded-lg bg-white py-2.5 text-[12px] font-semibold text-emerald-800 ring-1 ring-emerald-200">
              Chat with Support
            </button>
          </div>
        </>
      )
    }

    return (
      <>
        {promotionSummary}
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-4">
          <p className="text-[12px] font-bold text-emerald-900">Secure payment</p>
          <p className="mt-1 text-[11px] text-emerald-800/90">Encrypted checkout · PCI compliant</p>
          <p className="mt-3 text-[10px] font-semibold tracking-wide text-emerald-800/70">VISA · MASTERCARD · VERVE · GTBANK</p>
        </div>
        <div className="rounded-xl border border-violet-100 bg-violet-50/90 p-4">
          <p className="text-[12px] font-semibold text-violet-950">Need help?</p>
          <p className="mt-1 text-[11px] leading-relaxed text-violet-900/85">Our support team can walk you through checkout.</p>
          <button type="button" className="mt-3 w-full rounded-lg bg-white py-2.5 text-[12px] font-semibold text-[#6366F1] ring-1 ring-violet-200">
            Chat with Support
          </button>
        </div>
      </>
    )
  }

  const mainStep = () => {
    if (step === 1 && scope === 'mine') {
      return (
        <>
          <h2 className="text-lg font-bold text-[#111827]">Select a listing to promote</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Search</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  value={searchMine}
                  onChange={(e) => setSearchMine(e.target.value)}
                  type="search"
                  placeholder="Search your listings..."
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-[13px] outline-none ring-offset-0 focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Sort</label>
              <select
                value={sortMine}
                onChange={(e) => setSortMine(e.target.value)}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-700 outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/15"
              >
                <option value="newest">Sort by: Newest</option>
                <option value="oldest">Sort by: Oldest</option>
              </select>
            </div>
          </div>
          <div className="mt-5 space-y-2">
            {filteredMine.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-slate-500">No listings match your search.</p>
            ) : (
              filteredMine.map((r) => {
                const sel = selectedMineId === r.id
                return (
                  <label
                    key={r.id}
                    className={`flex cursor-pointer items-center gap-4 rounded-lg border p-3 transition sm:p-4 ${
                      sel ? 'border-[#6366F1] bg-indigo-50/50 ring-1 ring-[#6366F1]/20' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input type="radio" name="m" checked={sel} onChange={() => setSelectedMineId(r.id)} className="h-4 w-4 accent-[#6366F1]" />
                    <img src={r.image} alt="" className="h-14 w-20 shrink-0 rounded-md object-cover ring-1 ring-slate-100" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-bold text-[#111827]">{r.title}</p>
                      <p className="truncate text-[12px] text-slate-500">{r.listingLocation ?? 'Lagos'}</p>
                      <p className="mt-1 text-[13px] font-bold text-[#6366F1]">{fmtPrice(r.listingPrice ?? 0)}</p>
                    </div>
                    <div className="hidden items-center gap-5 sm:flex">
                      <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        {r.views != null ? r.views.toLocaleString('en-NG') : '—'}
                      </span>
                      <span className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-600">
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                        </svg>
                        {r.leads != null ? r.leads : '—'}
                      </span>
                      <StatusPill row={r} />
                    </div>
                    <div className="sm:hidden">
                      <StatusPill row={r} />
                    </div>
                  </label>
                )
              })
            )}
          </div>
          <div className="mt-6 flex justify-end border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={goNext}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#6366F1] px-6 text-[13px] font-semibold text-white shadow-sm transition hover:bg-indigo-600"
            >
              Next <span aria-hidden>→</span>
            </button>
          </div>
        </>
      )
    }

    if (step === 1 && scope === 'other') {
      return (
        <>
          <h2 className="text-lg font-bold text-[#111827]">Find a listing to promote</h2>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
            Choose any active listing on TrustedHome to promote and earn commission when the deal is closed.
          </p>
          <div className="mt-5 space-y-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Search</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  value={searchOther}
                  onChange={(e) => setSearchOther(e.target.value)}
                  type="search"
                  placeholder="Search by location, title, or price..."
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-[13px] outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/15"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { v: locFilter, set: setLocFilter, lab: 'Location', opts: [
                  ['all', 'Location: All'], ['lekki', 'Lekki'], ['ikoyi', 'Ikoyi'], ['lagos', 'Lagos'], ['victoria', 'Victoria'], ['yaba', 'Yaba'], ['ajah', 'Ajah'],
                ] },
                { v: typeFilter, set: setTypeFilter, lab: 'Property type', opts: [
                  ['all', 'Property Type: All'], ['Duplex', 'Duplex'], ['Apartment', 'Apartment'], ['Terrace', 'Terrace'], ['Penthouse', 'Penthouse'], ['Flat', 'Flat'], ['Land', 'Land'], ['Studio', 'Studio'],
                ] },
                { v: sortOther, set: setSortOther, lab: 'Sort', opts: [['newest', 'Sort: Newest'], ['oldest', 'Sort: Oldest']] },
              ].map((field) => (
                <div key={field.lab}>
                  <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">{field.lab}</label>
                  <select
                    value={field.v}
                    onChange={(e) => field.set(e.target.value)}
                    className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/15"
                  >
                    {field.opts.map(([val, lab]) => (
                      <option key={val} value={val}>
                        {lab}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-5 space-y-2">
            {otherSlice.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-slate-500">No listings match your filters.</p>
            ) : (
              otherSlice.map((r) => {
                const sel = selectedOtherId === r.id
                return (
                  <div
                    key={r.id}
                    className={`flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 ${
                      sel ? 'border-[#6366F1] bg-indigo-50/50 ring-1 ring-[#6366F1]/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <input
                        type="radio"
                        name="o"
                        checked={sel}
                        onChange={() => setSelectedOtherId(r.id)}
                        className="mt-1.5 h-4 w-4 accent-[#6366F1]"
                      />
                      <div className="relative shrink-0">
                        <img src={r.image} alt="" className="h-14 w-20 rounded-md object-cover ring-1 ring-slate-100" />
                        {r.featured ? (
                          <span className="absolute -right-1 -top-1 rounded bg-[#6366F1] px-1 py-0.5 text-[7px] font-bold uppercase text-white">Featured</span>
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-bold text-[#111827]">{r.title}</p>
                        <p className="truncate text-[12px] text-slate-500">{r.listingLocation}</p>
                        <p className="mt-1 text-[13px] font-bold text-[#6366F1]">{fmtPrice(r.listingPrice)}</p>
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-500">
                          <span>{r.beds} beds</span>
                          <span>{r.baths} baths</span>
                          <span>{r.sqft.toLocaleString('en-NG')} sqft</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:w-56 sm:flex-col sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                      <div className="flex items-center gap-2">
                        <img src={r.listedByAvatar} alt="" className="h-9 w-9 rounded-full ring-1 ring-slate-200" />
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-slate-400">Listed by</p>
                          <p className="text-[12px] font-semibold text-slate-800">{r.listedByName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-right">
                          <span className="block text-[10px] font-semibold uppercase text-slate-400">Commission</span>
                          <span className="text-lg font-bold text-[#6366F1]">{r.commissionPct}%</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedOtherId(r.id)}
                          className="rounded-lg border-2 border-[#6366F1] bg-white px-3 py-2 text-[11px] font-semibold text-[#6366F1] hover:bg-indigo-50"
                        >
                          Select listing
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <div className="mt-5 flex flex-col items-stretch justify-between gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
            <div className="flex items-center justify-center gap-1 sm:justify-start">
              <button type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-sm" onClick={() => setOtherPage((p) => Math.max(1, p - 1))}>
                &lt;
              </button>
              {Array.from({ length: otherTotalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setOtherPage(p)}
                  className={`min-w-[2rem] rounded-lg py-2 text-[13px] font-semibold ${p === otherPage ? 'bg-[#6366F1] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {p}
                </button>
              ))}
              <button type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 bg-white text-sm" onClick={() => setOtherPage((p) => Math.min(otherTotalPages, p + 1))}>
                &gt;
              </button>
            </div>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#6366F1] px-6 text-[13px] font-semibold text-white shadow-sm hover:bg-indigo-600"
            >
              Next: Choose plan <span aria-hidden>→</span>
            </button>
          </div>
        </>
      )
    }

    if (step === 2) {
      return (
        <>
          <h2 className="text-lg font-bold text-[#111827]">Choose a promotion plan</h2>
          <p className="mt-1 text-[13px] text-slate-500">Select a plan that fits your goals and how aggressively you want to reach buyers.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {PLANS.map((p) => {
              const selected = planId === p.id
              return (
                <div
                  key={p.id}
                  className={`relative flex flex-col rounded-xl border p-4 ${selected && p.featured ? 'border-[#6366F1] ring-2 ring-[#6366F1]/20' : selected ? 'border-[#6366F1]' : 'border-slate-200'} ${p.featured ? 'bg-white shadow-md' : 'bg-white'}`}
                >
                  {p.badge ? (
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-[#6366F1] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      {p.badge}
                    </span>
                  ) : null}
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50">
                    <PlanIcon type={p.icon} className="h-6 w-6" />
                  </div>
                  <p className="text-[15px] font-bold text-[#111827]">{p.name}</p>
                  {p.price != null ? (
                    <p className="mt-1 text-xl font-bold text-[#6366F1]">
                      {fmtPrice(p.price)} <span className="text-[12px] font-semibold text-slate-500">/ {p.days} days</span>
                    </p>
                  ) : (
                    <p className="mt-1 text-[13px] font-semibold text-slate-600">Custom budget & duration</p>
                  )}
                  <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{p.blurb}</p>
                  <ul className="mt-3 flex-1 space-y-1.5 text-[11px] text-slate-600">
                    {p.features.map((f) => (
                      <li key={f} className="flex gap-1.5">
                        <span className="text-[#6366F1]">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => setPlanId(p.id)}
                    className={`mt-4 w-full rounded-lg py-2.5 text-[12px] font-semibold transition ${
                      selected ? 'bg-[#6366F1] text-white shadow-sm hover:bg-indigo-600' : 'border-2 border-slate-200 bg-white text-slate-700 hover:border-[#6366F1] hover:text-[#6366F1]'
                    }`}
                  >
                    {p.cta}
                  </button>
                </div>
              )
            })}
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-violet-100 bg-violet-50/90 p-4">
            <span className="text-[#6366F1]">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6z" />
              </svg>
            </span>
            <div>
              <p className="text-[13px] font-bold text-violet-950">How promotion works</p>
              <p className="mt-1 text-[12px] leading-relaxed text-violet-900/85">
                Your budget fuels impressions and clicks across selected channels. You can pause or extend anytime from your dashboard.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={goPrev} className="h-11 rounded-lg border border-slate-200 px-5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#6366F1] px-5 text-[13px] font-semibold text-white hover:bg-indigo-600"
            >
              Next: Set budget & duration <span aria-hidden>→</span>
            </button>
          </div>
        </>
      )
    }

    if (step === 3) {
      return (
        <>
          <h2 className="text-lg font-bold text-[#111827]">Set budget & duration</h2>
          <p className="mt-1 text-[13px] text-slate-500">Dial in how much you want to spend and how long the promotion should run.</p>
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wide text-slate-500">Budget</p>
              <div className="mt-3 space-y-2">
                {[
                  ['10000', '₦10,000', 'Recommended for 7 days'],
                  ['25000', '₦25,000', 'Recommended for 14 days'],
                  ['50000', '₦50,000', 'Recommended for 30 days'],
                ].map(([val, lab, sub]) => (
                  <label
                    key={val}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${budgetPreset === val ? 'border-[#6366F1] bg-indigo-50/40' : 'border-slate-200'}`}
                  >
                    <input type="radio" name="b" checked={budgetPreset === val} onChange={() => setBudgetPreset(val)} className="mt-0.5 accent-[#6366F1]" />
                    <div>
                      <p className="font-bold text-[#111827]">{lab}</p>
                      <p className="text-[11px] text-slate-500">{sub}</p>
                    </div>
                  </label>
                ))}
                <label className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${budgetPreset === 'custom' ? 'border-[#6366F1] bg-indigo-50/40' : 'border-slate-200'}`}>
                  <input type="radio" name="b" checked={budgetPreset === 'custom'} onChange={() => setBudgetPreset('custom')} className="mt-0.5 accent-[#6366F1]" />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-[#111827]">Custom amount</p>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">₦</span>
                      <input
                        value={customBudget}
                        onChange={(e) => setCustomBudget(e.target.value)}
                        placeholder="Enter amount"
                        className="h-10 w-full rounded-lg border border-slate-200 pl-8 pr-3 text-[13px] outline-none focus:border-[#6366F1]"
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Minimum budget is ₦5,000</p>
                  </div>
                </label>
              </div>
            </div>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wide text-slate-500">Duration</p>
              <div className="mt-3 space-y-2">
                {[
                  ['7', '7 days', 'May 16 – May 22, 2026', null],
                  ['14', '14 days', 'May 16 – May 30, 2026', 'Most popular'],
                  ['30', '30 days', 'May 16 – Jun 14, 2026', 'Best value'],
                ].map(([val, lab, range, tag]) => (
                  <label
                    key={val}
                    className={`relative flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${durationPreset === val ? 'border-[#6366F1] bg-indigo-50/40' : 'border-slate-200'}`}
                  >
                    <input type="radio" name="d" checked={durationPreset === val} onChange={() => setDurationPreset(val)} className="mt-0.5 accent-[#6366F1]" />
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-[#111827]">{lab}</p>
                        {tag ? (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tag === 'Most popular' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`}>{tag}</span>
                        ) : null}
                      </div>
                      <p className="text-[11px] text-slate-500">{range}</p>
                    </div>
                  </label>
                ))}
                <label className={`flex cursor-pointer flex-col gap-2 rounded-lg border p-3 ${durationPreset === 'custom' ? 'border-[#6366F1] bg-indigo-50/40' : 'border-slate-200'}`}>
                  <div className="flex items-start gap-3">
                    <input type="radio" name="d" checked={durationPreset === 'custom'} onChange={() => setDurationPreset('custom')} className="mt-0.5 accent-[#6366F1]" />
                    <p className="font-bold text-[#111827]">Custom date range</p>
                  </div>
                  <div className="ml-7 grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="text-[10px] font-semibold uppercase text-slate-400">Start date</label>
                      <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-2 text-[13px]" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold uppercase text-slate-400">End date</label>
                      <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-2 text-[13px]" />
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
          <div className="mt-8 rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-violet-50 p-5">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#6366F1]" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" strokeLinecap="round" />
                <path d="M7 16V9M12 16V5M17 16v-5" strokeLinecap="round" />
              </svg>
              <p className="text-[14px] font-bold text-indigo-950">Estimated results</p>
            </div>
            <p className="mt-1 text-[12px] text-indigo-900/80">
              Based on your {fmtPrice(effectiveBudget)} budget for {effectiveDays} days (typical campaigns in your market).
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { k: '12K – 18K', l: 'Est. views', i: 'eye' },
                { k: '45 – 70', l: 'Est. leads', i: 'users' },
                { k: '15 – 25', l: 'Est. inquiries', i: 'chat' },
                { k: 'High', l: 'Visibility boost', i: 'meg' },
              ].map((x) => (
                <div key={x.l} className="rounded-lg bg-white/80 p-3 ring-1 ring-indigo-100/80">
                  <p className="text-lg font-bold text-[#6366F1]">{x.k}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-600">{x.l}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-[10px] text-indigo-800/70">Estimates are indicative and vary by listing quality and audience.</p>
          </div>
          <div className="mt-6 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={goPrev} className="h-11 rounded-lg border border-slate-200 px-5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
              Back: Choose plan
            </button>
            <button type="button" onClick={goNext} className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#6366F1] px-5 text-[13px] font-semibold text-white hover:bg-indigo-600">
              Next: Review & pay <span aria-hidden>→</span>
            </button>
          </div>
        </>
      )
    }

    return (
      <>
        <h2 className="text-lg font-bold text-[#111827]">Review & pay</h2>
        <p className="mt-1 text-[13px] text-slate-500">Confirm your promotion details and complete payment.</p>
        <div className="mt-6 rounded-xl border border-slate-200 p-4">
          <p className="text-[12px] font-bold uppercase tracking-wide text-slate-500">Review your promotion</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row">
            {listing?.image ? <img src={listing.image} alt="" className="h-24 w-36 shrink-0 rounded-lg object-cover ring-1 ring-slate-100" /> : null}
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-bold text-[#111827]">{listing?.title}</p>
              <p className="mt-1 text-[12px] text-slate-500">{listing?.listingLocation}</p>
              <p className="mt-2 text-lg font-bold text-[#6366F1]">{fmtPrice(listing?.listingPrice ?? 0)}</p>
            </div>
            <dl className="grid shrink-0 grid-cols-2 gap-x-6 gap-y-2 text-[12px] sm:grid-cols-1">
              <div>
                <dt className="text-slate-500">Plan</dt>
                <dd className="font-semibold">{planLabel}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Budget</dt>
                <dd className="font-semibold">{fmtPrice(effectiveBudget)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Duration</dt>
                <dd className="font-semibold">{effectiveDays} days</dd>
              </div>
              <div>
                <dt className="text-slate-500">Start</dt>
                <dd className="font-semibold">{fmtDate(startDate)}</dd>
              </div>
              <div>
                <dt className="text-slate-500">End</dt>
                <dd className="font-semibold">{fmtDate(endDate)}</dd>
              </div>
            </dl>
          </div>
        </div>
        <div className="mt-6">
          <p className="text-[13px] font-bold text-[#111827]">Payment method</p>
          <p className="text-[12px] text-slate-500">Select how you would like to pay for this promotion.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { id: 'wallet', lab: 'Wallet balance' },
              { id: 'card', lab: 'Card payment' },
              { id: 'bank', lab: 'Bank transfer' },
              { id: 'ussd', lab: 'USSD / Bank' },
            ].map((m) => (
              <label
                key={m.id}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border-2 px-3 py-3 text-left text-[12px] font-semibold ${paymentMethod === m.id ? 'border-[#6366F1] bg-indigo-50/50 text-[#6366F1]' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}
              >
                <input type="radio" name="pay" checked={paymentMethod === m.id} onChange={() => setPaymentMethod(m.id)} className="h-4 w-4 accent-[#6366F1]" />
                {m.lab}
              </label>
            ))}
          </div>
          {paymentMethod === 'wallet' ? (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <svg viewBox="0 0 24 24" className="h-8 w-8 shrink-0 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <path d="M2 10h20" />
              </svg>
              <div>
                <p className="text-[13px] font-bold text-emerald-900">Use wallet balance</p>
                <p className="text-[12px] text-emerald-800">Available balance: {fmtPrice(246800)}</p>
              </div>
            </div>
          ) : null}
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-[12px] font-bold text-[#111827]">Price breakdown</p>
            <ul className="mt-3 space-y-2 text-[13px]">
              <li className="flex justify-between">
                <span className="text-slate-500">Promotion plan</span>
                <span className="font-semibold">{fmtPrice(effectiveBudget)}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Duration</span>
                <span className="font-semibold">{effectiveDays} days</span>
              </li>
              <li className="flex justify-between">
                <span className="text-slate-500">Platform fee</span>
                <span className="font-semibold">{fmtPrice(platformFee)}</span>
              </li>
              <li className="flex justify-between border-t border-slate-100 pt-2 text-[15px] font-bold">
                <span>Total amount</span>
                <span className="text-[#6366F1]">{fmtPrice(totalPay)}</span>
              </li>
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <p className="text-[12px] font-bold text-[#111827]">Promo code</p>
            <div className="mt-2 flex gap-2">
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Enter code"
                className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-[13px] outline-none focus:border-[#6366F1]"
              />
              <button type="button" onClick={() => setPromoApplied(true)} className="rounded-lg bg-slate-100 px-4 text-[12px] font-semibold text-slate-700 hover:bg-slate-200">
                Apply
              </button>
            </div>
            {promoApplied ? <p className="mt-2 text-[12px] font-medium text-emerald-600">Great! You get 0% off. You save ₦0.</p> : null}
          </div>
        </div>
        <p className="mt-4 text-center text-[11px] text-slate-500">
          By continuing you agree to our <span className="font-semibold text-[#6366F1]">Terms of Service</span> and <span className="font-semibold text-[#6366F1]">Promotion Policy</span>.
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5">
          <button type="button" onClick={goPrev} className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-5 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
            <span aria-hidden>←</span> Back
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#6366F1] px-6 text-[13px] font-semibold text-white hover:bg-indigo-600"
          >
            Pay {fmtPrice(totalPay)} & promote <span aria-hidden>→</span>
          </button>
        </div>
      </>
    )
  }

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-[#F9FAFB] text-slate-800">
      <div className="thin-scroll min-h-0 w-full min-w-0 flex-1 overflow-y-auto">
        <div className="w-full min-w-0 px-3 py-3 sm:px-5 sm:py-5 md:px-6 md:py-6 lg:px-8">
          <button type="button" onClick={onClose} className="text-[12px] font-semibold text-slate-500 hover:text-[#6366F1]">
            ← Back to promotions
          </button>

          <div className="mt-3 w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
            <h1 className="text-2xl font-bold tracking-tight text-[#111827] lg:text-[1.75rem]">Promote Listing</h1>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-500">Increase visibility, get more leads, and close deals faster.</p>

            <div className="mt-8 border-b border-slate-200" role="tablist">
              <div className="flex gap-8">
                <button
                  type="button"
                  role="tab"
                  aria-selected={scope === 'mine'}
                  onClick={() => setScope('mine')}
                  className={`flex items-center gap-2 border-b-2 pb-3 text-[14px] font-semibold transition ${scope === 'mine' ? 'border-[#6366F1] text-[#6366F1]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  <IconUser className="h-4 w-4" />
                  Promote My Listings
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={scope === 'other'}
                  onClick={() => setScope('other')}
                  className={`flex items-center gap-2 border-b-2 pb-3 text-[14px] font-semibold transition ${scope === 'other' ? 'border-[#6366F1] text-[#6366F1]' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                  <IconUsers className="h-4 w-4" />
                  Promote Other Listings
                </button>
              </div>
            </div>

            <Stepper step={step} />

            <div className="mt-2 grid w-full min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0">{mainStep()}</div>
              <aside className="min-w-0 space-y-4 lg:space-y-5">{renderAside()}</aside>
            </div>
          </div>

          {scope === 'mine' && step === 1 ? (
            <div className="mt-4 flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-100/90 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-[#6366F1] ring-1 ring-slate-200">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 11v3a1 1 0 0 0 1 1h3l6 6V4l-6 6H4a1 1 0 0 0-1 1z" />
                  </svg>
                </span>
                <div>
                  <p className="text-[14px] font-bold text-slate-900">Promote other listings</p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-slate-600">
                    Earn referral commissions when you promote listings from other agents on TrustedHome.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScope('other')}
                className="shrink-0 rounded-lg border-2 border-[#6366F1] bg-white px-4 py-2.5 text-[12px] font-bold text-[#6366F1] hover:bg-indigo-50"
              >
                Promote other listings →
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
