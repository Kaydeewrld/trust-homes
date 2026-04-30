import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { adminAgents as adminAgentsSeed } from '../../data/adminSeed'
import AdminModalShell from './AdminModalShell'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { adminPendingAgentVerifications, adminSetAgentVerification } from '../../lib/api'

const PAGE_SIZE = 6

function VerifyBadge({ value }) {
  const v = String(value || '')
  const map = {
    Verified: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
    Pending: 'bg-amber-50 text-amber-900 ring-amber-100',
    Rejected: 'bg-red-50 text-red-800 ring-red-100',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${map[v] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
      {value}
    </span>
  )
}

function HealthBadge({ value }) {
  const v = String(value || '')
  const map = {
    Good: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
    Review: 'bg-amber-50 text-amber-900 ring-amber-100',
    Watch: 'bg-red-50 text-red-800 ring-red-100',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${map[v] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
      {value}
    </span>
  )
}

function AccountStatusBadge({ value }) {
  const v = String(value || '')
  const ok = v === 'Active'
  const pending = v.includes('Pending')
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${
        ok ? 'bg-emerald-50 text-emerald-800 ring-emerald-100' : pending ? 'bg-amber-50 text-amber-900 ring-amber-100' : 'bg-red-50 text-red-800 ring-red-100'
      }`}
    >
      {value}
    </span>
  )
}

function Field({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-sm font-medium text-slate-900">{value ?? '—'}</p>
    </div>
  )
}

function SectionTitle({ children }) {
  return <h3 className="mb-3 border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500">{children}</h3>
}

export default function AdminAgentsPage() {
  const toast = useToast()
  const { adminToken } = useAdminAuth()
  const [livePending, setLivePending] = useState([])
  const agents = useMemo(() => {
    const seed = adminAgentsSeed.map((r) => ({ ...r }))
    const mappedLive = livePending.map((a) => ({
      id: String(a.userId || ''),
      name: a.agencyName || a.displayName || 'Agent',
      contactName: a.displayName || 'Agent',
      email: a.email || '—',
      phone: a.phone || a.emergencyContact || '—',
      city: '—',
      rcNumber: a.licenseId || '—',
      verify: 'Pending',
      accountStatus: 'Pending review',
      listings: 0,
      activeListings: 0,
      commission: '₦0',
      walletBalance: '₦0',
      health: 'Review',
      registeredAt: a.profileCreatedAt ? new Date(a.profileCreatedAt).toLocaleDateString('en-NG') : '—',
      address: '—',
      taxId: '—',
      kycLevel: 'Tier 1',
      documentsStatus: a.verificationPhotoUrl ? 'Submitted' : 'Missing',
      ninMasked: a.nin ? `***${String(a.nin).slice(-4)}` : '—',
      bvnMasked: '—',
      leadResponseAvg: '—',
      complaints90d: 0,
      pendingPayout: '₦0',
      lifetimePayouts: '₦0',
      lastPayoutAt: '—',
      lastPayoutAmount: '₦0',
      payoutMethod: 'Bank transfer',
      payoutAccounts: [],
      internalNotes: a.verificationRequestedAt
        ? `Verification requested at ${new Date(a.verificationRequestedAt).toLocaleString('en-NG')}`
        : 'Verification request submitted.',
    }))
    const merged = [...mappedLive, ...seed]
    const seen = new Set()
    return merged.filter((row) => {
      const key = String(row.id || '')
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [livePending])
  const [search, setSearch] = useState('')
  const [verifyFilter, setVerifyFilter] = useState('all')
  const [healthFilter, setHealthFilter] = useState('all')
  const [accountFilter, setAccountFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [viewAgent, setViewAgent] = useState(null)
  const [moderatingByUserId, setModeratingByUserId] = useState({})

  useEffect(() => {
    if (!adminToken) return
    let cancelled = false
    ;(async () => {
      try {
        const out = await adminPendingAgentVerifications(adminToken)
        const rows = Array.isArray(out?.agents) ? out.agents : []
        if (!cancelled) setLivePending(rows)
      } catch (e) {
        if (!cancelled) setLivePending([])
        toast.error('Could not load live verification queue', e?.message || 'Please refresh.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [adminToken, toast])

  const moderateVerification = async (userId, approved) => {
    if (!adminToken || !userId) return
    const key = String(userId)
    setModeratingByUserId((prev) => ({ ...prev, [key]: true }))
    try {
      await adminSetAgentVerification(adminToken, key, approved)
      setLivePending((prev) => prev.filter((row) => String(row.userId) !== key))
      toast.success(
        approved ? 'Agent approved' : 'Agent rejected',
        approved ? 'Verification badge has been granted.' : 'Verification request has been rejected.',
      )
    } catch (e) {
      toast.error('Action failed', e?.message || 'Could not update verification status.')
    } finally {
      setModeratingByUserId((prev) => ({ ...prev, [key]: false }))
    }
  }

  const stats = useMemo(() => {
    const total = agents.length
    const verified = agents.filter((a) => a.verify === 'Verified').length
    const pendingKyc = agents.filter((a) => a.verify === 'Pending').length
    const risk = agents.filter((a) => a.health === 'Watch' || a.health === 'Review').length
    return { total, verified, pendingKyc, risk }
  }, [agents])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return agents.filter((a) => {
      if (verifyFilter !== 'all' && a.verify !== verifyFilter) return false
      if (healthFilter !== 'all' && a.health !== healthFilter) return false
      if (accountFilter !== 'all' && String(a.accountStatus || '') !== accountFilter) return false
      if (!q) return true
      const blob = [a.name, a.contactName, a.email, a.id, a.city, a.rcNumber].filter(Boolean).join(' ').toLowerCase()
      return blob.includes(q)
    })
  }, [agents, search, verifyFilter, healthFilter, accountFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  useEffect(() => {
    setPage(1)
  }, [search, verifyFilter, healthFilter, accountFilter])

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const resetFilters = () => {
    setSearch('')
    setVerifyFilter('all')
    setHealthFilter('all')
    setAccountFilter('all')
    toast.info('Filters cleared', 'Showing all agents in the directory.')
  }

  const exportAgents = () => {
    toast.success('Export queued', `${filtered.length} agent record(s) prepared for CSV (demo).`)
  }

  const copyAgentId = (a) => {
    const text = a.id
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => toast.success('Copied', `${text} is on the clipboard.`),
        () => toast.info('Copy manually', text),
      )
    } else {
      toast.info('Agent ID', text)
    }
  }

  const payoutAccounts = viewAgent?.payoutAccounts ?? []

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1760px] space-y-7 px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-6 lg:px-8 lg:py-8 xl:px-11 xl:py-9">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Agents</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Verification, wallet balances, and payout destinations for every agency on the platform. Click{' '}
            <span className="font-semibold text-slate-700">View</span> to open the full dossier (demo data — production should mask fields per policy).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={resetFilters}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Clear filters
          </button>
          <button
            type="button"
            onClick={exportAgents}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Export roster
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-5 py-4">
        <p className="text-sm font-semibold text-indigo-950">Payout & compliance</p>
        <p className="mt-1 text-sm leading-relaxed text-indigo-900/85">
          Bank tokens are masked here. In production, load NIBSS-name enquiry results, payout rails limits, and audit who viewed full account numbers. Never expose raw BVN/NIN in the browser.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm md:p-5">
        <div className="grid gap-3 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="ag-search">
              Search
            </label>
            <input
              id="ag-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Business, contact, email, ID, city…"
              className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="ag-verify">
              Verification
            </label>
            <select
              id="ag-verify"
              value={verifyFilter}
              onChange={(e) => setVerifyFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
            >
              <option value="all">All</option>
              <option value="Verified">Verified</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="ag-health">
              Health
            </label>
            <select
              id="ag-health"
              value={healthFilter}
              onChange={(e) => setHealthFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
            >
              <option value="all">All</option>
              <option value="Good">Good</option>
              <option value="Review">Review</option>
              <option value="Watch">Watch</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="ag-account">
              Account status
            </label>
            <select
              id="ag-account"
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
            >
              <option value="all">All</option>
              <option value="Active">Active</option>
              <option value="Pending review">Pending review</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of {agents.length} agents
        </p>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total agents', value: stats.total, c: 'text-slate-900' },
          { label: 'Verified', value: stats.verified, c: 'text-emerald-700' },
          { label: 'KYC pending', value: stats.pendingKyc, c: 'text-amber-700' },
          { label: 'Review / watch', value: stats.risk, c: 'text-red-700' },
        ].map((x) => (
          <article key={x.label} className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{x.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${x.c}`}>{x.value}</p>
          </article>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 md:px-6">
          <h2 className="text-[15px] font-semibold text-slate-900">Agent directory</h2>
          <p className="mt-0.5 text-sm text-slate-500">Business accounts, payout rails, and risk signals.</p>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-700">No agents match your filters</p>
            <button type="button" onClick={resetFilters} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 md:px-6">Business</th>
                    <th className="px-5 py-3 md:px-6">Contact</th>
                    <th className="px-5 py-3 md:px-6">Verify</th>
                    <th className="px-5 py-3 md:px-6">Account</th>
                    <th className="px-5 py-3 md:px-6">Listings</th>
                    <th className="px-5 py-3 md:px-6">Commission (YTD)</th>
                    <th className="px-5 py-3 md:px-6">Wallet</th>
                    <th className="px-5 py-3 md:px-6">Health</th>
                    <th className="px-5 py-3 text-right md:px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 md:px-6">
                        <p className="font-medium text-slate-900">{a.name}</p>
                        <p className="text-xs text-slate-400">{a.id}</p>
                      </td>
                      <td className="max-w-[200px] px-5 py-3.5 md:px-6">
                        <p className="truncate text-slate-800">{a.contactName}</p>
                        <p className="truncate text-xs text-slate-500">{a.email}</p>
                      </td>
                      <td className="px-5 py-3.5 md:px-6">
                        <VerifyBadge value={a.verify} />
                      </td>
                      <td className="px-5 py-3.5 md:px-6">
                        <AccountStatusBadge value={a.accountStatus} />
                      </td>
                      <td className="px-5 py-3.5 tabular-nums text-slate-700 md:px-6">
                        {a.activeListings ?? a.listings}/{a.listings}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800 md:px-6">{a.commission}</td>
                      <td className="px-5 py-3.5 text-slate-700 md:px-6">{a.walletBalance}</td>
                      <td className="px-5 py-3.5 md:px-6">
                        <HealthBadge value={a.health} />
                      </td>
                      <td className="px-5 py-3.5 text-right md:px-6">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {a.verify === 'Pending' && a.id ? (
                            <>
                              <button
                                type="button"
                                onClick={() => moderateVerification(a.id, true)}
                                disabled={Boolean(moderatingByUserId[String(a.id)])}
                                className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => moderateVerification(a.id, false)}
                                disabled={Boolean(moderatingByUserId[String(a.id)])}
                                className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => setViewAgent(a)}
                            className="rounded-md px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => copyAgentId(a)}
                            className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                          >
                            Copy ID
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500 md:px-6">
              <span>
                Page {page} of {totalPages} · {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-md border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      <AdminModalShell
        size="xl"
        open={Boolean(viewAgent)}
        onClose={() => setViewAgent(null)}
        title="Agent dossier"
        subtitle={viewAgent ? `${viewAgent.name} · ${viewAgent.id}` : ''}
        footer={
          <button
            type="button"
            onClick={() => setViewAgent(null)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        }
      >
        {viewAgent ? (
          <div className="space-y-8">
            <div>
              <SectionTitle>Identity & business</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Agent ID" value={viewAgent.id} />
                <Field label="Business name" value={viewAgent.name} />
                <Field label="Primary contact" value={viewAgent.contactName} />
                <Field label="Work email" value={viewAgent.email} />
                <Field label="Phone" value={viewAgent.phone} />
                <Field label="Registered" value={viewAgent.registeredAt} />
                <Field label="Street address" value={viewAgent.address} />
                <Field label="City / region" value={viewAgent.city} />
                <Field label="RC (CAC)" value={viewAgent.rcNumber} />
                <Field label="Tax ID (TIN)" value={viewAgent.taxId} />
              </div>
            </div>

            <div>
              <SectionTitle>Verification & compliance</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Verification status" value={viewAgent.verify} />
                <Field label="Account status" value={viewAgent.accountStatus} />
                <Field label="KYC tier" value={viewAgent.kycLevel} />
                <Field label="Documents" value={viewAgent.documentsStatus} />
                <Field label="NIN (masked)" value={viewAgent.ninMasked} />
                <Field label="BVN (masked)" value={viewAgent.bvnMasked} />
                <Field label="Avg. lead response" value={viewAgent.leadResponseAvg} />
                <Field label="Complaints (90d)" value={String(viewAgent.complaints90d ?? '—')} />
                <Field label="Risk / health" value={viewAgent.health} />
              </div>
            </div>

            <div>
              <SectionTitle>Performance & wallet</SectionTitle>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Total listings" value={String(viewAgent.listings)} />
                <Field label="Active listings" value={String(viewAgent.activeListings ?? viewAgent.listings)} />
                <Field label="Commission (YTD)" value={viewAgent.commission} />
                <Field label="Wallet balance" value={viewAgent.walletBalance} />
                <Field label="Pending payout" value={viewAgent.pendingPayout} />
                <Field label="Lifetime payouts" value={viewAgent.lifetimePayouts} />
                <Field label="Last payout date" value={viewAgent.lastPayoutAt} />
                <Field label="Last payout amount" value={viewAgent.lastPayoutAmount} />
                <Field label="Default payout method" value={viewAgent.payoutMethod} />
              </div>
            </div>

            <div>
              <SectionTitle>Payout accounts (bank)</SectionTitle>
              <p className="mb-4 text-xs text-slate-500">All settlement rails on file. Masked account numbers only in this demo UI.</p>
              <div className="space-y-4">
                {payoutAccounts.length === 0 ? (
                  <p className="text-sm text-slate-500">No bank accounts on file.</p>
                ) : (
                  payoutAccounts.map((acct, i) => (
                    <div
                      key={`${acct.accountNumber}-${i}`}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 ring-1 ring-slate-100"
                    >
                      <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">{acct.label}</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <Field label="Bank name" value={acct.bankName} />
                        <Field label="Account name" value={acct.accountName} />
                        <Field label="Account number" value={acct.accountNumber} />
                        <Field label="Bank code" value={acct.bankCode} />
                        <Field label="Verified / status" value={acct.verifiedAt} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {viewAgent.mobileMoney ? (
              <div>
                <SectionTitle>Mobile money & instant rails</SectionTitle>
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Provider" value={viewAgent.mobileMoney.provider} />
                    <Field label="Label" value={viewAgent.mobileMoney.label} />
                    <Field label="Number / ID" value={viewAgent.mobileMoney.accountNumber} />
                    <Field label="Verification" value={viewAgent.mobileMoney.verifiedAt} />
                  </div>
                </div>
              </div>
            ) : null}

            {viewAgent.internalNotes ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Internal notes</p>
                <p className="mt-1 text-sm text-amber-950/90">{viewAgent.internalNotes}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </AdminModalShell>
    </div>
  )
}
