import crypto from 'crypto'
import { query } from '../db.js'
import { config } from '../config.js'
import { hashPassword, verifyPassword } from '../utils/password.js'
import { assertPasswordStrength } from '../utils/passwordPolicy.js'
import { signStaffToken } from '../utils/jwt.js'
import { createId } from '../utils/createId.js'

function hashEq(a, b) {
  const ah = crypto.createHash('sha256').update(String(a), 'utf8').digest()
  const bh = crypto.createHash('sha256').update(String(b), 'utf8').digest()
  return ah.length === bh.length && crypto.timingSafeEqual(ah, bh)
}

function mapStaffRow(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.ph,
    name: row.name,
    roleLabel: row.rl,
    status: row.status,
    createdAt: row.ca,
    updatedAt: row.ua,
  }
}

export async function staffLogin({ email, password }) {
  const e = String(email || '').trim().toLowerCase()
  const p = String(password || '')
  if (!e || !p) {
    const err = new Error('Email and password required')
    err.status = 400
    err.expose = true
    throw err
  }

  const bootEmail = config.adminBootstrapEmail
  const bootPw = config.adminBootstrapPassword
  const bootBcrypt = config.adminBootstrapPasswordBcrypt
  if (bootEmail && e === bootEmail) {
    if (bootBcrypt) {
      const okBoot = await verifyPassword(p, bootBcrypt)
      if (okBoot) {
        const token = signStaffToken({
          sub: 'bootstrap',
          email: e,
          source: 'bootstrap',
        })
        return {
          token,
          staff: { id: 'bootstrap', email: e, name: 'Bootstrap Admin', roleLabel: 'Super Admin', source: 'bootstrap' },
        }
      }
    } else if (bootPw && hashEq(p, bootPw)) {
      const token = signStaffToken({
        sub: 'bootstrap',
        email: e,
        source: 'bootstrap',
      })
      return {
        token,
        staff: { id: 'bootstrap', email: e, name: 'Bootstrap Admin', roleLabel: 'Super Admin', source: 'bootstrap' },
      }
    }
  }

  const { rows } = await query(
    `SELECT id, email, "passwordHash" AS ph, name, "roleLabel" AS rl, status, "createdAt" AS ca, "updatedAt" AS ua
     FROM "StaffAdmin" WHERE email = $1 LIMIT 1`,
    [e],
  )
  const row = mapStaffRow(rows[0])
  if (!row || row.status === 'SUSPENDED') {
    const err = new Error('Invalid email or password')
    err.status = 401
    err.expose = true
    throw err
  }
  const ok = await verifyPassword(p, row.passwordHash)
  if (!ok) {
    const err = new Error('Invalid email or password')
    err.status = 401
    err.expose = true
    throw err
  }
  const token = signStaffToken({
    sub: row.id,
    email: row.email,
    source: 'database',
  })
  return {
    token,
    staff: {
      id: row.id,
      email: row.email,
      name: row.name,
      roleLabel: row.roleLabel,
      status: row.status,
      source: 'database',
    },
  }
}

export async function createStaff({ email, password, name, roleLabel = 'Operations' }, actor) {
  const e = String(email || '').trim().toLowerCase()
  if (!e || !password) {
    const err = new Error('Email and password required')
    err.status = 400
    err.expose = true
    throw err
  }
  assertPasswordStrength(password)
  const { rows: ex } = await query('SELECT id FROM "StaffAdmin" WHERE email = $1 LIMIT 1', [e])
  if (ex.length) {
    const err = new Error('Staff email already exists')
    err.status = 409
    err.expose = true
    throw err
  }
  const passwordHash = await hashPassword(password)
  const addedById = actor.source === 'bootstrap' ? null : actor.id
  const id = createId()
  const { rows } = await query(
    `INSERT INTO "StaffAdmin" ("id", email, "passwordHash", name, "roleLabel", status, "addedById", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6, NOW(), NOW())
     RETURNING id, email, name, "roleLabel" AS rl, status, "createdAt" AS ca, "updatedAt" AS ua`,
    [id, e, passwordHash, String(name || '').trim() || e, String(roleLabel || 'Operations').trim() || 'Operations', addedById],
  )
  const row = rows[0]
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    roleLabel: row.rl,
    status: row.status,
    createdAt: row.ca,
  }
}

export async function listStaff() {
  const { rows } = await query(
    `SELECT id, email, name, "roleLabel" AS rl, status, "createdAt" AS ca, "updatedAt" AS ua
     FROM "StaffAdmin" ORDER BY "createdAt" DESC`,
  )
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    roleLabel: row.rl,
    status: row.status,
    createdAt: row.ca,
    updatedAt: row.ua,
  }))
}
