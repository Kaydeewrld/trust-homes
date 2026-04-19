import { useCallback, useEffect, useMemo, useState } from 'react'

const fmtPrice = (naira) => `₦${Number(naira).toLocaleString('en-NG')}`

function arcSlice(cx, cy, rOuter, rInner, angleStart, angleEnd) {
  const largeArc = angleEnd - angleStart > Math.PI ? 1 : 0
  const xo1 = cx + rOuter * Math.cos(angleStart)
  const yo1 = cy + rOuter * Math.sin(angleStart)
  const xo2 = cx + rOuter * Math.cos(angleEnd)
  const yo2 = cy + rOuter * Math.sin(angleEnd)
  const xi2 = cx + rInner * Math.cos(angleEnd)
  const yi2 = cy + rInner * Math.sin(angleEnd)
  const xi1 = cx + rInner * Math.cos(angleStart)
  const yi1 = cy + rInner * Math.sin(angleStart)
  return `M ${xo1} ${yo1} A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${xo2} ${yo2} L ${xi2} ${yi2} A ${rInner} ${rInner} 0 ${largeArc} 0 ${xi1} ${yi1} Z`
}

function TrafficDonut({ total }) {
  const cx = 100
  const cy = 100
  const ro = 72
  const ri = 46
  const segs = [
    { pct: 0.45, color: '#3B82F6' },
    { pct: 0.25, color: '#6366F1' },
    { pct: 0.2, color: '#22C55E' },
    { pct: 0.1, color: '#F97316' },
  ]
  let a = -Math.PI / 2
  const paths = segs.map((s, i) => {
    const sweep = s.pct * Math.PI * 2
    const d = arcSlice(cx, cy, ro, ri, a, a + sweep)
    a += sweep
    return <path key={i} d={d} fill={s.color} stroke="white" strokeWidth="1" />
  })
  const c1 = Math.round(total * 0.45)
  const c2 = Math.round(total * 0.25)
  const c3 = Math.round(total * 0.2)
  const c4 = Math.max(0, total - c1 - c2 - c3)
  const legend = [
    { label: 'Direct', pct: 45, count: c1, color: '#3B82F6' },
    { label: 'Social Media', pct: 25, count: c2, color: '#6366F1' },
    { label: 'Search Engines', pct: 20, count: c3, color: '#22C55E' },
    { label: 'Referrals', pct: 10, count: c4, color: '#F97316' },
  ]
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
      <svg viewBox="0 0 200 200" className="h-44 w-44 shrink-0">
        {paths}
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" className="fill-slate-800 text-[11px] font-bold">
          {total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="middle" className="fill-slate-500 text-[9px] font-medium">
          visits
        </text>
      </svg>
      <ul className="w-full min-w-0 space-y-2.5 sm:w-auto">
        {legend.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-4 text-[12px]">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
              <span className="font-medium text-slate-700">{row.label}</span>
            </span>
            <span className="shrink-0 tabular-nums text-slate-600">
              <span className="font-semibold text-slate-800">{row.pct}%</span>
              <span className="text-slate-400"> ({row.count})</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ViewsLineChart({ series, peakIndex, dateLabels }) {
  const w = 360
  const h = 120
  const padL = 8
  const padR = 8
  const padT = 16
  const padB = 28
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const maxV = Math.max(...series, 1)
  const minV = Math.min(...series) * 0.85
  const span = maxV - minV || 1
  const n = series.length
  const points = series.map((v, i) => {
    const x = padL + (i / (n - 1)) * innerW
    const y = padT + innerH - ((v - minV) / span) * innerH
    return [x, y]
  })
  const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const labels = ['Apr 18', 'Apr 25', 'May 2', 'May 9', 'May 15', 'May 18']
  const labelXs = [0, 0.2, 0.4, 0.6, 0.8, 1].map((t) => padL + t * innerW)

  const [hovered, setHovered] = useState(null)
  const active = Math.min(Math.max(0, hovered ?? peakIndex), points.length - 1)
  const ap = points[active]
  const dateLine = dateLabels?.[active] ?? 'May 8, 2026'

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full max-h-[200px]" onMouseLeave={() => setHovered(null)}>
        <defs>
          <linearGradient id="perfLineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`${d} L ${points[points.length - 1][0]} ${padT + innerH} L ${points[0][0]} ${padT + innerH} Z`}
          fill="url(#perfLineGrad)"
        />
        <path d={d} fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r={active === i ? 6 : 4}
            fill={active === i ? '#6366F1' : '#fff'}
            stroke="#6366F1"
            strokeWidth="2"
            className="cursor-pointer"
            onMouseEnter={() => setHovered(i)}
          />
        ))}
        {labels.map((lab, i) => (
          <text
            key={lab}
            x={labelXs[i]}
            y={h - 6}
            textAnchor={i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}
            className="fill-slate-400 text-[9px] font-medium"
          >
            {lab}
          </text>
        ))}
      </svg>
      {ap ? (
        <div
          className="pointer-events-none absolute z-10 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium shadow-md"
          style={{
            left: `calc(${(ap[0] / w) * 100}% + 0px)`,
            top: `${(ap[1] / h) * 100}%`,
            transform: 'translate(-50%, calc(-100% - 12px))',
          }}
        >
          <span className="block whitespace-nowrap text-slate-500">{dateLine}</span>
          <span className="block whitespace-nowrap text-slate-800">
            Views: <span className="font-bold">{series[active]}</span>
          </span>
        </div>
      ) : null}
    </div>
  )
}

function MetricCard({ icon, iconWrap, label, value, delta }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className={`mb-2 grid h-9 w-9 place-items-center rounded-lg ${iconWrap}`}>{icon}</div>
      <p className="text-[11px] font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-[#111827]">{value}</p>
      <p className="mt-1 flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600">
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {delta}
      </p>
    </div>
  )
}

function buildSeries(views) {
  const base = Math.max(40, Math.min(views, 320))
  const seed = [0.55, 0.62, 0.58, 0.7, 0.68, 0.75, 0.82, 0.78, 0.85, 0.88, 0.9, 0.86, 0.92, 0.95, 0.91, 0.88, 0.94, 0.97, 0.93, 0.99, 1, 0.96, 0.94, 0.98, 0.92, 0.9, 0.88, 0.85, 0.82, 0.8, 0.78]
  return seed.map((m) => Math.round(base * m * (0.85 + (m % 0.07))))
}

function buildDateLabels() {
  const start = new Date(2026, 3, 18)
  const out = []
  for (let i = 0; i < 31; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    out.push(
      d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    )
  }
  return out
}

export default function AgentListingPerformanceModal({ listing, open, onClose }) {
  const [timeframe, setTimeframe] = useState('30')
  const [metric, setMetric] = useState('views')
  const [copied, setCopied] = useState(false)

  const series = useMemo(() => (listing ? buildSeries(listing.views) : []), [listing])
  const dateLabels = useMemo(() => buildDateLabels(), [])
  const peakIndex = useMemo(() => {
    let maxI = 0
    let maxV = -1
    series.forEach((v, i) => {
      if (v > maxV) {
        maxV = v
        maxI = i
      }
    })
    return maxI
  }, [series])

  const metrics = useMemo(() => {
    if (!listing) return null
    const v = listing.views
    const unique = Math.max(1, Math.round(v * (156 / 234)))
    const inq = Math.max(1, Math.round(listing.leads * 2))
    const leads = listing.leads
    const ctr = v > 0 ? ((leads / v) * 100).toFixed(1) : '0.0'
    return {
      views: v,
      unique,
      inquiries: inq,
      leads,
      ctr,
      deltas: ['15.6%', '12.4%', '28.6%', '12.5%', '9.3%'],
    }
  }, [listing])

  const donutTotal = useMemo(() => {
    if (!listing) return 234
    return Math.max(120, Math.round(listing.views * 1.05))
  }, [listing])

  const highlights = useMemo(() => {
    const v = listing?.views ?? 200
    const s = Math.max(1, v / 234)
    return [
      { label: 'Property Photos', views: Math.round(124 * s), icon: 'image', color: 'text-indigo-600 bg-indigo-50' },
      { label: 'Location', views: Math.round(98 * s), icon: 'pin', color: 'text-sky-600 bg-sky-50' },
      { label: 'Price', views: Math.round(76 * s), icon: 'tag', color: 'text-indigo-600 bg-indigo-50' },
      { label: 'Amenities', views: Math.round(65 * s), icon: 'spark', color: 'text-indigo-600 bg-indigo-50' },
    ]
  }, [listing])

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

  if (!open || !listing || !metrics) return null

  const isRent = (listing.purpose || '').toLowerCase().includes('rent')

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-3 sm:p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="perf-modal-title"
        className="relative flex max-h-[min(94vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15"
      >
        <div className="shrink-0 border-b border-slate-100 px-5 pb-4 pt-5 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 pr-2">
              <h2 id="perf-modal-title" className="text-lg font-bold tracking-tight text-[#111827] sm:text-xl">
                Listing Performance
              </h2>
              <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-slate-500">
                Track how your listing is performing and engaging with potential buyers.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center self-end rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 sm:self-start"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 gap-3">
              <img src={listing.image} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover ring-1 ring-slate-200/80 sm:h-[72px] sm:w-[88px]" />
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
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                  <span className="inline-flex items-center gap-1 font-medium">
                    ID: <span className="font-semibold text-slate-700">{listing.id}</span>
                    <button
                      type="button"
                      onClick={copyId}
                      className="rounded p-0.5 text-indigo-600 hover:bg-indigo-50"
                      aria-label="Copy listing ID"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    {copied ? <span className="text-emerald-600">Copied</span> : null}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span>Listed on {listing.dateAdded}</span>
                </div>
              </div>
            </div>
            <div className="shrink-0 sm:pl-2">
              <label htmlFor="perf-timeframe" className="sr-only">
                Time period
              </label>
              <select
                id="perf-timeframe"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="h-10 w-full min-w-[140px] rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15 sm:w-auto"
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>

        <div className="thin-scroll flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3">
            <MetricCard
              label="Views"
              value={metrics.views}
              delta={`${metrics.deltas[0]} vs last 30 days`}
              iconWrap="bg-indigo-50 text-indigo-600"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="3" strokeLinecap="round" />
                </svg>
              }
            />
            <MetricCard
              label="Unique Views"
              value={metrics.unique}
              delta={`${metrics.deltas[1]} vs last 30 days`}
              iconWrap="bg-sky-50 text-sky-600"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              }
            />
            <MetricCard
              label="Inquiries"
              value={metrics.inquiries}
              delta={`${metrics.deltas[2]} vs last 30 days`}
              iconWrap="bg-emerald-50 text-emerald-600"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinejoin="round" />
                </svg>
              }
            />
            <MetricCard
              label="Leads"
              value={metrics.leads}
              delta={`${metrics.deltas[3]} vs last 30 days`}
              iconWrap="bg-orange-50 text-orange-600"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v18h18" strokeLinecap="round" />
                  <path d="M7 16V9M12 16V5M17 16v-5" strokeLinecap="round" />
                </svg>
              }
            />
            <MetricCard
              label="Click Through Rate"
              value={`${metrics.ctr}%`}
              delta={`${metrics.deltas[4]} vs last 30 days`}
              iconWrap="bg-indigo-50 text-indigo-600"
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4l7 7M11 11l9-9M15 4h6v6M9 20H3v-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[13px] font-bold text-[#111827]">Views Over Time</h3>
                <select
                  value={metric}
                  onChange={(e) => setMetric(e.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-slate-50/80 px-2 text-[11px] font-semibold text-slate-700 outline-none focus:border-indigo-400"
                >
                  <option value="views">Views</option>
                  <option value="unique">Unique Views</option>
                </select>
              </div>
              <ViewsLineChart series={series} peakIndex={peakIndex} dateLabels={dateLabels} />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h3 className="mb-4 text-[13px] font-bold text-[#111827]">Traffic Sources</h3>
              <TrafficDonut total={donutTotal} />
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <h3 className="text-[13px] font-bold text-[#111827]">Top Performing Highlights</h3>
            <p className="mt-0.5 text-[12px] text-slate-500">These highlights are getting the most attention.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {highlights.map((h) => (
                <div
                  key={h.label}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1.5 pl-2 pr-3 text-[12px] shadow-sm"
                >
                  <span className={`grid h-7 w-7 place-items-center rounded-full ${h.color}`}>
                    {h.icon === 'image' ? (
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" strokeLinecap="round" />
                      </svg>
                    ) : h.icon === 'pin' ? (
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    ) : h.icon === 'tag' ? (
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l6.59-6.59a1 1 0 0 0 0-1.41L12 2Z" />
                        <path d="M7 7h.01" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" strokeLinejoin="round" />
                      </svg>
                    )}
                  </span>
                  <span className="font-semibold text-slate-800">{h.label}</span>
                  <span className="text-slate-500">{h.views} views</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
