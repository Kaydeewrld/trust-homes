function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/90 shadow-lg shadow-blue-900/40">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor">
          <path d="M3 10.5 12 3l9 7.5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 9v11h12V9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 20v-5h4v5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div>
        <p className="text-[0.7rem] uppercase tracking-[0.2em] text-blue-100/90">Trusted</p>
        <h1 className="text-lg font-semibold leading-none text-white">Home</h1>
      </div>
    </div>
  )
}

export default Logo
