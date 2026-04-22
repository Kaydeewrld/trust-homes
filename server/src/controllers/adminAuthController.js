import { z } from 'zod'
import * as adminAuthService from '../services/adminAuthService.js'
import { verifyToken } from '../utils/jwt.js'
import { validatePasswordStrength } from '../utils/passwordPolicy.js'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

const staffStrongPassword = z.string().superRefine((pw, ctx) => {
  const r = validatePasswordStrength(pw)
  if (!r.ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: r.message })
})

const createStaffSchema = z.object({
  email: z.string().email(),
  password: staffStrongPassword,
  name: z.string().min(2),
  roleLabel: z.string().min(1).optional(),
})

export async function staffLogin(req, res, next) {
  try {
    const body = loginSchema.parse(req.body)
    const out = await adminAuthService.staffLogin(body)
    res.json({ ok: true, ...out })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}

export async function staffMe(req, res, next) {
  try {
    const h = req.headers.authorization || ''
    const m = /^Bearer\s+(.+)$/i.exec(h)
    if (!m) return res.status(401).json({ ok: false, error: 'Missing bearer token' })
    const payload = verifyToken(m[1])
    if (payload.typ !== 'staff') return res.status(403).json({ ok: false, error: 'Invalid token' })
    res.json({
      ok: true,
      staff: {
        id: payload.sub,
        email: payload.email,
        source: payload.source,
      },
    })
  } catch {
    return res.status(401).json({ ok: false, error: 'Invalid or expired token' })
  }
}

export async function createStaff(req, res, next) {
  try {
    const body = createStaffSchema.parse(req.body)
    const row = await adminAuthService.createStaff(body, req.staff)
    res.status(201).json({ ok: true, staff: row })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}

export async function listStaff(req, res, next) {
  try {
    const rows = await adminAuthService.listStaff()
    res.json({ ok: true, staff: rows })
  } catch (e) {
    next(e)
  }
}
