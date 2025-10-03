/**
 * ========================================
 * USE GEOLOCATION HOOK
 * ========================================
 * Hook React pour la géolocalisation avec gestion complète des états
 *
 * FONCTIONNALITÉS :
 * - Détection automatique de la position GPS
 * - Gestion des erreurs (permission, timeout, indisponibilité)
 * - États de chargement et messages utilisateur
 * - Retry automatique en cas d'échec
 * - Validation de la précision GPS
 *
 * EXEMPLE D'UTILISATION :
 * ```typescript
 * function MyComponent() {
 *   const { position, error, isLoading, getCurrentPosition, retry } = useGeolocation()
 *
 *   return (
 *     <div>
 *       {isLoading && <p>Localisation en cours...</p>}
 *       {error && <p>{error.userMessage}</p>}
 *       {position && <p>Lat: {position.coords.latitude}</p>}
 *       <button onClick={getCurrentPosition}>Localiser</button>
 *     </div>
 *   )
 * }
 * ```
 */

import { useState, useCallback, useEffect } from 'react'
import {
  getCurrentPosition as getPosition,
  isGeolocationAvailable,
} from '@/services/geolocation.service'
import { logger } from '@/middleware/logger'
import type { BikeGeolocError } from '@/middleware/error-handler'
import type {
  GeolocationResult,
  GeolocationStatus,
} from '@/types/geolocation.types'

interface UseGeolocationOptions {
  /**
   * Déclencher automatiquement la géolocalisation au montage du composant
   * @default false
   */
  immediate?: boolean

  /**
   * Nombre maximum de tentatives en cas d'échec
   * @default 1
   */
  maxRetries?: number

  /**
   * Précision minimale requise en mètres (rejeter si accuracy > maxAccuracy)
   * @default undefined (pas de validation)
   */
  maxAccuracy?: number

  /**
   * Callback appelé en cas de succès
   */
  onSuccess?: (position: GeolocationResult) => void

  /**
   * Callback appelé en cas d'erreur
   */
  onError?: (error: BikeGeolocError) => void
}

interface UseGeolocationReturn {
  /** Position GPS actuelle (null si pas encore récupérée) */
  position: GeolocationResult | null

  /** Erreur survenue (null si aucune erreur) */
  error: BikeGeolocError | null

  /** État de chargement */
  isLoading: boolean

  /** État global (idle | loading | success | error) */
  status: GeolocationStatus

  /** Disponibilité de l'API Geolocation */
  isAvailable: boolean

  /** Déclencher manuellement la géolocalisation */
  getCurrentPosition: () => Promise<void>

  /** Réessayer après une erreur */
  retry: () => Promise<void>

  /** Réinitialiser l'état */
  reset: () => void

  /** Nombre de tentatives échouées */
  retryCount: number
}

export function useGeolocation(
  options: UseGeolocationOptions = {}
): UseGeolocationReturn {
  const {
    immediate = false,
    maxRetries = 1,
    maxAccuracy,
    onSuccess,
    onError,
  } = options

  // États
  const [position, setPosition] = useState<GeolocationResult | null>(null)
  const [error, setError] = useState<BikeGeolocError | null>(null)
  const [status, setStatus] = useState<GeolocationStatus>('idle')
  const [retryCount, setRetryCount] = useState(0)

  // Dérivés
  const isLoading = status === 'loading'
  const isAvailable = isGeolocationAvailable()

  /**
   * Réinitialise tous les états
   */
  const reset = useCallback(() => {
    setPosition(null)
    setError(null)
    setStatus('idle')
    setRetryCount(0)
    logger.debug('Geolocation state reset')
  }, [])

  /**
   * Fonction principale de géolocalisation
   */
  const fetchPosition = useCallback(
    async (isRetry = false) => {
      // Vérifier disponibilité
      if (!isAvailable) {
        const unavailableError = {
          type: 'GEOLOCATION' as const,
          message: 'Geolocation API not available in this browser',
          userMessage:
            '🚫 Votre navigateur ne supporte pas la géolocalisation',
          timestamp: new Date().toISOString(),
        } as BikeGeolocError

        setError(unavailableError)
        setStatus('error')
        onError?.(unavailableError)
        logger.error('Geolocation not available')
        return
      }

      // Vérifier limite de retry
      if (isRetry && retryCount >= maxRetries) {
        logger.warn('Max retries reached', { retryCount, maxRetries })
        return
      }

      try {
        setStatus('loading')
        setError(null)

        if (isRetry) {
          setRetryCount((prev) => prev + 1)
          logger.info('Retrying geolocation', { attempt: retryCount + 1 })
        }

        logger.info('Fetching geolocation...')
        const result = await getPosition()

        // Validation de la précision si requise
        if (maxAccuracy && result.accuracy > maxAccuracy) {
          const accuracyError = {
            type: 'VALIDATION' as const,
            message: `GPS accuracy too low: ${result.accuracy}m (max: ${maxAccuracy}m)`,
            userMessage: `⚠️ Précision GPS insuffisante (${Math.round(result.accuracy)}m). Veuillez réessayer.`,
            timestamp: new Date().toISOString(),
            context: { accuracy: result.accuracy, maxAccuracy },
          } as BikeGeolocError

          setError(accuracyError)
          setStatus('error')
          onError?.(accuracyError)
          logger.warn('GPS accuracy too low', {
            accuracy: result.accuracy,
            maxAccuracy,
          })
          return
        }

        // Succès
        logger.info('Setting position state', result)
        setPosition(result)
        logger.info('Position state set, setting status to success')
        setStatus('success')
        setRetryCount(0) // Reset retry count on success

        logger.info('Geolocation success', {
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          accuracy: `${result.accuracy}m`,
        })

        logger.info('Calling onSuccess callback')
        onSuccess?.(result)
        logger.info('onSuccess callback called')
      } catch (err) {
        const geoError = err as BikeGeolocError

        setError(geoError)
        setStatus('error')
        onError?.(geoError)

        logger.error('Geolocation failed', {
          type: geoError.type,
          message: geoError.message,
          retryCount,
        })

        // Auto-retry si possible
        if (retryCount < maxRetries) {
          logger.info('Auto-retrying geolocation...', {
            attempt: retryCount + 1,
            maxRetries,
          })
          setTimeout(() => {
            fetchPosition(true)
          }, 1000) // Délai de 1s avant retry
        }
      }
    },
    [
      isAvailable,
      maxRetries,
      maxAccuracy,
      retryCount,
      onSuccess,
      onError,
    ]
  )

  /**
   * Déclencher manuellement la géolocalisation
   */
  const getCurrentPositionManual = useCallback(async () => {
    setRetryCount(0) // Reset retry count pour nouvelle tentative manuelle
    await fetchPosition(false)
  }, [fetchPosition])

  /**
   * Réessayer après une erreur
   */
  const retry = useCallback(async () => {
    logger.info('Manual retry triggered')
    await fetchPosition(true)
  }, [fetchPosition])

  /**
   * Effet : géolocalisation automatique au montage si `immediate: true`
   */
  useEffect(() => {
    if (immediate && isAvailable) {
      logger.debug('Immediate geolocation triggered')
      fetchPosition(false)
    }
  }, [immediate, isAvailable]) // fetchPosition intentionnellement omis pour éviter loop

  return {
    position,
    error,
    isLoading,
    status,
    isAvailable,
    getCurrentPosition: getCurrentPositionManual,
    retry,
    reset,
    retryCount,
  }
}
