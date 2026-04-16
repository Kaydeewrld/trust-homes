import { useEffect, useRef, useState } from 'react'

function normalizeOptions(options) {
  return options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
}

/**
 * Custom-styled dropdown (opened panel is fully styled, not the OS native menu).
 * @param {'light' | 'hero' | 'modal'} variant
 */
function CustomDropdown({ value, options = [], onChange, placeholder = '', className = '', variant = 'light', disabled = false }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const list = normalizeOptions(options)
  const selected = list.find((o) => o.value === value)
  const display = selected?.label ?? value ?? placeholder

  useEffect(() => {
    function handleOutside(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const triggerClasses = {
    light:
      'flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60',
    hero:
      'flex w-full items-center justify-between rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-left text-xs text-blue-100 outline-none transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60',
    modal:
      'flex w-full items-center justify-between rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-left text-sm text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60',
  }

  const panelClasses = {
    light:
      'absolute left-0 right-0 top-[calc(100%+6px)] z-[100] overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-200/80 ring-1 ring-slate-900/5',
    hero:
      'absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl border border-white/20 bg-[#1a4fd4] py-1 shadow-2xl shadow-blue-950/50 ring-1 ring-white/10 backdrop-blur-md',
    modal:
      'absolute left-0 right-0 top-[calc(100%+6px)] z-[110] overflow-hidden rounded-xl border border-white/25 bg-[#0c2461] py-1 shadow-2xl shadow-black/40 ring-1 ring-white/10',
  }

  const itemClasses = {
    light: (active) =>
      `block w-full px-3 py-2.5 text-left text-xs transition ${
        active ? 'bg-blue-50 font-medium text-blue-700' : 'text-slate-700 hover:bg-slate-50'
      }`,
    hero: (active) =>
      `block w-full px-3 py-2.5 text-left text-xs transition ${
        active ? 'bg-white/20 font-medium text-white' : 'text-blue-100 hover:bg-white/10'
      }`,
    modal: (active) =>
      `block w-full px-3 py-2.5 text-left text-sm transition ${
        active ? 'bg-white/15 font-medium text-white' : 'text-blue-100/95 hover:bg-white/10'
      }`,
  }

  const chevronClass = {
    light: 'h-4 w-4 text-slate-500',
    hero: 'h-4 w-4 text-blue-100/85',
    modal: 'h-4 w-4 text-blue-100/90',
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={triggerClasses[variant] || triggerClasses.light}
      >
        <span className="truncate">{display || placeholder}</span>
        <svg
          viewBox="0 0 24 24"
          className={`${chevronClass[variant] || chevronClass.light} shrink-0 transition ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
        >
          <path d="m7 10 5 5 5-5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className={panelClasses[variant] || panelClasses.light} role="listbox">
          {list.map((option) => {
            const active = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={itemClasses[variant](active)}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default CustomDropdown
