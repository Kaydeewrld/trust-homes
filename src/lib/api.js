const DEFAULT_API = 'http://localhost:4000/api'

/**
 * All Express routes are mounted at `/api` on the server. If `VITE_API_URL` is set
 * without that suffix (e.g. `https://my-service.onrender.com`), append `/api` so
 * requests hit `/api/auth/register` instead of `/auth/register` (404).
 */
export function apiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL
  const isLocalApp =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  if (!raw || !String(raw).trim()) return DEFAULT_API
  // In local dev, prefer local API to avoid CORS failures from production-only origins.
  if (import.meta.env.DEV && isLocalApp && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(String(raw).trim())) {
    return DEFAULT_API
  }
  let base = String(raw).trim().replace(/\/+$/, '')
  if (!base.endsWith('/api')) base = `${base}/api`
  return base
}

export async function apiFetch(path, { method = 'GET', token, body, headers = {} } = {}) {
  const url = path.startsWith('http') ? path : `${apiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`
  const h = { ...headers }
  if (body !== undefined && !h['Content-Type']) h['Content-Type'] = 'application/json'
  if (token) h.Authorization = `Bearer ${token}`
  let res
  try {
    res = await fetch(url, {
      method,
      headers: h,
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    })
  } catch (cause) {
    const err = new Error(
      import.meta.env.DEV
        ? 'Cannot reach API. Ensure backend is running on http://localhost:4000 (run `npm run server:dev`).'
        : 'Network error while contacting server. Please try again.',
    )
    err.cause = cause
    throw err
  }
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

export function authUpdateMe(token, payload) {
  return apiFetch('/auth/me', { method: 'PUT', token, body: payload })
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

export function agentVerificationStatus(token) {
  return apiFetch('/agent/verification-status', { token })
}

export function agentSubmitVerificationRequest(token, payload) {
  return apiFetch('/agent/verification-request', { method: 'POST', token, body: payload })
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

/** Create a wallet withdrawal request (bank details stored; wallet debited when staff approves). */
export function walletPayoutCreate(token, payload) {
  return apiFetch('/wallet/payout', { method: 'POST', token, body: payload })
}

export function walletPayoutsMine(token, params = {}) {
  const q = new URLSearchParams()
  if (params.take != null) q.set('take', String(params.take))
  return apiFetch(`/wallet/payouts${q.toString() ? `?${q.toString()}` : ''}`, { token })
}

/** Staff: wallet withdrawal queue. */
export function adminWalletPayoutsList(token, params = {}) {
  const q = new URLSearchParams()
  if (params.status) q.set('status', String(params.status))
  if (params.take != null) q.set('take', String(params.take))
  if (params.skip != null) q.set('skip', String(params.skip))
  return apiFetch(`/admin/wallet-payouts${q.toString() ? `?${q.toString()}` : ''}`, { token })
}

export function adminWalletPayoutModerate(token, payoutId, payload) {
  return apiFetch(`/admin/wallet-payouts/${encodeURIComponent(payoutId)}`, {
    method: 'PATCH',
    token,
    body: payload,
  })
}

/** Paystack checkout for listing price (platform payment; not paid to agent directly). */
export function paymentListingInit(token, payload) {
  return apiFetch('/payments/listing/init', { method: 'POST', token, body: payload })
}

export function paymentHotelReservationInit(token, payload) {
  return apiFetch('/payments/hotel/init', { method: 'POST', token, body: payload })
}

export function paymentPropertyInit(token, payload) {
  return apiFetch('/payments/property/init', { method: 'POST', token, body: payload })
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

export function adminPendingAgentVerifications(token) {
  return apiFetch('/admin/agents/verification/pending', { token })
}

export function adminSetAgentVerification(token, userId, approved) {
  return apiFetch(`/admin/agents/${encodeURIComponent(userId)}/verification`, {
    method: 'PATCH',
    token,
    body: { approved: Boolean(approved) },
  })
}

export function adminPendingPayouts(token, params = {}) {
  const q = new URLSearchParams()
  if (params.take != null) q.set('take', String(params.take))
  if (params.skip != null) q.set('skip', String(params.skip))
  return apiFetch(`/admin/payouts/pending${q.toString() ? `?${q.toString()}` : ''}`, { token })
}

export function adminTransactionsList(token, params = {}) {
  const q = new URLSearchParams()
  if (params.take != null) q.set('take', String(params.take))
  if (params.skip != null) q.set('skip', String(params.skip))
  return apiFetch(`/admin/transactions${q.toString() ? `?${q.toString()}` : ''}`, { token })
}

export function listingsCreate(token, payload) {
  return apiFetch('/listings', { method: 'POST', token, body: payload })
}

export function listingsList(params = {}) {
  const q = new URLSearchParams()
  if (params.status) q.set('status', String(params.status))
  if (params.take != null) q.set('take', String(params.take))
  if (params.skip != null) q.set('skip', String(params.skip))
  return apiFetch(`/listings${q.toString() ? `?${q.toString()}` : ''}`)
}

export function listingsGetById(listingId) {
  return apiFetch(`/listings/${encodeURIComponent(listingId)}`)
}

export function agentsList(params = {}) {
  const q = new URLSearchParams()
  if (params.take != null) q.set('take', String(params.take))
  if (params.skip != null) q.set('skip', String(params.skip))
  return apiFetch(`/agents${q.toString() ? `?${q.toString()}` : ''}`)
}

export function listingsRequestInfo(listingId, payload) {
  return apiFetch(`/listings/${encodeURIComponent(listingId)}/request-info`, { method: 'POST', body: payload })
}

export function listingsMine(token, params = {}) {
  const q = new URLSearchParams()
  if (params.status) q.set('status', String(params.status))
  if (params.take != null) q.set('take', String(params.take))
  if (params.skip != null) q.set('skip', String(params.skip))
  return apiFetch(`/listings/mine${q.toString() ? `?${q.toString()}` : ''}`, { token })
}

export function listingsUpdate(token, listingId, payload) {
  return apiFetch(`/listings/${encodeURIComponent(listingId)}`, { method: 'PUT', token, body: payload })
}

export function listingsDelete(token, listingId) {
  return apiFetch(`/listings/${encodeURIComponent(listingId)}`, { method: 'DELETE', token })
}

export function adminListingsModerationList(token, params = {}) {
  const q = new URLSearchParams()
  if (params.status) q.set('status', String(params.status))
  if (params.take != null) q.set('take', String(params.take))
  if (params.skip != null) q.set('skip', String(params.skip))
  return apiFetch(`/admin/listings${q.toString() ? `?${q.toString()}` : ''}`, { token })
}

export function adminModerateListing(token, listingId, status) {
  return apiFetch(`/admin/listings/${encodeURIComponent(listingId)}/status`, {
    method: 'PATCH',
    token,
    body: { status },
  })
}

export function messagesConversations(token) {
  return apiFetch('/messages/conversations', { token })
}

export function messagesOpenConversation(token, payload) {
  return apiFetch('/messages/conversations/open', { method: 'POST', token, body: payload })
}

export function messagesList(token, conversationId, params = {}) {
  const q = new URLSearchParams()
  if (params.take != null) q.set('take', String(params.take))
  if (params.before) q.set('before', String(params.before))
  return apiFetch(`/messages/conversations/${encodeURIComponent(conversationId)}/messages${q.toString() ? `?${q.toString()}` : ''}`, { token })
}

export function messagesSend(token, conversationId, payload) {
  return apiFetch(`/messages/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: 'POST',
    token,
    body: payload,
  })
}

export function visitsCreate(token, payload) {
  return apiFetch('/visits', { method: 'POST', token, body: payload })
}

export function visitsMine(token, params = {}) {
  const q = new URLSearchParams()
  if (params.take != null) q.set('take', String(params.take))
  return apiFetch(`/visits/mine${q.toString() ? `?${q.toString()}` : ''}`, { token })
}
