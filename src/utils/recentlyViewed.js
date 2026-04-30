const STORAGE_KEY = 'th_recently_viewed_v1'
const MAX_ITEMS = 40

function readAll() {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(items) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function trackRecentlyViewedProperty(property) {
  const id = String(property?.id || '').trim()
  if (!id) return
  const item = {
    id,
    title: String(property?.title || 'Property'),
    image: String(property?.image || ''),
    location: String(property?.location || ''),
    price: Number(property?.price || 0),
    purpose: String(property?.purpose || 'Sale'),
    viewedAt: new Date().toISOString(),
  }
  const current = readAll().filter((x) => String(x?.id || '') !== id)
  const next = [item, ...current].slice(0, MAX_ITEMS)
  writeAll(next)
}

export function getRecentlyViewedProperties(limit = 12) {
  const n = Math.max(1, Number(limit) || 12)
  return readAll().slice(0, n)
}

