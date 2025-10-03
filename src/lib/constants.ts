/**
 * ========================================
 * CONSTANTES DE L'APPLICATION
 * ========================================
 */

// Configuration de recherche
export const SEARCH_RADIUS_METERS =
  Number(import.meta.env.VITE_SEARCH_RADIUS_METERS) || 500
export const MAX_STATIONS = Number(import.meta.env.VITE_MAX_STATIONS) || 10

// Configuration API
export const CITYBIKES_API_URL =
  import.meta.env.VITE_CITYBIKES_API_URL || 'https://api.citybik.es/v2'
export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 5000

// Configuration React Query
export const QUERY_STALE_TIME =
  Number(import.meta.env.VITE_QUERY_STALE_TIME) || 300000 // 5min
export const QUERY_CACHE_TIME =
  Number(import.meta.env.VITE_QUERY_CACHE_TIME) || 600000 // 10min
export const QUERY_RETRY_COUNT =
  Number(import.meta.env.VITE_QUERY_RETRY_COUNT) || 3

// Auto-refresh
export const AUTO_REFRESH_INTERVAL =
  Number(import.meta.env.VITE_AUTO_REFRESH_INTERVAL) || 60000 // 60s

// Rayon de la Terre en kilomètres (pour calcul Haversine)
export const EARTH_RADIUS_KM = 6371
