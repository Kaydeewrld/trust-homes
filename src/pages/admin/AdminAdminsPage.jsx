import { useMemo, useState } from 'react'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { useToast } from '../../context/ToastContext'
import { adminStaffRoles, adminStaffSeed } from '../../data/adminSeed'
import AdminModalShell from './AdminModalShell'

function emailValid(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
}

function StatusBadge({ status }) {
  const map = {
    Active: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
    Invited: 'bg-amber-50 text-amber-900 ring-amber-100',
    Suspended: 'bg-red-50 text-red-800 ring-red-100',
  }
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${map[status] || 'bg-slate-100 text-slate-700 ring-slate-200'}`}>
      {status}
    </span>
  )
}

export default function AdminAdminsPage() {
  const toast = useToast()
  const { adminEmail } = useAdminAuth()
  const [staff, setStaff] = useState(() => adminStaffSeed.map((r) => ({ ...r })))

  const [addOpen, setAddOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formRole, setFormRole] = useState('Operations')
  const [formNote, setFormNote] = useState('')

  const [editRole, setEditRole] = useState('Operations')

  const selfEmail = (adminEmail || '').trim().toLowerCase()
  const isSelf = (email) => {
    if (!selfEmail || email == null) return false
    return String(email).trim().toLowerCase() === selfEmail
  }

  const resetAddForm = () => {
    setFormName('')
    setFormEmail('')
    setFormRole('Operations')
    setFormNote('')
  }

  const openAdd = () => {
    resetAddForm()
    setAddOpen(true)
  }

  const submitAdd = () => {
    const name = formName.trim()
    const email = formEmail.trim()
    const note = formNote.trim()
    if (name.length < 2) {
      toast.error('Invalid name', 'Enter the admin’s full name (at least 2 characters).')
      return
    }
    if (!emailValid(email)) {
      toast.error('Invalid email', 'Use a valid work email address.')
      return
    }
    if (staff.some((s) => String(s.email || '').toLowerCase() === email.toLowerCase())) {
      toast.warning('Already exists', 'An admin with this email is already on the roster.')
      return
    }
    const row = {
      id: `adm-${Date.now()}`,
      name,
      email,
      role: formRole,
      status: 'Invited',
      lastActive: '—',
      addedBy: selfEmail || 'current.session',
    }
    setStaff((prev) => [row, ...prev])
    setAddOpen(false)
    resetAddForm()
    toast.success(
      'Admin invited',
      `${email} will receive a secure setup link. No public sign-up is used.${note ? ' Internal note attached for audit.' : ''}`,
    )
  }

  const submitEditRole = () => {
    if (!editTarget) return
    setStaff((prev) => prev.map((s) => (s.id === editTarget.id ? { ...s, role: editRole } : s)))
    toast.success('Role updated', `${editTarget.name} is now ${editRole}.`)
    setEditTarget(null)
  }

  const applyConfirm = () => {
    if (!confirm) return
    const { type, member } = confirm
    if (type === 'suspend') {
      setStaff((prev) => prev.map((s) => (s.id === member.id ? { ...s, status: 'Suspended', lastActive: '—' } : s)))
      toast.success('Access suspended', `${member.name} can no longer sign in until reinstated.`)
    }
    if (type === 'remove') {
      setStaff((prev) => prev.filter((s) => s.id !== member.id))
      toast.success('Admin removed', `${member.name} has been removed from the staff roster.`)
    }
    if (type === 'revoke') {
      setStaff((prev) => prev.filter((s) => s.id !== member.id))
      toast.success('Invite revoked', `${member.email} will not be able to complete onboarding.`)
    }
    setConfirm(null)
  }

  const resendInvite = (member) => {
    toast.info('Invite resent', `A fresh setup link was sent to ${member.email}.`)
  }

  const reactivateAdmin = (member) => {
    setStaff((prev) => prev.map((s) => (s.id === member.id ? { ...s, status: 'Active', lastActive: 'Just now' } : s)))
    toast.success('Access restored', `${member.name} can sign in again.`)
  }

  const exportAudit = () => {
    toast.info('Export started', 'Staff roster audit will download when the server is connected.')
  }

  const openEdit = (member) => {
    setEditRole(member.role)
    setEditTarget(member)
  }

  const stats = useMemo(() => {
    const active = staff.filter((s) => s.status === 'Active').length
    const invited = staff.filter((s) => s.status === 'Invited').length
    return { total: staff.length, active, invited }
  }, [staff])

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1760px] space-y-7 px-4 py-5 sm:px-5 sm:py-6 md:px-6 md:py-6 lg:px-8 lg:py-8 xl:px-11 xl:py-9">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Admin management</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Provision internal staff accounts only. Invited admins complete setup via a secure link — there is no public registration.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportAudit}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Export roster
          </button>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm shadow-indigo-600/25 hover:bg-indigo-500"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            Add admin
          </button>
        </div>
      </div>

      <section className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-5 py-4">
        <div className="flex flex-wrap items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-indigo-950">Security</p>
            <p className="mt-1 text-sm leading-relaxed text-indigo-900/80">
              Every change here should be audited in production (who invited whom, IP, timestamp). Use least-privilege roles; only Super Admins can invite other Super Admins.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Total staff</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{stats.total}</p>
        </article>
        <article className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Active</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-700">{stats.active}</p>
        </article>
        <article className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-slate-500">Pending invite</p>
          <p className="mt-1 text-2xl font-semibold text-amber-700">{stats.invited}</p>
        </article>
      </div>

      <section className="overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 md:px-6">
          <h2 className="text-[15px] font-semibold text-slate-900">Staff roster</h2>
          <p className="mt-0.5 text-sm text-slate-500">TrustedHome employees and authorized operators.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/90 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 md:px-6">Name</th>
                <th className="px-5 py-3 md:px-6">Work email</th>
                <th className="px-5 py-3 md:px-6">Role</th>
                <th className="px-5 py-3 md:px-6">Status</th>
                <th className="px-5 py-3 md:px-6">Last active</th>
                <th className="px-5 py-3 md:px-6">Added by</th>
                <th className="px-5 py-3 text-right md:px-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.map((member) => {
                const self = isSelf(member.email)
                return (
                  <tr key={member.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3.5 font-medium text-slate-900 md:px-6">
                      {member.name}
                      {self ? <span className="ml-2 text-xs font-normal text-slate-400">(you)</span> : null}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 md:px-6">{member.email}</td>
                    <td className="px-5 py-3.5 text-slate-700 md:px-6">{member.role}</td>
                    <td className="px-5 py-3.5 md:px-6">
                      <StatusBadge status={member.status} />
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 md:px-6">{member.lastActive}</td>
                    <td className="px-5 py-3.5 text-slate-500 md:px-6">{member.addedBy}</td>
                    <td className="px-5 py-3.5 text-right md:px-6">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {member.status === 'Invited' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => resendInvite(member)}
                              className="rounded-md px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                            >
                              Resend
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirm({ type: 'revoke', member })}
                              className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                            >
                              Revoke invite
                            </button>
                          </>
                        ) : null}
                        {member.status === 'Suspended' ? (
                          <button
                            type="button"
                            onClick={() => reactivateAdmin(member)}
                            className="rounded-md px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                          >
                            Reactivate
                          </button>
                        ) : null}
                        <button type="button" onClick={() => openEdit(member)} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                          Role
                        </button>
                        {member.status === 'Active' && !self ? (
                          <button
                            type="button"
                            onClick={() => setConfirm({ type: 'suspend', member })}
                            className="rounded-md px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                          >
                            Suspend
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={self}
                          title={self ? 'You cannot remove your own account while signed in.' : ''}
                          onClick={() => !self && setConfirm({ type: 'remove', member })}
                          className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <AdminModalShell
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Invite new admin"
        subtitle="They will receive an email with a time-limited link to set their password. This flow is not exposed on the public site."
        footer={
          <>
            <button type="button" onClick={() => setAddOpen(false)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="button" onClick={submitAdd} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Send invite
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="adm-name">
              Full name
            </label>
            <input
              id="adm-name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
              placeholder="e.g. Ibrahim Bello"
              autoComplete="name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="adm-email">
              Work email
            </label>
            <input
              id="adm-email"
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
              placeholder="name@trustedhome.com"
              autoComplete="off"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="adm-role">
              Role
            </label>
            <select
              id="adm-role"
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
              className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
            >
              {adminStaffRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">Super Admin can manage other admins and sensitive financial controls.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="adm-note">
              Internal note <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="adm-note"
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
              placeholder="Reason for access, ticket ID, etc."
            />
          </div>
        </div>
      </AdminModalShell>

      <AdminModalShell
        open={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        title="Change role"
        subtitle={editTarget ? `${editTarget.name} · ${editTarget.email}` : ''}
        footer={
          <>
            <button type="button" onClick={() => setEditTarget(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Cancel
            </button>
            <button type="button" onClick={submitEditRole} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              Save role
            </button>
          </>
        }
      >
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-700" htmlFor="edit-role">
            Role
          </label>
          <select
            id="edit-role"
            value={editRole}
            onChange={(e) => setEditRole(e.target.value)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
          >
            {adminStaffRoles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </AdminModalShell>

      <AdminModalShell
        open={Boolean(confirm)}
        onClose={() => setConfirm(null)}
        title={
          !confirm
            ? ''
            : confirm.type === 'suspend'
              ? 'Suspend admin access?'
              : confirm.type === 'revoke'
                ? 'Revoke pending invite?'
                : 'Remove admin permanently?'
        }
        subtitle={
          !confirm
            ? ''
            : confirm.type === 'suspend'
              ? `${confirm.member.name} will be signed out and blocked until reinstated.`
              : confirm.type === 'revoke'
                ? `${confirm.member.name} will not be able to complete onboarding.`
                : `${confirm.member.name} will lose all admin access. This cannot be undone from the UI demo.`
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
                confirm?.type === 'remove' ? 'bg-red-600 hover:bg-red-500' : confirm?.type === 'revoke' ? 'bg-slate-700 hover:bg-slate-600' : 'bg-amber-600 hover:bg-amber-500'
              }`}
            >
              {confirm?.type === 'suspend' ? 'Suspend access' : confirm?.type === 'revoke' ? 'Revoke invite' : 'Remove admin'}
            </button>
          </>
        }
      >
        {confirm ? (
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{confirm.member.email}</span> — confirm this matches the person you intend to update.
          </p>
        ) : null}
      </AdminModalShell>
    </div>
  )
}
