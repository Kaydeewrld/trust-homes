import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import CustomDropdown from '../components/CustomDropdown'
import GoogleSignInButton from '../components/GoogleSignInButton.jsx'
import { authLogin } from '../lib/api.js'

/** Mock primary indigo/purple */
const BRAND = '#5D5FEF'
const VILLA =
  'https://images.unsplash.com/photo-1600585154340-6efcd41ef336?auto=format&fit=crop&w=1800&q=88'
const VILLA_FALLBACK = 'https://picsum.photos/seed/trustedhome-login-left/1600/1400'

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

/** Purple circle + white house (mock logo) */
function LogoCircleHouse({ className = '' }) {
  return (
    <svg viewBox="0 0 40 40" className={`h-10 w-10 shrink-0 ${className}`} aria-hidden>
      <circle cx="20" cy="20" r="20" fill={BRAND} />
      <path
        fill="white"
        d="M20 11.5l-6.2 4.9V27h4.2v-5.2h3.9V27H26V16.4L20 11.5zm0-1.3L27.5 16v12H12.5V16L20 10.2z"
      />
    </svg>
  )
}

function DividerOr({ label }) {
  return (
    <div className="relative py-1">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-slate-200" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-[13px] font-medium text-slate-400">{label}</span>
      </div>
    </div>
  )
}

function FeatureRow({ icon, title, desc }) {
  const well = 'rgba(93, 95, 239, 0.2)'
  return (
    <li className="flex gap-3.5">
      <span
        className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1 ring-white/20"
        style={{ backgroundColor: well }}
      >
        <span style={{ color: BRAND }}>{icon}</span>
      </span>
      <div className="min-w-0">
        <p className="text-[15px] font-semibold leading-snug text-white">{title}</p>
        <p className="mt-0.5 text-[13px] leading-snug text-slate-300">{desc}</p>
      </div>
    </li>
  )
}

function FieldIcon({ children }) {
  return <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{children}</span>
}

const inpBase =
  'h-[52px] w-full rounded-xl border border-slate-200 bg-white pl-11 pr-3 text-[15px] text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#5D5FEF] focus:ring-2 focus:ring-[#5D5FEF]/20'

export default function LoginPage() {
  const navigate = useNavigate()
  const { applySession } = useAuth()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true)
  const [signInAs, setSignInAs] = useState('User')
  const [submitting, setSubmitting] = useState(false)

  const intent = signInAs === 'Agent' ? 'AGENT' : 'USER'

  const socialBtn =
    'flex h-[52px] flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-[13px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50'

  return (
    <div className="flex min-h-svh flex-1 flex-col bg-white text-slate-900 antialiased lg:min-h-0 lg:h-full lg:max-h-full lg:flex-row lg:overflow-hidden">
      {/* Left 50% */}
      <aside className="relative order-2 flex min-h-[280px] w-full shrink-0 flex-col lg:order-1 lg:h-full lg:min-h-0 lg:w-1/2">
        <SafeImg primary={VILLA} fallback={VILLA_FALLBACK} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(165deg, rgba(15, 23, 42, 0.82) 0%, rgba(49, 46, 129, 0.75) 48%, rgba(15, 23, 42, 0.88) 100%)',
          }}
        />
        <div className="relative z-10 flex h-full min-h-0 flex-col px-8 pb-8 pt-9 sm:px-10 sm:pt-10 lg:px-12 lg:pb-10 lg:pt-11">
          <Link to="/" className="flex w-fit items-center gap-2.5">
            <LogoCircleHouse />
            <span className="text-[18px] font-bold tracking-tight text-white">TrustedHome</span>
          </Link>

          <div className="mt-9 max-w-md lg:mt-10">
            <h2 className="text-[26px] font-bold leading-[1.2] tracking-tight text-white sm:text-[28px] lg:text-[30px]">
              Welcome back <span style={{ color: BRAND }}>home.</span>
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-300 sm:text-[15px]">
              Log in to your TrustedHome account and continue your journey.
            </p>
          </div>

          <ul className="mt-8 max-w-lg space-y-4 sm:mt-9 sm:space-y-[18px]">
            <FeatureRow
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.85">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" />
                  <path d="M9 22V12h6v10" strokeLinecap="round" />
                </svg>
              }
              title="Access saved properties"
              desc="View and manage your favorite listings anytime."
            />
            <FeatureRow
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.85">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
                </svg>
              }
              title="Get personalized matches"
              desc="Discover properties tailored to your preferences."
            />
            <FeatureRow
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.85">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 7h18s-3 0-3-7M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
                </svg>
              }
              title="Instant alerts"
              desc="Be the first to know about new listings and price drops."
            />
            <FeatureRow
              icon={
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.85">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" />
                </svg>
              }
              title="Secure & private"
              desc="Your data is protected with industry-standard security."
            />
          </ul>

          <div className="mt-auto max-w-md rounded-2xl border border-white/15 bg-black/40 p-5 shadow-lg backdrop-blur-md">
            <p className="font-serif text-3xl leading-none text-white/70">“</p>
            <p className="-mt-1 text-[15px] leading-relaxed text-white/95">
              Found my apartment in Victoria Island in days — TrustedHome made it effortless.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=96&q=72"
                alt=""
                className="h-11 w-11 rounded-full object-cover ring-2 ring-white/25"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-white">Daniel Okafor</p>
                <p className="text-[12px] text-slate-300">Victoria Island, Lagos</p>
              </div>
              <div className="flex shrink-0 gap-0.5 text-amber-400" aria-label="5 stars">
                {[1, 2, 3, 4, 5].map((i) => (
                  <svg key={i} viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Right 50% */}
      <main className="order-1 flex w-full flex-1 flex-col bg-white lg:order-2 lg:h-full lg:w-1/2 lg:min-h-0 lg:overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col px-6 py-8 sm:px-10 sm:py-10 lg:justify-center lg:px-16 lg:py-10 xl:px-24">
          <div className="mx-auto flex w-full max-w-[440px] flex-col lg:my-auto">
            <div className="mb-8 flex justify-end lg:mb-10">
              <p className="text-right text-[14px] text-slate-600">
                Don&apos;t have an account?{' '}
                <Link to="/signup" className="font-semibold hover:underline" style={{ color: BRAND }}>
                  Sign up
                </Link>
              </p>
            </div>

            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-slate-900 sm:text-[32px]">Welcome back</h1>
            <p className="mt-2 text-[15px] text-slate-500">Log in to your TrustedHome account</p>

            <label className="mt-8 block">
              <span className="mb-2 block text-[13px] font-medium text-slate-600">Sign in as</span>
              <CustomDropdown variant="auth" value={signInAs} onChange={setSignInAs} options={['User', 'Agent']} />
            </label>

            <div className="mt-6 flex gap-3">
              <div className="flex min-h-[52px] min-w-0 flex-1 items-stretch justify-center [&>div]:w-full [&>div]:max-w-full">
                <GoogleSignInButton intent={intent} ux="login" />
              </div>
              <button type="button" className={socialBtn}>
                <svg className="h-[18px] w-[18px] shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.17 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.65 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
                Continue with Apple
              </button>
            </div>

            <div className="mt-8">
              <DividerOr label="or continue with email" />
            </div>

            <form
              className="mt-8 space-y-5"
              onSubmit={async (e) => {
                e.preventDefault()
                const trimmed = email.trim()
                if (!trimmed) {
                  toast.warning('Email required', 'Enter the email you registered with.')
                  return
                }
                if (!password) {
                  toast.warning('Password required', 'Enter your password.')
                  return
                }
                setSubmitting(true)
                try {
                  const data = await authLogin({ email: trimmed, password, intent })
                  applySession({ token: data.token, user: data.user })
                  if (!data.user?.emailVerified) {
                    navigate(`/verify-email?email=${encodeURIComponent(trimmed)}`)
                  } else {
                    navigate(signInAs === 'Agent' ? '/agent' : '/explore')
                  }
                } catch (err) {
                  toast.error('Sign in failed', err.message || 'Check your email, password, and role.')
                } finally {
                  setSubmitting(false)
                }
              }}
            >
              <label className="block">
                <span className="mb-2 block text-[13px] font-medium text-slate-600">Email address</span>
                <div className="relative">
                  <FieldIcon>
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <path d="m22 6-10 7L2 6" strokeLinecap="round" />
                    </svg>
                  </FieldIcon>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className={inpBase}
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-[13px] font-medium text-slate-600">Password</span>
                <div className="relative">
                  <FieldIcon>
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <rect x="5" y="11" width="14" height="10" rx="2" />
                      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
                    </svg>
                  </FieldIcon>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className={`${inpBase} pr-12`}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
              </label>

              <div className="flex items-center justify-between gap-4 pt-1">
                <label className="flex cursor-pointer items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-[18px] w-[18px] rounded border-slate-300 focus:ring-[#5D5FEF]"
                    style={{ accentColor: BRAND }}
                  />
                  <span className="text-[14px] text-slate-600">Remember me</span>
                </label>
                <Link to="/forgot-password" className="shrink-0 text-[14px] font-semibold hover:underline" style={{ color: BRAND }}>
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 h-[52px] w-full rounded-xl text-[15px] font-semibold text-white shadow-md transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: BRAND }}
              >
                {submitting ? 'Signing in…' : 'Log in'}
              </button>
            </form>

            <div className="mt-8 rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-4 sm:px-5">
              <div className="flex gap-3">
                <span className="mt-0.5 shrink-0" style={{ color: BRAND }} aria-hidden>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" />
                  </svg>
                </span>
                <div>
                  <p className="text-[14px] font-bold text-slate-800">Your privacy is important to us.</p>
                  <p className="mt-1 text-[13px] leading-snug text-slate-500">We use industry-standard security to protect your data.</p>
                </div>
              </div>
            </div>

            <p className="mt-8 text-center text-[14px] text-slate-600">
              Need help?{' '}
              <a href="#support" className="inline-flex items-center gap-1 font-semibold hover:underline" style={{ color: BRAND }}>
                Contact our support team <span aria-hidden>→</span>
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
