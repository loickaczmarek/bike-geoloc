/// <reference types="vite/client" />

interface ImportMetaEnv {
  // API
  readonly VITE_CITYBIKES_API_URL: string
  readonly VITE_API_TIMEOUT: string

  // Search
  readonly VITE_SEARCH_RADIUS_METERS: string
  readonly VITE_MAX_STATIONS: string

  // Geolocation
  readonly VITE_GEOLOCATION_TIMEOUT: string
  readonly VITE_GEOLOCATION_HIGH_ACCURACY: string

  // React Query
  readonly VITE_QUERY_STALE_TIME: string
  readonly VITE_QUERY_CACHE_TIME: string
  readonly VITE_QUERY_RETRY_COUNT: string
  readonly VITE_AUTO_REFRESH_INTERVAL: string

  // Logging
  readonly VITE_LOG_LEVEL: string
  readonly VITE_DEBUG_MODE: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_ENVIRONMENT: string

  // Features
  readonly VITE_ENABLE_MAP_VIEW: string
  readonly VITE_ENABLE_NOTIFICATIONS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
