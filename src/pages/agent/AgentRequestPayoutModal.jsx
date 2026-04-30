import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { walletPayoutCreate } from '../../lib/api'

const fmtN = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`

const SERVICE_PCT = 0.1

function parseAmountInput(raw) {
  const n = Number(String(raw).replace(/\D/g, ''))
  return Number.isFinite(n) ? n : 0
}

export default function AgentRequestPayoutModal({ open, onClose, availableBalance, minPayout, onSuccess }) {
  const toast = useToast()
  const { token } = useAuth()
  const [amountRaw, setAmountRaw] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      setAmountRaw('')
      setBankName('')
      setAccountName('')
      setAccountNumber('')
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const requested = useMemo(() => {
    const n = parseAmountInput(amountRaw)
    return Math.min(Math.max(0, n), availableBalance)
  }, [amountRaw, availableBalance])

  const serviceCharge = useMemo(() => Math.round(requested * SERVICE_PCT), [requested])
  const youReceive = useMemo(() => Math.max(0, requested - serviceCharge), [requested, serviceCharge])

  const setMax = useCallback(() => {
    setAmountRaw(String(availableBalance))
  }, [availableBalance])

  const submit = useCallback(async () => {
    if (requested < minPayout || requested === 0 || !token) return
    if (!bankName.trim() || !accountName.trim() || !/^\d{10}$/.test(accountNumber.replace(/\D/g, ''))) {
      toast.error('Bank details required', 'Enter bank name, account name, and a 10-digit account number.')
      return
    }
    setSubmitting(true)
    try {
      await walletPayoutCreate(token, {
        amountNgn: requested,
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountNumber: accountNumber.replace(/\D/g, '').slice(0, 10),
      })
      onSuccess?.()
      toast.success('Payout requested', `${fmtN(requested)} submitted for staff approval.`)
      onClose()
    } catch (e) {
      toast.error('Request failed', e?.message || 'Could not submit payout.')
    } finally {
      setSubmitting(false)
    }
  }, [requested, minPayout, token, bankName, accountName, accountNumber, onSuccess, onClose, toast])

  if (!open) return null

  const canSubmit = requested >= minPayout && requested > 0 && Boolean(token)

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" aria-label="Close dialog" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-payout-title"
        className="relative flex max-h-[min(94vh,880px)] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-2xl shadow-slate-900/15"
      >
        <div className="shrink-0 border-b border-slate-100 px-5 pb-4 pt-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <h2 id="request-payout-title" className="text-lg font-bold tracking-tight text-[#111827]">
              Request Payout
            </h2>
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

        <div className="thin-scroll flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="flex gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/90 px-3 py-2.5">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
              </svg>
            </span>
            <p className="min-w-0 text-[12px] leading-relaxed text-emerald-950/90">
              Funds stay in your wallet until staff approves. Enter your settlement bank details below.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <p className="text-[13px] font-medium text-slate-600">Available Balance</p>
              <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-[#111827] sm:text-[26px]">{fmtN(availableBalance)}</p>
            </div>
            <div className="text-right">
              <p className="text-[12px] font-medium text-slate-500">Minimum Payout Amount</p>
              <p className="mt-0.5 text-[15px] font-bold tabular-nums text-slate-800">{fmtN(minPayout)}</p>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-[14px] font-bold text-[#111827]">Payout Amount</p>
            <p className="mt-0.5 text-[12px] text-slate-500">Enter the amount to withdraw from your wallet.</p>
            <div className="relative mt-3 flex rounded-xl border border-slate-200 bg-white shadow-sm ring-slate-200 transition focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500/15">
              <span className="pointer-events-none flex items-center pl-4 text-[15px] font-semibold text-slate-400">₦</span>
              <input
                type="text"
                inputMode="numeric"
                value={amountRaw}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '')
                  if (!digits) {
                    setAmountRaw('')
                    return
                  }
                  const n = Number(digits)
                  setAmountRaw(String(Math.min(n, availableBalance)))
                }}
                placeholder="Enter amount"
                className="min-w-0 flex-1 border-0 bg-transparent py-3 pl-1 pr-24 text-[15px] font-semibold tabular-nums text-[#111827] outline-none placeholder:font-normal placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={setMax}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-[#6366F1] px-3 py-1.5 text-[12px] font-bold text-white shadow-sm transition hover:bg-indigo-600"
              >
                Max
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12px] sm:text-[13px]">
              <span className="font-medium text-slate-600">
                Net to bank (after fee): <span className="font-bold tabular-nums text-[#111827]">{fmtN(youReceive)}</span>
              </span>
              <span className="font-medium text-slate-500">
                Platform fee (10%): <span className="font-semibold tabular-nums text-slate-700">{fmtN(serviceCharge)}</span>
              </span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-[14px] font-bold text-[#111827]">Bank details</p>
            <label className="block text-[12px] font-semibold text-slate-700">
              Bank name
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-[13px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
                placeholder="e.g. GTBank"
              />
            </label>
            <label className="block text-[12px] font-semibold text-slate-700">
              Account name
              <input
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-[13px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
              />
            </label>
            <label className="block text-[12px] font-semibold text-slate-700">
              Account number (10 digits)
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                inputMode="numeric"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-[13px] outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/15"
              />
            </label>
          </div>

          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[13px] font-bold text-[#111827]">Payout Summary</p>
            <div className="mt-3 space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-600">Requested from wallet</span>
                <span className="font-semibold tabular-nums text-slate-900">{fmtN(requested)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-600">Platform fee (10%)</span>
                <span className="font-semibold tabular-nums text-slate-700">− {fmtN(serviceCharge)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-200/90 pt-2.5">
                <span className="font-bold text-indigo-600">Estimated bank receipt</span>
                <span className="text-lg font-bold tabular-nums text-indigo-600">{fmtN(youReceive)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!canSubmit || submitting}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#6366F1] px-5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {submitting ? 'Submitting…' : 'Request Payout'}
          </button>
        </div>
      </div>
    </div>
  )
}
