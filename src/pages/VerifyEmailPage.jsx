import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { authResendVerifyEmail, authVerifyEmail } from '../lib/api.js'

const BRAND = '#6366F1'
const VILLA =
  'https://images.unsplash.com/photo-1600585154340-6efcd41ef336?auto=format&fit=crop&w=1800&q=88'
const VILLA_FALLBACK = 'https://picsum.photos/seed/trustedhome-villa-left/1600/1400'

const focusOtp = 'focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20'

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
        style={{ backgroundColor: 'rgba(99, 102, 241, 0.28)' }}
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

function EnvelopeHeroIllustration() {
  return (
    <div className="mx-auto flex h-[88px] w-[88px] items-center justify-center rounded-2xl bg-indigo-100/90 shadow-sm ring-1 ring-indigo-200/80 lg:mx-0 lg:h-[100px] lg:w-[100px]" aria-hidden>
      <svg viewBox="0 0 64 64" className="h-[52px] w-[52px] text-[#6366F1] lg:h-[60px] lg:w-[60px]">
        <path fill="currentColor" fillOpacity="0.15" d="M10 22h44v30H10V22z" />
        <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" d="M10 22h44v30H10V22z" />
        <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" d="M10 22l22 14 22-14" />
        <circle cx="46" cy="24" r="10" fill="white" stroke="currentColor" strokeWidth="1.8" />
        <path fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" d="M42 24l2.5 2.5L50 19" />
      </svg>
    </div>
  )
}

function formatCountdown(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { applySession } = useAuth()
  const email = searchParams.get('email')?.trim() || ''

  const [digits, setDigits] = useState(() => Array(6).fill(''))
  const inputsRef = useRef([])
  const [secondsLeft, setSecondsLeft] = useState(45)
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)

  useEffect(() => {
    const t = window.setInterval(() => setSecondsLeft((x) => (x <= 0 ? 0 : x - 1)), 1000)
    return () => window.clearInterval(t)
  }, [])

  const codeString = digits.join('')

  const submitVerify = useCallback(async () => {
    if (!email) {
      toast.warning('Missing email', 'Open this page from the sign-up link or add ?email= to the URL.')
      return
    }
    if (!/^\d{6}$/.test(codeString)) {
      toast.warning('Invalid code', 'Enter all 6 digits.')
      return
    }
    setVerifying(true)
    try {
      const data = await authVerifyEmail({ email, code: codeString })
      applySession({ token: data.token, user: data.user })
      toast.success('Email verified', 'You are all set.')
      navigate(data.user?.role === 'AGENT' ? '/agent' : '/explore')
    } catch (e) {
      toast.error('Verification failed', e.message || 'Check the code and try again.')
    } finally {
      setVerifying(false)
    }
  }, [applySession, codeString, email, navigate, toast])

  const submitResend = useCallback(async () => {
    if (!email) {
      toast.warning('Missing email', 'We need your email to resend the code.')
      return
    }
    if (secondsLeft > 0) return
    setResending(true)
    try {
      await authResendVerifyEmail({ email })
      toast.success('Code sent', 'Check your inbox (and spam folder).')
      setSecondsLeft(45)
    } catch (e) {
      toast.error('Could not resend', e.message || 'Try again in a moment.')
    } finally {
      setResending(false)
    }
  }, [email, secondsLeft, toast])

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
              One last step to get started <span aria-hidden>👋</span>
            </h2>
            <p className="mt-2 text-[11.5px] leading-relaxed text-slate-300 sm:text-[12px]">
              We&apos;ve sent a 6-digit code to <span className="font-semibold text-white">{email}</span>. Enter it on
              the right to verify your account.
            </p>
          </div>

          <ul className="mt-4 max-w-md space-y-2.5 sm:mt-5 sm:space-y-3">
            <MarketingRow
              icon={
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.85">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" />
                </svg>
              }
              title="Secure & Private"
              desc="Your verification code expires quickly and is never shared."
            />
            <MarketingRow
              icon={
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.85">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" />
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" />
                </svg>
              }
              title="Verified & Trusted"
              desc="Complete this step to unlock your TrustedHome profile."
            />
            <MarketingRow
              icon={
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.85">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" />
                  <path d="M9 22V12h6v10" strokeLinecap="round" />
                </svg>
              }
              title="Start your journey"
              desc="Browse listings, save favorites, and connect with agents."
            />
          </ul>

          <div className="mt-auto max-w-md pt-4 lg:pt-3">
            <div className="rounded-xl border border-white/12 bg-slate-950/55 p-3 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-3.5">
              <p className="text-[12px] font-medium leading-relaxed text-white/95">
                <span className="font-serif text-xl leading-none text-indigo-200/90">“</span>
                TrustedHome made finding my dream home simple, fast, and stress-free!
              </p>
              <div className="mt-2.5 flex items-center gap-2.5">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&q=72"
                  alt=""
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-white/25"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-white">Sarah Johnson</p>
                  <p className="text-[10px] text-slate-400">Lagos, Nigeria</p>
                </div>
                <div className="flex shrink-0 gap-0.5 text-amber-400" aria-label="5 stars">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <svg key={i} viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto bg-white lg:w-[60%] lg:overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[372px] flex-col px-5 py-6 sm:px-6 sm:py-7 lg:mx-0 lg:max-w-none lg:w-full lg:flex-1 lg:justify-center lg:px-10 lg:py-8 xl:px-14 2xl:px-20">
          <div className="mb-4 flex justify-end lg:mb-6">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10.5px] font-medium text-slate-500 lg:px-3 lg:py-1.5 lg:text-[11px]">
              <svg viewBox="0 0 24 24" className="h-3 w-3 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
              </svg>
              Secure verification
            </p>
          </div>

          <div className="w-full">
            <EnvelopeHeroIllustration />

            <h1 className="mt-5 text-center text-[21px] font-bold leading-tight tracking-tight text-slate-900 lg:mt-6 lg:text-left lg:text-[24px]">
              Verify your email
            </h1>
            <p className="mt-2 text-center text-[12px] leading-relaxed text-slate-500 lg:text-left lg:text-[13px]">
              Enter the 6-digit code we sent to{' '}
              <span className="font-semibold text-slate-700">{email || 'your email'}</span>
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

            <div className="mt-5 flex flex-wrap items-center justify-between gap-2 lg:mt-6">
              <button
                type="button"
                className="text-[12px] font-semibold disabled:cursor-not-allowed disabled:opacity-40 lg:text-[13px]"
                style={{ color: BRAND }}
                disabled={secondsLeft > 0 || resending}
                onClick={submitResend}
              >
                {resending ? 'Sending…' : 'Resend OTP'}
              </button>
              <span className="font-mono text-[12px] tabular-nums text-slate-400 lg:text-[13px]">{formatCountdown(secondsLeft)}</span>
            </div>

            <button
              type="button"
              disabled={verifying}
              onClick={submitVerify}
              className="mt-6 h-11 w-full rounded-xl text-[14px] font-semibold text-white shadow-md transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 lg:mt-8 lg:h-12 lg:text-[15px]"
              style={{ backgroundColor: BRAND }}
            >
              {verifying ? 'Verifying…' : 'Verify & Continue'}
            </button>

            <Link
              to="/signup"
              className="mt-5 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-slate-500 transition hover:text-slate-800 lg:mt-6 lg:justify-start lg:text-[13px]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" />
              </svg>
              Back to sign up
            </Link>

            <div className="mt-8 rounded-xl border border-indigo-100 bg-indigo-50/70 p-4 lg:mt-10 lg:p-5">
              <div className="flex gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-[#6366F1] shadow-sm ring-1 ring-indigo-100" aria-hidden>
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900 lg:text-[14px]">Didn&apos;t receive the email?</p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-slate-600 lg:text-[12px]">
                    Check your spam folder, or{' '}
                    <a href="#support" className="font-semibold hover:underline" style={{ color: BRAND }}>
                      contact support
                    </a>{' '}
                    if you still need help.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
