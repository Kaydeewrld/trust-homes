import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authMe } from '../lib/api.js'

const TOKEN_KEY = 'th_app_token'
const STORAGE_KEY = 'th_auth_user'

const defaultAvatar =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=72'

const AuthContext = createContext(null)

function normalizeUser(u) {
  if (!u || typeof u !== 'object') return null
  const email = typeof u.email === 'string' ? u.email : ''
  return {
    id: typeof u.id === 'string' ? u.id : undefined,
    email,
    displayName: typeof u.displayName === 'string' && u.displayName.trim() ? u.displayName.trim() : email.split('@')[0] || 'Member',
    avatarUrl: typeof u.avatarUrl === 'string' && u.avatarUrl.trim() ? u.avatarUrl.trim() : defaultAvatar,
    role: u.role === 'AGENT' ? 'AGENT' : 'USER',
    emailVerified: Boolean(u.emailVerified),
    phone: u.phone ?? null,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [bootstrapping, setBootstrapping] = useState(() => Boolean(typeof localStorage !== 'undefined' && localStorage.getItem(TOKEN_KEY)))

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY)
    if (!t) {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          setUser(normalizeUser(parsed))
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
      setBootstrapping(false)
      return
    }
    setToken(t)
    let cancelled = false
    ;(async () => {
      try {
        const data = await authMe(t)
        const nu = normalizeUser(data.user)
        if (!cancelled && nu) {
          setUser(nu)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nu))
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(STORAGE_KEY)
          setUser(null)
          setToken(null)
        }
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const applySession = useCallback(({ token: nextToken, user: nextUser }) => {
    const nu = normalizeUser(nextUser)
    if (!nu) return
    localStorage.setItem(TOKEN_KEY, nextToken)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nu))
    setToken(nextToken)
    setUser(nu)
  }, [])

  /** @deprecated Prefer applySession after API login */
  const login = useCallback((payload) => {
    const email = (payload?.email || 'member@trustedhome.ng').trim()
    const displayName =
      (payload?.displayName && String(payload.displayName).trim()) || email.split('@')[0] || 'Member'
    const avatarUrl = (payload?.avatarUrl && String(payload.avatarUrl).trim()) || defaultAvatar
    const next = { email, displayName, avatarUrl, role: 'USER', emailVerified: true }
    setUser(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(TOKEN_KEY)
  }, [])

  const value = useMemo(
    () => ({
      user,
      token,
      bootstrapping,
      applySession,
      login,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user, token, bootstrapping, applySession, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
