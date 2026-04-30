import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  agentSubmitVerificationRequest,
  agentVerificationStatus,
  authChangePassword,
  authRequestPasswordChangeOtp,
} from '../../lib/api.js'

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

async function compressImageFile(file, { maxEdge = 1200, quality = 0.78 } = {}) {
  const imageUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Invalid image'))
      el.src = imageUrl
    })
    const scale = Math.min(1, maxEdge / Math.max(img.width || 1, img.height || 1))
    const width = Math.max(1, Math.round((img.width || 1) * scale))
    const height = Math.max(1, Math.round((img.height || 1) * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas is not supported')
    ctx.drawImage(img, 0, 0, width, height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob) throw new Error('Image compression failed')
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Could not read compressed image'))
      reader.readAsDataURL(blob)
    })
    return { dataUrl, bytes: blob.size }
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}

export default function AgentProfilePage() {
  const toast = useToast()
  const { token, user, updateProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('personal')
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [editProfileSubmitting, setEditProfileSubmitting] = useState(false)
  const avatarInputRef = useRef(null)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [otpOpen, setOtpOpen] = useState(false)
  const [verificationOpen, setVerificationOpen] = useState(false)
  const [verificationSubmitting, setVerificationSubmitting] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState({
    verificationStatus: 'PENDING',
    verified: false,
    nin: '',
    verificationPhotoUrl: '',
    emergencyContact: '',
    profileUpdatedAt: null,
  })
  const [verificationForm, setVerificationForm] = useState({
    nin: '',
    verificationPhotoUrl: '',
    emergencyContact: '',
  })
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
    avatarUrl: '',
  })

  const completionPct = 85
  const headerName = String(form.fullName || user?.displayName || 'Agent').trim()
  const headerEmail = String(form.email || user?.email || '').trim()
  const headerPhone = String(form.phone || user?.phone || '').trim()
  const headerAvatar = String(form.avatarUrl || user?.avatarUrl || '').trim()
  const headerInitial = (headerName || 'A').charAt(0).toUpperCase()

  const loadVerificationStatus = useCallback(async () => {
    if (!token) return
    try {
      const data = await agentVerificationStatus(token)
      setVerificationStatus({
        verificationStatus: data.verificationStatus || 'PENDING',
        verified: Boolean(data.verified),
        nin: data.nin || '',
        verificationPhotoUrl: data.verificationPhotoUrl || '',
        emergencyContact: data.emergencyContact || '',
        profileUpdatedAt: data.profileUpdatedAt || null,
      })
    } catch (e) {
      console.error('[agent-profile] could not load verification status:', e?.message || e)
    }
  }, [token])

  useEffect(() => {
    loadVerificationStatus()
  }, [loadVerificationStatus])

  useEffect(() => {
    if (!user) return
    setForm((prev) => ({
      ...prev,
      fullName: user.displayName || prev.fullName,
      email: user.email || prev.email,
      phone: user.phone || prev.phone,
      bio: user.bio || prev.bio,
      avatarUrl: user.avatarUrl || prev.avatarUrl,
    }))
  }, [user])

  useEffect(() => {
    if (!verificationOpen) return
    setVerificationForm({
      nin: verificationStatus.nin || '',
      verificationPhotoUrl: verificationStatus.verificationPhotoUrl || '',
      emergencyContact: verificationStatus.emergencyContact || '',
    })
  }, [verificationOpen, verificationStatus])

  const update = (key, value) => setForm((s) => ({ ...s, [key]: value }))
  const handleProfileImagePick = useCallback(async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.warning('Invalid image', 'Please choose an image file.')
      return
    }
    try {
      const compressed = await compressImageFile(file, { maxEdge: 1200, quality: 0.76 })
      if (!compressed?.dataUrl) {
        toast.error('Image error', 'Could not process selected image.')
        return
      }
      if (compressed.bytes > 900 * 1024) {
        toast.warning('Image too large', 'Please upload a smaller image (under 900KB).')
        return
      }
      update('avatarUrl', compressed.dataUrl)
    } catch {
      toast.error('Image error', 'Could not process selected image.')
    } finally {
      event.target.value = ''
    }
  }, [toast])
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

  const submitVerificationRequest = useCallback(async () => {
    if (!token) {
      toast.warning('Session missing', 'Sign in again and retry.')
      return
    }
    const nin = String(verificationForm.nin || '').trim()
    const photo = String(verificationForm.verificationPhotoUrl || '').trim()
    const emergency = String(verificationForm.emergencyContact || '').trim()
    if (nin.length < 6) {
      toast.warning('Invalid NIN', 'Enter a valid NIN.')
      return
    }
    if (!/^https?:\/\//i.test(photo)) {
      toast.warning('Photo link required', 'Paste a valid image URL for your clear photograph.')
      return
    }
    if (emergency.length < 5) {
      toast.warning('Emergency contact required', 'Enter a valid emergency contact phone number.')
      return
    }
    setVerificationSubmitting(true)
    try {
      await agentSubmitVerificationRequest(token, {
        nin,
        verificationPhotoUrl: photo,
        emergencyContact: emergency,
      })
      await loadVerificationStatus()
      setVerificationOpen(false)
      toast.success('Verification submitted', 'Your request is pending admin approval.')
    } catch (e) {
      toast.error('Submission failed', e.message || 'Could not submit verification request.')
    } finally {
      setVerificationSubmitting(false)
    }
  }, [loadVerificationStatus, token, toast, verificationForm])

  const submitProfileEdit = useCallback(async () => {
    if (!token) {
      toast.warning('Session missing', 'Please sign in again.')
      return
    }
    const displayName = String(form.fullName || '').trim()
    const phone = String(form.phone || '').trim()
    const avatarUrl = String(form.avatarUrl || '').trim()
    const bio = String(form.bio || '').trim()
    if (!displayName) {
      toast.warning('Name required', 'Please enter your full name.')
      return
    }
    setEditProfileSubmitting(true)
    try {
      await updateProfile({
        displayName,
        phone,
        avatarUrl,
        bio,
      })
      setEditProfileOpen(false)
      toast.success('Profile updated', 'Your profile was updated successfully.')
    } catch (e) {
      toast.error('Update failed', e?.message || 'Could not update profile right now.')
    } finally {
      setEditProfileSubmitting(false)
    }
  }, [form.avatarUrl, form.bio, form.fullName, form.phone, toast, token, updateProfile])

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
                {headerAvatar ? (
                  <img
                    src={headerAvatar}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="grid h-full w-full place-items-center bg-indigo-100 text-[28px] font-bold text-indigo-700">
                    {headerInitial}
                  </span>
                )}
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
                  <h2 className="text-[24px] font-bold leading-none tracking-tight text-[#111827]">{headerName}</h2>
                  {verificationStatus.verified ? (
                    <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                      Verified Agent
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ring-1 ring-amber-100">
                      Verification Pending
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-1.5 text-[12px] text-slate-600">
                  <p className="flex items-center gap-1.5">
                    <span className="text-slate-400">@</span>
                    {headerEmail || 'No email'}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span className="text-slate-400">✆</span>
                    {headerPhone || 'No phone'}
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
                <button
                  type="button"
                  onClick={() => setEditProfileOpen(true)}
                  className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-indigo-600 shadow-sm transition hover:bg-slate-50"
                >
                  Edit Profile
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

          <SummaryCard title="Account Verification" subtitle="Submit your identity details for the verification badge.">
            {verificationStatus.verificationStatus === 'VERIFIED' ? (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/80 px-3 py-2.5 text-[12px] text-emerald-800">
                <span className="mt-0.5 text-emerald-600">✓</span>
                <span>Verified badge active. Your listings show verification.</span>
              </div>
            ) : (
              <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-3 py-2.5 text-[12px] text-amber-800">
                <p className="font-semibold">Verification pending</p>
                <p className="mt-1">
                  Submit NIN, clear photograph link, and emergency contact for admin approval.
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => setVerificationOpen(true)}
              className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              {verificationStatus.verificationStatus === 'VERIFIED' ? 'Update verification details' : 'Request verification'}
            </button>
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
        open={verificationOpen}
        onClose={() => setVerificationOpen(false)}
        title="Request Verification Badge"
        subtitle="Submit your identity details. Admin will review and approve."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={outlineBtn} onClick={() => setVerificationOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              disabled={verificationSubmitting}
              onClick={submitVerificationRequest}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#6366F1] px-5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {verificationSubmitting ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        }
      >
        <div className="grid gap-3">
          <InputField
            label="NIN"
            value={verificationForm.nin}
            onChange={(v) => setVerificationForm((s) => ({ ...s, nin: v }))}
          />
          <InputField
            label="Clear Photograph URL"
            value={verificationForm.verificationPhotoUrl}
            onChange={(v) => setVerificationForm((s) => ({ ...s, verificationPhotoUrl: v }))}
          />
          <InputField
            label="Emergency Contact"
            value={verificationForm.emergencyContact}
            onChange={(v) => setVerificationForm((s) => ({ ...s, emergencyContact: v }))}
          />
          <p className="text-[11px] leading-relaxed text-slate-500">
            Use an HTTPS image URL for your clear portrait photo. After submission, admin will review and approve your badge.
          </p>
        </div>
      </BaseModal>

      <BaseModal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        title="Edit Profile"
        subtitle="Update your personal details and bio."
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={outlineBtn} onClick={() => setEditProfileOpen(false)}>
              Cancel
            </button>
            <button
              type="button"
              disabled={editProfileSubmitting}
              onClick={submitProfileEdit}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-[#6366F1] px-5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {editProfileSubmitting ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        }
      >
        <div className="grid gap-3">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfileImagePick}
          />
          <div>
            <label className="block text-[12px] font-semibold text-slate-600">Profile Picture</label>
            <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              {form.avatarUrl ? (
                <img
                  src={form.avatarUrl}
                  alt=""
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-slate-200"
                />
              ) : (
                <span className="grid h-14 w-14 place-items-center rounded-full bg-indigo-100 text-[18px] font-bold text-indigo-700 ring-2 ring-slate-200">
                  {(form.fullName || 'A').trim().charAt(0).toUpperCase() || 'A'}
                </span>
              )}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-[12px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Upload Profile Picture
              </button>
            </div>
          </div>
          <InputField
            label="Full Name"
            value={form.fullName}
            onChange={(v) => update('fullName', v)}
          />
          <InputField
            label="Email Address"
            value={form.email}
            readOnly
          />
          <InputField
            label="Phone Number"
            value={form.phone}
            onChange={(v) => update('phone', v)}
          />
          <div>
            <label className="block text-[12px] font-semibold text-slate-600">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => update('bio', e.target.value)}
              maxLength={500}
              rows={4}
              className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
            />
          </div>
        </div>
      </BaseModal>

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
