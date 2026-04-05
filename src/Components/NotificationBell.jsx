import React, { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import '../styles/notification-bell.css'

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins < 1)  return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

const TYPE_COLOR = {
  LISTING_FULL:   '#27ae60',
  CUT_CLAIMED:    '#3498db',
  PROCESSING_SET: '#f39c12',
  COMPLETE:       '#9b59b6',
}

export default function NotificationBell() {
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotifications()
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const visible = notifications

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const visibleUnread = unreadCount

  return (
    <div className="nb-wrap" ref={ref}>
      <button
        className={`nb-btn${open ? ' nb-btn--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {visibleUnread > 0 && (
          <span className="nb-badge">{visibleUnread > 9 ? '9+' : visibleUnread}</span>
        )}
      </button>

      {open && (
        <div className="nb-panel">
          <div className="nb-panel-header">
            <span className="nb-panel-title">Notifications</span>
            <div className="nb-panel-actions">
              {visibleUnread > 0 && (
                <button className="nb-action-btn" onClick={markAllRead}>Mark all read</button>
              )}
              {visible.length > 0 && (
                <button className="nb-action-btn nb-action-btn--danger" onClick={clearAll}>Clear</button>
              )}
            </div>
          </div>

          <div className="nb-list">
            {visible.length === 0 ? (
              <div className="nb-empty">
                <Bell size={28} strokeWidth={1.2} />
                <p>No notifications yet</p>
              </div>
            ) : (
              visible.map(n => (
                <div
                  key={n.id}
                  className={`nb-item${n.read ? ' nb-item--read' : ''}`}
                  onClick={() => markRead(n.id)}
                >
                  <div
                    className="nb-item-icon"
                    style={{ background: `${TYPE_COLOR[n.type] || '#555'}22`, color: TYPE_COLOR[n.type] || '#aaa' }}
                  >
                    {n.icon}
                  </div>
                  <div className="nb-item-body">
                    <div className="nb-item-title">{n.title}</div>
                    <div className="nb-item-text">{n.body}</div>
                    <div className="nb-item-time">{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.read && <span className="nb-unread-dot" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
