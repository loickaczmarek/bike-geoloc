/**
 * ========================================
 * GEOLOCATION SERVICE
 * ========================================
 * Service de géolocalisation du navigateur avec gestion d'erreurs
 *
 * EXEMPLE D'UTILISATION:
 * ```typescript
 * import { getCurrentPosition } from '@/services/geolocation.service'
 *
 * try {
 *   const position = await getCurrentPosition()
 *   console.log(`Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`)
 * } catch (error) {
 *   // L'erreur est déjà parsée par le middleware error-handler
 *   console.error(error.userMessage)
 * }
 * ```
 */

import { logger } from '@/middleware/logger'
import { handleError, BikeGeolocError } from '@/middleware/error-handler'
import type {
  Coordinates,
  GeolocationOptions,
  GeolocationResult,
} from '@/types/geolocation.types'

/**
 * Vérifie si l'API Geolocation est disponible dans le navigateur
 */
export function isGeolocationAvailable(): boolean {
  return 'geolocation' in navigator
}

/**
 * Configuration par défaut de la géolocalisation
 */
const DEFAULT_OPTIONS: GeolocationOptions = {
  enableHighAccuracy:
    import.meta.env.VITE_GEOLOCATION_HIGH_ACCURACY === 'true' || true,
  timeout: Number(import.meta.env.VITE_GEOLOCATION_TIMEOUT) || 10000,
  maximumAge: 0, // Force une position fraîche
}

/**
 * Récupère la position actuelle de l'utilisateur
 * @throws {BikeGeolocError} En cas d'erreur (permission, timeout, etc.)
 */
export async function getCurrentPosition(
  options: GeolocationOptions = {}
): Promise<GeolocationResult> {
  if (!isGeolocationAvailable()) {
    throw handleError(
      new Error('Geolocation API not available'),
      'geolocation.service'
    )
  }

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  logger.info('Requesting geolocation', mergedOptions)

  return new Promise((resolve, reject) => {
    const startTime = performance.now()

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const duration = performance.now() - startTime
        logger.performance('Geolocation acquired', duration)

        const result: GeolocationResult = {
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          timestamp: position.timestamp,
          accuracy: position.coords.accuracy,
        }

        logger.info('Geolocation success', {
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          accuracy: `${result.accuracy}m`,
        })

        resolve(result)
      },
      (error) => {
        logger.error('Geolocation error', { code: error.code })
        reject(handleError(error, 'geolocation.service'))
      },
      mergedOptions
    )
  })
}

/**
 * Récupère uniquement les coordonnées (version simplifiée)
 */
export async function getCoordinates(
  options?: GeolocationOptions
): Promise<Coordinates> {
  const result = await getCurrentPosition(options)
  return result.coords
}

/**
 * Surveille la position en temps réel (pour fonctionnalité future)
 * @returns ID du watcher pour pouvoir l'annuler avec clearWatch
 */
export function watchPosition(
  onSuccess: (result: GeolocationResult) => void,
  onError: (error: BikeGeolocError) => void,
  options: GeolocationOptions = {}
): number {
  if (!isGeolocationAvailable()) {
    onError(
      handleError(
        new Error('Geolocation API not available'),
        'geolocation.service'
      )
    )
    return -1
  }

  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }

  logger.info('Starting position watch', mergedOptions)

  return navigator.geolocation.watchPosition(
    (position) => {
      const result: GeolocationResult = {
        coords: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        timestamp: position.timestamp,
        accuracy: position.coords.accuracy,
      }
      onSuccess(result)
    },
    (error) => {
      onError(handleError(error, 'geolocation.service'))
    },
    mergedOptions
  )
}

/**
 * Arrête la surveillance de la position
 */
export function clearWatch(watchId: number): void {
  if (watchId >= 0) {
    navigator.geolocation.clearWatch(watchId)
    logger.info('Position watch cleared', { watchId })
  }
}
