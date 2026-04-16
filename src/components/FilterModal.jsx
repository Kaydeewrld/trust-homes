import { listingPurposes, propertyTypes } from '../data/properties'

function FilterModal({ open, filters, onClose, onApply, onClear, onChange }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-30 bg-slate-950/65 px-4 py-12 backdrop-blur-sm">
      <div className="animate-modalUp mx-auto max-w-md rounded-3xl border border-white/20 bg-blue-950/70 p-5 text-white shadow-2xl shadow-blue-900/30">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Refine your search</h3>
          <button onClick={onClose} className="rounded-lg px-2 py-1 text-blue-100 hover:bg-white/10 active:scale-95">
            Close
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <label className="mb-1 block text-blue-100/90">Location</label>
            <input
              value={filters.location}
              onChange={(event) => onChange('location', event.target.value)}
              placeholder="e.g. Victoria Island"
              className="w-full rounded-xl border border-white/20 bg-white/10 p-3"
            />
          </div>

          <div>
            <label className="mb-1 block text-blue-100/90">Property type</label>
            <select
              value={filters.type}
              onChange={(event) => onChange('type', event.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 p-3"
            >
              {propertyTypes.map((item) => (
                <option className="bg-blue-950" key={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-blue-100/90">Purpose</label>
            <select
              value={filters.purpose}
              onChange={(event) => onChange('purpose', event.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 p-3"
            >
              {listingPurposes.map((item) => (
                <option className="bg-blue-950" key={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-blue-100/90">Min Price</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(event) => onChange('minPrice', event.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 p-3"
              />
            </div>
            <div>
              <label className="mb-1 block text-blue-100/90">Max Price</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(event) => onChange('maxPrice', event.target.value)}
                className="w-full rounded-xl border border-white/20 bg-white/10 p-3"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-blue-100/90">Minimum Bedrooms</label>
            <select
              value={filters.bedrooms}
              onChange={(event) => onChange('bedrooms', event.target.value)}
              className="w-full rounded-xl border border-white/20 bg-white/10 p-3"
            >
              <option className="bg-blue-950" value="Any">Any</option>
              <option className="bg-blue-950" value="1">1+</option>
              <option className="bg-blue-950" value="2">2+</option>
              <option className="bg-blue-950" value="3">3+</option>
              <option className="bg-blue-950" value="4">4+</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={onClear} className="w-full rounded-xl border border-white/30 px-4 py-2 font-medium active:scale-95">
            Clear
          </button>
          <button onClick={onApply} className="w-full rounded-xl bg-blue-500 px-4 py-2 font-medium transition hover:bg-blue-400 active:scale-95">
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

export default FilterModal
