import { useCallback, useEffect, useMemo, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext.jsx'
import { authChangePassword, authRequestPasswordChangeOtp } from '../../lib/api.js'

function passwordClientHint(pw) {
  const p = String(pw || '')
  if (p.length < 10) return 'Use at least 10 characters.'
  if (!/[a-zA-Z]/.test(p)) return 'Include at least one letter.'
  if (!/\d/.test(p)) return 'Include at least one number.'
  if (!/[^A-Za-z0-9]/.test(p)) return 'Include at least one symbol.'
  return ''
}

const selectStyle = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.65rem center',
}

const tabs = [
  { id: 'personal', label: 'Personal Information' },
  { id: 'business', label: 'Business Information' },
  { id: 'bank', label: 'Bank Details' },
  { id: 'security', label: 'Password & Security' },
  { id: 'notifications', label: 'Notification Preferences' },
]

const quickActions = [
  { id: 'view-profile', title: 'View Public Profile', subtitle: 'See how buyers view your profile' },
  { id: 'business', title: 'Edit Business Information', subtitle: 'Update your business details' },
  { id: 'bank', title: 'Manage Bank Details', subtitle: 'Update payout account information' },
  { id: 'change-password', title: 'Change Password', subtitle: 'Update your account password' },
]

function BaseModal({ open, title, subtitle, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" aria-label="Close dialog" onClick={onClose} />
      <div className="relative flex max-h-[min(90vh,680px)] w-full max-w-[460px] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15">
        <div className="shrink-0 border-b border-slate-100 px-5 pb-4 pt-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-[#111827]">{title}</h2>
              {subtitle ? <p className="mt-1 text-[13px] text-slate-500">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              aria-label="Close"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
        {footer ? <div className="shrink-0 border-t border-slate-100 px-5 py-4 sm:px-6">{footer}</div> : null}
      </div>
    </div>
  )
}

function PasswordField({ label, id, value, onChange }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-[12px] font-semibold text-slate-600" htmlFor={id}>
        {label}
      </label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-11 text-[13px] text-[#111827] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  )
}

function InputField({ label, value, onChange, type = 'text', readOnly }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-slate-600">{label}</label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        className={`mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-[13px] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 ${
          readOnly ? 'cursor-default bg-slate-50 text-slate-700' : 'bg-white text-[#111827]'
        }`}
      />
    </div>
  )
}

function SummaryCard({ title, subtitle, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-100 px-4 py-3.5 sm:px-5">
        <h3 className="text-[14px] font-bold text-[#111827]">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-[11px] text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="px-4 py-3.5 sm:px-5">{children}</div>
    </div>
  )
}

export default function AgentProfilePage() {
  const toast = useToast()
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState('personal')
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [otpOpen, setOtpOpen] = useState(false)
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [otp, setOtp] = useState('')
  const [form, setForm] = useState({
    fullName: 'John Doe',
    email: 'johndoe@example.com',
    phone: '+234 801 234 5678',
    dob: '1990-05-20',
    gender: 'Male',
    nationality: 'Nigerian',
    language: 'English',
    businessName: 'Doe Properties Ltd.',
    businessAddress: '15 Admiralty Way, Lekki Phase 1, Lagos',
    accountName: 'John Doe',
    accountNumber: '0123456789',
    bankName: 'GTBank',
    bio: 'Experienced real estate agent specializing in helping clients find their dream homes and investment properties. Dedicated to providing excellent service and building long-term relationships.',
  })

  const completionPct = 85

  const update = (key, value) => setForm((s) => ({ ...s, [key]: value }))
  const outlineBtn =
    'inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50'

  const onQuickAction = (id) => {
    if (id === 'business') {
      setActiveTab('business')
      return
    }
    if (id === 'bank') {
      setActiveTab('bank')
      return
    }
    if (id === 'change-password') {
      setChangePasswordOpen(true)
      return
    }
    toast.info('Public profile', 'Public profile preview is available in production mode.')
  }

  const beginPasswordChange = useCallback(async () => {
    if (!token) {
      toast.warning('Session missing', 'Sign in again to change your password.')
      return
    }
    if (!pwd.current || !pwd.next || pwd.next !== pwd.confirm) {
      toast.warning('Fix password fields', 'Please complete fields and ensure new passwords match.')
      return
    }
    const hint = passwordClientHint(pwd.next)
    if (hint) {
      toast.warning('New password too weak', hint)
      return
    }
    try {
      await authRequestPasswordChangeOtp(token)
      setOtp('')
      setOtpOpen(true)
      toast.success('Code sent', 'Check your email for a 6-digit code.')
    } catch (e) {
      toast.error('Could not send code', e.message || 'Try again later.')
    }
  }, [pwd, toast, token])

  const verifyOtp = useCallback(async () => {
    if (!token) {
      toast.warning('Session missing', 'Sign in again to change your password.')
      return
    }
    if (!/^\d{6}$/.test(otp)) {
      toast.warning('Invalid OTP', 'Enter a valid 6-digit OTP code.')
      return
    }
    try {
      await authChangePassword(token, {
        currentPassword: pwd.current,
        newPassword: pwd.next,
        otp,
      })
      setOtpOpen(false)
      setChangePasswordOpen(false)
      setPwd({ current: '', next: '', confirm: '' })
      setOtp('')
      toast.success('Password updated', 'Your password was changed successfully.')
    } catch (e) {
      toast.error('Update failed', e.message || 'Check your current password and OTP.')
    }
  }, [otp, pwd, toast, token])

  const progressRows = useMemo(
    () => [
      { label: 'Personal Information', done: true },
      { label: 'Business Information', done: true },
      { label: 'Bank Details', done: true },
      { label: 'Profile Photo', done: true },
      { label: 'About Me', done: false },
    ],
    [],
  )

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1480px] flex-col px-4 py-3 text-slate-800 md:px-6 md:py-4">
      <div className="min-w-0">
        <h1 className="text-[24px] font-bold leading-tight tracking-tight text-[#111827]">Profile</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-slate-500">Manage your personal information, business details, and account preferences.</p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-5 lg:items-start">
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-3">
          <section className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            <div className="grid gap-4 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-5">
              <div className="relative h-[86px] w-[86px] overflow-hidden rounded-full ring-2 ring-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=160&q=80"
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  className="absolute bottom-0 right-0 grid h-6 w-6 place-items-center rounded-full border border-white bg-indigo-600 text-white"
                  aria-label="Change profile image"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" strokeLinecap="round" />
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[24px] font-bold leading-none tracking-tight text-[#111827]">John Doe</h2>
                  <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">Verified Agent</span>
                </div>
                <div className="mt-2 space-y-1.5 text-[12px] text-slate-600">
                  <p className="flex items-center gap-1.5">
                    <span className="text-slate-400">@</span>
                    johndoe@example.com
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span className="text-slate-400">✆</span>
                    +234 801 234 5678
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span className="text-slate-400">⌖</span>
                    Lagos, Nigeria
                  </p>
                </div>
              </div>

              <div className="grid gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-[12px] sm:justify-items-end">
                <p className="text-slate-500">
                  <span className="font-semibold text-slate-700">Member Since:</span> Jan 15, 2025
                </p>
                <p className="text-slate-500">
                  <span className="font-semibold text-slate-700">Agent ID:</span> AGT-78645
                </p>
                <button type="button" className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-indigo-600 shadow-sm transition hover:bg-slate-50">
                  View Public Profile
                </button>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            <div className="border-b border-slate-200 px-4 sm:px-5">
              <nav className="-mb-px flex flex-wrap gap-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`border-b-2 px-3 py-2.5 text-[13px] font-medium transition ${
                      activeTab === tab.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-4 sm:p-5">
              {activeTab === 'personal' && (
                <div>
                  <h3 className="text-[15px] font-bold text-[#111827]">Personal Information</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <InputField label="Full Name" value={form.fullName} onChange={(v) => update('fullName', v)} />
                    <div className="sm:row-span-2">
                      <label className="block text-[12px] font-semibold text-slate-600">Profile Picture</label>
                      <div className="mt-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3">
                        <p className="text-[11px] text-slate-500">JPG, PNG or GIF. Max size 2MB.</p>
                        <button type="button" className="mt-2 inline-flex h-8 items-center rounded-lg border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700">
                          Change Photo
                        </button>
                      </div>
                    </div>
                    <InputField label="Email Address" value={form.email} onChange={(v) => update('email', v)} />
                    <InputField label="Phone Number" value={form.phone} onChange={(v) => update('phone', v)} />
                    <InputField label="Date of Birth" value={form.dob} onChange={(v) => update('dob', v)} type="date" />

                    <div>
                      <label className="block text-[12px] font-semibold text-slate-600">Gender</label>
                      <select
                        value={form.gender}
                        onChange={(e) => update('gender', e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 pr-9 text-[13px] font-medium text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
                        style={selectStyle}
                      >
                        <option>Male</option>
                        <option>Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-600">Nationality</label>
                      <select
                        value={form.nationality}
                        onChange={(e) => update('nationality', e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 pr-9 text-[13px] font-medium text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
                        style={selectStyle}
                      >
                        <option>Nigerian</option>
                        <option>Ghanaian</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-slate-600">Language</label>
                      <select
                        value={form.language}
                        onChange={(e) => update('language', e.target.value)}
                        className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 pr-9 text-[13px] font-medium text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
                        style={selectStyle}
                      >
                        <option>English</option>
                        <option>French</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'business' && (
                <div>
                  <h3 className="text-[15px] font-bold text-[#111827]">Business Information</h3>
                  <div className="mt-3 grid gap-3">
                    <InputField label="Business Name" value={form.businessName} onChange={(v) => update('businessName', v)} />
                    <InputField label="Business Address" value={form.businessAddress} onChange={(v) => update('businessAddress', v)} />
                  </div>
                </div>
              )}

              {activeTab === 'bank' && (
                <div>
                  <h3 className="text-[15px] font-bold text-[#111827]">Bank Details</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <InputField label="Account Name" value={form.accountName} onChange={(v) => update('accountName', v)} />
                    <InputField label="Bank Name" value={form.bankName} onChange={(v) => update('bankName', v)} />
                    <InputField label="Account Number" value={form.accountNumber} onChange={(v) => update('accountNumber', v)} />
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h3 className="text-[15px] font-bold text-[#111827]">Password & Security</h3>
                  <p className="mt-1 text-[12px] text-slate-500">Change password and update your security preferences from the Quick Actions panel.</p>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <h3 className="text-[15px] font-bold text-[#111827]">Notification Preferences</h3>
                  <p className="mt-1 text-[12px] text-slate-500">Manage alerts and communication settings from the Settings page.</p>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button type="button" className="inline-flex h-10 items-center justify-center rounded-xl bg-[#6366F1] px-5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600">
                  Save Changes
                </button>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] sm:p-5">
            <h3 className="text-[15px] font-bold text-[#111827]">About Me</h3>
            <p className="mt-0.5 text-[12px] text-slate-500">Write a short bio for your public profile.</p>
            <textarea
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
              maxLength={500}
              className="mt-3 h-28 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
            />
            <div className="mt-2 flex items-center justify-between">
              <p className="text-[11px] text-slate-500">{form.bio.length}/500</p>
              <button type="button" className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                Save Bio
              </button>
            </div>
          </section>
        </div>

        <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
          <SummaryCard title="Profile Completion" subtitle="Complete your profile to build trust and get more leads.">
            <div className="flex items-start gap-4">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[conic-gradient(#6366F1_306deg,#E5E7EB_0)] sm:h-24 sm:w-24">
                <div className="grid h-[64px] w-[64px] place-items-center rounded-full bg-white text-center sm:h-[76px] sm:w-[76px]">
                  <p className="text-[24px] font-bold leading-none text-slate-900">{completionPct}%</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Completed</p>
                </div>
              </div>
              <ul className="flex-1 space-y-1.5 text-[12px]">
                {progressRows.map((r) => (
                  <li key={r.label} className="flex items-center justify-between gap-2 text-slate-600">
                    <span>{r.label}</span>
                    <span className={r.done ? 'text-emerald-600' : 'text-slate-400'}>{r.done ? '✓' : '○'}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button type="button" className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
              Complete Profile
            </button>
          </SummaryCard>

          <SummaryCard title="Account Verification" subtitle="Your account is verified and eligible for promotions.">
            <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2.5 text-[12px] text-emerald-800">
              <span className="mt-0.5 text-emerald-600">✓</span>
              <span>Verified on Jan 15, 2025</span>
            </div>
          </SummaryCard>

          <SummaryCard title="Quick Actions">
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
              {quickActions.map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => onQuickAction(item.id)} className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-slate-50">
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-slate-700">{item.title}</span>
                      <span className="mt-0.5 block truncate text-[11px] text-slate-500">{item.subtitle}</span>
                    </span>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </SummaryCard>

          <div className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#111827]">Need Help?</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-500">Our support team is here to help with profile and account setup.</p>
                <button type="button" className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
                  Chat with Support
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <BaseModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        title="Change Password"
        subtitle="Enter your old and new password, then verify with OTP."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={outlineBtn} onClick={() => setChangePasswordOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              onClick={beginPasswordChange}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#6366F1] px-5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600"
            >
              Continue
            </button>
          </div>
        }
      >
        <div className="grid gap-3">
          <PasswordField label="Current Password" id="profile-pwd-current" value={pwd.current} onChange={(v) => setPwd((p) => ({ ...p, current: v }))} />
          <PasswordField label="New Password" id="profile-pwd-new" value={pwd.next} onChange={(v) => setPwd((p) => ({ ...p, next: v }))} />
          <PasswordField label="Confirm New Password" id="profile-pwd-confirm" value={pwd.confirm} onChange={(v) => setPwd((p) => ({ ...p, confirm: v }))} />
        </div>
      </BaseModal>

      <BaseModal
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        title="Verify OTP"
        subtitle="Enter the 6-digit OTP sent to your email and phone."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={outlineBtn} onClick={() => setOtpOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              onClick={verifyOtp}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#6366F1] px-5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600"
            >
              Verify OTP
            </button>
          </div>
        }
      >
        <label className="block text-[12px] font-semibold text-slate-600" htmlFor="profile-otp-input">
          OTP Code
        </label>
        <input
          id="profile-otp-input"
          type="text"
          inputMode="numeric"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
          className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[14px] font-semibold tracking-[0.2em] text-[#111827] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
          placeholder="000000"
        />
      </BaseModal>

    </div>
  )
}
