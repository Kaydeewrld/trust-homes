import { Server } from 'socket.io'
import { query } from '../db.js'
import { config } from '../config.js'
import { verifyToken } from '../utils/jwt.js'

let io = null
const onlineCounts = new Map()

function roomForUser(userId) {
  return `user:${userId}`
}

function getCount(userId) {
  return Number(onlineCounts.get(String(userId)) || 0)
}

function isOnline(userId) {
  return getCount(userId) > 0
}

async function listCounterpartUserIds(userId) {
  const { rows } = await query(
    `SELECT DISTINCT cp2."userId" AS id
     FROM "ConversationParticipant" cp1
     JOIN "ConversationParticipant" cp2
       ON cp2."conversationId" = cp1."conversationId"
      AND cp2.id <> cp1.id
     WHERE cp1."userId" = $1
       AND cp2."userId" IS NOT NULL`,
    [userId],
  )
  return rows.map((r) => String(r.id))
}

async function emitPresenceSnapshot(socket, userId) {
  const counterpartIds = await listCounterpartUserIds(userId)
  socket.emit('presence:snapshot', {
    users: counterpartIds.map((id) => ({ userId: id, online: isOnline(id) })),
  })
}

async function notifyPresenceChange(userId, online) {
  if (!io) return
  const counterpartIds = await listCounterpartUserIds(userId)
  for (const counterpartId of counterpartIds) {
    io.to(roomForUser(counterpartId)).emit('presence:update', { userId: String(userId), online: Boolean(online) })
  }
}

export function initRealtime(httpServer) {
  if (io) return io
  io = new Server(httpServer, {
    cors: {
      origin(origin, cb) {
        const isDev = process.env.NODE_ENV !== 'production'
        const devOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i
        if (!origin) return cb(null, true)
        if (config.clientOrigins.includes(origin)) return cb(null, true)
        if (isDev && devOriginPattern.test(origin)) return cb(null, true)
        return cb(null, false)
      },
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const bearer = String(socket.handshake.auth?.token || '').trim()
    if (!bearer) return next(new Error('Missing auth token'))
    try {
      const payload = verifyToken(bearer)
      if (payload.typ !== 'app') return next(new Error('Invalid token type'))
      socket.data.user = { id: String(payload.sub), email: payload.email || '', role: payload.role || 'USER' }
      return next()
    } catch {
      return next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const me = socket.data.user
    if (!me?.id) return
    const userId = String(me.id)
    socket.join(roomForUser(userId))
    const prev = getCount(userId)
    onlineCounts.set(userId, prev + 1)
    if (prev === 0) {
      void notifyPresenceChange(userId, true).catch(() => {})
    }
    void emitPresenceSnapshot(socket, userId).catch(() => {})

    socket.on('call:invite', (payload = {}) => {
      const toUserId = String(payload.toUserId || '').trim()
      if (!toUserId) return
      io.to(roomForUser(toUserId)).emit('call:incoming', {
        fromUserId: userId,
        fromName: String(payload.fromName || 'Member'),
        mode: payload.mode === 'video' ? 'video' : 'voice',
        roomId: String(payload.roomId || ''),
      })
    })

    socket.on('call:accept', (payload = {}) => {
      const toUserId = String(payload.toUserId || '').trim()
      if (!toUserId) return
      io.to(roomForUser(toUserId)).emit('call:accepted', {
        fromUserId: userId,
        roomId: String(payload.roomId || ''),
      })
    })

    socket.on('call:decline', (payload = {}) => {
      const toUserId = String(payload.toUserId || '').trim()
      if (!toUserId) return
      io.to(roomForUser(toUserId)).emit('call:declined', {
        fromUserId: userId,
        roomId: String(payload.roomId || ''),
      })
    })

    socket.on('call:signal', (payload = {}) => {
      const toUserId = String(payload.toUserId || '').trim()
      if (!toUserId) return
      io.to(roomForUser(toUserId)).emit('call:signal', {
        fromUserId: userId,
        roomId: String(payload.roomId || ''),
        signal: payload.signal || null,
      })
    })

    socket.on('call:end', (payload = {}) => {
      const toUserId = String(payload.toUserId || '').trim()
      if (!toUserId) return
      io.to(roomForUser(toUserId)).emit('call:ended', {
        fromUserId: userId,
        roomId: String(payload.roomId || ''),
      })
    })

    socket.on('disconnect', () => {
      const next = Math.max(0, getCount(userId) - 1)
      if (next <= 0) {
        onlineCounts.delete(userId)
        void notifyPresenceChange(userId, false).catch(() => {})
      } else {
        onlineCounts.set(userId, next)
      }
    })
  })

  return io
}

export function emitToUser(userId, event, payload) {
  if (!io || !userId) return
  io.to(roomForUser(String(userId))).emit(event, payload)
}

export function isUserOnline(userId) {
  return isOnline(userId)
}
