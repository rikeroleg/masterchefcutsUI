import { useState, useCallback } from 'react'

export const createPageUrl = (page) => {
  return `/${page.toLowerCase().replace(/ /g, '-')}`;
};

const FAVORITES_KEY = 'mcc_fav_farmers'

function readFavorites() {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]') } catch { return [] }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(readFavorites)

  const toggle = useCallback((farmer) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === farmer.id)
      const next = exists ? prev.filter(f => f.id !== farmer.id) : [...prev, farmer]
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const isFav = useCallback((id) => favorites.some(f => f.id === id), [favorites])

  return { favorites, toggle, isFav }
}

