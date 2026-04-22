import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const SESSION_KEY = 'th_admin_session'
const EMAIL_KEY = 'th_admin_email'

const AdminAuthContext = createContext(null)

function readAdminSessionFlag() {
  try {
    return localStorage.getItem(SESSION_KEY) === '1'
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

function clearAdminSessionStorage() {
  try {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(EMAIL_KEY)
  } catch {
    /* ignore */
  }
}

export function AdminAuthProvider({ children }) {
  const [authed, setAuthed] = useState(readAdminSessionFlag)
  const [email, setEmailState] = useState(readAdminSessionEmail)

  const login = useCallback((emailInput, password) => {
    const e = String(emailInput || '').trim()
    const p = String(password || '')
    if (!e || !p) return { ok: false, error: 'Enter your work email and password.' }
    if (!persistAdminSession(e)) {
      return {
        ok: false,
        error: 'This browser blocked local storage. Allow storage for this site or try another browser.',
      }
    }
    setEmailState(e)
    setAuthed(true)
    return { ok: true }
  }, [])

  const logout = useCallback(() => {
    clearAdminSessionStorage()
    setEmailState('')
    setAuthed(false)
  }, [])

  const value = useMemo(
    () => ({
      isAuthenticated: authed,
      adminEmail: email,
      login,
      logout,
    }),
    [authed, email, login, logout],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
