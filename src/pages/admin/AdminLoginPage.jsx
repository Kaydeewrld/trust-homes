import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../context/AdminAuthContext'
import { useToast } from '../../context/ToastContext'

function LogoMark() {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 shadow-sm shadow-indigo-600/25">
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden>
        <path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-7H10v7H5a1 1 0 0 1-1-1v-9.5z" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { isAuthenticated, login } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [remember, setRemember] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/admin', { replace: true })
  }, [isAuthenticated, navigate])

  const onSubmit = (e) => {
    e.preventDefault()
    setSubmitting(true)
    const result = login(email, password)
    setSubmitting(false)
    if (!result.ok) {
      toast.error('Sign in failed', result.error)
      return
    }
    toast.success('Welcome back', 'You are signed in to the admin console.')
    navigate('/admin', { replace: true })
  }

  return (
    <div className="relative min-h-svh overflow-hidden bg-[#ECEEF2] text-slate-900 antialiased">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.04) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />
      <div className="relative z-10 flex min-h-svh flex-col lg:flex-row">
        <aside className="flex flex-col justify-between border-b border-slate-200/80 bg-[#0f172a] px-8 py-10 text-white lg:w-[44%] lg:border-b-0 lg:border-r lg:px-12 lg:py-14">
          <div>
            <div className="flex items-center gap-3">
              <LogoMark />
              <div>
                <p className="text-lg font-semibold tracking-tight">TrustedHome</p>
                <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Staff console</p>
              </div>
            </div>
            <h1 className="mt-12 max-w-md text-[28px] font-semibold leading-tight tracking-tight lg:text-[32px]">
              Internal access only
            </h1>
            <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-slate-400">
              Sign in with your work credentials to manage the platform. There is no public registration for this area.
            </p>
          </div>
          <p className="mt-10 text-xs leading-relaxed text-slate-500 lg:mt-0">
            If you are not a TrustedHome employee or authorized contractor, leave this page. All access may be logged.
          </p>
        </aside>

        <main className="flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-10 lg:py-16">
          <div className="w-full max-w-[440px]">
            <div className="rounded-2xl border border-slate-200/90 bg-white p-8 shadow-[0_24px_48px_-12px_rgba(15,23,42,0.12)] sm:p-10">
              <h2 className="text-[22px] font-semibold tracking-tight text-slate-900">Sign in</h2>
              <p className="mt-1.5 text-sm text-slate-500">Use your admin email and password.</p>

              <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
                <div>
                  <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                    Work email
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <path d="M4 6h16v12H4V6z" strokeLinejoin="round" />
                        <path d="M4 7l8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <input
                      id="admin-email"
                      type="email"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-[52px] w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-11 pr-3 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
                      placeholder="you@trustedhome.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <label htmlFor="admin-password" className="block text-sm font-medium text-slate-700">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => toast.info('Password reset', 'Contact your administrator to reset staff credentials.')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.75">
                        <rect x="5" y="11" width="14" height="10" rx="2" strokeLinejoin="round" />
                        <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <input
                      id="admin-password"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-[52px] w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-11 pr-12 text-[15px] text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2.5 select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500/20"
                  />
                  <span className="text-sm text-slate-600">Keep me signed in on this device</span>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-[52px] w-full items-center justify-center rounded-xl bg-indigo-600 text-[15px] font-semibold text-white shadow-sm shadow-indigo-600/25 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? 'Signing in…' : 'Sign in to admin'}
                </button>
              </form>

              <p className="mt-8 text-center text-xs text-slate-500">
                <Link to="/" className="font-medium text-slate-600 underline-offset-2 hover:text-slate-900 hover:underline">
                  ← Back to TrustedHome
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
