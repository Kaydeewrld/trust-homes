import { z } from 'zod'
import * as authService from '../services/authService.js'
import * as googleAuthService from '../services/googleAuthService.js'
import { validatePasswordStrength } from '../utils/passwordPolicy.js'

const strongPassword = z.string().superRefine((pw, ctx) => {
  const r = validatePasswordStrength(pw)
  if (!r.ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: r.message })
})

const registerSchema = z.object({
  email: z.string().email(),
  password: strongPassword,
  displayName: z.string().min(1).optional(),
  role: z.enum(['USER', 'AGENT']),
  phone: z.string().optional(),
  agencyName: z.string().optional(),
  licenseId: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  intent: z.enum(['USER', 'AGENT']),
})

const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
})

const resendVerifySchema = z.object({
  email: z.string().email(),
})

const googleSchema = z.object({
  idToken: z.string().min(20),
  intent: z.enum(['USER', 'AGENT']),
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: strongPassword,
  otp: z.string().regex(/^\d{6}$/),
})

const forgotPasswordRequestSchema = z.object({
  email: z.string().email(),
})

const forgotPasswordResetSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/),
  newPassword: strongPassword,
})

export async function register(req, res, next) {
  try {
    const body = registerSchema.parse(req.body)
    const out = await authService.register(body)
    res.status(201).json({ ok: true, ...out })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}

export async function login(req, res, next) {
  try {
    const body = loginSchema.parse(req.body)
    const out = await authService.login(body)
    res.json({ ok: true, ...out })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}

export async function verifyEmail(req, res, next) {
  try {
    const body = verifyEmailSchema.parse(req.body)
    const out = await authService.verifyEmailWithOtp(body)
    res.json({ ok: true, ...out })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}

export async function resendVerifyEmail(req, res, next) {
  try {
    const body = resendVerifySchema.parse(req.body)
    const out = await authService.resendVerifyEmailOtp(body)
    res.json({ ok: true, ...out })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}

export async function googleLogin(req, res, next) {
  try {
    const body = googleSchema.parse(req.body)
    const out = await googleAuthService.loginWithGoogleIdToken(body)
    res.json({ ok: true, ...out })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}

export async function requestPasswordChangeOtp(req, res, next) {
  try {
    const out = await authService.requestPasswordChangeOtp(req.user.id)
    res.json({ ok: true, ...out })
  } catch (e) {
    next(e)
  }
}

export async function changePassword(req, res, next) {
  try {
    const body = changePasswordSchema.parse(req.body)
    await authService.changePasswordWithOtp({ userId: req.user.id, ...body })
    res.json({ ok: true })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}

export async function forgotPasswordRequest(req, res, next) {
  try {
    const body = forgotPasswordRequestSchema.parse(req.body)
    const out = await authService.requestForgotPasswordOtp(body)
    res.json({ ok: true, ...out })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}

export async function forgotPasswordReset(req, res, next) {
  try {
    const body = forgotPasswordResetSchema.parse(req.body)
    const out = await authService.resetPasswordWithForgotOtp(body)
    res.json({ ok: true, ...out })
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    next(e)
  }
}

export async function me(req, res, next) {
  try {
    const user = await authService.getMe(req.user.id)
    res.json({ ok: true, user })
  } catch (e) {
    next(e)
  }
}
