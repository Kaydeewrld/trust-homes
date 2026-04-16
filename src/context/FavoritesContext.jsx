import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const FavoritesContext = createContext(null)
const STORAGE_KEY = 'trustedhome-favorites'

/** Demo listings for Saved / hearts when storage is empty or unset. */
export const DEMO_FAVORITE_IDS = ['th-001', 'th-002', 'th-004', 'th-006', 'th-009', 'th-011']

function readStoredFavoriteIds() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === null || saved === '' || saved === '[]') {
      return DEMO_FAVORITE_IDS
    }
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return DEMO_FAVORITE_IDS
    }
    return parsed
  } catch {
    return DEMO_FAVORITE_IDS
  }
}

export function FavoritesProvider({ children }) {
  const [favoriteIds, setFavoriteIds] = useState(readStoredFavoriteIds)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds))
  }, [favoriteIds])

  const value = useMemo(
    () => ({
      favoriteIds,
      isFavorite: (id) => favoriteIds.includes(id),
      toggleFavorite: (id) =>
        setFavoriteIds((current) =>
          current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
        ),
    }),
    [favoriteIds],
  )

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider')
  }
  return context
}
