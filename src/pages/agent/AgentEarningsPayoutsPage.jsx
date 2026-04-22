import { Link } from 'react-router-dom'
import { useId, useMemo, useState } from 'react'
import { earningsSummary, earningsTransactions, earningsYearlyNorm } from '../../data/agentEarningsSeed'
import AgentRequestPayoutModal from './AgentRequestPayoutModal'
import AgentPayoutHistoryModal from './AgentPayoutHistoryModal'

const fmtN = (n) => `₦${Number(n).toLocaleString('en-NG')}`

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

function EarningsYearChart() {
  const gradId = `earningsFill-${useId().replace(/:/g, '')}`
  const w = 720
  const h = 228
  const pad = { t: 22, r: 20, b: 40, l: 52 }
  const innerW = w - pad.l - pad.r
  const innerH = h - pad.t - pad.b
  const yLabels = ['₦200K', '₦150K', '₦100K', '₦50K', '₦0']
  const points = earningsYearlyNorm
  const lineD = buildSmoothAreaPath(points, pad, innerW, innerH)
  const last = points.length - 1
  const mayIdx = 4
  const areaD = `${lineD} L${(pad.l + innerW).toFixed(1)},${(pad.t + innerH).toFixed(1)} L${pad.l},${(pad.t + innerH).toFixed(1)} Z`
  const tooltipX = pad.l + (mayIdx / last) * innerW
  const tooltipY = pad.t + points[mayIdx] * innerH
  const mayAmount = 180600
  const xMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100/90 px-4 pb-3 pt-4 sm:px-5">
        <div className="min-w-0">
          <h3 className="text-[15px] font-bold tracking-tight text-slate-900">Earnings Overview</h3>
          <p className="mt-0.5 text-xs text-slate-500">Monthly earnings · Jan–Dec 2026</p>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[12px]">
            <p className="text-slate-600">
              <span className="font-semibold text-slate-800">This Year</span>{' '}
              <span className="font-bold tabular-nums text-indigo-600">{fmtN(earningsSummary.thisYearTotal)}</span>
            </p>
            <p className="text-slate-500">
              <span className="font-medium text-slate-600">Last Year</span>{' '}
              <span className="font-semibold tabular-nums text-slate-700">{fmtN(earningsSummary.lastYearTotal)}</span>
            </p>
          </div>
        </div>
        <label className="sr-only" htmlFor="earnings-year-select">
          Earnings period
        </label>
        <select
          id="earnings-year-select"
          defaultValue="this-year"
          className="h-10 shrink-0 rounded-xl border border-slate-200 bg-white px-3 pr-9 text-[12px] font-semibold text-slate-800 shadow-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.65rem center' }}
        >
          <option value="this-year">This Year</option>
          <option value="last-year">Last Year</option>
        </select>
      </div>
      <div className="relative px-2 pb-4 pt-1 sm:px-4">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-[min(200px,42vw)] w-full max-h-[220px]" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.28" />
              <stop offset="55%" stopColor="#6366F1" stopOpacity="0.09" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
            </linearGradient>
          </defs>
          {yLabels.map((label, i) => {
            const y = pad.t + (i / (yLabels.length - 1)) * innerH
            return (
              <g key={label}>
                <line x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="#EEF2F7" strokeWidth="1" />
                <text x={6} y={y + 4} fill="#94a3b8" style={{ fontSize: 10, fontWeight: 600 }}>
                  {label}
                </text>
              </g>
            )
          })}
          {xMonths.map((lab, i) => {
            const x = pad.l + (i / (xMonths.length - 1)) * innerW
            return (
              <text key={lab} x={x} y={h - 10} textAnchor="middle" fill="#94a3b8" style={{ fontSize: 10, fontWeight: 600 }}>
                {lab}
              </text>
            )
          })}
          <path d={areaD} fill={`url(#${gradId})`} />
          <path d={lineD} fill="none" stroke="#6366F1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={tooltipX} cy={tooltipY} r="6" fill="white" stroke="#6366F1" strokeWidth="2.5" />
        </svg>
        <div
          className="pointer-events-none absolute z-10 rounded-xl border border-slate-200/90 bg-white px-3 py-2 shadow-[0_10px_40px_-10px_rgba(15,23,42,0.15)]"
          style={{ left: 'clamp(32%, 36%, 40%)', top: '10%', transform: 'translateX(-50%)' }}
        >
          <p className="text-[11px] font-medium text-slate-500">May 2026</p>
          <p className="text-[15px] font-bold tabular-nums leading-tight text-indigo-600">{fmtN(mayAmount)}</p>
        </div>
      </div>
    </div>
  )
}

function EarningsDonut() {
  const { donutTotal, breakdown } = earningsSummary
  let a = -90
  const segs = breakdown.map((s) => {
    const sweep = (s.pct / 100) * 360
    const start = a
    const end = a + sweep
    a = end
    return { ...s, start, end }
  })
  const gradientStops = segs.map((s) => `${s.color} ${s.start}deg ${s.end}deg`).join(', ')
  const bg = `conic-gradient(from -90deg, ${gradientStops})`

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="border-b border-slate-100/90 px-4 pb-3 pt-4 sm:px-5">
        <h3 className="text-[15px] font-bold tracking-tight text-slate-900">Earnings Breakdown</h3>
        <p className="mt-0.5 text-xs text-slate-500">Share of income by source</p>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-5 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-5">
        <div className="relative mx-auto h-[150px] w-[150px] shrink-0 sm:mx-0 sm:h-[158px] sm:w-[158px]">
          <div
            className="h-full w-full rounded-full shadow-[inset_0_2px_8px_rgba(15,23,42,0.06)] ring-2 ring-white"
            style={{ background: bg }}
          />
          <div className="absolute inset-[24%] flex flex-col items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(15,23,42,0.08)]">
            <p className="text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500">Total</p>
            <p className="mt-0.5 text-center text-[15px] font-bold leading-none tabular-nums tracking-tight text-slate-900 sm:text-[16px]">
              {fmtN(donutTotal)}
            </p>
          </div>
        </div>
        <ul className="w-full min-w-0 flex-1 space-y-2 sm:max-w-[200px]">
          {breakdown.map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-2 text-[12px] sm:text-[13px]">
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: row.color }} />
                <span className="truncate font-medium text-slate-700">{row.label}</span>
              </span>
              <span className="shrink-0 font-bold tabular-nums text-slate-800">{row.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-auto border-t border-slate-100/90 px-4 py-3 sm:px-5">
        <button
          type="button"
          className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          View Full Breakdown
        </button>
      </div>
    </div>
  )
}

function StatusPill({ status }) {
  const paid = status === 'Paid'
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
        paid ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-amber-50 text-amber-800 ring-1 ring-amber-100'
      }`}
    >
      {status}
    </span>
  )
}

export default function AgentEarningsPayoutsPage() {
  const [payoutModalOpen, setPayoutModalOpen] = useState(false)
  const [payoutHistoryOpen, setPayoutHistoryOpen] = useState(false)

  const kpi = useMemo(
    () => [
      {
        label: 'Total Earnings',
        value: fmtN(earningsSummary.totalEarnings),
        trend: `▲ ${earningsSummary.totalEarningsDeltaPct}% vs last month`,
        trendClass: 'text-emerald-600',
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinejoin="round" />
            <path d="M9 22V12h6v10" strokeLinejoin="round" />
          </svg>
        ),
        wrap: 'bg-indigo-50 text-indigo-600',
      },
      {
        label: 'Available Balance',
        value: fmtN(earningsSummary.availableBalance),
        trend: 'Ready for payout',
        trendClass: 'text-emerald-600',
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M19 7V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1" />
            <path d="M3 10h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H3" />
            <path d="M16 14h.01" strokeLinecap="round" />
          </svg>
        ),
        wrap: 'bg-emerald-50 text-emerald-600',
      },
      {
        label: 'Pending Earnings',
        value: fmtN(earningsSummary.pendingEarnings),
        trend: 'From active deals',
        trendClass: 'text-blue-600',
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" strokeLinecap="round" />
          </svg>
        ),
        wrap: 'bg-blue-50 text-blue-600',
      },
      {
        label: 'Total Paid Out',
        value: fmtN(earningsSummary.totalPaidOut),
        trend: `Across ${earningsSummary.paidOutCount} payouts`,
        trendClass: 'text-orange-600',
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" />
          </svg>
        ),
        wrap: 'bg-orange-50 text-orange-500',
      },
    ],
    [],
  )

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1480px] flex-col px-4 py-4 text-slate-800 md:px-6 md:py-4">
      <AgentRequestPayoutModal
        open={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        availableBalance={earningsSummary.availableBalance}
        minPayout={earningsSummary.payoutMin}
      />
      <AgentPayoutHistoryModal open={payoutHistoryOpen} onClose={() => setPayoutHistoryOpen(false)} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[24px] font-bold leading-tight tracking-tight text-slate-900">Earnings &amp; Payouts</h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-slate-500">
            Track your earnings, commissions, and manage your payouts.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-1">
          <button
            type="button"
            onClick={() => setPayoutHistoryOpen(true)}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Payout History
          </button>
          <button
            type="button"
            onClick={() => setPayoutModalOpen(true)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#6366F1] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600"
          >
            <span className="text-base font-bold leading-none">+</span>
            Request Payout
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpi.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-slate-100/80 bg-white p-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.wrap}`}>{card.icon}</div>
            <p className="mt-2 text-[11px] font-semibold text-slate-500">{card.label}</p>
            <p className="mt-1 text-[22px] font-bold leading-none tracking-tight text-slate-900">{card.value}</p>
            <p className={`mt-1.5 text-[11px] font-semibold ${card.trendClass}`}>{card.trend}</p>
          </div>
        ))}
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-5 lg:items-stretch">
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-3">
          <EarningsYearChart />

          <div className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
              <h3 className="text-[15px] font-bold text-slate-900">Recent Transactions</h3>
              <p className="mt-0.5 text-xs text-slate-500">Commissions and bonuses credited to your account.</p>
            </div>
            <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[800px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/90">
                    {['Type', 'Description', 'Property', 'Amount', 'Status', 'Date'].map((h) => (
                      <th
                        key={h}
                        className={`whitespace-nowrap px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 ${
                          h === 'Amount' || h === 'Status' || h === 'Date' ? 'text-right' : ''
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {earningsTransactions.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 last:border-0">
                      <td className="whitespace-nowrap px-3 py-2.5 align-middle text-[13px] font-semibold text-[#111827]">{row.type}</td>
                      <td className="max-w-[220px] px-3 py-2.5 align-middle text-[13px] text-slate-600">{row.description}</td>
                      <td className="px-3 py-2.5 align-middle">
                        <div className="flex items-center gap-3">
                          <img
                            src={row.image}
                            alt=""
                            className="h-10 w-[52px] shrink-0 rounded-lg object-cover ring-1 ring-slate-100"
                          />
                          <span className="line-clamp-2 text-[12px] font-medium text-slate-700">{row.propertyTitle}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 align-middle text-right text-[13px] font-bold tabular-nums text-[#111827]">
                        {fmtN(row.amount)}
                      </td>
                      <td className="px-3 py-2.5 align-middle text-right">
                        <StatusPill status={row.status} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 align-middle text-right text-[12px] font-medium text-slate-500">
                        {row.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-100 px-4 py-2.5 sm:px-5">
              <Link to="/agent/transactions" className="text-[13px] font-semibold text-indigo-600 hover:text-indigo-500">
                View All Transactions →
              </Link>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
          <EarningsDonut />

          <div className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            <div className="border-b border-slate-100/90 px-4 pb-3 pt-4 sm:px-5">
              <h3 className="text-[15px] font-bold tracking-tight text-slate-900">Payout Summary</h3>
              <p className="mt-0.5 text-xs text-slate-500">How and when you get paid</p>
            </div>
            <div className="divide-y divide-slate-100 px-4 sm:px-5">
              <div className="flex items-center justify-between gap-3 py-3.5">
                <span className="text-[12px] font-medium text-slate-600 sm:text-[13px]">Minimum payout</span>
                <span className="text-[13px] font-bold tabular-nums text-slate-900">{fmtN(earningsSummary.payoutMin)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 py-3.5">
                <span className="text-[12px] font-medium text-slate-600 sm:text-[13px]">Next payout date</span>
                <span className="text-right text-[12px] font-semibold text-slate-900 sm:text-[13px]">{earningsSummary.nextPayoutDate}</span>
              </div>
              <div className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <span className="shrink-0 text-[12px] font-medium text-slate-600 sm:text-[13px]">Payout method</span>
                <span className="min-w-0 text-right text-[12px] font-semibold leading-snug text-slate-800 sm:max-w-[14rem]">
                  {earningsSummary.payoutMethod}
                </span>
              </div>
            </div>
            <div className="flex items-start gap-3 border-t border-indigo-100/90 bg-indigo-50/80 px-4 py-3 sm:px-5">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100/80">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 7V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1" />
                  <path d="M3 10h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H3" />
                  <path d="M16 14h.01" strokeLinecap="round" />
                </svg>
              </span>
              <p className="min-w-0 text-[12px] leading-relaxed text-indigo-950/90">
                <span className="font-semibold text-indigo-900">You can request a payout anytime.</span> Payouts are processed within{' '}
                <span className="font-semibold">1–3 business days</span>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
