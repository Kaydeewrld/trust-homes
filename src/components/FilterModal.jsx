import { listingPurposes, propertyTypes } from '../data/properties'
import CustomDropdown from './CustomDropdown'

const bedroomFilterOptions = [
  { value: 'Any', label: 'Any' },
  { value: '1', label: '1+' },
  { value: '2', label: '2+' },
  { value: '3', label: '3+' },
  { value: '4', label: '4+' },
]

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
            <CustomDropdown
              variant="modal"
              value={filters.type}
              options={propertyTypes}
              onChange={(v) => onChange('type', v)}
            />
          </div>

          <div>
            <label className="mb-1 block text-blue-100/90">Purpose</label>
            <CustomDropdown
              variant="modal"
              value={filters.purpose}
              options={listingPurposes}
              onChange={(v) => onChange('purpose', v)}
            />
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
            <CustomDropdown
              variant="modal"
              value={filters.bedrooms}
              options={bedroomFilterOptions}
              onChange={(v) => onChange('bedrooms', v)}
            />
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
