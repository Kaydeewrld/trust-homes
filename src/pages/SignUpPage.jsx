import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import CustomDropdown from '../components/CustomDropdown'

/** Mock primary (indigo) */
const BRAND = '#6366F1'
const VILLA =
  'https://images.unsplash.com/photo-1600585154340-6efcd41ef336?auto=format&fit=crop&w=1800&q=88'
const VILLA_FALLBACK = 'https://picsum.photos/seed/trustedhome-villa-left/1600/1400'

const focusInp = 'focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/15'

const DIAL_CODE_OPTIONS = ['+234', '+1', '+44']

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

/** Purple house + white wordmark (on photo / dark overlay) */
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

function DividerOr({ label }) {
  return (
    <div className="relative py-0.5">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-slate-200" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-2 text-[11px] font-medium text-slate-400">{label}</span>
      </div>
    </div>
  )
}

/** Feature row on hero overlay (mock: light well + purple icon, white copy) */
function MarketingFeatureHero({ icon, title, desc }) {
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

function FieldIcon({ children }) {
  return (
    <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 lg:left-3">{children}</span>
  )
}

const inpBase = `h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-[13px] text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 lg:h-10 lg:pl-9 lg:pr-3 lg:text-[14px] ${focusInp}`

function RolePick({ active, title, subtitle, onClick, icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-[84px] w-full flex-col items-center justify-center rounded-xl border-2 px-2 py-2 text-center transition lg:min-h-[96px] lg:px-4 lg:py-3 ${
        active
          ? 'border-[#6366F1] bg-indigo-50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <span
        className={`mb-1 grid h-9 w-9 place-items-center rounded-full ${
          active ? 'bg-indigo-100 text-[#6366F1]' : 'bg-slate-100 text-slate-400'
        }`}
      >
        {icon}
      </span>
      <span className={`text-[11.5px] font-bold leading-tight ${active ? 'text-slate-900' : 'text-slate-700'}`}>{title}</span>
      <span className="mt-0.5 max-w-[9.5rem] text-[9px] leading-snug text-slate-500 lg:max-w-[18rem] lg:text-[10px]">{subtitle}</span>
    </button>
  )
}

function UserForm({ showPw, setShowPw, agree, setAgree, email, setEmail, dialCode, setDialCode, onSubmit }) {
  return (
    <form className="space-y-2 lg:space-y-3" onSubmit={onSubmit}>
      <div className="grid grid-cols-2 gap-2 lg:gap-4">
        <label className="block min-w-0">
          <span className="mb-0.5 block text-[10px] font-medium text-slate-600">First name</span>
          <div className="relative">
            <FieldIcon>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" strokeLinecap="round" />
              </svg>
            </FieldIcon>
            <input type="text" placeholder="First name" className={inpBase} />
          </div>
        </label>
        <label className="block min-w-0">
          <span className="mb-0.5 block text-[10px] font-medium text-slate-600">Last name</span>
          <div className="relative">
            <FieldIcon>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" strokeLinecap="round" />
              </svg>
            </FieldIcon>
            <input type="text" placeholder="Last name" className={inpBase} />
          </div>
        </label>
      </div>

      <label className="block">
        <span className="mb-0.5 block text-[10px] font-medium text-slate-600">Email address</span>
        <div className="relative">
          <FieldIcon>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <path d="m22 6-10 7L2 6" strokeLinecap="round" />
            </svg>
          </FieldIcon>
          <input
            type="email"
            placeholder="Enter your email address"
            className={inpBase}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-0.5 block text-[10px] font-medium text-slate-600">Phone number</span>
        <div
          className={`flex h-9 items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm focus-within:border-[#6366F1] focus-within:ring-2 focus-within:ring-[#6366F1]/15 lg:h-10`}
        >
          <div className="flex h-full min-w-0 shrink-0 items-stretch border-r border-slate-200 bg-slate-50 px-1.5 lg:px-2.5">
            <span className="flex shrink-0 items-center text-xs leading-none">🇳🇬</span>
            <CustomDropdown
              variant="inlineLight"
              className="flex h-full min-w-0 flex-1"
              value={dialCode}
              onChange={setDialCode}
              options={DIAL_CODE_OPTIONS}
            />
          </div>
          <input type="tel" placeholder="Enter your phone number" className="min-w-0 flex-1 border-0 bg-transparent px-2 text-[13px] outline-none placeholder:text-slate-400 lg:px-3 lg:text-[14px]" />
        </div>
      </label>

      <label className="block">
        <span className="mb-0.5 block text-[10px] font-medium text-slate-600">Password</span>
        <div className="relative">
          <FieldIcon>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
            </svg>
          </FieldIcon>
          <input type={showPw ? 'text' : 'password'} placeholder="Create a password" className={`${inpBase} pr-9 lg:pr-10`} />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 lg:right-2.5"
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
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
        <p className="mt-0.5 text-[10px] leading-snug text-slate-500">Use 8+ characters with a mix of letters, numbers & symbols</p>
      </label>

      <label className="flex cursor-pointer items-start gap-2 pt-0.5 lg:gap-2.5">
        <input
          type="checkbox"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
          className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 lg:h-4 lg:w-4"
          style={{ accentColor: BRAND }}
        />
        <span className="text-[11px] leading-snug text-slate-600 lg:text-[12px]">
          I agree to the{' '}
          <a href="#terms" className="font-semibold" style={{ color: BRAND }}>
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#privacy" className="font-semibold" style={{ color: BRAND }}>
            Privacy Policy
          </a>
        </span>
      </label>

      <button
        type="submit"
        className="h-10 w-full rounded-lg text-[13px] font-semibold text-white shadow-md transition hover:opacity-95 active:scale-[0.99] lg:h-11 lg:text-[14px]"
        style={{ backgroundColor: BRAND }}
      >
        Create Account
      </button>
    </form>
  )
}

function AgentForm({ showPw, setShowPw, agree, setAgree, email, setEmail, dialCode, setDialCode, onSubmit }) {
  return (
    <form className="space-y-2 lg:space-y-3" onSubmit={onSubmit}>
      <label className="block">
        <span className="mb-0.5 block text-[10px] font-medium text-slate-600">Agency / business name</span>
        <div className="relative">
          <FieldIcon>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <path d="M9 22V12h6v10" strokeLinecap="round" />
            </svg>
          </FieldIcon>
          <input type="text" placeholder="Agency name" className={inpBase} />
        </div>
      </label>

      <div className="grid grid-cols-2 gap-2 lg:gap-4">
        <label className="block min-w-0">
          <span className="mb-0.5 block text-[10px] font-medium text-slate-600">First name</span>
          <div className="relative">
            <FieldIcon>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" strokeLinecap="round" />
              </svg>
            </FieldIcon>
            <input type="text" placeholder="First name" className={inpBase} />
          </div>
        </label>
        <label className="block min-w-0">
          <span className="mb-0.5 block text-[10px] font-medium text-slate-600">Last name</span>
          <div className="relative">
            <FieldIcon>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" strokeLinecap="round" />
              </svg>
            </FieldIcon>
            <input type="text" placeholder="Last name" className={inpBase} />
          </div>
        </label>
      </div>

      <label className="block">
        <span className="mb-0.5 block text-[10px] font-medium text-slate-600">Work email</span>
        <div className="relative">
          <FieldIcon>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <path d="m22 6-10 7L2 6" strokeLinecap="round" />
            </svg>
          </FieldIcon>
          <input
            type="email"
            placeholder="name@agency.com"
            className={inpBase}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
      </label>

      <label className="block">
        <span className="mb-0.5 block text-[10px] font-medium text-slate-600">Phone number</span>
        <div className="flex h-9 items-stretch overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm focus-within:border-[#6366F1] focus-within:ring-2 focus-within:ring-[#6366F1]/15 lg:h-10">
          <div className="flex h-full min-w-0 shrink-0 items-stretch border-r border-slate-200 bg-slate-50 px-1.5 lg:px-2.5">
            <span className="flex shrink-0 items-center text-xs leading-none">🇳🇬</span>
            <CustomDropdown
              variant="inlineLight"
              className="flex h-full min-w-0 flex-1"
              value={dialCode}
              onChange={setDialCode}
              options={DIAL_CODE_OPTIONS}
            />
          </div>
          <input type="tel" placeholder="Business phone" className="min-w-0 flex-1 border-0 bg-transparent px-2 text-[13px] outline-none placeholder:text-slate-400 lg:px-3 lg:text-[14px]" />
        </div>
      </label>

      <label className="block">
        <span className="mb-0.5 block text-[10px] font-medium text-slate-600">License ID (optional)</span>
        <div className="relative">
          <FieldIcon>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M16 13H8" strokeLinecap="round" />
            </svg>
          </FieldIcon>
          <input type="text" placeholder="e.g. REC-LAG-XXXXX" className={inpBase} />
        </div>
      </label>

      <label className="block">
        <span className="mb-0.5 block text-[10px] font-medium text-slate-600">Password</span>
        <div className="relative">
          <FieldIcon>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
            </svg>
          </FieldIcon>
          <input type={showPw ? 'text' : 'password'} placeholder="Create a password" className={`${inpBase} pr-9 lg:pr-10`} />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 lg:right-2.5"
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.75">
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
        <p className="mt-0.5 text-[10px] leading-snug text-slate-500">Use 8+ characters with a mix of letters, numbers & symbols</p>
      </label>

      <label className="flex cursor-pointer items-start gap-2 pt-0.5 lg:gap-2.5">
        <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 lg:h-4 lg:w-4" style={{ accentColor: BRAND }} />
        <span className="text-[11px] leading-snug text-slate-600 lg:text-[12px]">
          I agree to the{' '}
          <a href="#terms" className="font-semibold" style={{ color: BRAND }}>
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#privacy" className="font-semibold" style={{ color: BRAND }}>
            Privacy Policy
          </a>
        </span>
      </label>

      <button
        type="submit"
        className="h-10 w-full rounded-lg text-[13px] font-semibold text-white shadow-md transition hover:opacity-95 active:scale-[0.99] lg:h-11 lg:text-[14px]"
        style={{ backgroundColor: BRAND }}
      >
        Create Agent Account
      </button>
    </form>
  )
}

function SignUpPage() {
  const navigate = useNavigate()
  const [role, setRole] = useState('user')
  const [showPw, setShowPw] = useState(false)
  const [agree, setAgree] = useState(false)
  const [signupEmail, setSignupEmail] = useState('')
  const [dialCode, setDialCode] = useState('+234')

  const goToVerifyEmail = (e) => {
    e.preventDefault()
    const trimmed = signupEmail.trim()
    const qs = trimmed ? `?email=${encodeURIComponent(trimmed)}` : ''
    navigate(`/verify-email${qs}`)
  }

  const socialBtn =
    'flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 lg:h-10 lg:gap-2 lg:text-[12px]'

  const iconUser = (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" strokeLinecap="round" />
    </svg>
  )
  const iconAgent = (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="2" y="7" width="20" height="14" rx="2" strokeLinecap="round" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2M2 12h20" strokeLinecap="round" />
    </svg>
  )

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col-reverse overflow-hidden bg-white text-slate-900 antialiased lg:flex-row">
      {/* Left 40% — full-bleed villa hero, gradient, copy + features + testimonial (matches reference) */}
      <aside className="relative flex min-h-[min(380px,52vh)] w-full shrink-0 flex-col overflow-hidden lg:h-full lg:min-h-0 lg:w-[40%]">
        <SafeImg
          primary={VILLA}
          fallback={VILLA_FALLBACK}
          alt=""
          className="absolute inset-0 h-full w-full scale-105 object-cover object-[center_58%] lg:object-[center_52%]"
        />
        {/* Readability: dusk blue + vignette so pool / villa stay visible */}
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

        <div className="relative z-10 flex min-h-[min(340px,48vh)] w-full flex-1 flex-col px-6 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-7 lg:min-h-0 lg:h-full lg:px-8 lg:pb-6 lg:pt-8">
          <Link to="/" className="block w-fit rounded-md ring-white/0 transition hover:ring-2 hover:ring-white/20">
            <LogoHouseHero />
          </Link>

          <div className="mt-4 max-w-[18.5rem] sm:max-w-md lg:mt-5">
            <h2 className="text-[20px] font-bold leading-[1.2] tracking-tight text-white sm:text-[21px] lg:text-[22px]">
              Find your perfect space. <span style={{ color: BRAND }}>Trusted</span> every step.
            </h2>
            <p className="mt-2 text-[11.5px] leading-relaxed text-slate-300 sm:text-[12px]">
              Join thousands of users and agents on TrustedHome to buy, rent, and list verified properties with ease.
            </p>
          </div>

          <ul className="mt-4 max-w-md space-y-2.5 sm:mt-5 sm:space-y-3">
            <MarketingFeatureHero
              icon={
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.85">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" />
                  <path d="M9 12l2 2 4-4" strokeLinecap="round" />
                </svg>
              }
              title="Verified Listings"
              desc="Only trusted and verified properties."
            />
            <MarketingFeatureHero
              icon={
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.85">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
                </svg>
              }
              title="Expert Agents"
              desc="Connect with top-rated real estate experts."
            />
            <MarketingFeatureHero
              icon={
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.85">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" strokeLinecap="round" />
                </svg>
              }
              title="Save Favorites"
              desc="Save and organize your favorite properties."
            />
            <MarketingFeatureHero
              icon={
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.85">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 7-3 7h18s-3 0-3-7M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
                </svg>
              }
              title="Instant Alerts"
              desc="Get notified about new properties that match your preference."
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

      {/* Right 60% — scroll only here on short viewports */}
      <main className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto bg-white lg:w-[60%] lg:overflow-y-auto">
        <div className="mx-auto flex w-full max-w-[372px] flex-col px-5 py-5 sm:px-6 sm:py-6 lg:mx-0 lg:max-w-none lg:w-full lg:flex-1 lg:justify-center lg:px-10 lg:py-6 xl:px-14 2xl:px-20">
          <div className="mb-3 flex justify-end lg:mb-4">
            <p className="text-right text-[11.5px] text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold hover:underline" style={{ color: BRAND }}>
                Log in
              </Link>
            </p>
          </div>

          <h1 className="text-[20px] font-bold leading-tight tracking-tight text-slate-900 sm:text-[21px] lg:text-[22px]">Create your account</h1>
          <p className="mt-1 text-[11.5px] text-slate-500 lg:text-[12px]">Join TrustedHome and get started today.</p>

          <div className="mt-3 grid grid-cols-2 gap-2 lg:mt-4 lg:gap-4">
            <RolePick
              active={role === 'user'}
              title="Sign up as a User"
              subtitle="Find and manage properties"
              onClick={() => setRole('user')}
              icon={iconUser}
            />
            <RolePick
              active={role === 'agent'}
              title="Sign up as an Agent"
              subtitle="List properties and grow your business"
              onClick={() => setRole('agent')}
              icon={iconAgent}
            />
          </div>

          <div className="mt-3">
            <DividerOr label="or sign up with" />
          </div>

          <div className="mt-2 flex gap-2 lg:gap-3">
            <button type="button" className={socialBtn}>
              <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
            <button type="button" className={socialBtn}>
              <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.17 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.65 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Continue with Apple
            </button>
          </div>

          <div className="mt-3">
            <DividerOr label="or continue with email" />
          </div>

          <div className="mt-2.5">
            {role === 'user' ? (
              <UserForm
                showPw={showPw}
                setShowPw={setShowPw}
                agree={agree}
                setAgree={setAgree}
                email={signupEmail}
                setEmail={setSignupEmail}
                dialCode={dialCode}
                setDialCode={setDialCode}
                onSubmit={goToVerifyEmail}
              />
            ) : (
              <AgentForm
                showPw={showPw}
                setShowPw={setShowPw}
                agree={agree}
                setAgree={setAgree}
                email={signupEmail}
                setEmail={setSignupEmail}
                dialCode={dialCode}
                setDialCode={setDialCode}
                onSubmit={goToVerifyEmail}
              />
            )}
          </div>

          <p className="mt-4 flex items-center justify-center gap-1.5 pb-4 text-center text-[10px] leading-snug text-slate-500 lg:pb-0">
            <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0 text-[#6366F1]" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" />
            </svg>
            Your data is secure with us. We never share your information.
          </p>
        </div>
      </main>
    </div>
  )
}

export default SignUpPage
