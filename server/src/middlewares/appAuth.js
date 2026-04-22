import { verifyToken } from '../utils/jwt.js'

export function requireAppAuth(req, res, next) {
  const h = req.headers.authorization || ''
  const m = /^Bearer\s+(.+)$/i.exec(h)
  if (!m) return res.status(401).json({ ok: false, error: 'Missing bearer token' })
  try {
    const payload = verifyToken(m[1])
    if (payload.typ !== 'app') return res.status(403).json({ ok: false, error: 'Invalid token type' })
    req.user = { id: payload.sub, role: payload.role, email: payload.email }
    next()
  } catch {
    return res.status(401).json({ ok: false, error: 'Invalid or expired token' })
  }
}
