import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function Avatar({ name = '?', size = 36 }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="msg-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  )
}

export default function Messages() {
  const { user }           = useAuth()
  const { toast }          = useToast()
  const navigate           = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const withId = searchParams.get('with')   // pre-open thread with farmer ID
  const withName = searchParams.get('name') // display name hint

  const [threads, setThreads]           = useState([])
  const [activeThread, setActiveThread] = useState(null) // { participantId, name }
  const [messages, setMessages]         = useState([])
  const [draft, setDraft]               = useState('')
  const [sending, setSending]           = useState(false)
  const [threadsLoading, setThreadsLoading] = useState(true)
  const [msgLoading, setMsgLoading]     = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => { document.title = 'Messages — MasterChef Cuts' }, [])

  // Load thread list
  useEffect(() => {
    if (!user) return
    setThreadsLoading(true)
    api.get('/api/messages/threads')
      .then(setThreads)
      .catch(() => setThreads([]))
      .finally(() => setThreadsLoading(false))
  }, [user])

  // Open thread from URL param
  useEffect(() => {
    if (withId && user) {
      setActiveThread({ participantId: withId, name: withName || 'Farmer' })
    }
  }, [withId, user])

  // Load messages for active thread
  useEffect(() => {
    if (!activeThread || !user) return
    setMsgLoading(true)
    api.get(`/api/messages?with=${activeThread.participantId}`)
      .then(data => {
        setMessages(data)
        // Mark unread messages as read
        data.filter(m => !m.read && m.senderId !== user.id)
          .forEach(m => api.post(`/api/messages/${m.id}/read`).catch(() => {}))
        // Refresh thread list to update badge counts
        api.get('/api/messages/threads').then(setThreads).catch(() => {})
      })
      .catch(() => setMessages([]))
      .finally(() => setMsgLoading(false))
  }, [activeThread, user])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!draft.trim() || !activeThread) return
    setSending(true)
    try {
      const msg = await api.post('/api/messages', {
        recipientId: activeThread.participantId,
        content: draft.trim(),
      })
      setMessages(prev => [...prev, msg])
      setDraft('')
      // Update thread list
      api.get('/api/messages/threads').then(setThreads).catch(() => {})
    } catch (err) {
      toast.error(err.message || 'Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  function openThread(thread) {
    const otherId   = thread.otherParticipantId
    const otherName = thread.otherParticipantName
    setActiveThread({ participantId: otherId, name: otherName })
    setSearchParams({ with: otherId, name: otherName }, { replace: true })
  }

  if (!user) {
    return (
      <div className="msg-page">
        <div className="msg-unauth">
          <p>Sign in to view your messages.</p>
          <Link to="/login" className="hp-btn-primary">Sign In →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="msg-page">
      <div className="msg-layout">

        {/* ── Thread list sidebar ── */}
        <aside className="msg-sidebar">
          <div className="msg-sidebar-header">
            <h1 className="msg-sidebar-title">Messages</h1>
          </div>

          {threadsLoading ? (
            <p className="msg-loading">Loading…</p>
          ) : threads.length === 0 ? (
            <div className="msg-empty-threads">
              <p>No conversations yet.</p>
              <p className="msg-empty-hint">Visit a farmer&apos;s storefront and click &ldquo;Message Farmer&rdquo; to start one.</p>
            </div>
          ) : (
            <div className="msg-threads">
              {threads.map(t => {
                const isActive = activeThread?.participantId === t.otherParticipantId
                return (
                  <button
                    key={t.otherParticipantId}
                    className={`msg-thread${isActive ? ' msg-thread--active' : ''}`}
                    onClick={() => openThread(t)}
                  >
                    <Avatar name={t.otherParticipantName} size={38} />
                    <div className="msg-thread-body">
                      <div className="msg-thread-name">{t.otherParticipantName}</div>
                      <div className="msg-thread-preview">{t.lastMessage}</div>
                    </div>
                    {t.unreadCount > 0 && (
                      <span className="msg-thread-badge">{t.unreadCount}</span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </aside>

        {/* ── Message panel ── */}
        <section className="msg-panel">
          {!activeThread ? (
            <div className="msg-panel-empty">
              <span className="msg-panel-empty-icon">💬</span>
              <p>Select a conversation or start a new one from a farmer&apos;s profile.</p>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="msg-chat-header">
                <Avatar name={activeThread.name} size={36} />
                <div className="msg-chat-name">{activeThread.name}</div>
                <Link
                  to={`/farmer/${activeThread.participantId}`}
                  className="msg-chat-link"
                >
                  View Storefront →
                </Link>
              </div>

              {/* Messages */}
              <div className="msg-chat-body">
                {msgLoading ? (
                  <p className="msg-loading">Loading messages…</p>
                ) : messages.length === 0 ? (
                  <p className="msg-chat-empty">No messages yet. Say hello!</p>
                ) : (
                  messages.map(m => {
                    const mine = m.senderId === user.id
                    return (
                      <div key={m.id} className={`msg-bubble-row${mine ? ' msg-bubble-row--mine' : ''}`}>
                        {!mine && <Avatar name={activeThread.name} size={28} />}
                        <div className={`msg-bubble${mine ? ' msg-bubble--mine' : ''}`}>
                          <p className="msg-bubble-text">{m.content}</p>
                          <span className="msg-bubble-time">
                            {m.sentAt ? new Date(m.sentAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Compose box */}
              <form className="msg-compose" onSubmit={handleSend}>
                <input
                  className="msg-compose-input"
                  placeholder="Type a message…"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  disabled={sending}
                  maxLength={2000}
                  autoFocus
                />
                <button
                  type="submit"
                  className="msg-compose-send"
                  disabled={!draft.trim() || sending}
                >
                  {sending ? '…' : '→'}
                </button>
              </form>
            </>
          )}
        </section>

      </div>
    </div>
  )
}
