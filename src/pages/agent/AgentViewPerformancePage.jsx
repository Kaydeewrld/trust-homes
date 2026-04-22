import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { promotionRows } from '../../data/agentPromotionsSeed'

const fmtPrice = (naira) => `₦${Number(naira).toLocaleString('en-NG')}`
const COMPARE = 'Apr 16 - May 15'

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

function TrafficDonutAggregate({ total }) {
  const cx = 100
  const cy = 100
  const ro = 76
  const ri = 50
  const segs = [
    { pct: 0.45, color: '#6D28D9' },
    { pct: 0.25, color: '#8B5CF6' },
    { pct: 0.2, color: '#3B82F6' },
    { pct: 0.1, color: '#A78BFA' },
  ]
  let a = -Math.PI / 2
  const paths = segs.map((s, i) => {
    const sweep = s.pct * Math.PI * 2
    const d = arcSlice(cx, cy, ro, ri, a, a + sweep)
    a += sweep
    return <path key={i} d={d} fill={s.color} stroke="white" strokeWidth="2" />
  })
  const legend = [
    { label: 'Direct', pct: 45, color: '#6D28D9' },
    { label: 'Social Media', pct: 25, color: '#8B5CF6' },
    { label: 'Agent Referrals', pct: 20, color: '#3B82F6' },
    { label: 'Platform Search', pct: 10, color: '#A78BFA' },
  ]
  return (
    <div className="flex flex-col items-stretch gap-2">
      <div className="relative mx-auto shrink-0">
        <svg viewBox="0 0 200 200" className="h-[118px] w-[118px] lg:h-[128px] lg:w-[128px]">
          {paths}
          <text x={cx} y={cy - 2} textAnchor="middle" className="fill-[#111827] text-[13px] font-bold tabular-nums">
            {total.toLocaleString('en-NG')}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" className="fill-slate-500 text-[8px] font-medium">
            Total Views
          </text>
        </svg>
      </div>
      <ul className="min-w-0 space-y-1">
        {legend.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
              <span className="font-medium text-slate-700">{row.label}</span>
            </span>
            <span className="shrink-0 font-bold tabular-nums text-slate-800">{row.pct}%</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="mt-1 w-full rounded-lg border border-violet-200 bg-violet-50/80 py-1.5 text-[11px] font-semibold text-violet-800 transition hover:bg-violet-100"
      >
        View Full Breakdown
      </button>
    </div>
  )
}

function MiniSparkline({ values, color = '#6D28D9' }) {
  const w = 56
  const h = 20
  if (!values?.length) return null
  const max = Math.max(...values, 1)
  const min = Math.min(...values) * 0.9
  const span = max - min || 1
  const n = Math.max(1, values.length - 1)
  const pts = values.map((v, i) => {
    const x = (i / n) * w
    const y = h - ((v - min) / span) * (h - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-5 w-14 shrink-0" preserveAspectRatio="none">
      <path d={`M ${pts.join(' L ')}`} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function buildAggregateViewsSeries() {
  const len = 28
  const peakIdx = 12
  return Array.from({ length: len }, (_, i) => {
    if (i === peakIdx) return 1248
    const wave = 520 + Math.sin(i / 2.8) * 180 + i * 22
    return Math.max(380, Math.round(wave + (i % 4) * 12))
  })
}

function buildAggregateLeadsSeries(viewsSeries) {
  const peakIdx = 12
  return viewsSeries.map((v, i) => {
    if (i === peakIdx) return 14
    return Math.max(3, Math.round((v / 1248) * 14 * 0.95))
  })
}

function PerformanceOverTimeChart({ viewsSeries, leadsSeries }) {
  const w = 480
  const h = 132
  const padL = 8
  const padR = 8
  const padT = 22
  const padB = 20
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const maxV = Math.max(...viewsSeries, ...leadsSeries, 1)
  const n = viewsSeries.length
  const line = (series) => {
    const pts = series.map((v, i) => {
      const x = padL + (i / (n - 1)) * innerW
      const y = padT + innerH - (v / maxV) * innerH
      return [x, y]
    })
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
    return { d, pts }
  }
  const vLine = line(viewsSeries)
  const lLine = line(leadsSeries)
  const peakIdx = 12
  const [hovered, setHovered] = useState(null)
  const active = hovered ?? peakIdx
  const vx = padL + (active / (n - 1)) * innerW
  const tipDate = new Date(2026, 4, 16)
  tipDate.setDate(tipDate.getDate() + active)
  const tipStr = tipDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const tickLabels = ['May 16', 'May 22', 'May 28', 'Jun 3', 'Jun 14']
  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => padL + t * innerW)

  return (
    <div className="relative min-h-0 flex-1">
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
        <h3 className="text-[12px] font-bold text-[#111827]">Performance Over Time</h3>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-medium text-slate-500">Views</span>
          <span className="h-1.5 w-4 rounded-full bg-violet-700" />
          <span className="text-[9px] font-medium text-slate-500">Leads</span>
          <span className="h-1.5 w-4 rounded-full bg-blue-600" />
          <select className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 outline-none focus:border-violet-400">
            <option>Daily</option>
            <option>Weekly</option>
          </select>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[120px] w-full max-h-[120px]" onMouseLeave={() => setHovered(null)}>
        {[0, 0.25, 0.5, 0.75, 1].map((g) => {
          const y = padT + innerH * g
          return <line key={g} x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="#F1F5F9" strokeWidth="1" />
        })}
        <path d={vLine.d} fill="none" stroke="#6D28D9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={lLine.d} fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {viewsSeries.map((_, i) => {
          const x = padL + (i / (n - 1)) * innerW
          return (
            <rect
              key={i}
              x={x - (innerW / n) * 0.45}
              y={padT}
              width={(innerW / n) * 0.9}
              height={innerH}
              fill="transparent"
              className="cursor-crosshair"
              onMouseEnter={() => setHovered(i)}
            />
          )
        })}
        {tickLabels.map((lab, i) => (
          <text
            key={lab}
            x={xTicks[i]}
            y={h - 5}
            textAnchor={i === 0 ? 'start' : i === tickLabels.length - 1 ? 'end' : 'middle'}
            className="fill-slate-400 text-[8px] font-medium"
          >
            {lab}
          </text>
        ))}
      </svg>
      <div
        className="pointer-events-none absolute z-10 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] shadow-md"
        style={{
          left: `${(vx / w) * 100}%`,
          top: '6%',
          transform: 'translate(-50%, 0)',
        }}
      >
        <p className="font-semibold text-slate-800">{tipStr}</p>
        <p className="mt-0.5 text-violet-700">
          <span className="font-bold tabular-nums">{viewsSeries[active]?.toLocaleString('en-NG')}</span> views
        </p>
        <p className="text-blue-600 leading-tight">
          <span className="font-bold tabular-nums">{leadsSeries[active]?.toLocaleString('en-NG')}</span> leads
        </p>
      </div>
    </div>
  )
}

function VerticalFunnel() {
  const steps = [
    { label: 'Views', value: '24,560', sub: null, width: '100%', bg: 'bg-violet-700', text: 'text-white' },
    { label: 'Clicks', value: '2,340', sub: '9.54%', width: '92%', bg: 'bg-blue-600', text: 'text-white' },
    { label: 'Leads', value: '156', sub: '6.67%', width: '84%', bg: 'bg-emerald-500', text: 'text-white' },
    { label: 'Conversions', value: '18', sub: '11.54%', width: '76%', bg: 'bg-orange-500', text: 'text-white' },
  ]
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h3 className="text-[12px] font-bold text-[#111827]">Lead Funnel</h3>
      <div className="mt-2 flex flex-1 flex-col items-center justify-center gap-1">
        {steps.map((s) => (
          <div
            key={s.label}
            style={{ width: s.width }}
            className={`rounded-lg px-2.5 py-1.5 text-center shadow-sm ${s.bg} ${s.text}`}
          >
            <p className="text-[8px] font-semibold uppercase tracking-wide opacity-90">{s.label}</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums leading-none">{s.value}</p>
            {s.sub ? <p className="mt-0.5 text-[9px] font-medium opacity-95">{s.sub}</p> : null}
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-[10px] text-slate-600">
        Overall Conversion Rate: <span className="font-bold text-slate-900">0.07%</span>
      </p>
    </div>
  )
}

function KpiAggregate({ icon, label, value, delta, trendUp, spark }) {
  return (
    <div className="rounded-xl border border-slate-200/95 bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-1">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-700 ring-1 ring-violet-100/80 [&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
        {spark}
      </div>
      <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-base font-bold tabular-nums leading-tight tracking-tight text-[#111827]">{value}</p>
      <p className={`mt-0.5 flex items-center gap-0.5 text-[9px] font-semibold leading-tight ${trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
        {trendUp ? (
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14M5 12l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
        {delta}
      </p>
    </div>
  )
}

function CellTrend({ text, up }) {
  return (
    <span className={`mt-0.5 block text-[9px] font-semibold ${up ? 'text-emerald-600' : 'text-red-600'}`}>
      {up ? '↑' : '↓'} {text}
    </span>
  )
}

const sparkAgg = (base) =>
  Array.from({ length: 14 }, (_, i) => Math.round(base * (0.75 + (i / 13) * 0.28) + (i % 3) * 8))

export default function AgentViewPerformancePage() {
  const navigate = useNavigate()
  const [platform, setPlatform] = useState('all')

  const viewsSeries = useMemo(() => buildAggregateViewsSeries(), [])
  const leadsSeries = useMemo(() => buildAggregateLeadsSeries(viewsSeries), [viewsSeries])

  const tableRows = useMemo(() => {
    const withViews = promotionRows.filter((r) => r.views != null).slice(0, 5)
    const trendCycle = [
      { v: '+12.4%', u: true },
      { v: '-2.1%', u: false },
      { v: '+8.0%', u: true },
      { v: '+5.2%', u: true },
      { v: '-1.3%', u: false },
    ]
    return withViews.map((r, idx) => ({
      ...r,
      uniqueViews: r.uniqueViews ?? Math.round((r.views ?? 0) * 0.744),
      saves: r.saves ?? Math.round((r.views ?? 0) * 0.022),
      conversions: Math.max(1, Math.round((r.leads ?? 0) * 0.115)),
      trends: {
        views: trendCycle[idx % 5],
        unique: trendCycle[(idx + 1) % 5],
        leads: trendCycle[(idx + 2) % 5],
        ctr: trendCycle[(idx + 3) % 5],
        saves: trendCycle[(idx + 4) % 5],
        conv: trendCycle[(idx + 2) % 5],
      },
    }))
  }, [])

  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 pb-4 pt-2 sm:px-4 lg:px-5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-bold leading-tight tracking-tight text-[#111827] sm:text-xl lg:text-2xl">View Performance Analytics</h1>
          <p className="mt-0.5 max-w-3xl text-[11px] leading-snug text-slate-500 sm:text-xs">
            Track the performance of all your listings and understand what&apos;s driving results.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
              </svg>
            </span>
            <select className="h-9 appearance-none rounded-lg border border-slate-200 bg-white py-1 pl-9 pr-6 text-[11px] font-semibold text-slate-800 shadow-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-500/15">
              <option>May 16 – Jun 14, 2026</option>
              <option>Apr 16 – May 15, 2026</option>
            </select>
          </div>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-800 shadow-sm outline-none focus:border-violet-400"
          >
            <option value="all">All Platforms</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="google">Google</option>
          </select>
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-violet-600 bg-white px-3 text-[11px] font-semibold text-violet-700 shadow-sm transition hover:bg-violet-50"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 15V3M8 11l4 4 4-4M5 19h14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export Report
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-5">
        <KpiAggregate
          label="Total Views"
          value="24,560"
          delta={`+18.6% vs ${COMPARE}`}
          trendUp
          spark={<MiniSparkline values={sparkAgg(24560)} />}
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" />
              <circle cx="12" cy="12" r="3" strokeLinecap="round" />
            </svg>
          }
        />
        <KpiAggregate
          label="Unique Views"
          value="18,265"
          delta={`+12.4% vs ${COMPARE}`}
          trendUp
          spark={<MiniSparkline values={sparkAgg(18265)} />}
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
        />
        <KpiAggregate
          label="Total Leads"
          value="156"
          delta={`+12.4% vs ${COMPARE}`}
          trendUp
          spark={<MiniSparkline values={sparkAgg(156)} color="#2563EB" />}
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          }
        />
        <KpiAggregate
          label="Avg. CTR"
          value="7.48%"
          delta={`+2.1% vs ${COMPARE}`}
          trendUp
          spark={<MiniSparkline values={[6.2, 6.4, 6.8, 7.0, 7.1, 7.48, 7.2, 7.4, 7.48]} />}
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l7 7M11 11l9-9M15 4h6v6M9 20H3v-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <KpiAggregate
          label="Total Saves"
          value="432"
          delta={`+9.8% vs ${COMPARE}`}
          trendUp
          spark={<MiniSparkline values={sparkAgg(432)} color="#0D9488" />}
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
      </div>

      <div className="mt-3 grid gap-2 xl:grid-cols-[1.35fr_0.78fr_0.68fr] xl:items-stretch">
        <div className="flex min-h-0 flex-col rounded-xl border border-slate-200/95 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <PerformanceOverTimeChart viewsSeries={viewsSeries} leadsSeries={leadsSeries} />
        </div>
        <div className="flex flex-col rounded-xl border border-slate-200/95 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <h3 className="mb-1 text-[12px] font-bold text-[#111827]">Traffic Sources</h3>
          <TrafficDonutAggregate total={24560} />
        </div>
        <div className="flex flex-col rounded-xl border border-slate-200/95 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <VerticalFunnel />
        </div>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1.65fr)_252px] lg:items-start">
        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-200/95 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
            <div className="min-w-0">
              <h3 className="text-[12px] font-bold text-[#111827]">Top Performing Listings</h3>
              <p className="text-[10px] text-slate-500">Ranked by engagement for the selected period.</p>
            </div>
            <select className="h-8 shrink-0 rounded-lg border border-slate-200 bg-white px-2 text-[10px] font-semibold text-slate-700 shadow-sm outline-none focus:border-violet-400">
              <option>View All Listings</option>
              <option>Top 10 by views</option>
              <option>Top 10 by leads</option>
            </select>
          </div>
          <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[680px] border-collapse text-left text-[11px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/90">
                  {['Listing', 'Views', 'Unique Views', 'Leads', 'CTR', 'Saves', 'Conversions', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className={`whitespace-nowrap px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500 ${
                        h === 'Actions' ? 'text-right' : ''
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-2 py-1.5 align-middle">
                      <div className="flex items-center gap-2">
                        <img src={r.image} alt="" className="h-9 w-12 shrink-0 rounded-md object-cover ring-1 ring-slate-100" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-[#111827]">{r.title}</p>
                          <p className="truncate text-[10px] text-slate-500">{r.listingLocation ?? 'Lagos'}</p>
                          <p className="mt-0.5 text-[10px] font-bold tabular-nums text-slate-800">{fmtPrice(r.listingPrice ?? 0)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 align-top tabular-nums font-semibold text-slate-800">
                      {(r.views ?? 0).toLocaleString('en-NG')}
                      <CellTrend text={r.trends.views.v} up={r.trends.views.u} />
                    </td>
                    <td className="px-2 py-1.5 align-top tabular-nums font-semibold text-slate-800">
                      {r.uniqueViews.toLocaleString('en-NG')}
                      <CellTrend text={r.trends.unique.v} up={r.trends.unique.u} />
                    </td>
                    <td className="px-2 py-1.5 align-top tabular-nums font-semibold text-slate-800">
                      {(r.leads ?? 0).toLocaleString('en-NG')}
                      <CellTrend text={r.trends.leads.v} up={r.trends.leads.u} />
                    </td>
                    <td className="px-2 py-1.5 align-top font-semibold text-slate-800">
                      {r.ctr != null ? `${r.ctr}%` : '—'}
                      <CellTrend text={r.trends.ctr.v} up={r.trends.ctr.u} />
                    </td>
                    <td className="px-2 py-1.5 align-top tabular-nums font-semibold text-slate-800">
                      {r.saves.toLocaleString('en-NG')}
                      <CellTrend text={r.trends.saves.v} up={r.trends.saves.u} />
                    </td>
                    <td className="px-2 py-1.5 align-top tabular-nums font-semibold text-slate-800">
                      {r.conversions}
                      <CellTrend text={r.trends.conv.v} up={r.trends.conv.u} />
                    </td>
                    <td className="px-2 py-1.5 align-middle text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/agent/promotions/performance/${r.id}`)}
                          className="text-[10px] font-semibold text-violet-700 hover:text-violet-800"
                        >
                          View Analytics
                        </button>
                        <button
                          type="button"
                          className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                          aria-label="More"
                        >
                          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                            <circle cx="12" cy="6" r="1.5" />
                            <circle cx="12" cy="12" r="1.5" />
                            <circle cx="12" cy="18" r="1.5" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <div>
            <h3 className="text-[12px] font-bold text-[#111827]">Engagement Overview</h3>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {[
                { label: 'Avg. Time on Listing', value: '2m 34s', delta: '+15%', up: true, icon: 'clock' },
                { label: 'Contact Clicks', value: '98', delta: '+12%', up: true, icon: 'phone' },
                { label: 'Save Rate', value: '3.2%', delta: '+8%', up: true, icon: 'bookmark' },
                { label: 'Scroll Depth', value: '68%', delta: '+6%', up: true, icon: 'scroll' },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-slate-200/95 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                  <div className="flex items-start justify-between gap-1">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-violet-50 text-violet-700">
                      {m.icon === 'clock' ? (
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 2" strokeLinecap="round" />
                        </svg>
                      ) : m.icon === 'phone' ? (
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 4h3l2 5-2 1.5a14 14 0 0 0 5.5 5.5L15 14l5 2v3a2 2 0 0 1-2 2h-1C10.4 21 3 13.6 3 7V6a2 2 0 0 1 2-2z" strokeLinecap="round" />
                        </svg>
                      ) : m.icon === 'bookmark' ? (
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M4 6h16M4 12h10M4 18h6" strokeLinecap="round" />
                        </svg>
                      )}
                    </span>
                    <span className="flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600">
                      <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {m.delta}
                    </span>
                  </div>
                  <p className="mt-1 text-[8px] font-semibold uppercase leading-tight tracking-wide text-slate-500">{m.label}</p>
                  <p className="mt-0.5 text-sm font-bold tabular-nums leading-none text-[#111827]">{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-violet-100/90 bg-gradient-to-br from-violet-50 via-white to-indigo-50/80 p-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <h3 className="text-[12px] font-bold text-violet-950">Insights &amp; Recommendations</h3>
            <ul className="mt-2 space-y-1.5 text-[10px] leading-snug text-violet-950/90">
              <li className="flex gap-1.5">
                <span className="mt-0.5 shrink-0 text-violet-600">✦</span>
                <span>Listings with 5+ images get 2× more leads — add another photo of your best room.</span>
              </li>
              <li className="flex gap-1.5">
                <span className="mt-0.5 shrink-0 text-violet-600">✦</span>
                <span>Your CTR peaks mid-week; schedule boosts on Tuesday–Thursday for better ROI.</span>
              </li>
              <li className="flex gap-1.5">
                <span className="mt-0.5 shrink-0 text-violet-600">✦</span>
                <span>Agent referral traffic is outperforming search — share your link in client follow-ups.</span>
              </li>
            </ul>
            <Link
              to="/agent/analytics"
              className="mt-2 inline-flex items-center gap-1 text-[10px] font-semibold text-violet-700 hover:text-violet-900"
            >
              View Full Report
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
