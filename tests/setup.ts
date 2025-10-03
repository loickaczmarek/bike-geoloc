/**
 * Configuration globale des tests (Vitest)
 */
import '@testing-library/jest-dom'

// Mock de l'API Geolocation pour les tests
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
}

// @ts-expect-error - Mock pour tests
global.navigator.geolocation = mockGeolocation

// Mock des variables d'environnement pour tests
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_CITYBIKES_API_URL: 'https://api.citybik.es/v2',
    VITE_SEARCH_RADIUS_METERS: '200',
    VITE_MAX_STATIONS: '10',
    VITE_API_TIMEOUT: '5000',
    VITE_GEOLOCATION_TIMEOUT: '10000',
    VITE_GEOLOCATION_HIGH_ACCURACY: 'true',
    VITE_QUERY_STALE_TIME: '300000',
    VITE_QUERY_CACHE_TIME: '600000',
    VITE_QUERY_RETRY_COUNT: '3',
    VITE_AUTO_REFRESH_INTERVAL: '60000',
    VITE_LOG_LEVEL: 'error',
    VITE_DEBUG_MODE: 'false',
    VITE_ENVIRONMENT: 'test',
    DEV: false,
  },
  writable: true,
})
