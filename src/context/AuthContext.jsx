import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'th_auth_user'

const defaultAvatar =
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&q=72'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object' && typeof parsed.email === 'string') {
        setUser({
          email: parsed.email,
          displayName: typeof parsed.displayName === 'string' ? parsed.displayName : parsed.email.split('@')[0],
          avatarUrl: typeof parsed.avatarUrl === 'string' ? parsed.avatarUrl : defaultAvatar,
        })
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const login = useCallback((payload) => {
    const email = (payload?.email || 'member@trustedhome.ng').trim()
    const displayName =
      (payload?.displayName && String(payload.displayName).trim()) || email.split('@')[0] || 'Member'
    const avatarUrl = (payload?.avatarUrl && String(payload.avatarUrl).trim()) || defaultAvatar
    const next = { email, displayName, avatarUrl }
    setUser(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
