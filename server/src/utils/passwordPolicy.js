/**
 * Shared rules for app users, agents, and staff-created passwords.
 * @param {string} password
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
export function validatePasswordStrength(password) {
  const p = String(password || '')
  if (p.length < 10) return { ok: false, message: 'Password must be at least 10 characters.' }
  if (!/[a-zA-Z]/.test(p)) return { ok: false, message: 'Password must include at least one letter.' }
  if (!/\d/.test(p)) return { ok: false, message: 'Password must include at least one number.' }
  if (!/[^A-Za-z0-9]/.test(p)) return { ok: false, message: 'Password must include at least one symbol.' }
  return { ok: true }
}

export function assertPasswordStrength(password) {
  const r = validatePasswordStrength(password)
  if (!r.ok) {
    const err = new Error(r.message)
    err.status = 400
    err.expose = true
    throw err
  }
}
