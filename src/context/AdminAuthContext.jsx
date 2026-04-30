import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { adminAuthLogin, adminAuthMe } from '../lib/api'

const SESSION_KEY = 'th_admin_session'
const EMAIL_KEY = 'th_admin_email'
const TOKEN_KEY = 'th_admin_token'

const AdminAuthContext = createContext(null)

function readAdminSessionFlag() {
  try {
    return Boolean(localStorage.getItem(TOKEN_KEY))
  } catch {
    return false
  }
}

function readAdminSessionEmail() {
  try {
    return localStorage.getItem(EMAIL_KEY) || ''
  } catch {
    return ''
  }
}

function persistAdminSession(emailValue) {
  try {
    localStorage.setItem(SESSION_KEY, '1')
    localStorage.setItem(EMAIL_KEY, emailValue)
    return true
  } catch {
    return false
  }
}

function readAdminToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

function persistAdminToken(tokenValue) {
  try {
    if (tokenValue) localStorage.setItem(TOKEN_KEY, tokenValue)
    return true
  } catch {
    return false
  }
}

function clearAdminSessionStorage() {
  try {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(EMAIL_KEY)
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export function AdminAuthProvider({ children }) {
  const [authed, setAuthed] = useState(readAdminSessionFlag)
  const [email, setEmailState] = useState(readAdminSessionEmail)
  const [token, setToken] = useState(readAdminToken)

  const login = useCallback(async (emailInput, password) => {
    const e = String(emailInput || '').trim()
    const p = String(password || '')
    if (!e || !p) return { ok: false, error: 'Enter your work email and password.' }
    try {
      const out = await adminAuthLogin({ email: e, password: p })
      const apiToken = String(out?.token || '')
      const staffEmail = String(out?.staff?.email || e)
      if (!apiToken) return { ok: false, error: 'No admin token was returned.' }
      if (!persistAdminSession(staffEmail) || !persistAdminToken(apiToken)) {
        return {
          ok: false,
          error: 'This browser blocked local storage. Allow storage for this site or try another browser.',
        }
      }
      setToken(apiToken)
      setEmailState(staffEmail)
      setAuthed(true)
      return { ok: true }
    } catch (error) {
      return { ok: false, error: error?.message || 'Invalid admin credentials.' }
    }
  }, [])

  const refreshSession = useCallback(async () => {
    const existingToken = readAdminToken()
    if (!existingToken) {
      clearAdminSessionStorage()
      setToken('')
      setEmailState('')
      setAuthed(false)
      return { ok: false, error: 'Your admin session expired. Please sign in again.' }
    }
    try {
      const out = await adminAuthMe(existingToken)
      const staffEmail = String(out?.staff?.email || readAdminSessionEmail() || '')
      persistAdminSession(staffEmail)
      setToken(existingToken)
      setEmailState(staffEmail)
      setAuthed(true)
      return { ok: true }
    } catch {
      clearAdminSessionStorage()
      setToken('')
      setEmailState('')
      setAuthed(false)
      return {
        ok: false,
        error: 'Your admin session expired. Please sign in again.',
      }
    }
  }, [])

  const logout = useCallback(() => {
    clearAdminSessionStorage()
    setToken('')
    setEmailState('')
    setAuthed(false)
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated: authed,
      adminEmail: email,
      adminToken: token,
      login,
      refreshSession,
      logout,
    }),
    [authed, email, token, login, refreshSession, logout],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
