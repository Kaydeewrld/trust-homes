import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { agentsList, messagesOpenConversation } from '../lib/api'

export default function AgentsPage() {
  const navigate = useNavigate()
  const { token, user } = useAuth()
  const toast = useToast()
  const [topAgents, setTopAgents] = useState([])
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const out = await agentsList({ take: 300 })
        if (cancelled) return
        setTopAgents(Array.isArray(out?.top) ? out.top : [])
        setAgents(Array.isArray(out?.agents) ? out.agents : [])
      } catch (err) {
        if (!cancelled) toast.error('Could not load agents', err?.message || 'Try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [toast])

  const fallbackAgents = useMemo(() => (topAgents.length ? topAgents : agents.slice(0, 6)), [topAgents, agents])

  const openChat = async (agent) => {
    if (!user || !token) {
      navigate('/login?next=%2Fagents')
      return
    }
    try {
      const out = await messagesOpenConversation(token, { withUserId: agent.id })
      navigate(`/messages?conversation=${encodeURIComponent(out.conversationId)}`)
    } catch (err) {
      toast.error('Could not open chat', err?.message || 'Please try again.')
    }
  }

  return (
    <section className="space-y-6 pb-8 text-slate-800">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Agents</h1>
        <p className="mt-1 text-sm text-slate-500">Top-performing agents and full roster. Message or call directly.</p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Top Performing Agents</h2>
        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Loading agents...</p>
        ) : (
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {fallbackAgents.map((a) => (
              <article key={`top-${a.id}`} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
                <div className="flex items-center gap-3">
                  <img src={a.avatarUrl || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=200&q=80'} alt="" className="h-12 w-12 rounded-full object-cover" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{a.displayName}</p>
                    <p className="truncate text-xs text-slate-500">{a.agencyName || 'Independent agent'}</p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-600">
                  <span className="rounded-full bg-blue-100 px-2 py-0.5">{a.activeListings} active</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5">{a.soldListings} sold</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => void openChat(a)} className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500">
                    Message
                  </button>
                  <a href={a.phone ? `tel:${a.phone.replace(/\D/g, '')}` : undefined} className={`flex-1 rounded-lg border border-slate-200 px-3 py-2 text-center text-xs font-semibold ${a.phone ? 'text-slate-700 hover:bg-slate-50' : 'cursor-not-allowed text-slate-400'}`}>
                    Call
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">All Agents</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2">Agent</th>
                <th className="px-3 py-2">Agency</th>
                <th className="px-3 py-2">Active</th>
                <th className="px-3 py-2">Sold</th>
                <th className="px-3 py-2">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.map((a) => (
                <tr key={a.id}>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <img src={a.avatarUrl || 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=120&q=80'} alt="" className="h-8 w-8 rounded-full object-cover" />
                      <span className="text-sm font-medium text-slate-800">{a.displayName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-sm text-slate-600">{a.agencyName || 'Independent'}</td>
                  <td className="px-3 py-2.5 text-sm text-slate-700">{a.activeListings}</td>
                  <td className="px-3 py-2.5 text-sm text-slate-700">{a.soldListings}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => void openChat(a)} className="rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-500">
                        Message
                      </button>
                      <a href={a.phone ? `tel:${a.phone.replace(/\D/g, '')}` : undefined} className={`rounded-md border border-slate-200 px-2.5 py-1.5 text-xs font-semibold ${a.phone ? 'text-slate-700 hover:bg-slate-50' : 'cursor-not-allowed text-slate-400'}`}>
                        Call
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

