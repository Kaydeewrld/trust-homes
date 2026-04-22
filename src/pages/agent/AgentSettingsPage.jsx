import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  agentSettingsProfile,
  phoneVisibilityOptions,
  privacyVisibilityOptions,
  timeZoneOptions,
} from '../../data/agentSettingsSeed'
import { useWallet } from '../../context/WalletContext'
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

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

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
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[min(90vh,720px)] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15"
      >
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
        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">{children}</div>
        {footer ? <div className="shrink-0 border-t border-slate-100 px-5 py-4 sm:px-6">{footer}</div> : null}
      </div>
    </div>
  )
}

function Toggle({ checked, onChange, id }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-indigo-400/70 ${
        checked ? 'bg-indigo-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`h-5 w-5 rounded-full bg-white shadow-[0_1px_2px_rgba(15,23,42,0.28)] transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function Field({ label, value, readOnly }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-slate-600">{label}</label>
      <input
        readOnly={readOnly}
        value={value}
        className={`mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3 text-[13px] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15 ${
          readOnly ? 'cursor-default bg-slate-50 text-slate-700' : 'bg-white text-[#111827]'
        }`}
      />
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
          autoComplete="off"
          className="h-10 w-full rounded-xl border border-slate-200 bg-white py-2 pl-3 pr-11 text-[13px] text-[#111827] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" strokeLinecap="round" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" />
              <circle cx="12" cy="12" r="3" strokeLinecap="round" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

const outlineBtn =
  'inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50'
const chevronRight = (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export default function AgentSettingsPage() {
  const [profile, setProfile] = useState(() => ({ ...agentSettingsProfile }))
  const toast = useToast()
  const { token } = useAuth()
  const [notif, setNotif] = useState({ email: true, sms: true, marketing: false, weekly: true })
  const [twoFA, setTwoFA] = useState(true)
  const [privacyVis, setPrivacyVis] = useState('public')
  const [phoneVis, setPhoneVis] = useState('leads')
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' })
  const [otpCode, setOtpCode] = useState('')

  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [twoFaModalOpen, setTwoFaModalOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [otpModalOpen, setOtpModalOpen] = useState(false)
  const [draftProfile, setDraftProfile] = useState(() => ({ ...agentSettingsProfile }))

  const [bankForm, setBankForm] = useState({
    accountName: 'John Doe',
    bankName: 'GTBank',
    accountNumber: '0123456789',
  })

  useEffect(() => {
    if (editProfileOpen) setDraftProfile({ ...profile })
  }, [editProfileOpen, profile])

  const saveProfileFromModal = useCallback(() => {
    setProfile({ ...draftProfile })
    setEditProfileOpen(false)
    toast.success('Profile updated', 'Your account details have been saved.')
  }, [draftProfile, toast])

  const savePreferences = useCallback(() => {
    toast.success('Preferences saved', 'Your notification settings are up to date.')
  }, [toast])

  const beginPasswordChange = useCallback(async () => {
    if (!token) {
      toast.warning('Session missing', 'Sign in again to change your password.')
      return
    }
    if (!pwd.current || !pwd.next) {
      toast.warning('Check your passwords', 'Fill in current and new password.')
      return
    }
    const hint = passwordClientHint(pwd.next)
    if (hint) {
      toast.warning('New password too weak', hint)
      return
    }
    if (pwd.next !== pwd.confirm) {
      toast.warning('Passwords do not match', 'Confirm your new password and try again.')
      return
    }
    try {
      await authRequestPasswordChangeOtp(token)
      setOtpCode('')
      setOtpModalOpen(true)
      toast.success('Code sent', 'Check your email for a 6-digit code.')
    } catch (e) {
      toast.error('Could not send code', e.message || 'Try again later.')
    }
  }, [pwd, toast, token])

  const verifyPasswordOtp = useCallback(async () => {
    if (!token) {
      toast.warning('Session missing', 'Sign in again to change your password.')
      return
    }
    if (!/^\d{6}$/.test(otpCode)) {
      toast.warning('Invalid OTP', 'Enter the 6-digit OTP sent to your email.')
      return
    }
    try {
      await authChangePassword(token, {
        currentPassword: pwd.current,
        newPassword: pwd.next,
        otp: otpCode,
      })
      setOtpModalOpen(false)
      setChangePasswordOpen(false)
      setPwd({ current: '', next: '', confirm: '' })
      setOtpCode('')
      toast.success('Password updated', 'Your password was changed successfully.')
    } catch (e) {
      toast.error('Update failed', e.message || 'Check your current password and OTP.')
    }
  }, [otpCode, pwd, toast, token])

  const quickActions = useMemo(
    () => [
      { label: 'Edit Profile', icon: 'user', onClick: () => setEditProfileOpen(true) },
      { label: 'Change Password', icon: 'lock', onClick: () => setChangePasswordOpen(true) },
      { label: 'Manage Bank Details', icon: 'bank', onClick: () => setBankOpen(true) },
      { label: 'Notification Settings', icon: 'bell', onClick: () => scrollToSection('notification-preferences') },
      { label: 'Privacy Settings', icon: 'shield', onClick: () => setPrivacyOpen(true) },
    ],
    [],
  )

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1480px] flex-col px-4 pb-0 pt-3 text-slate-800 md:px-6 md:pb-0 md:pt-4">
      <div className="min-w-0">
        <h1 className="text-[22px] font-bold leading-tight tracking-tight text-[#111827]">Settings</h1>
        <p className="mt-1 max-w-2xl text-[13px] text-slate-500">
          Manage your account, preferences, and security settings.
        </p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-5 lg:items-start">
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-3">
          {/* Account */}
          <section
            id="account-settings"
            className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
          >
            <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5 sm:py-4">
              <div className="flex min-w-0 gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-bold text-[#111827]">Account Settings</h2>
                  <p className="mt-0.5 text-[12px] text-slate-500">Your public profile and business information.</p>
                </div>
              </div>
              <button type="button" className={`${outlineBtn} shrink-0 self-start`} onClick={() => setEditProfileOpen(true)}>
                Edit Profile
              </button>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-2 sm:gap-x-4 sm:gap-y-3 sm:p-5">
              <Field label="Full name" value={profile.fullName} readOnly />
              <Field label="Email address" value={profile.email} readOnly />
              <Field label="Phone number" value={profile.phone} readOnly />
              <Field label="Business name" value={profile.businessName} readOnly />
              <div className="sm:col-span-2">
                <Field label="Business address" value={profile.businessAddress} readOnly />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-600">Time zone</label>
                <select
                  disabled
                  value={profile.timeZone}
                  className="mt-1.5 h-10 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 pr-9 text-[13px] font-medium text-slate-700"
                  style={selectStyle}
                >
                  {timeZoneOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section
            id="notification-preferences"
            className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
          >
            <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5 sm:py-4">
              <div className="flex min-w-0 gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-500 text-white shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 7h18s-3 0-3-7M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-bold text-[#111827]">Notification Preferences</h2>
                  <p className="mt-0.5 text-[12px] text-slate-500">Choose how we reach you about activity on TrustedHome.</p>
                </div>
              </div>
              <button type="button" className={`${outlineBtn} shrink-0 self-start`} onClick={savePreferences}>
                Save Preferences
              </button>
            </div>
            <div className="divide-y divide-slate-100 px-4 py-2 sm:px-5">
              {[
                { key: 'email', label: 'Email notifications', sub: 'Payouts, leads, and listing updates', icon: 'mail', val: notif.email, set: (v) => setNotif((s) => ({ ...s, email: v })) },
                { key: 'sms', label: 'SMS alerts', sub: 'Critical security and payment alerts', icon: 'sms', val: notif.sms, set: (v) => setNotif((s) => ({ ...s, sms: v })) },
                { key: 'marketing', label: 'Marketing & tips', sub: 'Product news and growth ideas', icon: 'spark', val: notif.marketing, set: (v) => setNotif((s) => ({ ...s, marketing: v })) },
                { key: 'weekly', label: 'Weekly performance summary', sub: 'Every Monday morning', icon: 'chart', val: notif.weekly, set: (v) => setNotif((s) => ({ ...s, weekly: v })) },
              ].map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                      {row.icon === 'mail' ? (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <path d="m22 6-10 7L2 6" strokeLinecap="round" />
                        </svg>
                      ) : row.icon === 'sms' ? (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinejoin="round" />
                        </svg>
                      ) : row.icon === 'spark' ? (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                          <path d="m12 3-1.5 4.5L6 9l4.5 1.5L12 15l1.5-4.5L18 9l-4.5-1.5L12 3zM5 19l1-3M19 19l-1-3" strokeLinecap="round" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                          <path d="M3 3v18h18" strokeLinecap="round" />
                          <path d="M7 12v5M12 8v9M17 5v12" strokeLinecap="round" />
                        </svg>
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#111827]">{row.label}</p>
                      <p className="mt-0.5 text-[12px] text-slate-500">{row.sub}</p>
                    </div>
                  </div>
                  <Toggle id={`notif-${row.key}`} checked={row.val} onChange={row.set} />
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Right column */}
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
          <div className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
            <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
              <h3 className="text-[15px] font-bold text-[#111827]">Quick Actions</h3>
              <p className="mt-0.5 text-[12px] text-slate-500">Jump to a section or open a tool.</p>
            </div>
            <ul className="divide-y divide-slate-100">
              {quickActions.map((a) => (
                <li key={a.label}>
                  <button
                    type="button"
                    onClick={a.onClick}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 sm:px-5"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
                        {a.icon === 'user' ? (
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        ) : a.icon === 'lock' ? (
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                            <rect x="5" y="11" width="14" height="10" rx="2" />
                            <path d="M12 16v-1M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
                          </svg>
                        ) : a.icon === 'bank' ? (
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                            <path d="M3 9h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9Z" strokeLinejoin="round" />
                            <path d="M3 10V7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3" />
                          </svg>
                        ) : a.icon === 'bell' ? (
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 7h18s-3 0-3-7M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span className="truncate text-[13px] font-semibold text-slate-800">{a.label}</span>
                    </span>
                    {chevronRight}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="overflow-hidden rounded-2xl border border-emerald-100/90 bg-emerald-50/80 p-4 sm:p-5">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-emerald-950">Keep Your Account Secure</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-emerald-900/85">
                  Turn on two-factor authentication so only you can sign in, even if your password is compromised.
                </p>
                <button
                  type="button"
                  onClick={() => setTwoFaModalOpen(true)}
                  className={`${outlineBtn} mt-3 inline-flex gap-2 border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50`}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <rect x="5" y="11" width="14" height="10" rx="2" />
                    <path d="M12 16v-1M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
                  </svg>
                  Enable 2FA
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.06)] sm:p-5">
            <div className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" strokeLinejoin="round" />
                </svg>
              </span>
              <div className="min-w-0">
                <h3 className="text-[15px] font-bold text-[#111827]">Need Help?</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-500">We&apos;re here for billing, verification, and account questions.</p>
                <button type="button" onClick={() => setSupportOpen(true)} className={`${outlineBtn} mt-3 w-full gap-2`}>
                  <svg viewBox="0 0 24 24" className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" strokeLinejoin="round" />
                  </svg>
                  Chat with Support
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Edit profile modal */}
      <BaseModal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        title="Edit profile"
        subtitle="Update the details shown on your agent profile."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={outlineBtn} onClick={() => setEditProfileOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              onClick={saveProfileFromModal}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#6366F1] px-5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600"
            >
              Save changes
            </button>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[12px] font-semibold text-slate-600">Full name</label>
            <input
              value={draftProfile.fullName}
              onChange={(e) => setDraftProfile((d) => ({ ...d, fullName: e.target.value }))}
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-[#111827] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-600">Email address</label>
            <input
              value={draftProfile.email}
              onChange={(e) => setDraftProfile((d) => ({ ...d, email: e.target.value }))}
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-[#111827] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-600">Phone number</label>
            <input
              value={draftProfile.phone}
              onChange={(e) => setDraftProfile((d) => ({ ...d, phone: e.target.value }))}
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-[#111827] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-600">Business name</label>
            <input
              value={draftProfile.businessName}
              onChange={(e) => setDraftProfile((d) => ({ ...d, businessName: e.target.value }))}
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-[#111827] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[12px] font-semibold text-slate-600">Business address</label>
            <input
              value={draftProfile.businessAddress}
              onChange={(e) => setDraftProfile((d) => ({ ...d, businessAddress: e.target.value }))}
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] text-[#111827] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[12px] font-semibold text-slate-600">Time zone</label>
            <select
              value={draftProfile.timeZone}
              onChange={(e) => setDraftProfile((d) => ({ ...d, timeZone: e.target.value }))}
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 pr-9 text-[13px] font-medium text-slate-700 shadow-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
              style={selectStyle}
            >
              {timeZoneOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </BaseModal>

      {/* Bank details */}
      <BaseModal
        open={bankOpen}
        onClose={() => setBankOpen(false)}
        title="Manage bank details"
        subtitle="Payouts are sent to this account after you request a withdrawal."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={outlineBtn} onClick={() => setBankOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setBankOpen(false)
                toast.success('Bank details saved', 'Your payout account has been updated.')
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#6366F1] px-5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600"
            >
              Save
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-[12px] font-semibold text-slate-600">Account name</label>
            <input
              value={bankForm.accountName}
              onChange={(e) => setBankForm((b) => ({ ...b, accountName: e.target.value }))}
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-600">Bank</label>
            <input
              value={bankForm.bankName}
              onChange={(e) => setBankForm((b) => ({ ...b, bankName: e.target.value }))}
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-600">Account number</label>
            <input
              value={bankForm.accountNumber}
              onChange={(e) => setBankForm((b) => ({ ...b, accountNumber: e.target.value }))}
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>
        </div>
      </BaseModal>

      {/* Support */}
      <BaseModal open={supportOpen} onClose={() => setSupportOpen(false)} title="Chat with support" subtitle="Tell us what you need — we typically reply within a few hours.">
        <p className="text-[13px] leading-relaxed text-slate-600">
          For live chat, use the in-app messenger after this demo. You can also email{' '}
          <span className="font-semibold text-indigo-600">support@trustedhome.com</span>.
        </p>
        <button
          type="button"
          onClick={() => setSupportOpen(false)}
          className="mt-5 w-full rounded-xl bg-[#6366F1] py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600"
        >
          Got it
        </button>
      </BaseModal>

      {/* Change password */}
      <BaseModal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        title="Change Password"
        subtitle="Use a strong password to keep your account secure."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className={outlineBtn}
              onClick={() => {
                setChangePasswordOpen(false)
                setPwd({ current: '', next: '', confirm: '' })
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                beginPasswordChange()
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#6366F1] px-5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600"
            >
              Update Password
            </button>
          </div>
        }
      >
        <div className="grid gap-3 sm:grid-cols-1">
          <PasswordField label="Current password" id="pwd-cur-modal" value={pwd.current} onChange={(v) => setPwd((p) => ({ ...p, current: v }))} />
          <PasswordField label="New password" id="pwd-new-modal" value={pwd.next} onChange={(v) => setPwd((p) => ({ ...p, next: v }))} />
          <PasswordField label="Confirm new password" id="pwd-conf-modal" value={pwd.confirm} onChange={(v) => setPwd((p) => ({ ...p, confirm: v }))} />
        </div>
      </BaseModal>

      {/* OTP verification */}
      <BaseModal
        open={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        title="Verify OTP"
        subtitle="Enter the 6-digit OTP sent to your email and phone to complete password change."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={outlineBtn} onClick={() => setOtpModalOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              onClick={verifyPasswordOtp}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#6366F1] px-5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600"
            >
              Verify OTP
            </button>
          </div>
        }
      >
        <div>
          <label className="block text-[12px] font-semibold text-slate-600" htmlFor="pwd-otp">
            OTP Code
          </label>
          <input
            id="pwd-otp"
            type="text"
            inputMode="numeric"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[15px] font-semibold tracking-[0.2em] text-[#111827] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
          />
          <p className="mt-2 text-[11px] text-slate-500">Demo mode: use any 6-digit code.</p>
        </div>
      </BaseModal>

      {/* Privacy settings */}
      <BaseModal
        open={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        title="Privacy Settings"
        subtitle="Control who can see your profile and contact details."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={outlineBtn} onClick={() => setPrivacyOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setPrivacyOpen(false)
                toast.success('Privacy updated', 'Your visibility preferences have been saved.')
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#6366F1] px-5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600"
            >
              Save Privacy Settings
            </button>
          </div>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-[12px] font-semibold text-slate-600">Profile visibility</label>
            <select
              value={privacyVis}
              onChange={(e) => setPrivacyVis(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 pr-9 text-[13px] font-medium text-slate-700 shadow-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
              style={selectStyle}
            >
              {privacyVisibilityOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-600">Show phone number</label>
            <select
              value={phoneVis}
              onChange={(e) => setPhoneVis(e.target.value)}
              className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 pr-9 text-[13px] font-medium text-slate-700 shadow-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
              style={selectStyle}
            >
              {phoneVisibilityOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </BaseModal>

      {/* 2FA intro */}
      <BaseModal
        open={twoFaModalOpen}
        onClose={() => setTwoFaModalOpen(false)}
        title="Enable two-factor authentication"
        subtitle="Add a second step after your password when you sign in."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={outlineBtn} onClick={() => setTwoFaModalOpen(false)}>
              Not now
            </button>
            <button
              type="button"
              onClick={() => {
                setTwoFA(true)
                setTwoFaModalOpen(false)
                toast.success('2FA enabled', 'Use your authenticator app to generate codes at sign-in.')
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#6366F1] px-5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600"
            >
              Turn on 2FA
            </button>
          </div>
        }
      >
        <ul className="list-inside list-disc space-y-2 text-[13px] text-slate-600">
          <li>Download an authenticator app (Google Authenticator, Authy, etc.).</li>
          <li>Scan the QR code we show on the next step (coming soon in production).</li>
          <li>Enter a 6-digit code to confirm setup.</li>
        </ul>
      </BaseModal>

      {/* Success / info */}
    </div>
  )
}
