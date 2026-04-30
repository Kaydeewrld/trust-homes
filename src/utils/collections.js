const STORAGE_KEY = 'th_property_collections_v1'

function readAll() {
  if (typeof localStorage === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeAll(data) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data || {}))
}

function toCollection(input) {
  return {
    id: String(input?.id || '').trim(),
    name: String(input?.name || '').trim(),
    createdAt: String(input?.createdAt || new Date().toISOString()),
    properties: Array.isArray(input?.properties) ? input.properties : [],
  }
}

export function getUserCollections(userId) {
  const all = readAll()
  const rows = Array.isArray(all?.[userId]) ? all[userId] : []
  return rows.map(toCollection).filter((c) => c.id && c.name)
}

export function createUserCollection(userId, name) {
  const cleanName = String(name || '').trim()
  if (!cleanName) throw new Error('Collection name is required')
  const all = readAll()
  const rows = Array.isArray(all?.[userId]) ? all[userId].map(toCollection) : []
  const exists = rows.some((c) => c.name.toLowerCase() === cleanName.toLowerCase())
  if (exists) throw new Error('A collection with that name already exists')
  const next = {
    id: `col_${Math.random().toString(36).slice(2, 10)}`,
    name: cleanName,
    createdAt: new Date().toISOString(),
    properties: [],
  }
  all[userId] = [next, ...rows]
  writeAll(all)
  return next
}

export function addPropertyToCollection(userId, collectionId, property) {
  const all = readAll()
  const rows = Array.isArray(all?.[userId]) ? all[userId].map(toCollection) : []
  const idx = rows.findIndex((c) => c.id === collectionId)
  if (idx < 0) throw new Error('Collection not found')
  const existing = rows[idx]
  const pid = String(property?.id || '').trim()
  if (!pid) throw new Error('Property id is required')
  if (existing.properties.some((p) => String(p?.id) === pid)) return existing
  const nextProperty = {
    id: pid,
    title: String(property?.title || 'Property'),
    image: String(property?.image || ''),
    location: String(property?.location || ''),
    price: Number(property?.price || 0),
    purpose: String(property?.purpose || 'Sale'),
  }
  const updated = { ...existing, properties: [nextProperty, ...existing.properties] }
  rows[idx] = updated
  all[userId] = rows
  writeAll(all)
  return updated
}
