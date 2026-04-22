import { Link } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'

function formatNaira(amount) {
  return `₦${new Intl.NumberFormat('en-NG').format(amount)}`
}

function phoneDigits(phone) {
  if (!phone) return ''
  return String(phone).replace(/\D/g, '')
}

/** Opens the device dialer (mobile) or desktop calling app */
function telHref(phone) {
  const d = phoneDigits(phone)
  if (!d) return undefined
  return `tel:+${d.replace(/^\+/, '')}`
}

/** WhatsApp chat — user can start a video call from there */
function whatsappHref(phone) {
  const d = phoneDigits(phone)
  if (!d) return undefined
  return `https://wa.me/${d}`
}

const conversations = [
  {
    id: 'c1',
    name: 'John Okafor',
    role: 'Property Consultant',
    verified: true,
    kind: 'person',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=160&q=80',
    lastMessage: 'Thanks for the details — I can schedule a viewing this week.',
    timeLabel: '10:30 AM',
    phone: '+2348034567890',
    unread: 2,
    online: true,
    rating: 4.9,
    reviewsCount: 128,
    soldCount: 124,
    bio: 'Specializing in luxury residential sales across Lekki and Victoria Island. Over 124 properties sold with a client-first approach.',
    property: {
      id: 'th-006',
      title: 'Luxury 5 Bedroom Duplex',
      location: 'Lekki Phase 1, Lagos',
      price: 85000000,
      image:
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
    },
    attachments: [{ name: 'Brochure.pdf', size: '2.4 MB' }],
  },
  {
    id: 'c2',
    name: 'Eko Luxury Realty',
    role: 'Agency',
    verified: true,
    kind: 'agency',
    initials: 'EL',
    avatar: null,
    lastMessage: 'We have attached the brochure for your review.',
    timeLabel: 'Yesterday',
    phone: '+2348091112233',
    unread: 1,
    online: false,
    rating: 4.8,
    reviewsCount: 56,
    soldCount: 210,
    bio: 'Boutique agency focused on waterfront and island listings.',
    property: {
      id: 'th-009',
      title: 'Marina Glassfront Residence',
      location: 'Victoria Island, Lagos',
      price: 335000000,
      image:
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
    },
    attachments: [],
  },
  {
    id: 'c3',
    name: 'Ada Nwosu',
    role: 'Luxury Advisor',
    verified: true,
    kind: 'person',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=160&q=80',
    lastMessage: 'The penthouse viewing is confirmed for Saturday.',
    timeLabel: 'May 16',
    phone: '+2348029876543',
    unread: 0,
    online: true,
    rating: 5.0,
    reviewsCount: 94,
    soldCount: 88,
    bio: 'Ultra-luxury specialist for Banana Island and Ikoyi.',
    property: {
      id: 'th-006',
      title: 'The Azure Heights Penthouse',
      location: 'Banana Island, Lagos',
      price: 410000000,
      image:
        'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=800&q=80',
    },
    attachments: [],
  },
  {
    id: 'c4',
    name: 'Kemi Adebayo',
    role: 'Senior Property Consultant',
    verified: false,
    kind: 'person',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=160&q=80',
    lastMessage: 'Let me know if you need comparable sales in the area.',
    timeLabel: 'May 12',
    phone: '+2348155544332',
    unread: 0,
    online: false,
    rating: 4.9,
    reviewsCount: 72,
    soldCount: 51,
    bio: 'Residential sales across Lagos mainland and Lekki.',
    property: {
      id: 'th-001',
      title: 'Ocean Crest Smart Villa',
      location: 'Lekki Phase 1, Lagos',
      price: 285000000,
      image:
        'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80',
    },
    attachments: [],
  },
]

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

const threads = {
  c1: [
    {
      id: 'm1',
      from: 'them',
      text: 'Hello! I saw your interest in the Luxury 5 Bedroom Duplex — happy to help with viewings or paperwork.',
      time: '10:22 AM',
    },
    {
      id: 'm2',
      from: 'me',
      text: "Hi John — I'd like to book a viewing this week if possible.",
      time: '10:25 AM',
      read: true,
    },
  ],
}

const AUTO_REPLY_TEXT = 'Thanks for your message. Our team will get back to you shortly.'

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

function MessageAttachments({ attachments, variant }) {
  if (!attachments?.length) return null
  const isOutgoing = variant === 'outgoing'
  return (
    <div className={`space-y-1.5 ${isOutgoing ? 'mb-1.5' : 'mb-1'}`}>
      {attachments.map((a) => {
        if (a.kind === 'image') {
          return (
            <a key={a.id} href={a.url} target="_blank" rel="noreferrer" className="block">
              <img src={a.url} alt={a.name || ''} className="max-h-36 w-full max-w-[14rem] rounded-lg object-cover ring-1 ring-black/10" />
            </a>
          )
        }
        if (a.kind === 'audio') {
          if (isOutgoing) {
            return (
              <div key={a.id} className="w-full max-w-[min(100%,260px)]">
                <div
                  className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-white/40"
                  style={{ colorScheme: 'light' }}
                >
                  <div className="flex items-center gap-2 px-2 py-2">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600"
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
                      className="h-9 min-h-[36px] min-w-0 flex-1 rounded-lg bg-slate-50"
                      preload="metadata"
                    />
                  </div>
                  {a.sizeLabel ? (
                    <p className="border-t border-slate-100 px-2 py-1 text-[10px] text-slate-500">{a.sizeLabel}</p>
                  ) : null}
                </div>
              </div>
            )
          }
          return (
            <div key={a.id} className="max-w-[min(100%,16rem)]" style={{ colorScheme: 'light' }}>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 px-2 py-1.5">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 ring-1 ring-slate-200"
                    aria-hidden
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 1 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
                    </svg>
                  </span>
                  <audio
                    src={a.url}
                    controls
                    className="h-8 min-w-0 flex-1 rounded-md bg-white"
                    preload="metadata"
                  />
                </div>
                {a.sizeLabel ? (
                  <p className="border-t border-slate-200 px-2 py-1 text-[10px] text-slate-500">{a.sizeLabel}</p>
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

function defaultThreadFor(conversation) {
  return [
    {
      id: 'd0',
      from: 'them',
      text: `Hi — I'm ${conversation.name}. How can I help you with this listing today?`,
      time: conversation.timeLabel,
    },
  ]
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

function MessagesPage() {
  const [selectedId, setSelectedId] = useState(null)
  const [listTab, setListTab] = useState('all')
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState('')
  /** Appended messages per conversation (user sends + auto-replies) */
  const [threadExtra, setThreadExtra] = useState({})
  const [awaitingReply, setAwaitingReply] = useState(false)
  const [emojiOpen, setEmojiOpen] = useState(false)
  /** Files staged before send: { id, file, previewUrl? } */
  const [pendingFiles, setPendingFiles] = useState([])
  const replyTimerRef = useRef(null)
  const chatScrollRef = useRef(null)
  const chatEndRef = useRef(null)
  const emojiPanelRef = useRef(null)
  const attachAnyRef = useRef(null)
  const attachImageRef = useRef(null)
  const attachDocRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const recordingCancelledRef = useRef(false)
  const [isRecording, setIsRecording] = useState(false)

  const filtered = useMemo(() => {
    let list = [...conversations]
    if (listTab === 'unread') list = list.filter((c) => c.unread > 0)
    if (listTab === 'archived') list = []
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q))
    }
    return list
  }, [listTab, query])

  const active = useMemo(() => conversations.find((c) => c.id === selectedId), [selectedId])
  const messages = useMemo(() => {
    if (!active) return []
    const base = threads[active.id] || defaultThreadFor(active)
    const extra = threadExtra[active.id] || []
    return [...base, ...extra]
  }, [active, threadExtra])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, selectedId, awaitingReply])

  useEffect(() => {
    return () => {
      if (replyTimerRef.current) clearTimeout(replyTimerRef.current)
    }
  }, [])

  useEffect(() => {
    recordingCancelledRef.current = true
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
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
      recordingCancelledRef.current = true
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

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
      streamRef.current = stream
      const mimeType = pickSupportedAudioMime()
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      const chunks = []
      mr.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data)
      }
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
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
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }

  const sendMessage = () => {
    const text = draft.trim()
    const hasFiles = pendingFiles.length > 0
    if ((!text && !hasFiles) || !active) return

    const uid = `u-${Date.now()}`
    const time = nowTimeLabel()
    const attachments = pendingFiles.map((p) => {
      const url = URL.createObjectURL(p.file)
      const isImage = p.file.type.startsWith('image/')
      const isAudio = p.file.type.startsWith('audio/')
      return {
        id: `att-${p.id}`,
        kind: isImage ? 'image' : isAudio ? 'audio' : 'file',
        url,
        name: p.file.name,
        sizeLabel: formatFileSize(p.file.size),
      }
    })

    pendingFiles.forEach((p) => {
      if (p.previewUrl) URL.revokeObjectURL(p.previewUrl)
    })

    setThreadExtra((prev) => ({
      ...prev,
      [active.id]: [
        ...(prev[active.id] || []),
        {
          id: uid,
          from: 'me',
          text,
          attachments: attachments.length ? attachments : undefined,
          time,
          read: true,
        },
      ],
    }))
    setDraft('')
    setPendingFiles([])
    setAwaitingReply(true)

    if (replyTimerRef.current) clearTimeout(replyTimerRef.current)
    replyTimerRef.current = setTimeout(() => {
      const aid = `a-${Date.now()}`
      setThreadExtra((prev) => ({
        ...prev,
        [active.id]: [
          ...(prev[active.id] || []),
          { id: aid, from: 'auto', text: AUTO_REPLY_TEXT, time: nowTimeLabel() },
        ],
      }))
      setAwaitingReply(false)
    }, 900)
  }

  const unreadTotal = conversations.reduce((acc, c) => acc + c.unread, 0)
  const activeCallHref = active ? telHref(active.phone) : undefined
  const activeWhatsAppHref = active ? whatsappHref(active.phone) : undefined

  return (
    <div className="flex w-full min-w-0 max-w-[min(100%,1600px)] flex-col">
      <div className="flex min-h-[640px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm">
        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 divide-y divide-slate-200 overflow-hidden lg:grid-cols-[minmax(200px,260px)_minmax(0,1fr)] lg:divide-x lg:divide-y-0 xl:grid-cols-[minmax(240px,300px)_minmax(0,1fr)_minmax(260px,300px)]">
        {/* Conversation list */}
        <aside className="flex min-h-0 flex-col bg-white lg:max-h-full">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-2.5 py-1.5">
            <h2 className="text-sm font-semibold text-slate-900">Messages</h2>
            <div className="flex items-center gap-1">
              <button type="button" className="grid h-7 w-7 place-items-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Compose">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                  <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
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
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{c.lastMessage}</p>
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
              <button
                type="button"
                onClick={() => setSelectedId(conversations[0]?.id ?? null)}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-blue-500"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                  <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Start a New Message
              </button>
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
                          Online
                        </span>
                      </p>
                      <p className="truncate text-[11px] text-slate-500">{active.role}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    {activeCallHref ? (
                      <a
                        href={activeCallHref}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                        aria-label="Voice call"
                        title="Call"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                          <path d="M5 4h3l2 5-2 1.5a14 14 0 0 0 5.5 5.5L15 14l5 2v3a2 2 0 0 1-2 2h-1C10.4 21 3 13.6 3 7V6a2 2 0 0 1 2-2z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>
                    ) : (
                      <span className="grid h-8 w-8 place-items-center rounded-lg text-slate-300" aria-hidden>
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                          <path d="M5 4h3l2 5-2 1.5a14 14 0 0 0 5.5 5.5L15 14l5 2v3a2 2 0 0 1-2 2h-1C10.4 21 3 13.6 3 7V6a2 2 0 0 1 2-2z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                    {activeWhatsAppHref ? (
                      <a
                        href={activeWhatsAppHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                        aria-label="Video call on WhatsApp"
                        title="Open WhatsApp (video call from chat)"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                          <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </a>
                    ) : (
                      <span className="grid h-8 w-8 place-items-center rounded-lg text-slate-300" aria-hidden>
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                          <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
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
                  <Link to={`/property/${active.property.id}`} className="shrink-0 text-[11px] font-semibold text-blue-600 hover:underline">
                    View
                  </Link>
                </div>
              </div>

              <div ref={chatScrollRef} className="thin-scroll min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain px-2.5 py-1.5">
                {messages.map((m) => {
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
                            {m.text}
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
                          <MessageAttachments attachments={m.attachments} variant="outgoing" />
                          {m.text ? (
                            <p className={`whitespace-pre-wrap break-words ${m.attachments?.length ? 'mt-2' : ''}`}>{m.text}</p>
                          ) : null}
                        </div>
                        <p className="mt-0.5 flex items-center justify-end gap-0.5 pr-1 text-[10px] text-slate-400">
                          {m.time}
                          {m.read && (
                            <span className="inline-flex text-blue-500" aria-hidden>
                              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
                                <path d="M18 7l-8 8-4-4" />
                              </svg>
                              <svg viewBox="0 0 24 24" className="-ml-1 h-3 w-3" fill="currentColor">
                                <path d="M18 7l-8 8-4-4" />
                              </svg>
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {awaitingReply && (
                  <div className="flex gap-2">
                    <div className="mt-0.5 h-8 w-8 shrink-0" />
                    <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-2.5 py-1.5 shadow-sm ring-1 ring-slate-100">
                      <span className="th-typing-dot h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <span className="th-typing-dot h-1.5 w-1.5 rounded-full bg-slate-400" />
                      <span className="th-typing-dot h-1.5 w-1.5 rounded-full bg-slate-400" />
                    </div>
                  </div>
                )}
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
                          <div className="flex items-center gap-2 pr-1" style={{ colorScheme: 'light' }}>
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600" aria-hidden>
                              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                                <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 1 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
                              </svg>
                            </span>
                            <audio src={p.previewUrl} controls className="h-8 min-w-0 flex-1 rounded-lg bg-slate-50" />
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
                <p className="mt-1 text-[11px] font-medium text-emerald-600">● Online</p>
                <div className="mt-4 flex justify-center gap-2">
                  {activeCallHref ? (
                    <a
                      href={activeCallHref}
                      className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                      aria-label="Call"
                      title="Call"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                        <path d="M5 4h3l2 5-2 1.5a14 14 0 0 0 5.5 5.5L15 14l5 2v3a2 2 0 0 1-2 2h-1C10.4 21 3 13.6 3 7V6a2 2 0 0 1 2-2z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-slate-100 text-slate-300" aria-hidden>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                        <path d="M5 4h3l2 5-2 1.5a14 14 0 0 0 5.5 5.5L15 14l5 2v3a2 2 0 0 1-2 2h-1C10.4 21 3 13.6 3 7V6a2 2 0 0 1 2-2z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                  {activeWhatsAppHref ? (
                    <a
                      href={activeWhatsAppHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50"
                      aria-label="Video on WhatsApp"
                      title="Open WhatsApp"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </a>
                  ) : (
                    <span className="grid h-10 w-10 place-items-center rounded-full border border-slate-100 text-slate-300" aria-hidden>
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
                        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
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
    </div>
  )
}

export default MessagesPage
