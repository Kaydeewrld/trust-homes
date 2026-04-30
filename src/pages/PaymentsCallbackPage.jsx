import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useWallet } from '../context/WalletContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { paymentStatus } from '../lib/api.js'

const BRAND = '#4F46E5'
const API_HOST = 'trust-homes-1-wvow.onrender.com'

function fmtN(n) {
  return `₦${Number(n || 0).toLocaleString('en-NG')}`
}

export default function PaymentsCallbackPage() {
  const [searchParams] = useSearchParams()
  const { token, bootstrapping, user } = useAuth()
  const { refreshWallet } = useWallet()
  const toast = useToast()

  const reference = useMemo(() => {
    const r = searchParams.get('reference') || searchParams.get('trxref') || ''
    return String(r).trim()
  }, [searchParams])
  const nextHref = useMemo(() => {
    const raw = String(searchParams.get('next') || '').trim()
    if (!raw) return ''
    return raw.startsWith('/') ? raw : ''
  }, [searchParams])

  const [phase, setPhase] = useState('loading')
  const [payment, setPayment] = useState(null)
  const [errMsg, setErrMsg] = useState('')

  const runVerify = useCallback(async () => {
    if (!reference) {
      setPhase('no_reference')
      return
    }
    const t = token || (typeof localStorage !== 'undefined' ? localStorage.getItem('th_app_token') : null)
    if (!t) {
      setPhase('no_token')
      return
    }
    setPhase('loading')
    setErrMsg('')
    try {
      const data = await paymentStatus(t, reference)
      setPayment(data.payment || null)
      if (data.payment?.status === 'SUCCESS') {
        setPhase('success')
        await refreshWallet()
        toast.success('Payment confirmed', 'Your wallet balance is up to date.')
      } else {
        setPhase('pending')
        await refreshWallet()
      }
    } catch (e) {
      setPhase('error')
      setErrMsg(e.message || 'Could not verify this payment.')
    }
  }, [reference, token, refreshWallet, toast])

  useEffect(() => {
    if (bootstrapping) return
    runVerify()
  }, [bootstrapping, runVerify])

  const continueHref = nextHref || (user?.role === 'AGENT' ? '/agent' : '/explore')

  return (
    <div className="flex min-h-svh flex-1 flex-col bg-gradient-to-b from-slate-50 via-indigo-50/40 to-white text-slate-900 antialiased">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,_rgba(79,70,229,0.18),_transparent_55%)]" aria-hidden />

      <header className="relative z-10 border-b border-slate-200/80 bg-white/80 px-5 py-4 shadow-sm backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 font-bold tracking-tight text-slate-900">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl text-white shadow-md shadow-indigo-500/25"
              style={{ background: `linear-gradient(135deg, ${BRAND}, #312e81)` }}
              aria-hidden
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" />
                <path d="M9 22V12h6v10" strokeLinecap="round" />
              </svg>
            </span>
            TrustedHome
          </Link>
          <span className="hidden text-[11px] font-medium uppercase tracking-wider text-slate-400 sm:inline">Secure checkout</span>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-10 sm:px-6 sm:py-14">
        <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 shadow-xl shadow-slate-900/5 ring-1 ring-slate-100 sm:p-8">
          {bootstrapping || phase === 'loading' ? (
            <div className="text-center">
              <div
                className="mx-auto h-14 w-14 animate-spin rounded-full border-[3px] border-slate-200 border-t-indigo-600"
                style={{ borderTopColor: BRAND }}
                aria-hidden
              />
              <h1 className="mt-6 text-xl font-bold text-slate-900">Confirming your payment…</h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                We are talking to Paystack and updating your TrustedHome wallet. This usually takes a few seconds.
              </p>
            </div>
          ) : null}

          {phase === 'no_reference' ? (
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <h1 className="mt-6 text-xl font-bold text-slate-900">Missing payment reference</h1>
              <p className="mt-2 text-sm text-slate-600">
                Open this page from the Paystack return link (it should include <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">?reference=…</code>).
              </p>
              <Link
                to="/explore"
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-95"
                style={{ backgroundColor: BRAND }}
              >
                Back to listings
              </Link>
            </div>
          ) : null}

          {phase === 'no_token' ? (
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-600 ring-1 ring-slate-200/80">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="5" y="11" width="14" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
                </svg>
              </div>
              <h1 className="mt-6 text-xl font-bold text-slate-900">Sign in to finish</h1>
              <p className="mt-2 text-sm text-slate-600">
                We need your TrustedHome session to verify this payment and refresh your wallet. Log in with the same account you used before checkout.
              </p>
              <Link
                to={`/login?next=${encodeURIComponent(`/payments/callback?reference=${encodeURIComponent(reference)}${nextHref ? `&next=${encodeURIComponent(nextHref)}` : ''}`)}`}
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-95"
                style={{ backgroundColor: BRAND }}
              >
                Log in
              </Link>
            </div>
          ) : null}

          {phase === 'success' ? (
            <div className="text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h1 className="mt-6 text-xl font-bold text-slate-900">Payment successful</h1>
              <p className="mt-2 text-sm text-slate-600">
                Your transaction was confirmed on the TrustedHome platform. {payment?.kind === 'wallet_topup' ? 'Your wallet has been topped up.' : 'Your listing payment was recorded.'}
              </p>
              {payment ? (
                <dl className="mt-6 space-y-2 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-4 text-left text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Amount</dt>
                    <dd className="font-semibold tabular-nums text-slate-900">{fmtN(payment.amountNgn)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Reference</dt>
                    <dd className="max-w-[60%] truncate font-mono text-xs text-slate-700">{payment.reference}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">Type</dt>
                    <dd className="font-medium capitalize text-slate-800">{String(payment.kind || '').replace(/_/g, ' ')}</dd>
                  </div>
                </dl>
              ) : null}
              <Link
                to={continueHref}
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-95"
                style={{ backgroundColor: BRAND }}
              >
                Continue
              </Link>
            </div>
          ) : null}

          {phase === 'pending' ? (
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" strokeLinecap="round" />
                </svg>
              </div>
              <h1 className="mt-6 text-xl font-bold text-slate-900">Almost there</h1>
              <p className="mt-2 text-sm text-slate-600">
                Paystack shows this payment as still processing, or our server is waiting for the webhook. You can retry verification in a moment.
              </p>
              {payment ? (
                <p className="mt-3 font-mono text-xs text-slate-500">{payment.reference}</p>
              ) : null}
              <button
                type="button"
                onClick={() => runVerify()}
                className="mt-8 w-full rounded-xl border border-slate-200 bg-white py-3.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                Check again
              </button>
              <Link to={continueHref} className="mt-3 block text-sm font-semibold text-indigo-600 hover:text-indigo-800">
                Skip for now
              </Link>
            </div>
          ) : null}

          {phase === 'error' ? (
            <div className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <h1 className="mt-6 text-xl font-bold text-slate-900">Could not verify</h1>
              <p className="mt-2 text-sm text-rose-700/90">{errMsg}</p>
              <button
                type="button"
                onClick={() => runVerify()}
                className="mt-8 w-full rounded-xl py-3.5 text-sm font-semibold text-white shadow-lg transition hover:opacity-95"
                style={{ backgroundColor: BRAND }}
              >
                Try again
              </button>
              <Link to="/profile" className="mt-3 block text-sm font-semibold text-slate-600 hover:text-slate-900">
                Go to profile
              </Link>
            </div>
          ) : null}
        </div>

        <p className="mx-auto mt-8 max-w-md text-center text-[11px] leading-relaxed text-slate-500">
          Payments are processed securely through{' '}
          <span className="font-semibold text-slate-600">Paystack</span> on the TrustedHome API (
          <span className="font-mono text-slate-600">{API_HOST}</span>). Funds for listings are settled on the platform, not sent
          directly to agents.
        </p>
      </main>
    </div>
  )
}
