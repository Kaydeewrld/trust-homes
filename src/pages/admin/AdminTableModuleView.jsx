function StatusCell({ value }) {
  const v = String(value).toLowerCase()
  const tone =
    v.includes('approved') || v.includes('active') || v.includes('verified') || v.includes('completed') || v.includes('good')
      ? 'bg-emerald-50 text-emerald-800 ring-emerald-100'
      : v.includes('pending') || v.includes('review') || v.includes('open') || v.includes('paused')
        ? 'bg-amber-50 text-amber-900 ring-amber-100'
        : 'bg-red-50 text-red-800 ring-red-100'
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tone}`}>{value}</span>
}

export default function AdminTableModuleView({ config }) {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1760px] space-y-6 px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-6 lg:px-8 lg:py-8 xl:px-11 xl:py-9">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{config.title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">{config.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="Filter…"
            className="h-10 w-44 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
          />
          <select className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
            <option>All statuses</option>
          </select>
          <button
            type="button"
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Export
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                {config.columns.map((col) => (
                  <th key={col.key} className="px-5 py-3.5 md:px-6">
                    {col.label}
                  </th>
                ))}
                <th className="px-5 py-3.5 text-right md:px-6"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {config.rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60">
                  {config.columns.map((col) => {
                    const raw = row[col.key]
                    const isStatus = col.key === 'status' || col.key === 'verify' || col.key === 'health'
                    return (
                      <td key={col.key} className="px-5 py-3.5 text-slate-700 md:px-6">
                        {isStatus ? <StatusCell value={raw} /> : <span className="font-medium text-slate-900">{raw}</span>}
                      </td>
                    )
                  })}
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
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs text-slate-500 md:px-6">
          <span>
            Showing {config.rows.length} of {config.rows.length}
          </span>
          <div className="flex gap-1">
            <button type="button" className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50">
              Previous
            </button>
            <button type="button" className="rounded-md border border-slate-200 px-2 py-1 hover:bg-slate-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
