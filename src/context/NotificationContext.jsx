import React, { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api/client'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount]     = useState(0)

  useEffect(() => {
    if (!user) { setNotifications([]); setUnreadCount(0); return }
    fetchAll()
    const t = setInterval(fetchAll, 30_000)
    return () => clearInterval(t)
  }, [user])

  async function fetchAll() {
    try {
      const data = await api.get('/api/notifications')
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.read).length)
    } catch { /* silent — user may not be authenticated yet */ }
  }

  async function markRead(id) {
    try {
      await api.post(`/api/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch { /* silent */ }
  }

  async function markAllRead() {
    try {
      await api.post('/api/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch { /* silent */ }
  }

  async function clearAll() {
    try {
      await api.delete('/api/notifications')
      setNotifications([])
      setUnreadCount(0)
    } catch { /* silent */ }
  }

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, clearAll, refetch: fetchAll }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
