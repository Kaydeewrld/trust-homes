const DEFAULT_API = 'http://localhost:4000/api'

export function apiBaseUrl() {
  const u = import.meta.env.VITE_API_URL
  if (u && String(u).trim()) return String(u).replace(/\/$/, '')
  return DEFAULT_API
}

export async function apiFetch(path, { method = 'GET', token, body, headers = {} } = {}) {
  const url = path.startsWith('http') ? path : `${apiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const h = { ...headers }
  if (body !== undefined && !h['Content-Type']) h['Content-Type'] = 'application/json'
  if (token) h.Authorization = `Bearer ${token}`
  const res = await fetch(url, {
    method,
    headers: h,
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
  })
  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { ok: false, error: text || res.statusText }
  }
  if (!res.ok) {
    const err = new Error(data.error || res.statusText || 'Request failed')
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export function authRegister(payload) {
  return apiFetch('/auth/register', { method: 'POST', body: payload })
}

export function authLogin(payload) {
  return apiFetch('/auth/login', { method: 'POST', body: payload })
}

export function authMe(token) {
  return apiFetch('/auth/me', { token })
}

export function authVerifyEmail(payload) {
  return apiFetch('/auth/verify-email', { method: 'POST', body: payload })
}

export function authResendVerifyEmail(payload) {
  return apiFetch('/auth/otp/resend-verify', { method: 'POST', body: payload })
}

export function authGoogleLogin(payload) {
  return apiFetch('/auth/google', { method: 'POST', body: payload })
}

export function authRequestPasswordChangeOtp(token) {
  return apiFetch('/auth/otp/password-change', { method: 'POST', token })
}

export function authChangePassword(token, payload) {
  return apiFetch('/auth/password', { method: 'PUT', token, body: payload })
}

export function adminAuthLogin(payload) {
  return apiFetch('/admin/auth/login', { method: 'POST', body: payload })
}

export function adminAuthMe(token) {
  return apiFetch('/admin/auth/me', { token })
}

export function adminListStaff(token) {
  return apiFetch('/admin/staff', { token })
}

export function adminCreateStaff(token, payload) {
  return apiFetch('/admin/staff', { method: 'POST', token, body: payload })
}
