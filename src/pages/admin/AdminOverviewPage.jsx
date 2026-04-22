import { adminGrowthTx, adminGrowthUsers, adminOverviewKpis, adminRecentActivity } from '../../data/adminSeed'

function fmtFee10(amount) {
  return `₦${Math.round(amount * 0.1).toLocaleString('en-NG')}`
}

function GrowthChart() {
  const max = Math.max(...adminGrowthUsers, ...adminGrowthTx, 1)
  const line = (data) =>
    data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - (v / max) * 82}`).join(' ')
  return (
    <div className="h-[220px] w-full sm:h-[260px]">
      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
        <line x1="0" y1="100" x2="100" y2="100" stroke="#e2e8f0" vectorEffect="non-scaling-stroke" />
        <line x1="0" y1="75" x2="100" y2="75" stroke="#f1f5f9" vectorEffect="non-scaling-stroke" />
        <line x1="0" y1="50" x2="100" y2="50" stroke="#f1f5f9" vectorEffect="non-scaling-stroke" />
        <line x1="0" y1="25" x2="100" y2="25" stroke="#f1f5f9" vectorEffect="non-scaling-stroke" />
        <polyline points={line(adminGrowthUsers)} fill="none" stroke="#4f46e5" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <polyline points={line(adminGrowthTx)} fill="none" stroke="#0ea5e9" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-xs font-medium text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-indigo-600" /> Users
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-sky-500" /> Transactions
        </span>
      </div>
    </div>
  )
}

function StatusPill({ status }) {
  const ok = status === 'Completed'
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        ok ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-amber-50 text-amber-800 ring-1 ring-amber-100'
      }`}
    >
      {status}
    </span>
  )
}

export default function AdminOverviewPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1760px] space-y-7 px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-6 lg:px-8 lg:py-8 xl:px-11 xl:py-9">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-[26px]">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Overview of platform health and recent financial activity.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {adminOverviewKpis.map((k) => (
          <article
            key={k.label}
            className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm shadow-slate-900/[0.02] transition hover:shadow-md"
          >
            <p className="text-xs font-medium text-slate-500">{k.label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px] sm:leading-none">{k.value}</p>
            <p
              className={`mt-2 text-xs font-semibold ${
                k.positive === true ? 'text-emerald-600' : k.positive === false ? 'text-amber-600' : 'text-slate-500'
              }`}
            >
              {k.change}
            </p>
          </article>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[15px] font-semibold text-slate-900">Platform growth</h2>
              <p className="mt-0.5 text-sm text-slate-500">Users and transaction volume (indexed).</p>
            </div>
            <div className="flex rounded-lg border border-slate-200 bg-slate-50/80 p-0.5">
              <button type="button" className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-white">
                7d
              </button>
              <button type="button" className="rounded-md px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-white">
                30d
              </button>
              <button type="button" className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 shadow-sm">
                Year
              </button>
            </div>
          </div>
          <div className="mt-6">
            <GrowthChart />
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
            <h2 className="text-[15px] font-semibold text-slate-900">Review queue</h2>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                <span className="text-sm text-slate-600">Listings pending</span>
                <span className="text-sm font-semibold text-slate-900">42</span>
              </li>
              <li className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                <span className="text-sm text-slate-600">Agent verifications</span>
                <span className="text-sm font-semibold text-slate-900">6</span>
              </li>
              <li className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                <span className="text-sm text-slate-600">Payout requests</span>
                <span className="text-sm font-semibold text-slate-900">11</span>
              </li>
            </ul>
            <button
              type="button"
              className="mt-4 w-full rounded-lg border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Open approvals
            </button>
          </section>
          <section className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
            <h2 className="text-[15px] font-semibold text-slate-900">System</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">All services operational. Last deploy: today 08:12 UTC.</p>
          </section>
        </aside>
      </div>

      <section className="rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 md:px-6">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">Recent activity</h2>
            <p className="mt-0.5 text-sm text-slate-500">Latest payments and fees across the platform.</p>
          </div>
          <div className="flex gap-2">
            <select className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600">
              <option>All statuses</option>
            </select>
            <button type="button" className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50">
              Export
            </button>
          </div>
        </div>
        <div className="overflow-x-auto px-1 pb-1">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-5 py-3 md:px-6">Date</th>
                <th className="px-5 py-3 md:px-6">User</th>
                <th className="px-5 py-3 md:px-6">Type</th>
                <th className="px-5 py-3 md:px-6">Amount</th>
                <th className="px-5 py-3 md:px-6">Status</th>
                <th className="px-5 py-3 md:px-6">Fee</th>
                <th className="px-5 py-3 md:px-6">Fee (10%)</th>
                <th className="px-5 py-3 md:px-6 text-right"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {adminRecentActivity.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-5 py-3.5 text-slate-600 md:px-6">{row.date}</td>
                  <td className="px-5 py-3.5 font-medium text-slate-900 md:px-6">{row.user}</td>
                  <td className="px-5 py-3.5 text-slate-600 md:px-6">{row.type}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 font-medium tabular-nums text-slate-800 md:px-6">
                    ₦{row.amount.toLocaleString('en-NG')}
                  </td>
                  <td className="px-5 py-3.5 md:px-6">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 tabular-nums text-slate-600 md:px-6">₦{row.fee.toLocaleString('en-NG')}</td>
                  <td className="whitespace-nowrap px-5 py-3.5 tabular-nums text-slate-600 md:px-6">{fmtFee10(row.amount)}</td>
                  <td className="px-5 py-3.5 text-right md:px-6">
                    <button type="button" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
