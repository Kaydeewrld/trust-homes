import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { promotionRows } from '../../data/agentPromotionsSeed'

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

function TrafficDonutMock({ total }) {
  const cx = 100
  const cy = 100
  const ro = 78
  const ri = 52
  const segs = [
    { pct: 0.45, color: '#6366F1' },
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
    { label: 'Direct', pct: 45, color: '#6366F1' },
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
    </div>
  )
}

function buildSeries(views) {
  const base = Math.max(40, Math.min(views, 420))
  const seed = [0.55, 0.62, 0.58, 0.7, 0.68, 0.75, 0.82, 0.78, 0.85, 0.88, 0.9, 0.86, 0.92, 0.95, 0.91, 0.88, 0.94, 0.97, 0.93, 0.99, 1, 0.96, 0.94, 0.98, 0.92, 0.9, 0.88, 0.85, 0.82, 0.8]
  return seed.map((m) => Math.round(base * m * (0.85 + (m % 0.07))))
}

function buildLeadsSeries(viewsSeries, leads) {
  const peak = Math.max(...viewsSeries, 1)
  return viewsSeries.map((v) => Math.max(2, Math.round((v / peak) * leads * 1.15)))
}

function MiniSparkline({ values, color = '#6366F1' }) {
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
  const d = `M ${pts.join(' L ')}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-5 w-14 shrink-0" preserveAspectRatio="none">
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ViewsLeadsChart({ viewsSeries, leadsSeries, dateLabels }) {
  const w = 480
  const h = 132
  const padL = 8
  const padR = 8
  const padT = 22
  const padB = 20
  const innerW = w - padL - padR
  const innerH = h - padT - padB
  const maxV = Math.max(...viewsSeries, ...leadsSeries, 1)
  const minV = 0
  const span = maxV - minV || 1
  const n = viewsSeries.length

  const line = (series, color) => {
    const pts = series.map((v, i) => {
      const x = padL + (i / (n - 1)) * innerW
      const y = padT + innerH - ((v - minV) / span) * innerH
      return [x, y]
    })
    const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
    return { d, pts }
  }

  const vLine = line(viewsSeries, '#7C3AED')
  const lLine = line(leadsSeries, '#2563EB')

  const peakIdx = viewsSeries.reduce((best, v, i) => (v > viewsSeries[best] ? i : best), 0)
  const [hovered, setHovered] = useState(null)
  const active = hovered ?? peakIdx
  const vx = padL + (active / (n - 1)) * innerW
  const tooltipDate = dateLabels[active] ?? 'May 28, 2026'
  const tv = viewsSeries[active]
  const tl = leadsSeries[active]

  const xTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => padL + t * innerW)
  const tickLabels = ['May 16', 'May 22', 'May 28', 'Jun 3', 'Jun 14']

  return (
    <div className="relative min-h-0 flex-1">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-[120px] w-full max-h-[120px]"
        onMouseLeave={() => setHovered(null)}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((g) => {
          const y = padT + innerH * g
          return <line key={g} x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="#F1F5F9" strokeWidth="1" />
        })}
        <path d={vLine.d} fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
        <p className="font-semibold text-slate-800">{tooltipDate}</p>
        <p className="mt-0.5 text-violet-700">
          <span className="font-bold tabular-nums">{tv.toLocaleString('en-NG')}</span> views
        </p>
        <p className="text-blue-600 leading-tight">
          <span className="font-bold tabular-nums">{tl.toLocaleString('en-NG')}</span> leads
        </p>
      </div>
    </div>
  )
}

function KpiCard({ icon, title, value, pctLabel, spark }) {
  return (
    <div className="rounded-xl border border-slate-200/95 bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-1">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-700 ring-1 ring-violet-100/80 [&>svg]:h-3.5 [&>svg]:w-3.5">
          {icon}
        </span>
        {spark}
      </div>
      <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-0.5 text-base font-bold tabular-nums leading-tight tracking-tight text-[#111827]">{value}</p>
      <p className="mt-0.5 flex items-center gap-0.5 text-[9px] font-semibold text-emerald-600">
        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {pctLabel}
      </p>
    </div>
  )
}

function FunnelStep({ label, value, subPct, isLast }) {
  return (
    <>
      <div className="min-w-0 flex-1 rounded-lg border border-slate-200/90 bg-slate-50/90 px-2 py-1.5 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
        <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-0.5 text-sm font-bold tabular-nums leading-none text-[#111827]">
          {typeof value === 'number' ? value.toLocaleString('en-NG') : value}
        </p>
        {subPct != null ? <p className="mt-0.5 text-[9px] font-medium text-slate-500">{subPct}</p> : null}
      </div>
      {!isLast ? (
        <div className="flex shrink-0 items-center px-0.5 text-slate-300">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      ) : null}
    </>
  )
}

const statusStyles = {
  active: { dot: 'bg-emerald-500', text: 'text-emerald-800', label: 'Active' },
  scheduled: { dot: 'bg-indigo-500', text: 'text-indigo-800', label: 'Scheduled' },
  ended: { dot: 'bg-slate-400', text: 'text-slate-600', label: 'Ended' },
  draft: { dot: 'bg-slate-400', text: 'text-slate-600', label: 'Draft' },
}

export default function AgentPromotionPerformancePage() {
  const { promotionId } = useParams()
  const navigate = useNavigate()
  const dateRange = 'May 16 – Jun 14, 2026'
  const [granularity, setGranularity] = useState('daily')

  const row = useMemo(() => promotionRows.find((r) => r.id === promotionId), [promotionId])

  const metrics = useMemo(() => {
    if (!row || row.views == null) return null
    const views = row.views
    const unique = row.uniqueViews ?? Math.round(views * 0.76)
    const leads = row.leads ?? 0
    const ctr = row.ctr ?? (views > 0 ? Number(((leads / views) * 100).toFixed(2)) : 0)
    const saves = row.saves ?? Math.round(views * 0.023)
    const clicks = Math.max(leads + 40, Math.round(views * 0.1302))
    const conversions = Math.max(1, Math.round(leads * 0.125))
    const clickRate = views > 0 ? ((clicks / views) * 100).toFixed(2) : '0'
    const leadRate = clicks > 0 ? ((leads / clicks) * 100).toFixed(2) : '0'
    const convRate = leads > 0 ? ((conversions / leads) * 100).toFixed(2) : '0'
    const leadToConversionRate = leads > 0 ? ((conversions / leads) * 100).toFixed(2) : '0'
    const deltas = ['+18%', '+12%', '+8%', '+2%', '+5%']
    const seed = row.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    const tweak = (i) => {
      const opts = ['+15%', '+18%', '+12%', '+20%', '+8%', '+10%', '+5%', '+3%', '+2%']
      return opts[(seed + i) % opts.length]
    }
    return {
      views,
      unique,
      leads,
      ctr,
      saves,
      clicks,
      conversions,
      clickRate,
      leadRate,
      convRate,
      leadToConversionRate,
      deltas: deltas.map((_, i) => tweak(i)),
    }
  }, [row])

  const viewsSeries = useMemo(() => (row?.views ? buildSeries(row.views) : []), [row])
  const leadsSeries = useMemo(() => {
    if (!row?.views || !metrics) return []
    return buildLeadsSeries(viewsSeries, metrics.leads)
  }, [row, metrics, viewsSeries])

  const dateLabels = useMemo(() => {
    const start = new Date(2026, 4, 16)
    const out = []
    for (let i = 0; i < viewsSeries.length; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      out.push(
        d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      )
    }
    return out
  }, [viewsSeries.length])

  const sparkViews = useMemo(() => viewsSeries.slice(-12), [viewsSeries])
  const sparkUnique = useMemo(() => viewsSeries.map((v) => Math.round(v * 0.78)).slice(-12), [viewsSeries])
  const sparkLeads = useMemo(() => leadsSeries.slice(-12), [leadsSeries])
  const sparkCtr = useMemo(() => viewsSeries.map((_, i) => 5 + (i % 5) * 0.4 + Math.sin(i) * 0.3).slice(-12), [viewsSeries])
  const sparkSaves = useMemo(() => viewsSeries.map((v) => Math.round(v * 0.022)).slice(-12), [viewsSeries])

  const topElements = useMemo(() => {
    const s = row?.views ? Math.max(0.85, row.views / 2458) : 1
    return [
      { label: 'Photos', count: Math.round(120 * s), icon: 'img' },
      { label: 'Location', count: Math.round(98 * s), icon: 'pin' },
      { label: 'Price', count: Math.round(76 * s), icon: 'tag' },
      { label: 'Features', count: Math.round(65 * s), icon: 'spark' },
    ]
  }, [row])

  if (!row) {
    return <Navigate to="/agent/promotions" replace />
  }

  if (!metrics) {
    return (
      <div className="flex min-h-[min(520px,70vh)] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <p className="text-[15px] font-semibold text-slate-800">No performance data yet</p>
        <p className="max-w-sm text-[13px] text-slate-500">Analytics will appear once this promotion is live and receiving traffic.</p>
        <Link to="/agent/promotions" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-[13px] font-semibold text-white">
          Back to Promote Listings
        </Link>
      </div>
    )
  }

  const st = statusStyles[row.status] || statusStyles.draft
  const listingLocation = row.listingLocation ?? 'Lagos, Nigeria'
  const listingPrice = row.listingPrice ?? 0
  const listedOn = row.listedOn ?? row.duration ?? '—'
  const listingType = row.listingType ?? 'Property'
  const beds = row.beds ?? '—'
  const baths = row.baths ?? '—'

  return (
    <div className="mx-auto w-full max-w-[1600px] px-3 pb-4 pt-2 text-slate-800 sm:px-4 lg:px-5">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-slate-500 sm:text-[11px]">
            <Link to="/agent/view-performance" className="font-semibold text-violet-700 hover:text-violet-800">
              View Performance
            </Link>
            <span className="text-slate-300" aria-hidden>
              /
            </span>
            <span className="truncate text-slate-600">{row.title}</span>
          </div>
          <Link
            to="/agent/promotions"
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 transition hover:text-violet-700"
          >
            <span aria-hidden>‹</span> Back to Promote Listings
          </Link>
          <h1 className="mt-1.5 text-lg font-bold leading-tight tracking-tight text-[#111827] sm:text-xl lg:text-2xl">Listing performance</h1>
          <p className="mt-0.5 max-w-3xl text-[11px] leading-snug text-slate-500 sm:text-xs">
            Track how your listing is performing and get insights to generate more leads.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
          <label htmlFor="perf-date-range" className="sr-only">
            Date range
          </label>
          <select
            id="perf-date-range"
            defaultValue={dateRange}
            className="h-9 min-w-[160px] rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-800 shadow-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-500/15"
          >
            <option>{dateRange}</option>
            <option>Apr 16 – May 15, 2026</option>
            <option>Mar 16 – Apr 15, 2026</option>
          </select>
          <button
            type="button"
            onClick={() => navigate('/agent/promotions')}
            className="h-9 rounded-lg bg-violet-700 px-3 text-[11px] font-semibold text-white shadow-sm shadow-violet-600/25 transition hover:bg-violet-800"
          >
            Promote Listing
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200/95 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 gap-2.5">
            <img src={row.image} alt="" className="h-16 w-[5.5rem] shrink-0 rounded-lg object-cover ring-1 ring-slate-100 sm:h-[72px] sm:w-[100px]" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-1.5">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold text-[#111827] sm:text-[15px]">{row.title}</h2>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">{listingLocation}</p>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${st.text} bg-white ring-1 ring-slate-200`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                  {st.label}
                </span>
              </div>
              <p className="mt-1 text-base font-bold tabular-nums text-[#111827] sm:text-lg">{fmtPrice(listingPrice)}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 border-t border-slate-100 pt-2 text-[10px] text-slate-600 sm:text-[11px] lg:border-t-0 lg:border-l lg:pl-4 lg:pt-0">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <p>
                <span className="font-medium text-slate-400">Listed On:</span>{' '}
                <span className="font-semibold text-slate-800">{listedOn}</span>
              </p>
              <p>
                <span className="font-medium text-slate-400">Property Type:</span>{' '}
                <span className="font-semibold text-slate-800">{listingType}</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <p>
                <span className="font-medium text-slate-400">{beds}</span>{' '}
                <span className="text-slate-700">Beds</span>
              </p>
              <p>
                <span className="font-medium text-slate-400">{baths}</span>{' '}
                <span className="text-slate-700">Baths</span>
              </p>
              <button
                type="button"
                className="ml-auto grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 lg:ml-0"
                aria-label="More options"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                  <circle cx="12" cy="6" r="1.5" />
                  <circle cx="12" cy="12" r="1.5" />
                  <circle cx="12" cy="18" r="1.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-5">
        <KpiCard
          title="Views"
          value={metrics.views.toLocaleString('en-NG')}
          pctLabel={`${metrics.deltas[0]} vs prev period`}
          spark={<MiniSparkline values={sparkViews} color="#7C3AED" />}
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" />
              <circle cx="12" cy="12" r="3" strokeLinecap="round" />
            </svg>
          }
        />
        <KpiCard
          title="Unique Views"
          value={metrics.unique.toLocaleString('en-NG')}
          pctLabel={`${metrics.deltas[1]} vs prev period`}
          spark={<MiniSparkline values={sparkUnique} color="#6366F1" />}
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          }
        />
        <KpiCard
          title="Leads"
          value={metrics.leads.toLocaleString('en-NG')}
          pctLabel={`${metrics.deltas[2]} vs prev period`}
          spark={<MiniSparkline values={sparkLeads} color="#2563EB" />}
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
            </svg>
          }
        />
        <KpiCard
          title="CTR (Click-Through Rate)"
          value={`${metrics.ctr}%`}
          pctLabel={`${metrics.deltas[3]} vs prev period`}
          spark={<MiniSparkline values={sparkCtr} color="#8B5CF6" />}
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4l7 7M11 11l9-9M15 4h6v6M9 20H3v-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
        <KpiCard
          title="Saves"
          value={metrics.saves.toLocaleString('en-NG')}
          pctLabel={`${metrics.deltas[4]} vs prev period`}
          spark={<MiniSparkline values={sparkSaves} color="#0EA5E9" />}
          icon={
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
        />
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-[1.35fr_0.78fr] lg:items-stretch">
        <div className="flex min-h-0 flex-col rounded-xl border border-slate-200/95 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
            <h3 className="text-[12px] font-bold text-[#111827]">Views &amp; Leads Over Time</h3>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] font-medium text-slate-500">Views</span>
              <span className="h-1.5 w-4 rounded-full bg-violet-600" />
              <span className="ml-1 text-[9px] font-medium text-slate-500">Leads</span>
              <span className="h-1.5 w-4 rounded-full bg-blue-600" />
              <div className="ml-1 flex rounded-md border border-slate-200 p-0.5">
                <button
                  type="button"
                  onClick={() => setGranularity('daily')}
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold ${granularity === 'daily' ? 'bg-violet-700 text-white' : 'text-slate-600'}`}
                >
                  Daily
                </button>
                <button
                  type="button"
                  onClick={() => setGranularity('weekly')}
                  className={`rounded px-2 py-0.5 text-[10px] font-semibold ${granularity === 'weekly' ? 'bg-violet-700 text-white' : 'text-slate-600'}`}
                >
                  Weekly
                </button>
              </div>
            </div>
          </div>
          <ViewsLeadsChart viewsSeries={viewsSeries} leadsSeries={leadsSeries} dateLabels={dateLabels} />
        </div>

        <div className="flex flex-col rounded-xl border border-slate-200/95 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
          <h3 className="mb-1 text-[12px] font-bold text-[#111827]">Traffic Sources</h3>
          <TrafficDonutMock total={metrics.views} />
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200/95 bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
        <h3 className="text-[12px] font-bold text-[#111827]">Lead Funnel</h3>
        <div className="mt-2 flex flex-col items-stretch gap-1.5 sm:flex-row sm:items-center">
          <FunnelStep label="Views" value={metrics.views} subPct={null} isLast={false} />
          <FunnelStep label="Clicks" value={metrics.clicks} subPct={`${metrics.clickRate}%`} isLast={false} />
          <FunnelStep label="Leads" value={metrics.leads} subPct={`${metrics.leadRate}%`} isLast={false} />
          <FunnelStep label="Conversions" value={metrics.conversions} subPct={`${metrics.convRate}%`} isLast />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5">
          <p className="text-[10px] text-slate-600">
            Your conversion rate is <span className="font-bold text-slate-900">{metrics.leadToConversionRate}%</span>
          </p>
          <p className="flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 19V5M5 12l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            +2.5%
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-1.5 lg:grid-cols-4">
        {[
          { label: 'Avg. Time on Listing', value: '2m 34s', icon: 'clock' },
          { label: 'Contact Clicks', value: '42', icon: 'phone' },
          { label: 'Save Rate', value: '3.2%', icon: 'bookmark' },
          { label: 'Scroll Depth', value: '68%', icon: 'scroll' },
        ].map((m) => (
          <div key={m.label} className="rounded-lg border border-slate-200/95 bg-white p-2 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-violet-50 text-violet-700 ring-1 ring-violet-100/80">
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
            <p className="mt-1 text-[8px] font-semibold uppercase leading-tight tracking-wide text-slate-500">{m.label}</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums leading-none text-[#111827]">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
        <div>
          <h3 className="text-[12px] font-bold text-[#111827]">Top Performing Elements</h3>
          <p className="text-[10px] text-slate-500">Which parts of your listing attract the most attention.</p>
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {topElements.map((el) => (
              <div
                key={el.label}
                className="flex flex-col items-center rounded-lg border border-slate-200/95 bg-gradient-to-b from-white to-slate-50/90 p-2 text-center shadow-[0_1px_2px_rgba(15,23,42,0.05)]"
              >
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-violet-50 text-violet-700 ring-1 ring-violet-100/80">
                  {el.icon === 'img' ? (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="m21 15-5-5L5 21" strokeLinecap="round" />
                    </svg>
                  ) : el.icon === 'pin' ? (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  ) : el.icon === 'tag' ? (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2H2v10l9.29 9.29a1 1 0 0 0 1.41 0l6.59-6.59a1 1 0 0 0 0-1.41L12 2Z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <p className="mt-1.5 text-[10px] font-semibold text-slate-800">{el.label}</p>
                <p className="mt-0.5 text-sm font-bold tabular-nums text-violet-700">{el.count}</p>
                <p className="text-[9px] text-slate-500">views</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-violet-100/90 bg-gradient-to-br from-violet-50 via-white to-indigo-50/80 p-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
          <div className="flex items-start gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18h6M10 22h4M12 2v1M12 22v-1M4.93 4.93l.71.71M18.36 18.36l.71.71M2 12h1M21 12h-1M4.93 19.07l.71-.71M18.36 5.64l.71-.71" strokeLinecap="round" />
                <circle cx="12" cy="12" r="4" />
              </svg>
            </span>
            <div className="min-w-0">
              <h3 className="text-[12px] font-bold text-violet-950">Insights &amp; Recommendations</h3>
              <ul className="mt-1.5 list-inside list-disc space-y-1 text-[10px] leading-snug text-violet-950/90">
                <li>Listings with 5+ images get roughly 2× more leads — add one more angle of the living area.</li>
                <li>Your peak traffic is mid-week; schedule a boosted post on Wednesday for maximum reach.</li>
                <li>Agent link traffic is strong — share your referral link in your newsletter this week.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[9px] text-slate-400">
        Analytics updates every few hours. All times are based on (WAT) West Africa Time.
      </p>
    </div>
  )
}
