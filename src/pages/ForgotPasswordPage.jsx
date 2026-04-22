import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../context/ToastContext.jsx'
import { authForgotPasswordRequest, authForgotPasswordReset } from '../lib/api.js'

const BRAND = '#5D5FEF'
const VILLA =
  'https://images.unsplash.com/photo-1600585154340?auto=format&fit=crop&w=1800&q=88'
const VILLA_FALLBACK = 'https://picsum.photos/seed/trustedhome-forgot-left/1600/1400'

const focusOtp = 'focus:border-[#5D5FEF] focus:ring-2 focus:ring-[#5D5FEF]/20'

function passwordClientHint(pw) {
  const p = String(pw || '')
  if (p.length < 10) return 'Use at least 10 characters.'
  if (!/[a-zA-Z]/.test(p)) return 'Include at least one letter.'
  if (!/\d/.test(p)) return 'Include at least one number.'
  if (!/[^A-Za-z0-9]/.test(p)) return 'Include at least one symbol.'
  return ''
}

function SafeImg({ primary, fallback, alt, className }) {
  const [src, setSrc] = useState(primary)
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="eager"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() =>
        setSrc((current) => {
          if (current === primary) return fallback
          if (current === fallback) return 'https://picsum.photos/1600/1200'
          return current
        })
      }
    />
  )
}

function LogoHouseHero({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 36 36" className="h-8 w-8 shrink-0 drop-shadow-sm" aria-hidden>
        <circle cx="18" cy="18" r="18" fill={BRAND} />
        <path fill="white" d="M18 11.5l-5.8 4.5v7.8h4v-5h3.6v5h4v-7.7L18 11.5z" />
      </svg>
      <span className="text-[16px] font-bold tracking-tight text-white drop-shadow-sm">TrustedHome</span>
    </span>
  )
}

function MarketingRow({ icon, title, desc }) {
  return (
    <li className="flex gap-2.5">
      <span
        className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ring-1 ring-white/20"
        style={{ backgroundColor: 'rgba(93, 95, 239, 0.28)' }}
      >
        <span className="text-white">{icon}</span>
      </span>
      <div className="min-w-0">
        <p className="text-[12.5px] font-semibold leading-snug text-white">{title}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-slate-300">{desc}</p>
      </div>
    </li>
  )
}

function formatCountdown(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function ForgotPasswordPage() {
  const toast = useToast()
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState('')
  const [digits, setDigits] = useState(() => Array(6).fill(''))
  const inputsRef = useRef([])
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(45)
  const [sending, setSending] = useState(false)
  const [resending, setResending] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    const t = window.setInterval(() => setSecondsLeft((x) => (x <= 0 ? 0 : x - 1)), 1000)
    return () => window.clearInterval(t)
  }, [])

  const codeString = digits.join('')

  const sendCode = useCallback(async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      toast.warning('Email required', 'Enter the email you use for TrustedHome.')
      return
    }
    setSending(true)
    try {
      const data = await authForgotPasswordRequest({ email: trimmed })
      toast.success('Check your email', data.message || 'If an account exists, we sent a code.')
      setEmail(trimmed)
      setStep('reset')
      setSecondsLeft(45)
      setDigits(Array(6).fill(''))
    } catch (e) {
      toast.error('Could not send code', e.message || 'Try again in a moment.')
    } finally {
      setSending(false)
    }
  }, [email, toast])

  const submitResend = useCallback(async () => {
    if (secondsLeft > 0) return
    setResending(true)
    try {
      const data = await authForgotPasswordRequest({ email })
      toast.success('Code sent', data.message || 'Check your inbox.')
      setSecondsLeft(45)
    } catch (e) {
      toast.error('Could not resend', e.message || 'Try again.')
    } finally {
      setResending(false)
    }
  }, [email, secondsLeft, toast])

  const submitReset = useCallback(async () => {
    if (!/^\d{6}$/.test(codeString)) {
      toast.warning('Invalid code', 'Enter all 6 digits from the email.')
      return
    }
    const hint = passwordClientHint(newPassword)
    if (hint) {
      toast.warning('Password too weak', hint)
      return
    }
    if (newPassword !== confirmPassword) {
      toast.warning('Passwords do not match', 'Re-enter the same password twice.')
      return
    }
    setResetting(true)
    try {
      await authForgotPasswordReset({ email, otp: codeString, newPassword })
      toast.success('Password updated', 'You can sign in with your new password.')
      setStep('done')
    } catch (e) {
      toast.error('Reset failed', e.message || 'Check the code and password requirements.')
    } finally {
      setResetting(false)
    }
  }, [codeString, confirmPassword, email, newPassword, toast])

  const setChar = useCallback((index, ch) => {
    const c = ch.replace(/\D/g, '').slice(-1) || ''
    setDigits((prev) => {
      const next = [...prev]
      next[index] = c
      return next
    })
    if (c && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }, [])

  const onKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  const onPaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    e.preventDefault()
    const next = [...digits]
    for (let i = 0; i < 6; i++) next[i] = text[i] || ''
    setDigits(next)
    const focusAt = Math.min(text.length, 5)
    inputsRef.current[focusAt]?.focus()
  }

  const pwHint = passwordClientHint(newPassword)

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col-reverse overflow-hidden bg-white text-slate-900 antialiased lg:flex-row">
      <aside className="relative flex min-h-[min(320px,48vh)] w-full shrink-0 flex-col overflow-hidden lg:h-full lg:min-h-0 lg:w-[40%]">
        <SafeImg
          primary={VILLA}
          fallback={VILLA_FALLBACK}
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover object-[center_58%] lg:object-[center_52%]"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(105deg, rgba(15, 23, 42, 0.94) 0%, rgba(30, 27, 75, 0.45) 52%, rgba(15, 23, 42, 0.25) 100%),
              linear-gradient(to top, rgba(2, 6, 23, 0.88) 0%, transparent 42%, rgba(15, 23, 42, 0.35) 100%)
            `,
          }}
          aria-hidden
        />

        <div className="relative z-10 flex min-h-[min(300px,46vh)] w-full flex-1 flex-col px-6 pb-5 pt-6 sm:px-8 lg:min-h-0 lg:h-full lg:px-8 lg:pb-6 lg:pt-8">
          <Link to="/" className="block w-fit rounded-md ring-white/0 transition hover:ring-2 hover:ring-white/20">
            <LogoHouseHero />
          </Link>

          <div className="mt-4 max-w-[19rem] sm:max-w-md lg:mt-5">
            <h2 className="text-[20px] font-bold leading-[1.2] tracking-tight text-white sm:text-[21px] lg:text-[22px]">
              {step === 'email' ? 'Forgot your password?' : step === 'reset' ? 'Check your inbox' : 'All set'}
            </h2>
            <p className="mt-2 text-[11.5px] leading-relaxed text-slate-300 sm:text-[12px]">
              {step === 'email'
                ? 'Enter your email and we will send a one-time code. You will use it to choose a new password.'
                : step === 'reset'
                  ? `We sent a 6-digit code to ${email}. Enter it with your new password on the right.`
                  : 'Your password has been reset. Return to log in with your new credentials.'}
            </p>
          </div>

          <ul className="mt-4 max-w-md space-y-2.5 sm:mt-5 sm:space-y-3">
            <MarketingRow
              icon={
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.85">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
                </svg>
              }
              title="One-time code"
              desc="Codes expire in 10 minutes and can only be used once."
            />
            <MarketingRow
              icon={
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.85">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" />
                </svg>
              }
              title="Account safety"
              desc="We never show whether an email is registered — same message either way."
            />
            <MarketingRow
              icon={
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.85">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" />
                  <path d="M9 22V12h6v10" strokeLinecap="round" />
                </svg>
              }
              title="Google sign-in"
              desc="If you use Google only, reset here does not apply — use Google on the login page."
            />
          </ul>

          <div className="mt-auto max-w-md pt-4 lg:pt-3">
            <div className="rounded-xl border border-white/12 bg-slate-950/55 p-3 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-3.5">
              <p className="text-[12px] font-medium leading-relaxed text-white/95">
                <span className="font-serif text-xl leading-none text-indigo-200/90">“</span>
                TrustedHome keeps my account secure without getting in the way.
              </p>
              <div className="mt-2.5 flex items-center gap-2.5">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&q=72"
                  alt=""
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-white/25"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-white">Daniel Okafor</p>
                  <p className="text-[10px] text-slate-400">Lagos, Nigeria</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto bg-white lg:w-[60%] lg:overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[400px] flex-col px-5 py-6 sm:px-6 sm:py-7 lg:mx-0 lg:max-w-none lg:w-full lg:flex-1 lg:justify-center lg:px-10 lg:py-8 xl:px-14 2xl:px-20">
          <div className="mb-4 flex justify-end lg:mb-6">
            <p className="text-right text-[13px] text-slate-600">
              Remember it?{' '}
              <Link to="/login" className="font-semibold hover:underline" style={{ color: BRAND }}>
                Log in
              </Link>
            </p>
          </div>

          {step === 'email' && (
            <div className="w-full">
              <h1 className="text-[22px] font-bold leading-tight tracking-tight text-slate-900 lg:text-[24px]">Reset password</h1>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                Enter the email for your account. We will email a 6-digit code if password sign-in is enabled.
              </p>
              <label className="mt-8 block">
                <span className="mb-2 block text-[13px] font-medium text-slate-600">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#5D5FEF] focus:ring-2 focus:ring-[#5D5FEF]/20"
                />
              </label>
              <button
                type="button"
                disabled={sending}
                onClick={sendCode}
                className="mt-6 h-12 w-full rounded-xl text-[15px] font-semibold text-white shadow-md transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: BRAND }}
              >
                {sending ? 'Sending…' : 'Send reset code'}
              </button>
            </div>
          )}

          {step === 'reset' && (
            <div className="w-full">
              <h1 className="text-[22px] font-bold leading-tight tracking-tight text-slate-900 lg:text-[24px]">Enter code & new password</h1>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
                Code sent to <span className="font-semibold text-slate-700">{email}</span>
              </p>

              <div className="mt-6 grid w-full grid-cols-6 gap-2 sm:gap-3 lg:mt-8 lg:gap-4" onPaste={onPaste}>
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      inputsRef.current[i] = el
                    }}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={d}
                    onChange={(e) => setChar(i, e.target.value)}
                    onKeyDown={(e) => onKeyDown(i, e)}
                    className={`flex h-12 min-h-0 w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50/80 text-center text-[17px] font-semibold tracking-wide text-slate-900 shadow-sm outline-none transition placeholder:text-slate-300 lg:h-14 lg:rounded-2xl lg:text-[20px] ${focusOtp}`}
                    aria-label={`Digit ${i + 1}`}
                  />
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  className="text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-40 lg:text-[13px]"
                  style={{ color: BRAND }}
                  disabled={secondsLeft > 0 || resending}
                  onClick={submitResend}
                >
                  {resending ? 'Sending…' : 'Resend code'}
                </button>
                <span className="font-mono text-[12px] tabular-nums text-slate-400 lg:text-[13px]">{formatCountdown(secondsLeft)}</span>
              </div>

              <label className="mt-6 block">
                <span className="mb-2 block text-[13px] font-medium text-slate-600">New password</span>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    className="h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 pr-12 text-[15px] text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#5D5FEF] focus:ring-2 focus:ring-[#5D5FEF]/20"
                    placeholder="At least 10 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                  >
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75">
                      {showPw ? (
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" strokeLinecap="round" />
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                {pwHint ? <p className="mt-1.5 text-[12px] text-amber-700">{pwHint}</p> : null}
              </label>

              <label className="mt-4 block">
                <span className="mb-2 block text-[13px] font-medium text-slate-600">Confirm password</span>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  className="h-[52px] w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#5D5FEF] focus:ring-2 focus:ring-[#5D5FEF]/20"
                  placeholder="Repeat password"
                />
              </label>

              <button
                type="button"
                disabled={resetting}
                onClick={submitReset}
                className="mt-6 h-12 w-full rounded-xl text-[15px] font-semibold text-white shadow-md transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: BRAND }}
              >
                {resetting ? 'Updating…' : 'Update password'}
              </button>

              <button
                type="button"
                className="mt-4 w-full text-center text-[13px] font-semibold text-slate-500 hover:text-slate-800"
                onClick={() => {
                  setStep('email')
                  setDigits(Array(6).fill(''))
                  setNewPassword('')
                  setConfirmPassword('')
                }}
              >
                Use a different email
              </button>
            </div>
          )}

          {step === 'done' && (
            <div className="w-full text-center lg:text-left">
              <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 lg:mx-0">
                <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="text-[22px] font-bold text-slate-900">Password reset</h1>
              <p className="mt-2 text-[14px] text-slate-600">You can now sign in with your new password.</p>
              <Link
                to="/login"
                className="mt-8 inline-flex h-12 w-full items-center justify-center rounded-xl text-[15px] font-semibold text-white shadow-md transition hover:opacity-95 lg:max-w-xs"
                style={{ backgroundColor: BRAND }}
              >
                Back to log in
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
