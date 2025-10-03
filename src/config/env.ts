/**
 * ========================================
 * ENVIRONMENT CONFIGURATION
 * ========================================
 * Validation et export centralisé des variables d'environnement
 */

import { logger } from '@/middleware/logger'

interface EnvConfig {
  // API
  cityBikesApiUrl: string
  apiTimeout: number

  // Search
  searchRadiusMeters: number
  maxStations: number

  // Geolocation
  geolocationTimeout: number
  geolocationHighAccuracy: boolean

  // React Query
  queryStaleTime: number
  queryCacheTime: number
  queryRetryCount: number
  autoRefreshInterval: number

  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error'
  debugMode: boolean
  environment: 'development' | 'staging' | 'production'

  // Features
  enableMapView: boolean
  enableNotifications: boolean
}

function validateEnv(): EnvConfig {
  // En développement, utiliser le proxy Vite pour contourner CORS
  const isDev = import.meta.env.DEV
  const defaultApiUrl = isDev
    ? '/api/citybikes/v2' // Proxy Vite
    : 'https://api.citybik.es/v2' // Production

  const config: EnvConfig = {
    cityBikesApiUrl:
      import.meta.env.VITE_CITYBIKES_API_URL || defaultApiUrl,
    apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT) || 5000,

    searchRadiusMeters: Number(import.meta.env.VITE_SEARCH_RADIUS_METERS) || 200,
    maxStations: Number(import.meta.env.VITE_MAX_STATIONS) || 10,

    geolocationTimeout:
      Number(import.meta.env.VITE_GEOLOCATION_TIMEOUT) || 10000,
    geolocationHighAccuracy:
      import.meta.env.VITE_GEOLOCATION_HIGH_ACCURACY === 'true',

    queryStaleTime: Number(import.meta.env.VITE_QUERY_STALE_TIME) || 300000,
    queryCacheTime: Number(import.meta.env.VITE_QUERY_CACHE_TIME) || 600000,
    queryRetryCount: Number(import.meta.env.VITE_QUERY_RETRY_COUNT) || 3,
    autoRefreshInterval:
      Number(import.meta.env.VITE_AUTO_REFRESH_INTERVAL) || 60000,

    logLevel: (import.meta.env.VITE_LOG_LEVEL as EnvConfig['logLevel']) || 'info',
    debugMode: import.meta.env.VITE_DEBUG_MODE === 'true',
    environment:
      (import.meta.env.VITE_ENVIRONMENT as EnvConfig['environment']) ||
      'development',

    enableMapView: import.meta.env.VITE_ENABLE_MAP_VIEW === 'true',
    enableNotifications: import.meta.env.VITE_ENABLE_NOTIFICATIONS === 'true',
  }

  // Validation des valeurs
  if (config.searchRadiusMeters <= 0) {
    logger.warn('Invalid VITE_SEARCH_RADIUS_METERS, using default 200m')
    config.searchRadiusMeters = 200
  }

  if (config.maxStations <= 0 || config.maxStations > 50) {
    logger.warn('Invalid VITE_MAX_STATIONS, using default 10')
    config.maxStations = 10
  }

  if (config.apiTimeout <= 0) {
    logger.warn('Invalid VITE_API_TIMEOUT, using default 5000ms')
    config.apiTimeout = 5000
  }

  logger.info('Environment configuration loaded', {
    environment: config.environment,
    searchRadius: config.searchRadiusMeters,
    maxStations: config.maxStations,
    cityBikesApiUrl: config.cityBikesApiUrl,
  })

  return config
}

export const env = validateEnv()
