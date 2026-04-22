import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(null)

let nextToastId = 1

function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[500] flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto overflow-hidden rounded-xl border bg-white shadow-[0_16px_36px_-18px_rgba(15,23,42,0.45)] ${
            toast.kind === 'success'
              ? 'border-emerald-100'
              : toast.kind === 'error'
                ? 'border-red-100'
                : toast.kind === 'warning'
                  ? 'border-amber-100'
                  : 'border-slate-200'
          }`}
        >
          <div className="flex items-start gap-3 px-3.5 py-3">
            <span
              className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                toast.kind === 'success'
                  ? 'bg-emerald-100 text-emerald-700'
                  : toast.kind === 'error'
                    ? 'bg-red-100 text-red-700'
                    : toast.kind === 'warning'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {toast.kind === 'success' ? '✓' : toast.kind === 'error' ? '!' : toast.kind === 'warning' ? '!' : 'i'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-800">{toast.title}</p>
              {toast.message ? <p className="mt-0.5 text-[12px] leading-relaxed text-slate-500">{toast.message}</p> : null}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Dismiss notification"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timeoutsRef = useRef(new Map())

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    const timer = timeoutsRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timeoutsRef.current.delete(id)
    }
  }, [])

  const showToast = useCallback(
    ({ title, message = '', kind = 'info', durationMs = 5000 }) => {
      const id = nextToastId++
      setToasts((prev) => [...prev, { id, title, message, kind }])
      const timer = setTimeout(() => dismissToast(id), durationMs)
      timeoutsRef.current.set(id, timer)
      return id
    },
    [dismissToast],
  )

  const value = useMemo(
    () => ({
      showToast,
      success: (title, message) => showToast({ title, message, kind: 'success' }),
      error: (title, message) => showToast({ title, message, kind: 'error' }),
      info: (title, message) => showToast({ title, message, kind: 'info' }),
      warning: (title, message) => showToast({ title, message, kind: 'warning' }),
    }),
    [showToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
