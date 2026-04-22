const policies = [
  {
    title: 'Two-factor for staff',
    value: 'Required',
    body: 'All admin accounts must enroll TOTP before accessing payouts or user deletion.',
  },
  {
    title: 'Payout approval threshold',
    value: '₦2,000,000',
    body: 'Single transfers above this amount require a second approver in finance.',
  },
  {
    title: 'Data retention',
    value: '24 months',
    body: 'Transaction logs retained for compliance; tickets archived after resolution + 90 days.',
  },
  {
    title: 'API rate limits',
    value: 'Standard tier',
    body: 'Internal tools share the elevated rate limit; partner keys remain restricted.',
  },
]

export default function AdminSettingsPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1200px] space-y-7 px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-6 lg:px-8 lg:py-8 xl:px-10 xl:py-9">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Platform policies and operational controls (read-only preview).</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {policies.map((p) => (
          <article key={p.title} className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{p.title}</p>
            <p className="mt-2 text-lg font-semibold text-indigo-700">{p.value}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.body}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
