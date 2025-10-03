/**
 * ========================================
 * GEOLOCATION TYPES
 * ========================================
 * Types pour la géolocalisation du navigateur
 */

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
}

export interface GeolocationResult {
  coords: Coordinates
  timestamp: number
  accuracy: number // en mètres
}

export type GeolocationStatus = 'idle' | 'loading' | 'success' | 'error'
