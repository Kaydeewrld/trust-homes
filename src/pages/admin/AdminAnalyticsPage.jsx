import { adminGrowthUsers } from '../../data/adminSeed'

function Sparkline() {
  const max = Math.max(...adminGrowthUsers, 1)
  const pts = adminGrowthUsers.map((v, i) => `${(i / (adminGrowthUsers.length - 1)) * 100},${100 - (v / max) * 90}`).join(' ')
  return (
    <svg viewBox="0 0 100 100" className="h-14 w-full" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="#4f46e5" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

const cards = [
  { label: 'Gross volume (30d)', value: '₦184M', sub: '+12% vs prior period' },
  { label: 'Take rate (10%)', value: '₦18.4M', sub: 'After refunds' },
  { label: 'Conversion (visit → lead)', value: '6.4%', sub: '+0.7pp' },
  { label: 'Organic traffic share', value: '48%', sub: 'Search + direct' },
]

export default function AdminAnalyticsPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1760px] space-y-7 px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-6 lg:px-8 lg:py-8 xl:px-11 xl:py-9">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">High-level revenue and funnel metrics for leadership reviews.</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <article key={c.label} className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{c.label}</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{c.value}</p>
            <p className="mt-1 text-xs font-medium text-emerald-600">{c.sub}</p>
            <div className="mt-4 border-t border-slate-100 pt-3">
              <Sparkline />
            </div>
          </article>
        ))}
      </section>
      <section className="rounded-xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <h2 className="text-[15px] font-semibold text-slate-900">Traffic sources</h2>
        <p className="mt-1 text-sm text-slate-500">Where sessions originate — demo split.</p>
        <ul className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { name: 'Organic', pct: 48 },
            { name: 'Paid', pct: 31 },
            { name: 'Direct', pct: 21 },
          ].map((s) => (
            <li key={s.name} className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3">
              <p className="text-sm font-semibold text-slate-800">{s.name}</p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${s.pct}%` }} />
              </div>
              <p className="mt-2 text-xs font-medium text-slate-500">{s.pct}% of sessions</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
