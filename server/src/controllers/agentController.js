import * as agentService from '../services/agentService.js'

export async function listAgents(req, res, next) {
  try {
    const take = req.query.take ? Number(req.query.take) : 200
    const skip = req.query.skip ? Number(req.query.skip) : 0
    const out = await agentService.listAgents({ take, skip })
    res.json({ ok: true, ...out })
  } catch (e) {
    next(e)
  }
}

