import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { adminUserRoles, adminUsers as adminUsersSeed } from '../../data/adminSeed'
import AdminModalShell from './AdminModalShell'

const PAGE_SIZE = 6

function StatusBadge({ status }) {
  const map = {
    Active: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
    Pending: 'bg-amber-50 text-amber-900 ring-amber-100',
    Suspended: 'bg-red-50 text-red-800 ring-red-100',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${map[status] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
      {status}
    </span>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-slate-900">{value ?? '—'}</p>
    </div>
  )
}

export default function AdminUsersPage() {
  const toast = useToast()
  const [users, setUsers] = useState(() => adminUsersSeed.map((r) => ({ ...r })))
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage] = useState(1)

  const [viewUser, setViewUser] = useState(null)
  const [editUser, setEditUser] = useState(null)
  const [editRole, setEditRole] = useState('User')
  const [confirm, setConfirm] = useState(null)

  const stats = useMemo(() => {
    const total = users.length
    const active = users.filter((u) => u.status === 'Active').length
    const pending = users.filter((u) => u.status === 'Pending').length
    const suspended = users.filter((u) => u.status === 'Suspended').length
    return { total, active, pending, suspended }
  }, [users])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (statusFilter !== 'all' && u.status !== statusFilter) return false
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (!q) return true
      return (
        u.name.toLowerCase().includes(q) ||
        String(u.email || '')
          .toLowerCase()
          .includes(q) ||
        String(u.id || '')
          .toLowerCase()
          .includes(q)
      )
    })
  }, [users, search, statusFilter, roleFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, roleFilter])

  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const resetFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setRoleFilter('all')
    toast.info('Filters cleared', 'Showing the full member directory again.')
  }

  const exportCsv = () => {
    toast.success('Export ready', `Prepared ${filtered.length} row(s) for download (demo — connect an API for real CSV).`)
  }

  const openEditRole = (u) => {
    setViewUser(null)
    setEditRole(u.role)
    setEditUser(u)
  }

  const saveRole = () => {
    if (!editUser) return
    setUsers((prev) => prev.map((x) => (x.id === editUser.id ? { ...x, role: editRole } : x)))
    toast.success('Role updated', `${editUser.name} is now a ${editRole}.`)
    setEditUser(null)
  }

  const applyConfirm = () => {
    if (!confirm) return
    const { type, user } = confirm
    if (type === 'suspend') {
      setUsers((prev) => prev.map((x) => (x.id === user.id ? { ...x, status: 'Suspended', lastActive: '—' } : x)))
      toast.success('Account suspended', `${user.name} can no longer sign in or transact.`)
    }
    if (type === 'remove') {
      setUsers((prev) => prev.filter((x) => x.id !== user.id))
      toast.success('Account removed', `${user.name} was removed from the directory (demo only).`)
    }
    if (type === 'approve') {
      setUsers((prev) =>
        prev.map((x) => (x.id === user.id ? { ...x, status: 'Active', lastActive: 'Just now' } : x)),
      )
      toast.success('Account approved', `${user.name} can now use the platform.`)
    }
    setConfirm(null)
    setViewUser((v) => {
      if (!v || v.id !== user.id) return v
      if (type === 'remove') return null
      if (type === 'suspend') return { ...v, status: 'Suspended', lastActive: '—' }
      if (type === 'approve') return { ...v, status: 'Active', lastActive: 'Just now' }
      return v
    })
    if (type === 'remove') {
      setEditUser((e) => (e?.id === user.id ? null : e))
    }
  }

  const reactivateUser = (u) => {
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, status: 'Active', lastActive: 'Just now' } : x)))
    toast.success('Account reactivated', `${u.name} is active again.`)
  }

  const sendPasswordReset = (u) => {
    toast.info('Reset link sent', `If email delivery were live, ${u.email} would receive a secure reset link.`)
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1760px] space-y-7 px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-6 lg:px-8 lg:py-8 xl:px-11 xl:py-9">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Users</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Search and manage member accounts: buyers, sellers, and agents. Actions here are demo-only — wire your API for real moderation and audit logs.
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
            onClick={exportCsv}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm md:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="user-search">
                Search
              </label>
              <input
                id="user-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, or ID…"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-sm outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="user-status">
                Status
              </label>
              <select
                id="user-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
              >
                <option value="all">All statuses</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400" htmlFor="user-role">
                Role
              </label>
              <select
                id="user-role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
              >
                <option value="all">All roles</option>
                {adminUserRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-slate-500 lg:max-w-[200px] lg:text-right">
            Showing <span className="font-semibold text-slate-700">{filtered.length}</span> of {users.length} members
          </p>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total members', value: stats.total, tone: 'text-slate-900' },
          { label: 'Active', value: stats.active, tone: 'text-emerald-700' },
          { label: 'Pending review', value: stats.pending, tone: 'text-amber-700' },
          { label: 'Suspended', value: stats.suspended, tone: 'text-red-700' },
        ].map((c) => (
          <article key={c.label} className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-slate-500">{c.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${c.tone}`}>{c.value}</p>
          </article>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 md:px-6">
          <h2 className="text-[15px] font-semibold text-slate-900">Member directory</h2>
          <p className="mt-0.5 text-sm text-slate-500">Platform accounts (users and agents).</p>
        </div>
        {filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm font-medium text-slate-700">No members match your filters</p>
            <p className="mt-1 text-sm text-slate-500">Try clearing search or widening status / role.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 md:px-6">Member</th>
                    <th className="px-5 py-3 md:px-6">Email</th>
                    <th className="px-5 py-3 md:px-6">Role</th>
                    <th className="px-5 py-3 md:px-6">Status</th>
                    <th className="px-5 py-3 md:px-6">Joined</th>
                    <th className="px-5 py-3 md:px-6">Last active</th>
                    <th className="px-5 py-3 text-right md:px-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3.5 md:px-6">
                        <p className="font-medium text-slate-900">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.id}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 md:px-6">{u.email}</td>
                      <td className="px-5 py-3.5 text-slate-700 md:px-6">{u.role}</td>
                      <td className="px-5 py-3.5 md:px-6">
                        <StatusBadge status={u.status} />
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 md:px-6">{u.joined}</td>
                      <td className="px-5 py-3.5 text-slate-600 md:px-6">{u.lastActive ?? '—'}</td>
                      <td className="px-5 py-3.5 text-right md:px-6">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditUser(null)
                              setViewUser(u)
                            }}
                            className="rounded-md px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditRole(u)}
                            className="rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Role
                          </button>
                          <button
                            type="button"
                            onClick={() => sendPasswordReset(u)}
                            className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                          >
                            Reset link
                          </button>
                          {u.status === 'Pending' ? (
                            <>
                              <button
                                type="button"
                                onClick={() => setConfirm({ type: 'approve', user: u })}
                                className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirm({ type: 'remove', user: u })}
                                className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                Reject
                              </button>
                            </>
                          ) : null}
                          {u.status === 'Active' ? (
                            <button
                              type="button"
                              onClick={() => setConfirm({ type: 'suspend', user: u })}
                              className="rounded-md px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                            >
                              Suspend
                            </button>
                          ) : null}
                          {u.status === 'Suspended' ? (
                            <button
                              type="button"
                              onClick={() => reactivateUser(u)}
                              className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                            >
                              Reactivate
                            </button>
                          ) : null}
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
        open={Boolean(viewUser)}
        onClose={() => setViewUser(null)}
        title="Member profile"
        subtitle={viewUser ? `${viewUser.name} · ${viewUser.email}` : ''}
        footer={
          <button
            type="button"
            onClick={() => setViewUser(null)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        }
      >
        {viewUser ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Account ID" value={viewUser.id} />
            <Field label="Status" value={viewUser.status} />
            <Field label="Role" value={viewUser.role} />
            <Field label="Joined" value={viewUser.joined} />
            <Field label="Phone" value={viewUser.phone} />
            <Field label="City" value={viewUser.city} />
            <Field label="Wallet (demo)" value={viewUser.wallet} />
            <Field label="Last active" value={viewUser.lastActive ?? '—'} />
          </div>
        ) : null}
      </AdminModalShell>

      <AdminModalShell
        open={Boolean(editUser)}
        onClose={() => setEditUser(null)}
        title="Change role"
        subtitle={editUser ? `${editUser.name} · ${editUser.email}` : ''}
        footer={
          <>
            <button type="button" onClick={() => setEditUser(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="button" onClick={saveRole} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Save role
            </button>
          </>
        }
      >
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="user-edit-role">
            Role
          </label>
          <select
            id="user-edit-role"
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
          >
            {adminUserRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-500">Agents can list properties; users browse and transact. Production systems should enforce verification before agent role changes.</p>
        </div>
      </AdminModalShell>

      <AdminModalShell
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={
          !confirm
            ? ''
            : confirm.type === 'suspend'
              ? 'Suspend this account?'
              : confirm.type === 'approve'
                ? 'Approve this account?'
                : 'Reject registration?'
        }
        subtitle={
          !confirm
            ? ''
            : confirm.type === 'suspend'
              ? `${confirm.user.name} will be blocked from signing in until reinstated.`
              : confirm.type === 'approve'
                ? `${confirm.user.name} will become an active member immediately.`
                : `${confirm.user.name} will be removed from the pending queue (demo).`
        }
        footer={
          <>
            <button type="button" onClick={() => setConfirm(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button
              type="button"
              onClick={applyConfirm}
              className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${
                !confirm ? 'bg-slate-400' : confirm.type === 'remove' ? 'bg-red-600 hover:bg-red-500' : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {!confirm ? 'OK' : confirm.type === 'suspend' ? 'Suspend account' : confirm.type === 'approve' ? 'Approve account' : 'Reject & remove'}
            </button>
          </>
        }
      >
        {confirm ? (
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{confirm.user.email}</span> — confirm this is the correct person before continuing.
          </p>
        ) : null}
      </AdminModalShell>
    </div>
  )
}
