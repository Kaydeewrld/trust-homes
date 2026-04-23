const DEFAULT_API = 'http://localhost:4000/api'

/**
 * All Express routes are mounted at `/api` on the server. If `VITE_API_URL` is set
 * without that suffix (e.g. `https://my-service.onrender.com`), append `/api` so
 * requests hit `/api/auth/register` instead of `/auth/register` (404).
 */
export function apiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL
  if (!raw || !String(raw).trim()) return DEFAULT_API
  let base = String(raw).trim().replace(/\/+$/, '')
  if (!base.endsWith('/api')) base = `${base}/api`
  return base
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

export function authForgotPasswordRequest(payload) {
  return apiFetch('/auth/forgot-password', { method: 'POST', body: payload })
}

export function authForgotPasswordReset(payload) {
  return apiFetch('/auth/forgot-password/reset', { method: 'POST', body: payload })
}

export function authRequestPasswordChangeOtp(token) {
  return apiFetch('/auth/otp/password-change', { method: 'POST', token })
}

export function authChangePassword(token, payload) {
  return apiFetch('/auth/password', { method: 'PUT', token, body: payload })
}

export function walletGet(token) {
  return apiFetch('/wallet', { token })
}

export function walletPayments(token, take) {
  const q = take != null ? `?take=${encodeURIComponent(String(take))}` : ''
  return apiFetch(`/wallet/payments${q}`, { token })
}

/** Start Paystack checkout to add NGN to the signed-in user wallet. */
export function walletFund(token, payload) {
  return apiFetch('/wallet/fund', { method: 'POST', token, body: payload })
}

/** Legacy: same as walletFund. */
export function paymentInitialize(token, payload) {
  return apiFetch('/payments/initialize', { method: 'POST', token, body: payload })
}

/** Paystack checkout for listing price (platform payment; not paid to agent directly). */
export function paymentListingInit(token, payload) {
  return apiFetch('/payments/listing/init', { method: 'POST', token, body: payload })
}

/** After redirect from Paystack, poll until status is SUCCESS (also triggers server verify). */
export function paymentStatus(token, reference) {
  return apiFetch(`/payments/status/${encodeURIComponent(reference)}`, { token })
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
