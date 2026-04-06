import React, { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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

function getDateGroup(iso) {
  const date = new Date(iso)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const thisWeek = new Date(today.getTime() - 7 * 86400000)

  if (date >= today) return 'Today'
  if (date >= yesterday) return 'Yesterday'
  if (date >= thisWeek) return 'This Week'
  return 'Earlier'
}

const TYPE_COLOR = {
  LISTING_FULL:     '#27ae60',
  CUT_CLAIMED:      '#3498db',
  PROCESSING_SET:   '#f39c12',
  COMPLETE:         '#9b59b6',
  ORDER_PAID:       '#27ae60',
  ORDER_ACCEPTED:   '#3498db',
  ORDER_PROCESSING: '#9b59b6',
  ORDER_READY:      '#27ae60',
  ORDER_COMPLETED:  '#7f8c8d',
}

export default function NotificationBell() {
  const { notifications, unreadCount, totalCount, hasMore, loading, markRead, markAllRead, clearAll, loadMore } = useNotifications()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Infinite scroll detection
  useEffect(() => {
    const listEl = listRef.current
    if (!listEl || !open) return

    function onScroll() {
      const { scrollTop, scrollHeight, clientHeight } = listEl
      if (scrollHeight - scrollTop - clientHeight < 50 && hasMore && !loading) {
        loadMore()
      }
    }
    listEl.addEventListener('scroll', onScroll)
    return () => listEl.removeEventListener('scroll', onScroll)
  }, [open, hasMore, loading, loadMore])

  function handleNotificationClick(n) {
    markRead(n.id)
    setOpen(false)

    // Deep link navigation based on notification type and IDs
    if (n.listingId) {
      navigate(`/listings/${n.listingId}`)
    } else if (n.orderId) {
      // Order notifications go to profile (orders section)
      navigate('/profile', { state: { scrollTo: 'orders' } })
    } else {
      // Default: go to profile
      navigate('/profile')
    }
  }

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, n) => {
    const group = getDateGroup(n.createdAt)
    if (!groups[group]) groups[group] = []
    groups[group].push(n)
    return groups
  }, {})

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier']

  return (
    <div className="nb-wrap" ref={ref}>
      <button
        className={`nb-btn${open ? ' nb-btn--open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="nb-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="nb-panel">
          <div className="nb-panel-header">
            <span className="nb-panel-title">
              Notifications
              {totalCount > 0 && <span className="nb-panel-count">({totalCount})</span>}
            </span>
            <div className="nb-panel-actions">
              {unreadCount > 0 && (
                <button className="nb-action-btn" onClick={markAllRead}>Mark all read</button>
              )}
              {notifications.length > 0 && (
                <button className="nb-action-btn nb-action-btn--danger" onClick={clearAll}>Clear</button>
              )}
            </div>
          </div>

          <div className="nb-list" ref={listRef}>
            {notifications.length === 0 ? (
              <div className="nb-empty">
                <Bell size={28} strokeWidth={1.2} />
                <p>No notifications yet</p>
              </div>
            ) : (
              <>
                {groupOrder.map(group => {
                  const items = groupedNotifications[group]
                  if (!items || items.length === 0) return null
                  return (
                    <div key={group} className="nb-group">
                      <div className="nb-group-header">{group}</div>
                      {items.map(n => (
                        <div
                          key={n.id}
                          className={`nb-item${n.read ? ' nb-item--read' : ''}`}
                          onClick={() => handleNotificationClick(n)}
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
                      ))}
                    </div>
                  )
                })}
                {loading && (
                  <div className="nb-loading">Loading more...</div>
                )}
                {!hasMore && notifications.length > 0 && (
                  <div className="nb-end">No more notifications</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
