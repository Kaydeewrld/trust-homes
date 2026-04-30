import { Link, useSearchParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { io } from 'socket.io-client'
import { apiBaseUrl, listingsGetById, messagesConversations, messagesList, messagesOpenConversation, messagesSend } from '../lib/api'

function formatNaira(amount) {
  return `₦${new Intl.NumberFormat('en-NG').format(amount)}`
}

function VerifiedBadge({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 text-blue-600 ${className}`} fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  )
}

function AvatarRing({ conversation, size = 'md' }) {
  const sizes = { sm: 'h-8 w-8 text-[10px]', md: 'h-11 w-11 text-xs', lg: 'h-20 w-20 text-lg' }
  if (conversation.kind === 'agency' && conversation.initials) {
    return (
      <span
        className={`grid ${sizes[size]} place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 font-semibold text-white`}
      >
        {conversation.initials}
      </span>
    )
  }
  return <img src={conversation.avatar} alt="" className={`${sizes[size]} rounded-full object-cover`} />
}


function nowTimeLabel() {
  return new Date().toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' })
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const EMOJI_CHOICES = [
  '😀',
  '😁',
  '😂',
  '🤣',
  '😊',
  '😍',
  '🥰',
  '😉',
  '👍',
  '👎',
  '🙏',
  '👋',
  '🔥',
  '✨',
  '💯',
  '🏠',
  '📍',
  '💰',
  '📎',
  '✅',
  '❤️',
  '🎉',
  '📅',
  '📞',
  '✉️',
]

function MessageAttachments({ attachments, variant, onPreviewImage }) {
  if (!attachments?.length) return null
  const isOutgoing = variant === 'outgoing'
  return (
    <div className={`space-y-1.5 ${isOutgoing ? 'mb-1.5' : 'mb-1'}`}>
      {attachments.map((a) => {
        if (a.kind === 'image') {
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onPreviewImage?.(a.url)}
              className="block"
              aria-label="Preview image"
            >
              <img src={a.url} alt={a.name || ''} className="max-h-36 w-full max-w-[14rem] rounded-lg object-cover ring-1 ring-black/10" />
            </button>
          )
        }
        if (a.kind === 'audio') {
          if (isOutgoing) {
            return (
              <div key={a.id} className="w-full max-w-[min(100%,280px)]">
                <div
                  className="overflow-hidden rounded-2xl border border-white/35 bg-white/95 shadow-md"
                  style={{ colorScheme: 'light' }}
                >
                  <div className="flex items-center gap-2 px-2.5 py-2">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                      aria-hidden
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                        <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 1 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
                      </svg>
                    </span>
                    <audio
                      src={a.url}
                      controls
                      controlsList="nodownload"
                      className="h-9 min-h-[36px] min-w-0 flex-1 rounded-lg bg-white"
                      preload="metadata"
                    />
                  </div>
                  {a.sizeLabel ? (
                    <p className="border-t border-slate-200/70 bg-slate-50 px-2.5 py-1 text-[10px] text-slate-600">{a.sizeLabel}</p>
                  ) : null}
                </div>
              </div>
            )
          }
          return (
            <div key={a.id} className="max-w-[min(100%,18rem)]" style={{ colorScheme: 'light' }}>
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center gap-2 px-2.5 py-2">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 ring-1 ring-slate-200"
                    aria-hidden
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 1 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
                    </svg>
                  </span>
                  <audio
                    src={a.url}
                    controls
                    className="h-9 min-w-0 flex-1 rounded-lg bg-white"
                    preload="metadata"
                  />
                </div>
                {a.sizeLabel ? (
                  <p className="border-t border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] text-slate-600">{a.sizeLabel}</p>
                ) : null}
              </div>
            </div>
          )
        }
        return (
          <a
            key={a.id}
            href={a.url}
            download={a.name}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-medium ring-1 ${
              isOutgoing ? 'bg-white/15 text-white ring-white/25 hover:bg-white/25' : 'bg-slate-100 text-slate-800 ring-slate-200 hover:bg-slate-200'
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 opacity-90" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="1.6" />
              <path d="M14 2v6h6" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="min-w-0 flex-1 truncate">{a.name}</span>
            {a.sizeLabel && <span className="shrink-0 opacity-80">{a.sizeLabel}</span>}
          </a>
        )
      })}
    </div>
  )
}

function pickSupportedAudioMime() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
  for (const t of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

function extensionForMime(mime) {
  if (mime.includes('webm')) return 'webm'
  if (mime.includes('ogg')) return 'ogg'
  if (mime.includes('mp4') || mime.includes('aac') || mime.includes('mpeg')) return 'm4a'
  return 'webm'
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

function EmptyStateIllustration() {
  return (
    <div className="relative mx-auto flex h-24 w-44 items-center justify-center" aria-hidden>
      <div className="absolute -right-1 top-4 h-12 w-12 rounded-full bg-blue-100/80" />
      <div className="absolute -left-2 bottom-5 h-8 w-8 rounded-full bg-slate-200/80" />
      <div className="absolute right-6 top-1 h-1.5 w-1.5 rounded-full bg-blue-400" />
      <div className="absolute left-8 top-7 h-1 w-1 rounded-full bg-blue-300" />
      <svg viewBox="0 0 200 160" className="relative z-[1] h-28 w-40 text-slate-300">
        <path
          d="M24 48h72c6 0 12 5 12 12v28c0 6-6 12-12 12H40l-8 16V80c-6 0-12-6-12-12V60c0-7 6-12 12-12z"
          fill="currentColor"
          className="text-slate-200"
        />
        <circle cx="48" cy="68" r="3" fill="#94a3b8" />
        <circle cx="60" cy="68" r="3" fill="#94a3b8" />
        <circle cx="72" cy="68" r="3" fill="#94a3b8" />
        <path
          d="M104 32h64c7 0 12 5 12 12v36c0 7-5 12-12 12h-48l-6 14V92c-8 0-14-6-14-14V44c0-7 6-12 14-12z"
          fill="#2563eb"
          opacity="0.92"
        />
        <path d="M118 52h36M118 64h28M118 76h32" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
      </svg>
      <span
        className="absolute bottom-3 left-1/2 z-[2] -translate-x-1/2 text-2xl text-emerald-500/90"
        style={{ fontFamily: 'serif' }}
      >
        ❧
      </span>
    </div>
  )
}

function MessageTick({ status = 'SENT' }) {
  const isRead = status === 'READ'
  const isDelivered = status === 'DELIVERED' || status === 'READ'
  const tickClass = isRead ? 'text-blue-500' : 'text-white/90'
  if (!isDelivered) {
    return (
      <svg viewBox="0 0 24 24" className={`h-3 w-3 ${tickClass}`} fill="currentColor" aria-hidden>
        <path d="M18 7l-8 8-4-4" />
      </svg>
    )
  }
  return (
    <span className={`inline-flex ${tickClass}`} aria-hidden>
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
        <path d="M18 7l-8 8-4-4" />
      </svg>
      <svg viewBox="0 0 24 24" className="-ml-1 h-3 w-3" fill="currentColor">
        <path d="M18 7l-8 8-4-4" />
      </svg>
    </span>
  )
}

function InlineStatusTick({ status = 'SENT', compact = false }) {
  const isRead = status === 'READ'
  const isDelivered = status === 'DELIVERED' || status === 'READ'
  const tickClass = isRead ? 'text-blue-500' : 'text-slate-400'
  if (!isDelivered) {
    return (
      <svg viewBox="0 0 24 24" className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} ${tickClass}`} fill="currentColor" aria-hidden>
        <path d="M18 7l-8 8-4-4" />
      </svg>
    )
  }
  return (
    <span className={`inline-flex ${tickClass}`} aria-hidden>
      <svg viewBox="0 0 24 24" className={`${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} fill="currentColor">
        <path d="M18 7l-8 8-4-4" />
      </svg>
      <svg viewBox="0 0 24 24" className={`-ml-1 ${compact ? 'h-3 w-3' : 'h-3.5 w-3.5'}`} fill="currentColor">
        <path d="M18 7l-8 8-4-4" />
      </svg>
    </span>
  )
}

function extractPropertyIdFromText(text) {
  const value = String(text || '')
  if (!value) return null
  const patterns = [/\/property\/([a-zA-Z0-9_-]+)/i, /property\/([a-zA-Z0-9_-]+)/i]
  for (const re of patterns) {
    const match = value.match(re)
    if (match?.[1]) return match[1]
  }
  return null
}

function socketBaseUrl() {
  const base = String(apiBaseUrl() || '').replace(/\/+$/, '')
  return base.endsWith('/api') ? base.slice(0, -4) : base
}

function messageCacheKey(userId) {
  return `th_messages_cache_${String(userId || '')}`
}

function conversationCacheKey(userId) {
  return `th_conversations_cache_${String(userId || '')}`
}

function formatCallDuration(totalSeconds) {
  const sec = Math.max(0, Number(totalSeconds) || 0)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

function parseCallLog(body, kind) {
  if (String(kind || '').toUpperCase() !== 'SYSTEM') return null
  const raw = String(body || '')
  if (!raw.startsWith('CALL_LOG|')) return null
  const [, modeRaw, eventRaw, durationRaw] = raw.split('|')
  const mode = modeRaw === 'video' ? 'Video' : 'Voice'
  const event = String(eventRaw || '').toUpperCase()
  const duration = Math.max(0, Number(durationRaw) || 0)
  if (event === 'DECLINED') return `${mode} call declined`
  if (event === 'MISSED') return `Missed ${mode.toLowerCase()} call`
  if (event === 'ENDED') return `${mode} call ended${duration > 0 ? ` · ${formatCallDuration(duration)}` : ''}`
  return `${mode} call update`
}

function MessagesPage() {
  const { token, user } = useAuth()
  const [searchParams] = useSearchParams()
  const [liveConversations, setLiveConversations] = useState([])
  const [liveMessages, setLiveMessages] = useState({})
  const [selectedId, setSelectedId] = useState(null)
  const [listTab, setListTab] = useState('all')
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  /** Files staged before send: { id, file, previewUrl? } */
  const [pendingFiles, setPendingFiles] = useState([])
  const chatScrollRef = useRef(null)
  const chatEndRef = useRef(null)
  const emojiPanelRef = useRef(null)
  const attachAnyRef = useRef(null)
  const attachImageRef = useRef(null)
  const attachDocRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const ringtoneIntervalRef = useRef(null)
  const audioCtxRef = useRef(null)
  const recorderStreamRef = useRef(null)
  const callStreamRef = useRef(null)
  const socketRef = useRef(null)
  const peerRef = useRef(null)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const pendingCandidatesRef = useRef([])
  const remoteUserForCallRef = useRef('')
  const activeCallRef = useRef(null)
  const liveConversationsRef = useRef([])
  const callMetaRef = useRef({ conversationId: '', mode: 'voice', startedAt: 0 })
  const recordingCancelledRef = useRef(false)
  const previewAutoSentRef = useRef(new Set())
  const [isRecording, setIsRecording] = useState(false)
  const [incomingCall, setIncomingCall] = useState(null)
  const [activeCall, setActiveCall] = useState(null)
  const [callConnected, setCallConnected] = useState(false)
  const [isCallMuted, setIsCallMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [sendError, setSendError] = useState('')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    activeCallRef.current = activeCall
  }, [activeCall])

  useEffect(() => {
    liveConversationsRef.current = liveConversations
  }, [liveConversations])

  const loadConversations = useCallback(async (nextSelectedId = null) => {
    if (!token) return
    const out = await messagesConversations(token)
    const rows = Array.isArray(out?.conversations)
      ? out.conversations.map((c) => ({
          id: c.id,
          name: c.counterpart?.displayName || 'Unknown',
          role: c.counterpart?.kind === 'TRUSTED_HOME' ? 'TrustedHome' : c.counterpart?.role || 'Member',
          verified: c.counterpart?.kind === 'TRUSTED_HOME' || Boolean(c.counterpart?.verified),
          kind: c.counterpart?.kind === 'TRUSTED_HOME' ? 'agency' : 'person',
          initials: (c.counterpart?.displayName || 'TH')
            .split(' ')
            .map((x) => x[0])
            .slice(0, 2)
            .join('')
            .toUpperCase(),
          avatar: c.counterpart?.avatarUrl || null,
          lastMessage: c.lastMessage || 'No messages yet',
          lastMessageFromMe: c.lastSenderUserId && user?.id ? String(c.lastSenderUserId) === String(user.id) : false,
          lastDeliveryStatus: c.lastDeliveryStatus || null,
          timeLabel: c.updatedAt ? new Date(c.updatedAt).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' }) : '',
          phone: '',
          unread: Number(c.unreadCount || 0),
          online: false,
          rating: 4.9,
          reviewsCount: 0,
          soldCount: 0,
          bio: c.counterpart?.kind === 'TRUSTED_HOME' ? 'Official TrustedHome notifications and support.' : 'Conversation',
          property: c.listingPreview
            ? {
                id: c.listingPreview.id || '',
                title: c.listingPreview.title || 'Shared property',
                location: c.listingPreview.location || '',
                price: Number(c.listingPreview.priceNgn || 0),
                image: c.listingPreview.image || '',
              }
            : {
                id: '',
                title: 'No property preview',
                location: '',
                price: 0,
                image: '',
              },
          attachments: [],
          _counterpartUserId: c.counterpart?.userId || null,
          _counterpartKind: c.counterpart?.kind || 'USER',
        }))
      : []
    setLiveConversations(rows)
    if (nextSelectedId) {
      setSelectedId(nextSelectedId)
      return
    }
    setSelectedId((prev) => prev || rows[0]?.id || null)
    setLoadError('')
  }, [token, user?.id])

  const loadMessages = useCallback(async (conversationId) => {
    if (!token || !conversationId) return
    const out = await messagesList(token, conversationId, { take: 120 })
    const rows = Array.isArray(out?.messages) ? out.messages : []
    setLiveMessages((prev) => ({
      ...prev,
      [conversationId]: rows.map((m) => ({
        id: m.id,
        from:
          m.senderUserId && user?.id && String(m.senderUserId) === String(user.id)
            ? 'me'
            : m.senderKind === 'TRUSTED_HOME'
              ? 'auto'
              : 'them',
        senderUserId: m.senderUserId || null,
        kind: m.kind || 'TEXT',
        text: m.body || '',
        time: new Date(m.createdAt).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' }),
        deliveryStatus: m.deliveryStatus || null,
        attachments: Array.isArray(m.attachments) ? m.attachments : [],
        listingPreview: m.listingPreview || null,
      })),
    }))
    setLoadError('')
  }, [token, user?.id])

  const cleanupCallMedia = useCallback(() => {
    if (peerRef.current) {
      peerRef.current.onicecandidate = null
      peerRef.current.ontrack = null
      peerRef.current.onconnectionstatechange = null
      peerRef.current.close()
      peerRef.current = null
    }
    pendingCandidatesRef.current = []
    if (callStreamRef.current) {
      callStreamRef.current.getTracks().forEach((t) => t.stop())
      callStreamRef.current = null
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null
    setCallConnected(false)
  }, [])

  const ensurePeer = useCallback(
    (roomId, remoteUserId) => {
      if (peerRef.current) return peerRef.current
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
      })
      remoteUserForCallRef.current = String(remoteUserId || '')
      pc.onicecandidate = (event) => {
        if (!event.candidate || !socketRef.current || !remoteUserForCallRef.current) return
        socketRef.current.emit('call:signal', {
          toUserId: remoteUserForCallRef.current,
          roomId,
          signal: { type: 'candidate', candidate: event.candidate },
        })
      }
      pc.ontrack = (event) => {
        const [remoteStream] = event.streams
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStream
      }
      pc.onconnectionstatechange = () => {
        const st = pc.connectionState
        setCallConnected(st === 'connected')
      }
      peerRef.current = pc
      return pc
    },
    [],
  )

  const initLocalMedia = useCallback(async (mode) => {
    if (callStreamRef.current) return callStreamRef.current
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: mode === 'video',
    })
    callStreamRef.current = stream
    if (localVideoRef.current) localVideoRef.current.srcObject = stream
    return stream
  }, [])

  const sendCallLog = useCallback(async ({ event, durationSec = 0, mode }) => {
    const conversationId = callMetaRef.current?.conversationId
    if (!token || !conversationId) return
    const body = `CALL_LOG|${mode === 'video' ? 'video' : 'voice'}|${String(event || 'ENDED').toUpperCase()}|${Math.max(0, Math.round(durationSec))}`
    await messagesSend(token, conversationId, { kind: 'SYSTEM', body }).catch(() => {})
  }, [token])

  const stopRingtone = useCallback(() => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current)
      ringtoneIntervalRef.current = null
    }
  }, [])

  const startRingtone = useCallback(() => {
    stopRingtone()
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx()
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') void ctx.resume()
      const ping = () => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = 760
        gain.gain.value = 0.0001
        osc.connect(gain)
        gain.connect(ctx.destination)
        const now = ctx.currentTime
        gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35)
        osc.start(now)
        osc.stop(now + 0.38)
      }
      ping()
      ringtoneIntervalRef.current = setInterval(ping, 1400)
    } catch {
      // ignore audio errors
    }
  }, [stopRingtone])

  const notifyIncomingCall = useCallback((callerName) => {
    const title = 'Incoming TrustedHome call'
    const body = `${callerName || 'Someone'} is calling you`
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body })
      } else if (Notification.permission === 'default') {
        void Notification.requestPermission().then((perm) => {
          if (perm === 'granted') new Notification(title, { body })
        })
      }
    }
    if (navigator?.vibrate) navigator.vibrate([180, 120, 180])
  }, [])

  const filtered = useMemo(() => {
    let list = [...liveConversations]
    if (listTab === 'unread') list = list.filter((c) => c.unread > 0)
    if (listTab === 'archived') list = []
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q))
    }
    return list
  }, [listTab, query, liveConversations])

  useEffect(() => {
    if (!user?.id) return
    try {
      const raw = localStorage.getItem(conversationCacheKey(user.id))
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) {
          setLiveConversations(parsed)
          setSelectedId((prev) => prev || parsed[0]?.id || null)
        }
      }
    } catch {
      // ignore bad cache
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    try {
      localStorage.setItem(conversationCacheKey(user.id), JSON.stringify(liveConversations))
    } catch {
      // ignore write errors
    }
  }, [liveConversations, user?.id])

  useEffect(() => {
    if (!user?.id) return
    try {
      const raw = localStorage.getItem(messageCacheKey(user.id))
      if (!raw) return
      const parsed = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        setLiveMessages(parsed)
      }
    } catch {
      // ignore bad cache
    }
  }, [user?.id])

  useEffect(() => {
    if (!user?.id) return
    try {
      localStorage.setItem(messageCacheKey(user.id), JSON.stringify(liveMessages))
    } catch {
      // ignore write errors
    }
  }, [liveMessages, user?.id])

  const active = useMemo(() => liveConversations.find((c) => c.id === selectedId), [selectedId, liveConversations])
  const messages = useMemo(() => {
    if (!active) return []
    return liveMessages[active.id] || []
  }, [active, liveMessages])

  useEffect(() => {
    if (!token) return
    void loadConversations().catch((err) => {
      setLoadError(err?.message || 'Unable to load conversations right now.')
    })
  }, [token, loadConversations])

  useEffect(() => {
    if (!active?.id) return
    void loadMessages(active.id).catch((err) => {
      setLoadError(err?.message || 'Unable to load messages right now.')
    })
  }, [active?.id, loadMessages])

  useEffect(() => {
    if (!token || socketRef.current) return
    const s = io(socketBaseUrl(), {
      transports: ['websocket', 'polling'],
      auth: { token },
    })
    socketRef.current = s

    s.on('message:new', (payload) => {
      const m = payload?.message
      if (!m?.conversationId) return
      const fromMe = m.senderUserId && user?.id && String(m.senderUserId) === String(user.id)
      const mapped = {
        id: m.id || `rt-${Date.now()}`,
        from: fromMe ? 'me' : 'them',
        senderUserId: m.senderUserId || null,
        kind: m.kind || 'TEXT',
        text: m.body || '',
        time: new Date(m.createdAt || Date.now()).toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' }),
        deliveryStatus: m.deliveryStatus || null,
        attachments: Array.isArray(m.attachments) ? m.attachments : [],
        listingPreview: m.listingPreview || null,
      }
      setLiveMessages((prev) => {
        const list = prev[m.conversationId] || []
        if (list.some((x) => String(x.id) === String(mapped.id))) return prev
        return { ...prev, [m.conversationId]: [...list, mapped] }
      })
      void loadConversations().catch(() => {})
    })

    s.on('conversation:refresh', () => {
      void loadConversations().catch(() => {})
    })

    s.on('presence:snapshot', (payload) => {
      const map = new Map((payload?.users || []).map((u) => [String(u.userId), Boolean(u.online)]))
      setLiveConversations((prev) =>
        prev.map((c) =>
          c?._counterpartUserId && map.has(String(c._counterpartUserId))
            ? { ...c, online: Boolean(map.get(String(c._counterpartUserId))) }
            : c,
        ),
      )
    })

    s.on('presence:update', (payload) => {
      const uid = String(payload?.userId || '')
      if (!uid) return
      setLiveConversations((prev) =>
        prev.map((c) => (String(c?._counterpartUserId || '') === uid ? { ...c, online: Boolean(payload?.online) } : c)),
      )
    })

    s.on('call:incoming', (payload) => {
      const fromUserId = String(payload?.fromUserId || '')
      const matchedConversation = liveConversationsRef.current.find((c) => String(c?._counterpartUserId || '') === fromUserId)
      startRingtone()
      notifyIncomingCall(payload?.fromName || 'Member')
      setIncomingCall({
        mode: payload?.mode === 'video' ? 'video' : 'voice',
        roomId: String(payload?.roomId || ''),
        callerName: String(payload?.fromName || 'Member'),
        fromUserId,
        conversationId: matchedConversation?.id || '',
      })
    })

    s.on('call:accepted', (payload) => {
      if (!payload?.roomId) return
      stopRingtone()
      setActiveCall((prev) =>
        prev?.roomId === payload.roomId
          ? { ...prev, accepted: true, remoteUserId: String(payload?.fromUserId || prev.remoteUserId || '') }
          : prev,
      )
    })

    s.on('call:declined', () => {
      stopRingtone()
      const current = activeCallRef.current
      if (current) {
        void sendCallLog({ event: 'DECLINED', mode: current.mode || 'voice' })
      }
      setActiveCall(null)
      cleanupCallMedia()
    })

    s.on('call:signal', async (payload) => {
      const roomId = String(payload?.roomId || '')
      if (!roomId) return
      const signal = payload?.signal
      const fromUserId = String(payload?.fromUserId || '')
      if (!signal || !fromUserId) return
      const current = activeCallRef.current
      if (!current || String(current.roomId) !== roomId) return
      const pc = ensurePeer(roomId, fromUserId)
      if (signal.type === 'offer' && signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }))
        const stream = await initLocalMedia(current.mode || 'voice')
        for (const track of stream.getTracks()) pc.addTrack(track, stream)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socketRef.current?.emit('call:signal', {
          toUserId: fromUserId,
          roomId,
          signal: { type: 'answer', sdp: answer.sdp },
        })
      } else if (signal.type === 'answer' && signal.sdp) {
        await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }))
      } else if (signal.type === 'candidate' && signal.candidate) {
        try {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate))
          } else {
            pendingCandidatesRef.current.push(signal.candidate)
          }
        } catch {
          // ignore
        }
      }
      if (pc.remoteDescription && pendingCandidatesRef.current.length) {
        const pending = [...pendingCandidatesRef.current]
        pendingCandidatesRef.current = []
        for (const c of pending) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c))
          } catch {
            // ignore
          }
        }
      }
    })

    s.on('call:ended', (payload) => {
      const current = activeCallRef.current
      if (current && String(current.roomId) === String(payload?.roomId || '')) {
        stopRingtone()
        const durationSec = callMetaRef.current?.startedAt ? Math.floor((Date.now() - callMetaRef.current.startedAt) / 1000) : 0
        void sendCallLog({ event: 'ENDED', mode: current.mode || 'voice', durationSec })
        setActiveCall(null)
        cleanupCallMedia()
      }
    })

    return () => {
      s.disconnect()
      socketRef.current = null
    }
  }, [token, user?.id, loadConversations, loadMessages, cleanupCallMedia, ensurePeer, initLocalMedia, sendCallLog, startRingtone, stopRingtone, notifyIncomingCall])

  useEffect(() => {
    if (!token) return
    const interval = setInterval(() => {
      void loadConversations().catch(() => {})
      if (active?.id) void loadMessages(active.id).catch(() => {})
    }, 15000)
    return () => clearInterval(interval)
  }, [token, active?.id, loadConversations, loadMessages])

  useEffect(() => {
    if (!token || !user?.id) return
    const agentId = searchParams.get('agentId')
    if (!agentId) return
    const listingId = searchParams.get('listingId') || ''
    ;(async () => {
      const fetchedPreview = listingId ? await buildListingPreview(listingId) : null
      const title = fetchedPreview?.title || searchParams.get('listingTitle') || 'Property'
      const location = fetchedPreview?.location || searchParams.get('listingLocation') || ''
      const priceNgn = Number(fetchedPreview?.priceNgn || searchParams.get('listingPrice') || 0)
      const image = fetchedPreview?.image || searchParams.get('listingImage') || ''
      const out = await messagesOpenConversation(token, {
        withUserId: agentId,
        listingPreview: { id: listingId, title, location, priceNgn, image },
      })
      const cid = out?.conversationId
      if (!cid) return
      setLiveConversations((prev) => {
        if (prev.some((c) => c.id === cid)) return prev
        return [
          {
            id: cid,
            name: 'Agent',
            role: 'Member',
            verified: false,
            kind: 'person',
            initials: 'AG',
            avatar: null,
            lastMessage: 'No messages yet',
            lastMessageFromMe: false,
            lastDeliveryStatus: null,
            timeLabel: '',
            phone: '',
            unread: 0,
            online: false,
            rating: 4.9,
            reviewsCount: 0,
            soldCount: 0,
            bio: 'Conversation',
            property: {
              id: listingId || '',
              title: title || 'Shared property',
              location: location || '',
              price: Number(priceNgn || 0),
              image: image || '',
            },
            attachments: [],
            _counterpartUserId: agentId,
            _counterpartKind: 'USER',
          },
          ...prev,
        ]
      })
      setSelectedId(cid)
      await loadConversations(cid)
      const autoKey = `${cid}:${listingId || ''}`
      if (listingId && !previewAutoSentRef.current.has(autoKey)) {
        previewAutoSentRef.current.add(autoKey)
        await messagesSend(token, cid, {
          kind: 'TEXT',
          body: '',
          listingPreview: { id: listingId, title, location, priceNgn, image },
        }).catch(() => {})
      }
    })().catch(() => {})
  }, [token, user?.id, searchParams])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, selectedId])

  useEffect(() => {
    recordingCancelledRef.current = true
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    recorderStreamRef.current?.getTracks().forEach((t) => t.stop())
    recorderStreamRef.current = null
    setIsRecording(false)
    setDraft('')
    setPendingFiles((prev) => {
      prev.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl)
      })
      return []
    })
    setEmojiOpen(false)
  }, [selectedId])

  useEffect(() => {
    return () => {
      stopRingtone()
      recordingCancelledRef.current = true
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      recorderStreamRef.current?.getTracks().forEach((t) => t.stop())
      callStreamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [stopRingtone])

  useEffect(() => {
    function handleClickOutside(event) {
      if (emojiPanelRef.current && !emojiPanelRef.current.contains(event.target)) {
        setEmojiOpen(false)
      }
    }
    if (emojiOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [emojiOpen])

  const addPendingFiles = (fileList) => {
    const files = Array.from(fileList || [])
    if (!files.length) return
    setPendingFiles((prev) => {
      const next = [...prev]
      for (const file of files) {
        const id = `pf-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        const isImage = file.type.startsWith('image/')
        next.push({
          id,
          file,
          previewUrl: isImage ? URL.createObjectURL(file) : undefined,
        })
      }
      return next
    })
  }

  const removePendingFile = (id) => {
    setPendingFiles((prev) => {
      const found = prev.find((p) => p.id === id)
      if (found?.previewUrl) URL.revokeObjectURL(found.previewUrl)
      return prev.filter((p) => p.id !== id)
    })
  }

  const toggleVoiceRecording = async () => {
    if (!active) return
    if (typeof MediaRecorder === 'undefined' || !navigator.mediaDevices?.getUserMedia) return

    if (isRecording) {
      const mr = mediaRecorderRef.current
      if (mr && mr.state !== 'inactive') mr.stop()
      return
    }

    recordingCancelledRef.current = false
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      recorderStreamRef.current = stream
      const mimeType = pickSupportedAudioMime()
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      const chunks = []
      mr.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data)
      }
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        recorderStreamRef.current = null
        mediaRecorderRef.current = null
        const cancelled = recordingCancelledRef.current
        recordingCancelledRef.current = false
        setIsRecording(false)
        if (cancelled) return
        const recordedType = (mr.mimeType && mr.mimeType.split(';')[0]) || (mimeType ? mimeType.split(';')[0] : '') || 'audio/webm'
        const blob = new Blob(chunks, { type: recordedType })
        if (blob.size < 32) return
        const ext = extensionForMime(blob.type || recordedType)
        const ts = Date.now()
        const file = new File([blob], `voice-${ts}.${ext}`, { type: blob.type || recordedType })
        const id = `pf-${ts}-${Math.random().toString(36).slice(2, 9)}`
        const previewUrl = URL.createObjectURL(file)
        setPendingFiles((prev) => [...prev, { id, file, previewUrl }])
      }
      mr.start(250)
      mediaRecorderRef.current = mr
      setIsRecording(true)
    } catch {
      setIsRecording(false)
      recorderStreamRef.current?.getTracks().forEach((t) => t.stop())
      recorderStreamRef.current = null
    }
  }

  const buildListingPreview = async (propertyId) => {
    if (!token || !propertyId) return null
    try {
      const out = await listingsGetById(propertyId)
      const l = out?.listing
      if (!l) return null
      return {
        id: String(l.id || propertyId),
        title: String(l.title || 'Shared Property'),
        location: String(l.location || ''),
        priceNgn: Number(l.priceNgn || 0),
        image: String(l.previewMediaUrl || l?.media?.[0]?.url || ''),
      }
    } catch {
      return { id: String(propertyId), title: 'Shared Property', location: '', priceNgn: 0, image: '' }
    }
  }

  const sendMessage = () => {
    void (async () => {
      setSendError('')
      const text = draft.trim()
      const linkedPropertyId = extractPropertyIdFromText(text)
      const linkedPreview = linkedPropertyId ? await buildListingPreview(linkedPropertyId) : null
      const hasFiles = pendingFiles.length > 0
      if ((!text && !hasFiles && !linkedPreview) || !active) return

      const uid = `u-${Date.now()}`
      const time = nowTimeLabel()
      const attachments = await Promise.all(pendingFiles.map(async (p) => {
        const dataUrl = await fileToDataUrl(p.file)
        const isImage = p.file.type.startsWith('image/')
        const isAudio = p.file.type.startsWith('audio/')
        return {
          id: `att-${p.id}`,
          kind: isImage ? 'image' : isAudio ? 'audio' : 'file',
          url: dataUrl,
          name: p.file.name,
          sizeLabel: formatFileSize(p.file.size),
        }
      }))

      pendingFiles.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl)
      })

      const optimistic = {
        id: uid,
        from: 'me',
        text,
        attachments: attachments.length ? attachments : undefined,
        listingPreview: linkedPreview || undefined,
        time,
        deliveryStatus: active.online ? 'DELIVERED' : 'SENT',
      }
      setLiveMessages((prev) => ({
        ...prev,
        [active.id]: [...(prev[active.id] || []), optimistic],
      }))
      setDraft('')
      setPendingFiles([])
      if (token) {
        const out = await messagesSend(token, active.id, {
          kind: attachments.some((a) => a.kind === 'audio') ? 'VOICE' : attachments.some((a) => a.kind === 'image') ? 'IMAGE' : attachments.length ? 'FILE' : 'TEXT',
          body: text,
          attachments,
          listingPreview: linkedPreview || undefined,
        }).catch((err) => {
          setSendError(err?.message || 'Message failed to send.')
          return null
        })
        if (!out?.id) {
          setLiveMessages((prev) => ({
            ...prev,
            [active.id]: (prev[active.id] || []).map((m) =>
              m.id === uid ? { ...m, deliveryStatus: 'FAILED' } : m,
            ),
          }))
          return
        }
        await loadMessages(active.id).catch(() => {})
        await loadConversations().catch(() => {})
      }
    })()
  }

  const startInAppCall = (mode) => {
    if (!active || !token) return
    const roomId = `trustedhome-${active.id}-${Date.now()}`
    const toUserId = String(active?._counterpartUserId || '')
    callMetaRef.current = { conversationId: active.id, mode: mode === 'video' ? 'video' : 'voice', startedAt: 0 }
    setIsCallMuted(false)
    setIsVideoEnabled(mode === 'video')
    startRingtone()
    setActiveCall({ mode, roomId, initiator: true, remoteUserId: toUserId, accepted: false })
    if (toUserId && socketRef.current) {
      socketRef.current.emit('call:invite', {
        toUserId,
        mode: mode === 'video' ? 'video' : 'voice',
        roomId,
        fromName: user?.displayName || 'Member',
      })
    } else {
      const body = `CALL_INVITE|${mode}|${roomId}|${user?.displayName || 'Member'}`
      void messagesSend(token, active.id, { kind: 'SYSTEM', body }).catch(() => {})
    }
  }

  useEffect(() => {
    const run = async () => {
      if (!activeCall?.initiator || !activeCall?.accepted || !activeCall?.remoteUserId || !activeCall?.roomId) return
      const pc = ensurePeer(activeCall.roomId, activeCall.remoteUserId)
      const stream = await initLocalMedia(activeCall.mode || 'voice')
      const existingSenders = pc.getSenders().map((s) => s.track?.id)
      for (const track of stream.getTracks()) {
        if (!existingSenders.includes(track.id)) {
          pc.addTrack(track, stream)
        }
      }
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socketRef.current?.emit('call:signal', {
        toUserId: activeCall.remoteUserId,
        roomId: activeCall.roomId,
        signal: { type: 'offer', sdp: offer.sdp },
      })
    }
    void run().catch(() => {})
  }, [activeCall, ensurePeer, initLocalMedia])

  useEffect(() => {
    if (!callConnected) return
    if (callMetaRef.current.startedAt) return
    stopRingtone()
    callMetaRef.current = { ...callMetaRef.current, startedAt: Date.now() }
  }, [callConnected, stopRingtone])

  const toggleMute = () => {
    const stream = callStreamRef.current
    if (!stream) return
    const audioTracks = stream.getAudioTracks()
    if (!audioTracks.length) return
    const nextEnabled = !audioTracks[0].enabled
    audioTracks.forEach((t) => { t.enabled = nextEnabled })
    setIsCallMuted(!nextEnabled)
  }

  const toggleVideo = async () => {
    const current = activeCallRef.current
    if (!current || !current.remoteUserId || !current.roomId) return
    const pc = ensurePeer(current.roomId, current.remoteUserId)
    let stream = callStreamRef.current
    if (!stream) {
      stream = await initLocalMedia('video')
      setActiveCall((prev) => (prev ? { ...prev, mode: 'video' } : prev))
      setIsVideoEnabled(true)
      return
    }
    const existing = stream.getVideoTracks()[0]
    if (existing) {
      const next = !existing.enabled
      existing.enabled = next
      setIsVideoEnabled(next)
      return
    }
    const extra = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }).catch(() => null)
    const track = extra?.getVideoTracks?.()[0]
    if (!track) return
    stream.addTrack(track)
    if (localVideoRef.current) localVideoRef.current.srcObject = stream
    pc.addTrack(track, stream)
    setActiveCall((prev) => (prev ? { ...prev, mode: 'video' } : prev))
    setIsVideoEnabled(true)
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    socketRef.current?.emit('call:signal', {
      toUserId: current.remoteUserId,
      roomId: current.roomId,
      signal: { type: 'offer', sdp: offer.sdp },
    })
  }

  useEffect(() => {
    if (!active || !messages.length) return
    const invite = [...messages]
      .reverse()
      .find((m) => String(m.kind || '').toUpperCase() === 'SYSTEM' && String(m.text || '').startsWith('CALL_INVITE|') && m.from !== 'me')
    if (!invite) return
    const [, mode, roomId, callerName] = String(invite.text || '').split('|')
    if (!roomId) return
    setIncomingCall((prev) => (prev?.roomId === roomId ? prev : { mode: mode === 'video' ? 'video' : 'voice', roomId, callerName: callerName || active.name }))
  }, [active, messages])

  const unreadTotal = liveConversations.reduce((acc, c) => acc + c.unread, 0)

  return (
    <div className="flex h-[calc(100vh-7.5rem)] w-full min-w-0 max-w-[min(100%,1600px)] flex-col">
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm">
        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 divide-y divide-slate-200 overflow-hidden lg:grid-cols-[minmax(200px,260px)_minmax(0,1fr)] lg:divide-x lg:divide-y-0 xl:grid-cols-[minmax(240px,300px)_minmax(0,1fr)_minmax(260px,300px)]">
        {/* Conversation list */}
        <aside className="flex min-h-0 flex-col bg-white lg:max-h-full">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-2.5 py-1.5">
            <h2 className="text-sm font-semibold text-slate-900">Messages</h2>
            <div className="flex items-center gap-1">
              <button type="button" className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Filter">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                  <path d="M4 6h16M8 12h8M10 18h4" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="shrink-0 border-b border-slate-100 px-2.5 py-1">
            <div className="relative">
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor">
                <path d="M11 4a7 7 0 1 0 4.95 11.95L20 20" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-9 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
              />
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-slate-200/80" aria-label="Filter messages">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                  <path d="M4 6h16M8 12h8M10 18h4" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex shrink-0 gap-2 border-b border-slate-100 px-2.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread', badge: unreadTotal },
              { id: 'archived', label: 'Archived' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setListTab(tab.id)}
                className={`relative pb-1.5 text-xs font-medium transition ${
                  listTab === tab.id ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  {tab.label}
                  {tab.badge != null && tab.badge > 0 && (
                    <span className="rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">{tab.badge}</span>
                  )}
                </span>
                {listTab === tab.id && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-blue-600" />}
              </button>
            ))}
          </div>

          <div className="thin-scroll flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-500">No conversations here.</p>
            ) : (
              filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`flex w-full gap-2 border-b border-slate-50 px-2.5 py-2 text-left transition hover:bg-slate-50 ${
                    selectedId === c.id ? 'border-l-[3px] border-l-blue-600 bg-blue-50/80 pl-[7px]' : 'border-l-[3px] border-l-transparent'
                  }`}
                >
                  <div className="relative shrink-0">
                    <AvatarRing conversation={c} size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="flex min-w-0 items-center gap-1 font-semibold text-slate-900">
                        <span className="truncate">{c.name}</span>
                        {c.verified && <VerifiedBadge className="h-4 w-4" />}
                      </p>
                      <span className="shrink-0 text-[11px] text-slate-400">{c.timeLabel}</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{c.role}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">
                      {c.lastMessageFromMe ? (
                        <span className="mr-1 inline-flex items-center gap-0.5 align-middle text-slate-500">
                          <span>You:</span>
                          <InlineStatusTick status={c.lastDeliveryStatus || 'SENT'} compact />
                        </span>
                      ) : null}
                      {c.lastMessage}
                    </p>
                  </div>
                  {c.unread > 0 && (
                    <span className="mt-1 flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                      {c.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Main: empty or thread */}
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-slate-50/50">
          {!active ? (
            <div className="flex flex-1 flex-col items-center justify-center px-3 py-4 text-center">
              <EmptyStateIllustration />
              <h3 className="mt-3 text-base font-semibold text-slate-900">Your conversations will appear here</h3>
              <p className="mt-1 max-w-md text-xs text-slate-500">
                Select a message from the list to view your conversation with agents, agencies or property owners.
              </p>
              {liveConversations[0]?.id ? (
                <button
                  type="button"
                  onClick={() => setSelectedId(liveConversations[0]?.id ?? null)}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-500"
                >
                  Open conversation
                </button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="shrink-0 border-b border-slate-200 bg-white px-2.5 py-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <AvatarRing conversation={active} size="sm" />
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-1 font-semibold leading-tight text-slate-900">
                        <span className="truncate">{active.name}</span>
                        {active.verified && <VerifiedBadge className="h-3.5 w-3.5" />}
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                          <span className="h-1 w-1 rounded-full bg-emerald-500" />
                          {active.online ? 'Online' : 'Offline'}
                        </span>
                      </p>
                      <p className="truncate text-[11px] text-slate-500">{active.role}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => startInAppCall('voice')}
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                      aria-label="Voice call"
                      title="Voice call"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                        <path d="M5 4h3l2 5-2 1.5a14 14 0 0 0 5.5 5.5L15 14l5 2v3a2 2 0 0 1-2 2h-1C10.4 21 3 13.6 3 7V6a2 2 0 0 1 2-2z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => startInAppCall('video')}
                      className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                      aria-label="Video call"
                      title="Video call"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                    <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="More">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                        <path d="M12 6h.01M12 12h.01M12 18h.01" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mt-1 flex flex-wrap items-center justify-between gap-1.5 rounded-md border border-slate-200 bg-slate-50/90 px-2 py-1">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-900">{active.property.title}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {active.property.location} · <span className="font-medium text-blue-600">{formatNaira(active.property.price)}</span>
                    </p>
                  </div>
                  <Link to={active.property.id ? `/property/${active.property.id}` : '/explore'} className="shrink-0 text-[11px] font-semibold text-blue-600 hover:underline">
                    View
                  </Link>
                </div>
              </div>

              <div ref={chatScrollRef} className="thin-scroll min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain px-2.5 py-1.5">
                {messages.map((m) => {
                  const callLogText = parseCallLog(m.text, m.kind)
                  if (callLogText) {
                    return (
                      <div key={m.id} className="flex justify-center px-2">
                        <p className="max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-[11px] leading-snug text-slate-600 shadow-sm">
                          {callLogText} · {m.time}
                        </p>
                      </div>
                    )
                  }
                  if (m.from === 'auto') {
                    return (
                      <div key={m.id} className="flex justify-center px-2">
                        <p className="max-w-md rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-[11px] leading-snug text-slate-600 shadow-sm">
                          {m.text}
                        </p>
                      </div>
                    )
                  }
                  if (m.from === 'them') {
                    return (
                      <div key={m.id} className="flex gap-2">
                        <div className="mt-0.5 shrink-0">
                          <AvatarRing conversation={active} size="sm" />
                        </div>
                        <div className="min-w-0">
                          <div className="inline-block max-w-[min(100%,20rem)] rounded-2xl rounded-bl-md bg-white px-3 py-2 text-xs leading-relaxed text-slate-800 shadow-sm ring-1 ring-slate-100">
                            {m.listingPreview ? (
                              <Link
                                to={m.listingPreview.id ? `/property/${m.listingPreview.id}` : '/explore'}
                                className="mb-2 block rounded-lg border border-slate-200 bg-slate-50 p-2 hover:border-blue-200 hover:bg-blue-50/40"
                              >
                                <p className="text-[10px] uppercase text-slate-500">Property Preview</p>
                                <p className="truncate text-[11px] font-semibold text-slate-800">{m.listingPreview.title || 'Shared Property'}</p>
                                <p className="truncate text-[10px] text-slate-500">{m.listingPreview.location || ''}</p>
                              </Link>
                            ) : null}
                          <MessageAttachments attachments={m.attachments} variant="incoming" onPreviewImage={setImagePreviewUrl} />
                            {m.text ? (
                              <p className={`${m.attachments?.length ? 'mt-2' : ''}`}>{m.text}</p>
                            ) : null}
                          </div>
                          <p className="mt-0.5 pl-1 text-[10px] text-slate-400">{m.time}</p>
                        </div>
                      </div>
                    )
                  }
                  return (
                    <div key={m.id} className="flex justify-end">
                      <div className="max-w-[min(100%,20rem)] text-right">
                        <div className="inline-block rounded-2xl rounded-br-md bg-blue-600 px-3 py-2 text-left text-xs leading-relaxed text-white shadow-sm">
                          {m.listingPreview ? (
                            <Link
                              to={m.listingPreview.id ? `/property/${m.listingPreview.id}` : '/explore'}
                              className="mb-2 block rounded-lg border border-white/25 bg-white/15 p-2 hover:bg-white/20"
                            >
                              <p className="text-[10px] uppercase text-white/80">Property Preview</p>
                              <p className="truncate text-[11px] font-semibold text-white">{m.listingPreview.title || 'Shared Property'}</p>
                              <p className="truncate text-[10px] text-white/80">{m.listingPreview.location || ''}</p>
                            </Link>
                          ) : null}
                          <MessageAttachments attachments={m.attachments} variant="outgoing" onPreviewImage={setImagePreviewUrl} />
                          {m.text ? (
                            <p className={`whitespace-pre-wrap break-words ${m.attachments?.length ? 'mt-2' : ''}`}>{m.text}</p>
                          ) : null}
                        </div>
                        <p className="mt-0.5 flex items-center justify-end gap-0.5 pr-1 text-[10px] text-slate-400">
                          {m.time}
                          <MessageTick status={m.deliveryStatus || 'SENT'} />
                          <span className="ml-0.5 font-medium text-slate-300">
                            {m.deliveryStatus === 'READ'
                              ? 'Read'
                              : m.deliveryStatus === 'DELIVERED'
                                ? 'Delivered'
                                : m.deliveryStatus === 'FAILED'
                                  ? 'Failed'
                                : 'Sent'}
                          </span>
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={chatEndRef} className="h-px w-full shrink-0" aria-hidden />
              </div>

              <div className="shrink-0 border-t border-slate-200 bg-white p-1.5">
                <input
                  ref={attachAnyRef}
                  type="file"
                  className="hidden"
                  multiple
                  onChange={(e) => {
                    addPendingFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
                <input
                  ref={attachImageRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    addPendingFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
                <input
                  ref={attachDocRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  multiple
                  onChange={(e) => {
                    addPendingFiles(e.target.files)
                    e.target.value = ''
                  }}
                />

                {pendingFiles.length > 0 && (
                  <div className="mb-2 flex flex-wrap gap-1.5">
                    {pendingFiles.map((p) => (
                      <div
                        key={p.id}
                        className={`relative text-[10px] text-slate-700 ${
                          p.file.type.startsWith('audio/')
                            ? 'max-w-[min(100%,260px)] rounded-2xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-6 shadow-sm'
                            : 'flex max-w-[7rem] items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 py-0.5 pl-0.5 pr-5'
                        }`}
                      >
                        {p.previewUrl && p.file.type.startsWith('image/') ? (
                          <img src={p.previewUrl} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />
                        ) : p.previewUrl && p.file.type.startsWith('audio/') ? (
                          <div className="flex w-full items-center gap-2 pr-1.5" style={{ colorScheme: 'light' }}>
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 ring-1 ring-blue-200" aria-hidden>
                              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                                <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 1 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
                              </svg>
                            </span>
                            <audio src={p.previewUrl} controls className="h-9 min-w-0 flex-1 rounded-lg bg-white" />
                          </div>
                        ) : (
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-200/80 text-[9px] font-medium">FILE</span>
                        )}
                        {!p.file.type.startsWith('audio/') ? (
                          <span className="min-w-0 flex-1 truncate leading-tight" title={p.file.name}>
                            {p.file.name}
                          </span>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => removePendingFile(p.id)}
                          className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-slate-600 text-[10px] text-white hover:bg-slate-800"
                          aria-label="Remove attachment"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative flex items-end rounded-xl border border-slate-200 bg-slate-50">
                  <div className="relative shrink-0 self-end" ref={emojiPanelRef}>
                    <button
                      type="button"
                      onClick={() => setEmojiOpen((o) => !o)}
                      className="mb-0.5 ml-0.5 rounded-lg p-1 text-slate-400 hover:bg-slate-200/80"
                      aria-label="Emoji"
                      aria-expanded={emojiOpen}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
                        <path d="M9 10h.01M15 10h.01M8 14s1.5 2 4 2 4-2 4-2" strokeWidth="1.8" strokeLinecap="round" />
                      </svg>
                    </button>
                    {emojiOpen && (
                      <div className="absolute bottom-full left-0 z-20 mb-1 w-[220px] rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                        <p className="mb-1.5 text-[10px] font-medium text-slate-500">Emoji</p>
                        <div className="grid max-h-[140px] grid-cols-6 gap-1 overflow-y-auto thin-scroll">
                          {EMOJI_CHOICES.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className="rounded-md py-1 text-lg leading-none hover:bg-slate-100"
                              onClick={() => {
                                setDraft((d) => d + emoji)
                                setEmojiOpen(false)
                              }}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        if (!isRecording) sendMessage()
                      }
                    }}
                    placeholder={isRecording ? 'Recording… tap mic to stop' : 'Type a message...'}
                    rows={1}
                    readOnly={isRecording}
                    className="max-h-20 min-h-[32px] w-full resize-none rounded-xl border-0 bg-transparent py-1.5 pl-1 pr-[4.25rem] text-xs leading-snug text-slate-800 placeholder:text-slate-400 outline-none read-only:bg-slate-100/50"
                  />
                  <div className="absolute right-1 bottom-1 flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={toggleVoiceRecording}
                      disabled={
                        !active ||
                        typeof MediaRecorder === 'undefined' ||
                        typeof navigator === 'undefined' ||
                        !navigator.mediaDevices?.getUserMedia
                      }
                      aria-label={isRecording ? 'Stop recording' : 'Record voice message'}
                      aria-pressed={isRecording}
                      className={`rounded-lg p-1 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        isRecording
                          ? 'animate-pulse bg-red-600 text-white hover:bg-red-500'
                          : 'text-slate-500 hover:bg-slate-200/80'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                        <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 1 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={(!draft.trim() && pendingFiles.length === 0) || isRecording}
                      className="rounded-lg bg-blue-600 p-1 text-white shadow-sm hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Send"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  {sendError ? (
                    <span className="rounded-md bg-red-50 px-2 py-1 text-[10px] font-medium text-red-700">
                      {sendError}
                    </span>
                  ) : null}
                {loadError ? (
                  <span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-800">
                    {loadError}
                  </span>
                ) : null}
                  <button
                    type="button"
                    onClick={() => attachAnyRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-100"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    Attach
                  </button>
                  <button
                    type="button"
                    onClick={() => attachImageRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-100"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                      <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="1.8" />
                      <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                      <path d="M21 15l-5-5L5 21" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    Image
                  </button>
                  <button
                    type="button"
                    onClick={() => attachDocRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-medium text-slate-500 hover:bg-slate-100"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="1.8" />
                      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                    Doc
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right context column — only when thread open, xl+ */}
        {active && (
          <aside className="hidden min-h-0 min-w-0 w-full max-w-full flex-col overflow-hidden border-l border-slate-200 bg-white xl:flex">
            <div className="thin-scroll max-h-full min-w-0 space-y-2 overflow-y-auto overflow-x-hidden p-2.5">
              <div className="rounded-xl border border-slate-200 p-2.5 text-center shadow-sm">
                <div className="mx-auto w-fit">
                  <AvatarRing conversation={active} size="lg" />
                </div>
                <p className="mt-3 text-base font-semibold text-slate-900">{active.name}</p>
                <p className="text-xs text-slate-500">{active.role}</p>
                <p className="mt-2 text-sm text-amber-500">★ {active.rating} · {active.reviewsCount} reviews</p>
                <p className={`mt-1 text-[11px] font-medium ${active.online ? 'text-emerald-600' : 'text-slate-400'}`}>
                  ● {active.online ? 'Online' : 'Offline'}
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => startInAppCall('voice')}
                    className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                    aria-label="Call"
                    title="Voice call"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                      <path d="M5 4h3l2 5-2 1.5a14 14 0 0 0 5.5 5.5L15 14l5 2v3a2 2 0 0 1-2 2h-1C10.4 21 3 13.6 3 7V6a2 2 0 0 1 2-2z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => startInAppCall('video')}
                    className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                    aria-label="Video call"
                    title="Video call"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                      <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                  <Link
                    to={`/property/${active.property.id}`}
                    className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                    aria-label="View profile"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-slate-900">About {active.name.split(' ')[0]}</h4>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{active.bio}</p>
                <p className="mt-2 text-[11px] font-medium text-slate-700">{active.soldCount} Properties Sold</p>
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                <img src={active.property.image} alt="" className="h-28 w-full object-cover" />
                <div className="p-3">
                  <p className="text-sm font-semibold text-slate-900">{active.property.title}</p>
                  <p className="text-xs text-slate-500">{active.property.location}</p>
                  <p className="mt-1 text-sm font-semibold text-blue-600">{formatNaira(active.property.price)}</p>
                  <Link to={`/property/${active.property.id}`} className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline">
                    View Property ↓
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                <h4 className="text-sm font-semibold text-slate-900">Quick Actions</h4>
                <ul className="mt-3 space-y-2">
                  {[
                    { t: 'Schedule a Viewing', icon: 'cal' },
                    { t: 'Request More Info', icon: 'info' },
                    { t: 'Share Property', icon: 'share' },
                    { t: 'Report', icon: 'flag' },
                  ].map((item) => (
                    <li key={item.t}>
                      <button type="button" className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50">
                        <span className="text-slate-400">•</span>
                        {item.t}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {active.attachments.length > 0 && (
                <div className="rounded-2xl border border-slate-200 p-4 shadow-sm">
                  <h4 className="text-sm font-semibold text-slate-900">Attachments</h4>
                  <ul className="mt-3 space-y-2">
                    {active.attachments.map((f) => (
                      <li key={f.name}>
                        <button type="button" className="flex w-full items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-100">
                          <span className="truncate">{f.name}</span>
                          <span className="shrink-0 text-slate-400">{f.size}</span>
                          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-blue-600" fill="none" stroke="currentColor">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        )}
        </div>
      </div>
      {incomingCall ? (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl">
          <p className="text-sm font-semibold text-slate-900">
            Incoming {incomingCall.mode === 'video' ? 'video' : 'voice'} call
          </p>
          <p className="mt-1 text-xs text-slate-600">{incomingCall.callerName || 'Agent'} is calling you.</p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                stopRingtone()
                callMetaRef.current = {
                  conversationId: incomingCall?.conversationId || active?.id || '',
                  mode: incomingCall?.mode === 'video' ? 'video' : 'voice',
                  startedAt: 0,
                }
                setIsCallMuted(false)
                setIsVideoEnabled(incomingCall?.mode === 'video')
                setActiveCall({
                  mode: incomingCall.mode,
                  roomId: incomingCall.roomId,
                  initiator: false,
                  accepted: true,
                  remoteUserId: incomingCall?.fromUserId || '',
                })
                if (incomingCall?.fromUserId && socketRef.current) {
                  socketRef.current.emit('call:accept', {
                    toUserId: incomingCall.fromUserId,
                    roomId: incomingCall.roomId,
                  })
                }
                setIncomingCall(null)
              }}
              className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
            >
              Join
            </button>
            <button
              type="button"
              onClick={() => {
                stopRingtone()
                if (incomingCall?.fromUserId && socketRef.current) {
                  socketRef.current.emit('call:decline', {
                    toUserId: incomingCall.fromUserId,
                    roomId: incomingCall.roomId,
                  })
                }
                callMetaRef.current = {
                  conversationId: incomingCall?.conversationId || active?.id || '',
                  mode: incomingCall?.mode === 'video' ? 'video' : 'voice',
                  startedAt: 0,
                }
                void sendCallLog({ event: 'MISSED', mode: incomingCall?.mode || 'voice' })
                setIncomingCall(null)
              }}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
      {activeCall ? (
        <div className="fixed inset-0 z-50 bg-slate-950/70 p-3">
          <div className="mx-auto flex h-full w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-700 bg-[#0f172a]">
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-2 text-white">
              <p className="text-sm font-semibold">
                {activeCall.mode === 'video' ? 'Video call' : 'Voice call'} · {callConnected ? 'Connected' : activeCall.accepted ? 'Connecting…' : 'Ringing…'}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${isCallMuted ? 'bg-amber-500 text-white hover:bg-amber-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {isCallMuted ? 'Unmute' : 'Mute'}
                </button>
                <button
                  type="button"
                  onClick={() => { void toggleVideo() }}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${isVideoEnabled ? 'bg-blue-500 text-white hover:bg-blue-400' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                  {isVideoEnabled ? 'Video On' : 'Video Off'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (activeCall?.remoteUserId && socketRef.current) {
                      socketRef.current.emit('call:end', {
                        toUserId: activeCall.remoteUserId,
                        roomId: activeCall.roomId,
                      })
                    }
                    const durationSec = callMetaRef.current?.startedAt ? Math.floor((Date.now() - callMetaRef.current.startedAt) / 1000) : 0
                    stopRingtone()
                    void sendCallLog({ event: 'ENDED', mode: activeCall?.mode || 'voice', durationSec })
                    setActiveCall(null)
                    cleanupCallMedia()
                  }}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
                >
                  End call
                </button>
              </div>
            </div>
            <div className="relative flex h-full w-full items-center justify-center">
              {activeCall.mode === 'video' ? (
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="h-full w-full object-cover"
                  />
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="absolute bottom-4 right-4 h-36 w-24 rounded-xl border border-slate-200/20 object-cover shadow-lg"
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-white">
                  <div className="mb-4 grid h-24 w-24 place-items-center rounded-full bg-white/10 text-2xl font-semibold">
                    {String(active?.name || 'A')
                      .split(' ')
                      .map((x) => x[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <p className="text-lg font-semibold">{active?.name || 'Contact'}</p>
                  <p className="mt-1 text-sm text-slate-300">{callConnected ? 'On call' : activeCall.accepted ? 'Connecting…' : 'Ringing…'}</p>
                  <video ref={localVideoRef} autoPlay muted playsInline className="hidden" />
                  <video ref={remoteVideoRef} autoPlay playsInline className="hidden" />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {imagePreviewUrl ? (
        <div
          className="fixed inset-0 z-[60] bg-black/80 p-4"
          onClick={() => setImagePreviewUrl('')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') setImagePreviewUrl('')
          }}
        >
          <div className="relative mx-auto flex h-full w-full max-w-5xl items-center justify-center">
            <img
              src={imagePreviewUrl}
              alt="Preview"
              className="max-h-full max-w-full rounded-xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={() => setImagePreviewUrl('')}
              className="absolute right-2 top-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-white"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default MessagesPage
