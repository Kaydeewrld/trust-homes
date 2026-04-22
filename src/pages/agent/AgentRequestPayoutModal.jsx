import { useCallback, useEffect, useMemo, useState } from 'react'
import { useToast } from '../../context/ToastContext'

const fmtN = (n) => `₦${Number(n || 0).toLocaleString('en-NG')}`

const SERVICE_PCT = 0.1

function parseAmountInput(raw) {
  const n = Number(String(raw).replace(/\D/g, ''))
  return Number.isFinite(n) ? n : 0
}

export default function AgentRequestPayoutModal({ open, onClose, availableBalance, minPayout }) {
  const toast = useToast()
  const [amountRaw, setAmountRaw] = useState('')

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

  const requested = useMemo(() => {
    const n = parseAmountInput(amountRaw)
    return Math.min(Math.max(0, n), availableBalance)
  }, [amountRaw, availableBalance])

  const serviceCharge = useMemo(() => Math.round(requested * SERVICE_PCT), [requested])
  const youReceive = useMemo(() => Math.max(0, requested - serviceCharge), [requested, serviceCharge])

  const setMax = useCallback(() => {
    setAmountRaw(String(availableBalance))
  }, [availableBalance])

  const submit = useCallback(() => {
    if (requested < minPayout || requested === 0) return
    toast.success('Payout requested', `${fmtN(requested)} payout request submitted successfully.`)
    onClose()
  }, [requested, minPayout, onClose, toast])

  if (!open) return null

  const canSubmit = requested >= minPayout && requested > 0

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
              You can request a payout any time your available balance is above the minimum payout amount.
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
            <p className="mt-0.5 text-[12px] text-slate-500">Enter the amount you want to withdraw.</p>
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
                You will receive: <span className="font-bold tabular-nums text-[#111827]">{fmtN(youReceive)}</span>
              </span>
              <span className="font-medium text-slate-500">
                Service Charge (10%): <span className="font-semibold tabular-nums text-slate-700">{fmtN(serviceCharge)}</span>
              </span>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-[14px] font-bold text-[#111827]">Payout Method</p>
            <p className="mt-0.5 text-[12px] text-slate-500">Choose how you want to receive your payout.</p>
            <button
              type="button"
              className="mt-3 flex w-full items-center gap-3 rounded-xl border-2 border-indigo-200 bg-indigo-50/40 px-4 py-3.5 text-left shadow-sm transition hover:bg-indigo-50/80"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-100 text-indigo-600">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                  <path d="M3 9h18v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9Z" strokeLinejoin="round" />
                  <path d="M3 10V7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v3" />
                  <path d="M7 15h2M11 15h6" strokeLinecap="round" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-bold text-[#111827]">GTBank</span>
                <span className="mt-0.5 block text-[12px] font-medium text-slate-600">Account ending **** 1234</span>
                <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-100">
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Verified
                </span>
              </span>
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6" strokeLinecap="round" />
              </svg>
            </button>
            <button type="button" className="mt-3 text-[13px] font-semibold text-indigo-600 transition hover:text-indigo-500">
              <span className="mr-1 font-bold">+</span>
              Add New Bank Account
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/60 p-4">
            <p className="text-[13px] font-bold text-[#111827]">Payout Summary</p>
            <div className="mt-3 space-y-2.5 text-[13px]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-600">Requested Amount</span>
                <span className="font-semibold tabular-nums text-slate-900">{fmtN(requested)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-600">Service Charge (10%)</span>
                <span className="font-semibold tabular-nums text-slate-700">− {fmtN(serviceCharge)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-slate-200/90 pt-2.5">
                <span className="font-bold text-indigo-600">You Will Receive</span>
                <span className="text-lg font-bold tabular-nums text-indigo-600">{fmtN(youReceive)}</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2.5 rounded-lg border border-indigo-100 bg-indigo-50/90 px-3 py-2.5">
              <span className="mt-0.5 shrink-0 text-indigo-500">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
                </svg>
              </span>
              <p className="text-[11px] leading-relaxed text-indigo-950/90">
                Payouts are processed within <span className="font-semibold">1–3 business days</span>. You will receive an email notification once your payout is
                completed.
              </p>
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
            onClick={submit}
            disabled={!canSubmit}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#6366F1] px-5 text-[13px] font-semibold text-white shadow-sm shadow-indigo-500/25 transition hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Request Payout
          </button>
        </div>
      </div>
    </div>
  )
}
