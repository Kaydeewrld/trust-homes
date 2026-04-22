import { Link } from 'react-router-dom'
import { properties } from '../../data/properties'

const fmtN = (n) => `₦ ${Number(n).toLocaleString('en-NG')}`

const recentListings = [
  {
    id: '1',
    title: 'Luxury 4 Bedroom Duplex',
    location: 'Lekki Phase 1, Lagos',
    status: 'Active',
    price: 120000000,
    views: 234,
    image: properties[0]?.image,
  },
  {
    id: '2',
    title: 'Modern 3 Bedroom Apartment',
    location: 'Victoria Island, Lagos',
    status: 'Pending',
    price: 85000000,
    views: 189,
    image: properties[1]?.image,
  },
  {
    id: '3',
    title: 'Waterfront Penthouse',
    location: 'Ikoyi, Lagos',
    status: 'Active',
    price: 250000000,
    views: 456,
    image: properties[2]?.image,
  },
  {
    id: '4',
    title: 'Executive Office Suite',
    location: 'Ikeja GRA, Lagos',
    status: 'Active',
    price: 45000000,
    views: 98,
    image: properties[3]?.image,
  },
]

const recentEarnings = [
  { id: 'e1', title: 'Luxury 4 Bedroom Duplex', location: 'Victoria Island, Lagos', amount: 120000, status: 'Paid', date: 'Apr 18, 2026', image: properties[0]?.image },
  { id: 'e2', title: 'Modern 3 Bedroom Apartment', location: 'Victoria Island, Lagos', amount: 85000, status: 'Pending', date: 'Apr 17, 2026', image: properties[1]?.image },
  { id: 'e3', title: 'Waterfront Penthouse', location: 'Ikoyi, Lagos', amount: 250000, status: 'Paid', date: 'Apr 16, 2026', image: properties[2]?.image },
  { id: 'e4', title: 'Executive Office Suite', location: 'Ikeja GRA, Lagos', amount: 45000, status: 'Pending', date: 'Apr 15, 2026', image: properties[3]?.image },
]

/** 48+42+26+12 = 128 — matches reference image */
const leadLegend = [
  { label: 'New Leads', count: 48, pct: '37.5%', color: '#6366F1' },
  { label: 'Contacted', count: 42, pct: '32.8%', color: '#3B82F6' },
  { label: 'Qualified', count: 26, pct: '20.3%', color: '#22C55E' },
  { label: 'Converted', count: 12, pct: '9.4%', color: '#FB923C' },
]

function MonthFilterButton() {
  return (
    <button
      type="button"
      className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
      </svg>
      This Month
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

/** Smooth curve through normalized y values (0=top of chart = high earnings) */
function buildSmoothAreaPath(points, pad, innerW, innerH) {
  const toXY = (i) => {
    const t = i / (points.length - 1)
    const x = pad.l + t * innerW
    const y = pad.t + points[i] * innerH
    return [x, y]
  }
  const coords = points.map((_, i) => toXY(i))
  let d = `M ${coords[0][0].toFixed(1)},${coords[0][1].toFixed(1)}`
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[Math.max(0, i - 1)]
    const p1 = coords[i]
    const p2 = coords[i + 1]
    const p3 = coords[Math.min(coords.length - 1, i + 2)]
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}

function EarningsLineChart() {
  const w = 720
  const h = 220
  const pad = { t: 20, r: 20, b: 40, l: 52 }
  const innerW = w - pad.l - pad.r
  const innerH = h - pad.t - pad.b
  const yLabels = ['N600K', 'N450K', 'N300K', 'N150K', 'N0']

  const smoothY = [
    0.78, 0.72, 0.68, 0.62, 0.58, 0.52, 0.48, 0.42, 0.38, 0.32, 0.28, 0.3, 0.34, 0.36, 0.38, 0.4, 0.38, 0.36, 0.35, 0.34,
  ]
  const lineD = buildSmoothAreaPath(smoothY, pad, innerW, innerH)
  const last = smoothY.length - 1
  const peakIdx = 10
  const areaD = `${lineD} L${(pad.l + innerW).toFixed(1)},${(pad.t + innerH).toFixed(1)} L${pad.l},${(pad.t + innerH).toFixed(1)} Z`
  const tooltipX = pad.l + (peakIdx / last) * innerW
  const tooltipY = pad.t + smoothY[peakIdx] * innerH

  const xTickLabels = ['Apr 1', 'Apr 7', 'Apr 12', 'Apr 18', 'Apr 24', 'Apr 30']
  const xTicks = [0, 0.2, 0.4, 0.5, 0.7, 1]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100/90 px-4 pb-3 pt-4">
        <div>
          <h3 className="text-[15px] font-bold tracking-tight text-slate-900">Earnings Overview</h3>
          <p className="mt-0.5 text-xs text-slate-500">Daily earnings · Apr 2026</p>
        </div>
        <MonthFilterButton />
      </div>
      <div className="relative px-2 pb-2 pt-1 sm:px-3">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-[min(190px,42vw)] w-full max-h-[190px]" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="agentChartFillV2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.28" />
              <stop offset="55%" stopColor="#6366F1" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </linearGradient>
          </defs>
          {yLabels.map((label, i) => {
            const y = pad.t + (i / (yLabels.length - 1)) * innerH
            return (
              <g key={label}>
                <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#EEF2F7" strokeWidth="1" />
                <text x={6} y={y + 4} fill="#94a3b8" style={{ fontSize: 10, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}>
                  {label}
                </text>
              </g>
            )
          })}
          {xTicks.map((t, i) => (
            <text
              key={t}
              x={pad.l + t * innerW}
              y={h - 10}
              textAnchor="middle"
              fill="#94a3b8"
              style={{ fontSize: 10, fontWeight: 600, fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif' }}
            >
              {xTickLabels[i]}
            </text>
          ))}
          <path d={areaD} fill="url(#agentChartFillV2)" />
          <path d={lineD} fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={tooltipX} cy={tooltipY} r="6" fill="white" stroke="#6366F1" strokeWidth="2.5" />
        </svg>
        <div
          className="pointer-events-none absolute z-10 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2.5 shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)]"
          style={{ left: 'clamp(42%, 48%, 52%)', top: '14%', transform: 'translateX(-50%)' }}
        >
          <p className="text-[11px] font-medium text-slate-500">Apr 18, 2026</p>
          <p className="text-[15px] font-bold tabular-nums text-indigo-600">{fmtN(320000)}</p>
        </div>
      </div>
    </div>
  )
}

function LeadsDonut() {
  return (
    <div className="flex h-full min-h-[230px] flex-col overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="border-b border-slate-100/90 px-4 pb-3 pt-4">
        <h3 className="text-[15px] font-bold tracking-tight text-slate-900">Leads Overview</h3>
        <p className="mt-0.5 text-xs text-slate-500">Pipeline distribution</p>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-3 py-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4 lg:px-4">
        <div className="relative h-[138px] w-[138px] shrink-0 sm:h-[150px] sm:w-[150px]">
          <div
            className="h-full w-full rounded-full shadow-[inset_0_2px_8px_rgba(15,23,42,0.06)]"
            style={{
              background: `conic-gradient(from -90deg, #6366F1 0deg 135deg, #3B82F6 135deg 253.125deg, #22C55E 253.125deg 326.25deg, #FB923C 326.25deg 360deg)`,
            }}
          />
          <div className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(15,23,42,0.08)]">
            <p className="text-[22px] font-bold leading-none tracking-tight text-slate-900">128</p>
            <p className="mt-1.5 text-center text-[11px] font-semibold leading-tight text-slate-500">Total Leads</p>
          </div>
        </div>
        <ul className="w-full max-w-[220px] space-y-2 lg:pr-1">
          {leadLegend.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-3 text-[13px]">
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: row.color }} />
                <span className="truncate font-medium text-slate-700">{row.label}</span>
              </span>
              <span className="shrink-0 text-right tabular-nums text-slate-600">
                <span className="font-semibold text-slate-800">{row.count}</span>{' '}
                <span className="text-slate-400">({row.pct})</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function StatusPill({ status }) {
  const paidOrActive = status === 'Paid' || status === 'Active'
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        paidOrActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-amber-50 text-amber-800 ring-1 ring-amber-100'
      }`}
    >
      {status}
    </span>
  )
}

function RowMenu() {
  return (
    <button
      type="button"
      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      aria-label="Row options"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <circle cx="12" cy="6" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="12" cy="18" r="1.5" />
      </svg>
    </button>
  )
}

export default function AgentOverviewPage() {
  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1480px] flex-col px-4 py-4 md:px-6 md:py-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[24px] font-bold leading-tight tracking-tight text-slate-900">Overview</h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-slate-500">
            Welcome back, John! Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
        <div className="self-start sm:pt-1">
          <MonthFilterButton />
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            icon: (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinejoin="round" />
                <path d="M9 22V12h6v10" strokeLinejoin="round" />
              </svg>
            ),
            wrap: 'bg-indigo-50 text-indigo-600',
            label: 'Total Earnings',
            value: fmtN(520000),
            trend: '▲ 18.6% vs last month',
          },
          {
            icon: (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M8 7V5h8v2M4 9h16v10H4zM4 13h16" strokeLinecap="round" />
              </svg>
            ),
            wrap: 'bg-blue-50 text-blue-600',
            label: 'Active Listings',
            value: '24',
            trend: '▲ 8 new this month',
          },
          {
            icon: (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M18 20V10M12 20V4M6 20v-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ),
            wrap: 'bg-emerald-50 text-emerald-600',
            label: 'Total Leads',
            value: '128',
            trend: '▲ 32.4% vs last month',
          },
          {
            icon: (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" />
                <circle cx="12" cy="12" r="3" strokeLinecap="round" />
              </svg>
            ),
            wrap: 'bg-orange-50 text-orange-500',
            label: 'Profile Views',
            value: '1,246',
            trend: '▲ 12.8% vs last month',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-100/80 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.wrap}`}>{card.icon}</div>
            <p className="mt-2 text-[11px] font-semibold text-slate-500">{card.label}</p>
            <p className="mt-1 text-[22px] font-bold leading-none tracking-tight text-slate-900">{card.value}</p>
            <p className="mt-1.5 text-[11px] font-semibold text-emerald-600">{card.trend}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid items-stretch gap-3 lg:grid-cols-5">
        <div className="min-h-0 lg:col-span-3">
          <EarningsLineChart />
        </div>
        <div className="min-h-0 lg:col-span-2">
          <LeadsDonut />
        </div>
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-[15px] font-bold text-slate-900">Recent Listings</h3>
            <Link to="/agent/listings" className="text-[13px] font-semibold text-indigo-600 hover:text-indigo-500">
              View all
            </Link>
          </div>
          <ul>
            {recentListings.slice(0, 3).map((row) => (
              <li key={row.id} className="flex items-center gap-3 border-b border-slate-100/90 px-4 py-2.5 last:border-0 sm:gap-3">
                <img src={row.image} alt="" className="h-[44px] w-[44px] shrink-0 rounded-lg object-cover ring-1 ring-slate-100" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-slate-900">{row.title}</p>
                  <p className="truncate text-xs text-slate-500">{row.location}</p>
                  <div className="mt-1.5 sm:hidden">
                    <StatusPill status={row.status} />
                  </div>
                </div>
                <div className="hidden shrink-0 sm:block">
                  <StatusPill status={row.status} />
                </div>
                <div className="hidden shrink-0 text-right md:block">
                  <p className="text-[12px] font-bold tabular-nums text-slate-900">{fmtN(row.price)}</p>
                  <p className="mt-0.5 flex items-center justify-end gap-1 text-xs font-medium text-slate-500">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" />
                      <circle cx="12" cy="12" r="3" strokeLinecap="round" />
                    </svg>
                    {row.views}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 sm:flex-col sm:items-end">
                  <div className="text-right md:hidden">
                    <p className="text-xs font-bold tabular-nums text-slate-900">{fmtN(row.price)}</p>
                    <p className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-slate-500">
                      <svg viewBox="0 0 24 24" className="h-3 w-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" />
                        <circle cx="12" cy="12" r="3" strokeLinecap="round" />
                      </svg>
                      {row.views}
                    </p>
                  </div>
                  <RowMenu />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-[15px] font-bold text-slate-900">Recent Earnings</h3>
            <Link to="/agent/earnings" className="text-[13px] font-semibold text-indigo-600 hover:text-indigo-500">
              View all
            </Link>
          </div>
          <ul>
            {recentEarnings.slice(0, 3).map((row) => (
              <li key={row.id} className="flex items-center gap-3 border-b border-slate-100/90 px-4 py-2.5 last:border-0 sm:gap-3">
                <img src={row.image} alt="" className="h-[44px] w-[44px] shrink-0 rounded-lg object-cover ring-1 ring-slate-100" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-slate-900">{row.title}</p>
                  <p className="truncate text-xs text-slate-500">{row.location}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[12px] font-bold tabular-nums text-indigo-600">{fmtN(row.amount)}</p>
                  <div className="mt-1">
                    <StatusPill status={row.status} />
                  </div>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">{row.date}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-indigo-100/90 via-indigo-50 to-violet-100/80 px-4 py-3 ring-1 ring-indigo-200/60 sm:flex-row sm:items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.65">
            <path d="M20 12v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8" strokeLinejoin="round" />
            <path d="M2 12h20" strokeLinecap="round" />
            <path d="M12 22V12M12 8a4 4 0 0 0-4-4H7.5a2.5 2.5 0 0 0 0 5H12m0-1a4 4 0 0 1 4-4H17a2.5 2.5 0 0 1 0 5H12" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold tracking-tight text-slate-900">Earn more by promoting verified listings</p>
          <p className="mt-1 max-w-3xl text-[12px] leading-relaxed text-slate-600">
            Browse properties and promote them to your network. Earn commission on every successful sale.
          </p>
        </div>
        <Link
          to="/agent/promotions"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-[12px] font-semibold text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500"
        >
          Browse Listings to Promote
          <span aria-hidden className="text-lg leading-none">
            →
          </span>
        </Link>
      </div>
    </div>
  )
}
