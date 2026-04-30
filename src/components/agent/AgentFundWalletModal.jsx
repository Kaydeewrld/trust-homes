import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { walletFund } from '../../lib/api'

const fmtN = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`

function parseAmount(raw) {
  const n = Number(String(raw).replace(/\D/g, ''))
  return Number.isFinite(n) ? n : 0
}

export default function AgentFundWalletModal({ open, onClose, balance }) {
  const toast = useToast()
  const { token } = useAuth()
  const [amountRaw, setAmountRaw] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) setAmountRaw('')
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const amount = useMemo(() => parseAmount(amountRaw), [amountRaw])

  const submit = useCallback(async () => {
    if (amount < 1000 || !token) return
    setSubmitting(true)
    try {
      const callbackUrl = `${window.location.origin}/payments/callback`
      const out = await walletFund(token, { amountNgn: Math.floor(amount), callbackUrl })
      if (!out?.authorization_url) {
        toast.error('Funding failed', 'No checkout URL returned. Please try again.')
        return
      }
      window.location.assign(out.authorization_url)
    } catch (e) {
      toast.error('Funding failed', e.message || 'Unable to start wallet checkout.')
    } finally {
      setSubmitting(false)
    }
  }, [amount, token, toast])

  if (!open) return null

  const canSubmit = amount >= 1000 && Boolean(token)

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" aria-label="Close dialog" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fund-wallet-title"
        className="relative flex w-full max-w-[440px] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 pb-4 pt-5 sm:px-6">
          <div>
            <h2 id="fund-wallet-title" className="text-lg font-bold tracking-tight text-[#111827]">
              Fund Wallet
            </h2>
            <p className="mt-1 text-[13px] text-slate-500">Add money securely via Paystack. Balance refreshes after you complete checkout.</p>
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
        <div className="px-5 py-5 sm:px-6">
          <p className="text-[12px] font-medium text-slate-500">Current balance</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-[#111827]">{fmtN(balance)}</p>
          <label className="mt-5 block text-[13px] font-semibold text-slate-700" htmlFor="fund-amount">
            Amount (NGN)
          </label>
          <input
            id="fund-amount"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="e.g. 50000"
            value={amountRaw}
            onChange={(e) => setAmountRaw(e.target.value)}
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[15px] font-semibold tabular-nums text-[#111827] outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
          />
          <p className="mt-2 text-[11px] text-slate-500">Minimum top-up ₦1,000. You’ll return here after Paystack confirms payment.</p>
          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={() => void submit()}
            className="mt-5 w-full rounded-xl bg-[#6366F1] py-3 text-[14px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitting ? 'Starting checkout…' : 'Continue to Paystack'}
          </button>
        </div>
      </div>
    </div>
  )
}
