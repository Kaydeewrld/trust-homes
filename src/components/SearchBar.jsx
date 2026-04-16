function SearchBar({ value, onChange }) {
  return (
    <div className="frosted glow-ring flex items-center gap-2 rounded-2xl px-3 py-3 transition focus-within:shadow-cyan-300/25">
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-100/80" fill="none" stroke="currentColor">
        <path d="M11 4a7 7 0 1 0 4.95 11.95L20 20" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search location, title, purpose"
        className="w-full bg-transparent text-sm text-white placeholder:text-blue-100/70 focus:outline-none"
      />
    </div>
  )
}

export default SearchBar
