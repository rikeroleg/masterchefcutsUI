import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import { useAuth } from './AuthContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const [page, setPage]                   = useState(0)
  const [hasMore, setHasMore]             = useState(true)
  const [loading, setLoading]             = useState(false)
  const [totalCount, setTotalCount]       = useState(0)

  const PAGE_SIZE = 20

  useEffect(() => {
    if (!user) { 
      setNotifications([])
      setUnreadCount(0)
      setPage(0)
      setHasMore(true)
      setTotalCount(0)
      return 
    }
    fetchPage(0, true)
    const t = setInterval(() => fetchPage(0, true), 30_000)
    return () => clearInterval(t)
  }, [user])

  const fetchPage = useCallback(async (pageNum, reset = false) => {
    if (loading) return
    setLoading(true)
    try {
      const data = await api.get(`/api/notifications/paged?page=${pageNum}&size=${PAGE_SIZE}`)
      if (reset) {
        setNotifications(data.content || [])
      } else {
        setNotifications(prev => [...prev, ...(data.content || [])])
      }
      setUnreadCount(data.unreadCount ?? 0)
      setPage(pageNum)
      setHasMore(data.hasNext ?? false)
      setTotalCount(data.totalElements ?? 0)
    } catch { /* silent */ }
    setLoading(false)
  }, [loading])

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchPage(page + 1, false)
    }
  }, [hasMore, loading, page, fetchPage])

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
      setTotalCount(0)
      setPage(0)
      setHasMore(false)
    } catch { /* silent */ }
  }

  const refetch = useCallback(() => fetchPage(0, true), [fetchPage])

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      unreadCount, 
      totalCount,
      hasMore,
      loading,
      markRead, 
      markAllRead, 
      clearAll, 
      loadMore,
      refetch 
    }}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
}
