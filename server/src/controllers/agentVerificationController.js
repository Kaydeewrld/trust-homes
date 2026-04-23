import { z } from 'zod'
import * as agentVerificationService from '../services/agentVerificationService.js'

const setStatusSchema = z.object({
  approved: z.boolean(),
})

const submitRequestSchema = z.object({
  nin: z.string().min(6),
  verificationPhotoUrl: z.string().url(),
  emergencyContact: z.string().min(5),
})

export async function listPending(req, res, next) {
  try {
    const agents = await agentVerificationService.listPendingAgentVerification()
    res.json({ ok: true, agents })
  } catch (e) {
    next(e)
  }
}

export async function setStatus(req, res, next) {
  try {
    const body = setStatusSchema.parse(req.body)
    const out = await agentVerificationService.setAgentVerificationStatus({
      userId: req.params.userId,
      approved: body.approved,
    })
    res.json({ ok: true, agent: out })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    }
    next(e)
  }
}

export async function myStatus(req, res, next) {
  try {
    const status = await agentVerificationService.getMyAgentVerificationStatus(req.user.id)
    res.json({ ok: true, ...status })
  } catch (e) {
    next(e)
  }
}

export async function submitMyRequest(req, res, next) {
  try {
    const body = submitRequestSchema.parse(req.body)
    const out = await agentVerificationService.submitMyVerificationRequest({
      userId: req.user.id,
      ...body,
    })
    res.json({ ok: true, agent: out })
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ ok: false, error: e.issues[0]?.message || 'Invalid body' })
    }
    next(e)
  }
}
