import { Link } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { agentLeads } from '../../data/agentLeadsMessagesSeed'

const fmtPrice = (naira) => `₦${Number(naira).toLocaleString('en-NG')}`

const TAB_DEFS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'interested', label: 'Interested' },
  { id: 'closed', label: 'Closed' },
]

function cloneLeads() {
  return JSON.parse(JSON.stringify(agentLeads))
}

function leadMatchesTab(lead, tabId) {
  if (tabId === 'all') return true
  if (tabId === 'unread') return lead.unread > 0
  if (tabId === 'interested') return lead.pipeline === 'interested'
  if (tabId === 'closed') return lead.pipeline === 'closed'
  return true
}

function IconPhone({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 4h3l2 5-2 1.5a14 14 0 0 0 5.5 5.5L15 14l5 2v3a2 2 0 0 1-2 2h-1C10.4 21 3 13.6 3 7V6a2 2 0 0 1 2-2z" strokeLinecap="round" />
    </svg>
  )
}

function IconVideo({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 7l-7 5 7 5V7z" strokeLinejoin="round" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  )
}

function IconMore({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <circle cx="12" cy="6" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="12" cy="18" r="1.5" />
    </svg>
  )
}

function IconChecks({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={`${className} text-blue-500`} fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="M3 12l4 4L11 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 12l4 4L17 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function VoiceWave() {
  const heights = [6, 14, 10, 18, 12, 20, 8, 16, 10, 22, 14, 18, 9, 15, 11]
  return (
    <div className="flex h-10 items-center gap-0.5 px-2">
      {heights.map((h, i) => (
        <span key={i} className="w-0.5 rounded-full bg-slate-400/80" style={{ height: `${h}px` }} />
      ))}
    </div>
  )
}

export default function AgentLeadsMessagesPage() {
  const [leads, setLeads] = useState(cloneLeads)
  const [tab, setTab] = useState('all')
  const [selectedId, setSelectedId] = useState(agentLeads[0]?.id ?? '')
  const [draft, setDraft] = useState('')
  const [notesByLead, setNotesByLead] = useState({})
  const [statusByLead, setStatusByLead] = useState(() =>
    Object.fromEntries(agentLeads.map((l) => [l.id, l.pipeline === 'closed' ? 'Closed' : l.pipeline === 'interested' ? 'Interested' : 'New'])),
  )
  const messagesElRef = useRef(null)

  const tabCounts = useMemo(
    () => ({
      all: leads.length,
      unread: leads.filter((l) => l.unread > 0).length,
      interested: leads.filter((l) => l.pipeline === 'interested').length,
      closed: leads.filter((l) => l.pipeline === 'closed').length,
    }),
    [leads],
  )

  const filtered = useMemo(() => leads.filter((l) => leadMatchesTab(l, tab)), [leads, tab])

  const selected = useMemo(() => leads.find((l) => l.id === selectedId) ?? filtered[0], [leads, selectedId, filtered])

  useEffect(() => {
    if (filtered.length === 0) return
    if (!filtered.some((l) => l.id === selectedId)) {
      setSelectedId(filtered[0].id)
    }
  }, [filtered, selectedId])

  useEffect(() => {
    const el = messagesElRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [selected?.id, selected?.messages?.length])

  const selectLead = useCallback((id) => {
    setSelectedId(id)
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, unread: 0 } : l)))
  }, [])

  const sendMessage = useCallback(() => {
    const t = draft.trim()
    if (!t || !selected) return
    const msg = {
      id: `local-${Date.now()}`,
      from: 'agent',
      type: 'text',
      body: t,
      time: new Date().toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit' }),
    }
    setLeads((prev) =>
      prev.map((l) => (l.id === selected.id ? { ...l, messages: [...l.messages, msg], lastSnippet: t, timeLabel: 'Just now' } : l)),
    )
    setDraft('')
  }, [draft, selected])

  const markClosed = useCallback(() => {
    if (!selected) return
    setLeads((prev) => prev.map((l) => (l.id === selected.id ? { ...l, pipeline: 'closed' } : l)))
    setStatusByLead((prev) => ({ ...prev, [selected.id]: 'Closed' }))
    setTab('closed')
  }, [selected])

  const statusDot =
    statusByLead[selected?.id] === 'Interested'
      ? 'bg-amber-400'
      : statusByLead[selected?.id] === 'Closed'
        ? 'bg-slate-400'
        : 'bg-emerald-400'

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden px-3 py-3 text-slate-800 md:px-5 md:py-4">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
        {/* Page header row */}
        <div className="flex shrink-0 flex-col gap-4 border-b border-slate-100 px-4 py-4 sm:px-5 md:py-5">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-[#111827] md:text-2xl">Leads &amp; Messages</h1>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-slate-500">
              Manage conversations with your leads and close more deals.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="shrink-0 border-b border-slate-100 px-4 sm:px-5">
          <div className="-mb-px flex gap-1 overflow-x-auto">
            {TAB_DEFS.map((t) => {
              const active = tab === t.id
              const c = tabCounts[t.id]
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`relative whitespace-nowrap border-b-2 px-3 py-3 text-[13px] font-semibold transition ${
                    active ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                  <span
                    className={`ml-1.5 rounded-full px-2 py-0.5 text-[11px] tabular-nums ${
                      active ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {c}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Three columns — height comes from flex parent; only list + thread scroll */}
        <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 divide-y divide-slate-100 lg:grid-rows-1 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:divide-x lg:divide-y-0 xl:grid-cols-[minmax(0,260px)_minmax(0,1fr)_minmax(0,260px)]">
          {/* Conversation list */}
          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-slate-50/40 max-lg:max-h-[38svh] lg:h-full lg:max-h-none">
            <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 p-3">
              <div className="relative min-w-0 flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  type="search"
                  placeholder="Search leads..."
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-[13px] text-[#111827] shadow-sm placeholder:text-slate-400 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>
              <button
                type="button"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50"
                aria-label="Filter"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div className="thin-scroll min-h-0 flex-1 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-slate-500">No leads in this tab.</p>
              ) : (
                <ul className="p-2">
                  {filtered.map((lead) => {
                    const active = selected?.id === lead.id
                    return (
                      <li key={lead.id}>
                        <button
                          type="button"
                          onClick={() => selectLead(lead.id)}
                          className={`mb-1 flex w-full items-start gap-3 rounded-xl border border-slate-100/80 py-3 pl-3 pr-3 text-left transition ${
                            active
                              ? 'border-l-[3px] border-l-indigo-500 bg-indigo-50/95 shadow-sm ring-1 ring-indigo-100/80'
                              : 'border-transparent hover:bg-white'
                          }`}
                        >
                          <img src={lead.avatar} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white" />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-start justify-between gap-2">
                              <span className="truncate text-[13px] font-semibold text-[#111827]">{lead.name}</span>
                              <span className="shrink-0 text-[11px] font-medium text-slate-400">{lead.timeLabel}</span>
                            </span>
                            <span className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-slate-500">{lead.lastSnippet}</span>
                          </span>
                          {lead.unread > 0 ? (
                            <span className="grid h-6 min-w-[1.5rem] shrink-0 place-items-center rounded-full bg-indigo-600 px-1.5 text-[11px] font-bold text-white">
                              {lead.unread}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-white max-lg:min-h-[min(52svh,420px)] lg:h-full">
            {selected ? (
              <>
                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-bold text-[#111827]">{selected.name}</p>
                    <p className="mt-0.5 truncate text-[12px] text-slate-500">{selected.interestLine}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                      aria-label="In-app call"
                    >
                      <IconPhone className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                      aria-label="Video call"
                    >
                      <IconVideo className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="grid h-9 w-9 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                      aria-label="More"
                    >
                      <IconMore className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div
                  ref={messagesElRef}
                  className="thin-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden bg-slate-50/50 px-4 py-4 sm:px-5"
                >
                  {selected.messages.map((m) => {
                    const isAgent = m.from === 'agent'
                    return (
                      <div key={m.id} className={`flex w-full ${isAgent ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex max-w-[min(100%,520px)] gap-2 ${isAgent ? 'flex-row-reverse' : 'flex-row'}`}>
                          {!isAgent ? (
                            <img src={selected.avatar} alt="" className="mt-0.5 h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-slate-200" />
                          ) : null}
                          <div>
                            {m.type === 'text' ? (
                              <div
                                className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                                  isAgent ? 'rounded-br-md bg-indigo-100 text-slate-900' : 'rounded-bl-md border border-slate-100 bg-white text-slate-800'
                                }`}
                              >
                                {m.body}
                              </div>
                            ) : null}
                            {m.type === 'voice' ? (
                              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-slate-100 bg-white px-3 py-2 shadow-sm">
                                <button
                                  type="button"
                                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-indigo-600 text-white"
                                  aria-label="Play voice"
                                >
                                  <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" fill="currentColor">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </button>
                                <VoiceWave />
                                <span className="shrink-0 text-[11px] font-medium text-slate-400">{m.duration}</span>
                              </div>
                            ) : null}
                            {m.type === 'video' ? (
                              <div className="max-w-sm overflow-hidden rounded-2xl rounded-bl-md border border-slate-100 bg-white shadow-sm">
                                <div className="relative aspect-video bg-slate-200">
                                  <img src={m.thumb} alt="" className="h-full w-full object-cover" />
                                  <button
                                    type="button"
                                    className="absolute inset-0 m-auto grid h-12 w-12 place-items-center rounded-full bg-white/95 text-indigo-600 shadow-lg"
                                    aria-label="Play video"
                                  >
                                    <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6" fill="currentColor">
                                      <path d="M8 5v14l11-7z" />
                                    </svg>
                                  </button>
                                </div>
                                {m.caption ? <p className="px-3 py-2 text-[12px] text-slate-600">{m.caption}</p> : null}
                              </div>
                            ) : null}
                            <div className={`mt-1 flex items-center gap-1.5 text-[11px] text-slate-400 ${isAgent ? 'justify-end' : ''}`}>
                              <span>{m.time}</span>
                              {isAgent ? <IconChecks className="h-3.5 w-3.5" /> : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="shrink-0 border-t border-slate-100 bg-white px-3 py-3 sm:px-5">
                  <div className="flex items-end gap-2">
                    <button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Attach">
                      <span className="text-xl font-light leading-none">+</span>
                    </button>
                    <button type="button" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Emoji">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" strokeLinecap="round" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="hidden h-10 shrink-0 items-center rounded-xl border border-slate-200 px-3 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 sm:inline-flex"
                    >
                      Hold to record
                    </button>
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      placeholder="Type a message..."
                      className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-3 text-[13px] text-[#111827] outline-none focus:border-indigo-300 focus:bg-white focus:ring-2 focus:ring-indigo-500/15"
                    />
                    <button
                      type="button"
                      onClick={sendMessage}
                      className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#6366F1] text-white shadow-sm shadow-indigo-500/20 hover:bg-indigo-600"
                      aria-label="Send"
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5 -translate-x-px" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-[13px] text-slate-500">Select a conversation</div>
            )}
          </div>

          {/* Lead details — xl+ (one column scroll, CTA pinned) */}
          <div className="hidden min-h-0 min-w-0 flex-col overflow-hidden border-t border-slate-100 bg-slate-50/30 xl:flex xl:h-full xl:border-l xl:border-t-0">
            {selected ? (
              <>
                <div className="thin-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 sm:px-5">
                  <div className="text-center">
                    <img src={selected.avatar} alt="" className="mx-auto h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-md" />
                    <h2 className="mt-3 text-lg font-bold text-[#111827]">{selected.name}</h2>
                    <p className="mt-1 text-[12px] text-slate-500">{selected.email}</p>
                    <p className="mt-0.5 text-[12px] font-semibold text-slate-700">{selected.phone}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{selected.location}</p>
                  </div>

                  <div className="mt-6 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Interested in</p>
                    <div className="mt-2 flex gap-3">
                      <img src={selected.listing.image} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover ring-1 ring-slate-100" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-bold leading-snug text-[#111827]">{selected.listing.title}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">{selected.listing.location}</p>
                        <p className="mt-1 text-[13px] font-bold tabular-nums text-indigo-600">{fmtPrice(selected.listing.price)}</p>
                      </div>
                    </div>
                    <Link
                      to={`/property/${selected.listing.id}`}
                      className="mt-3 flex w-full items-center justify-center rounded-lg border border-slate-200 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      View Listing
                    </Link>
                  </div>

                  <div className="mt-5">
                    <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Lead status</label>
                    <div className="relative mt-1.5">
                      <span className={`pointer-events-none absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${statusDot}`} />
                      <select
                        value={statusByLead[selected.id] ?? 'Interested'}
                        onChange={(e) => setStatusByLead((prev) => ({ ...prev, [selected.id]: e.target.value }))}
                        className="h-11 w-full min-w-0 max-w-full appearance-none rounded-xl border border-slate-200 bg-white pl-8 pr-10 text-[13px] font-semibold text-[#111827] shadow-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
                      >
                        <option>New</option>
                        <option>Interested</option>
                        <option>Qualified</option>
                        <option>Closed</option>
                      </select>
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="m6 9 6 6 6-6" strokeLinecap="round" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Source</p>
                    <span className="mt-1.5 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-700 ring-1 ring-indigo-100">
                      {selected.source}
                    </span>
                  </div>

                  <div className="mt-5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">First contact</p>
                    <p className="mt-1 text-[13px] font-medium text-slate-700">{selected.firstContact}</p>
                  </div>

                  <div className="mt-5">
                    <label htmlFor={`notes-${selected.id}`} className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Notes
                    </label>
                    <textarea
                      id={`notes-${selected.id}`}
                      value={notesByLead[selected.id] ?? ''}
                      onChange={(e) => setNotesByLead((prev) => ({ ...prev, [selected.id]: e.target.value }))}
                      rows={3}
                      placeholder="Add private notes about this lead..."
                      className="mt-1.5 max-h-32 w-full min-w-0 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-[#111827] shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/15"
                    />
                  </div>
                </div>

                <div className="shrink-0 border-t border-slate-100 p-4">
                  <button
                    type="button"
                    onClick={markClosed}
                    disabled={selected.pipeline === 'closed'}
                    className="w-full rounded-xl border-2 border-red-200 bg-white py-2.5 text-[13px] font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Mark as Closed
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
