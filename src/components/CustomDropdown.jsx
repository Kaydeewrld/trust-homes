import { useEffect, useRef, useState } from 'react'

function normalizeOptions(options) {
  return options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o))
}

/**
 * Custom-styled dropdown (opened panel is fully styled, not the OS native menu).
 * @param {'light' | 'hero' | 'modal' | 'addListing' | 'inlineLight' | 'auth'} variant
 */
function CustomDropdown({
  value,
  options = [],
  onChange,
  placeholder = '',
  className = '',
  variant = 'light',
  disabled = false,
}) {
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
      'flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs font-medium text-slate-800 shadow-sm outline-none transition hover:border-slate-300 hover:bg-slate-50/80 focus-visible:border-[#6366F1] focus-visible:ring-2 focus-visible:ring-[#6366F1]/15 disabled:cursor-not-allowed disabled:opacity-60',
    hero:
      'flex w-full items-center justify-between gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-left text-xs font-medium text-blue-100 outline-none transition hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/25 disabled:cursor-not-allowed disabled:opacity-60',
    modal:
      'flex w-full items-center justify-between gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-left text-sm font-medium text-white outline-none transition hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/20 disabled:cursor-not-allowed disabled:opacity-60',
    addListing:
      'flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-slate-800 shadow-sm outline-none transition hover:border-violet-200 hover:shadow-md focus-visible:border-violet-400 focus-visible:ring-2 focus-visible:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-60',
    inlineLight:
      'flex h-full min-h-0 min-w-0 w-full max-w-[5.5rem] flex-1 items-center justify-between gap-1 rounded-md border border-transparent bg-white/90 px-1 py-0.5 pl-0.5 pr-0.5 text-left text-[12px] font-semibold text-slate-800 shadow-none outline-none ring-1 ring-slate-200/60 transition hover:ring-slate-300 focus-visible:border-[#6366F1] focus-visible:ring-2 focus-visible:ring-[#6366F1]/25 disabled:cursor-not-allowed disabled:opacity-60 lg:max-w-[6rem] lg:text-[13px]',
    auth:
      'flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 min-h-[52px] text-left text-[15px] font-medium text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus-visible:border-[#5D5FEF] focus-visible:ring-2 focus-visible:ring-[#5D5FEF]/20 disabled:cursor-not-allowed disabled:opacity-60',
  }

  const panelClasses = {
    light:
      'absolute left-0 right-0 top-[calc(100%+6px)] z-[140] max-h-[min(320px,50vh)] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-200/80 ring-1 ring-slate-900/5',
    hero:
      'absolute left-0 right-0 top-[calc(100%+6px)] z-[140] max-h-[min(320px,50vh)] overflow-y-auto rounded-xl border border-white/20 bg-[#1a4fd4] py-1 shadow-2xl shadow-blue-950/50 ring-1 ring-white/10 backdrop-blur-md',
    modal:
      'absolute left-0 right-0 top-[calc(100%+6px)] z-[160] max-h-[min(320px,50vh)] overflow-y-auto rounded-xl border border-white/25 bg-[#0c2461] py-1 shadow-2xl shadow-black/40 ring-1 ring-white/10',
    addListing:
      'absolute left-0 right-0 top-[calc(100%+6px)] z-[140] max-h-[min(320px,50vh)] overflow-y-auto rounded-xl border border-violet-200 bg-white py-1 shadow-xl shadow-violet-200/40 ring-1 ring-violet-900/5',
    inlineLight:
      'absolute left-0 top-[calc(100%+4px)] z-[200] max-h-[min(280px,45vh)] min-w-[9rem] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-300/60 ring-1 ring-slate-900/5',
    auth:
      'absolute left-0 right-0 top-[calc(100%+6px)] z-[140] max-h-[min(280px,45vh)] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl shadow-slate-200/80 ring-1 ring-slate-900/5',
  }

  const itemClasses = {
    light: (active) =>
      `block w-full px-3 py-2.5 text-left text-xs transition ${
        active ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
      }`,
    hero: (active) =>
      `block w-full px-3 py-2.5 text-left text-xs transition ${
        active ? 'bg-white/20 font-semibold text-white' : 'text-blue-100 hover:bg-white/10'
      }`,
    modal: (active) =>
      `block w-full px-3 py-2.5 text-left text-sm transition ${
        active ? 'bg-white/15 font-semibold text-white' : 'text-blue-100/95 hover:bg-white/10'
      }`,
    addListing: (active) =>
      `block w-full px-3 py-2.5 text-left text-sm transition ${
        active ? 'bg-violet-50 font-semibold text-violet-800' : 'text-slate-700 hover:bg-violet-50/40'
      }`,
    inlineLight: (active) =>
      `block w-full px-3 py-2.5 text-left text-xs font-medium transition lg:text-[13px] ${
        active ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
      }`,
    auth: (active) =>
      `block w-full px-4 py-3 text-left text-[15px] transition ${
        active ? 'bg-[#5D5FEF]/10 font-semibold text-[#5D5FEF]' : 'text-slate-700 hover:bg-slate-50'
      }`,
  }

  const chevronWrapClass = {
    light: 'grid shrink-0 place-items-center rounded-md bg-slate-100 p-1 text-slate-600',
    hero: 'grid shrink-0 place-items-center rounded-md bg-white/15 p-1 text-blue-100',
    modal: 'grid shrink-0 place-items-center rounded-md bg-white/15 p-1 text-blue-100',
    addListing: 'grid shrink-0 place-items-center rounded-lg bg-violet-100 p-1 text-violet-700',
    inlineLight: 'grid shrink-0 place-items-center rounded-md bg-indigo-50 p-0.5 text-indigo-600',
    auth: 'grid shrink-0 place-items-center rounded-lg bg-slate-100 p-1.5 text-slate-500',
  }

  const chevronIconClass = {
    light: 'h-3.5 w-3.5',
    hero: 'h-3.5 w-3.5',
    modal: 'h-4 w-4',
    addListing: 'h-3.5 w-3.5',
    inlineLight: 'h-3 w-3 lg:h-3.5 lg:w-3.5',
    auth: 'h-4 w-4',
  }

  const v = triggerClasses[variant] ? variant : 'light'

  return (
    <div ref={rootRef} className={`relative min-h-0 ${className}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={triggerClasses[v] || triggerClasses.light}
      >
        <span className="min-w-0 flex-1 truncate text-left">{display || placeholder}</span>
        <span className={chevronWrapClass[v] || chevronWrapClass.light}>
          <svg
            viewBox="0 0 24 24"
            className={`${chevronIconClass[v] || chevronIconClass.light} transition ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            aria-hidden
          >
            <path d="m7 10 5 5 5-5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
      {open && (
        <div className={panelClasses[v] || panelClasses.light} role="listbox">
          {list.map((option) => {
            const active = option.value === value
            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={itemClasses[v](active)}
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
