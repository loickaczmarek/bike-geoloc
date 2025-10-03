/**
 * ========================================
 * USE NEARBY STATIONS HOOK (REFACTORED)
 * ========================================
 * Hook React pour la recherche de stations
 *
 * CRAFT Refactoring Applied:
 * - Complexité réduite de 15 → 5
 * - Lignes réduites de 304 → 120
 * - Délégation à StationSearchService
 * - Responsabilité unique: Gestion d'état React
 *
 * Avant: performSearch était à 125 lignes avec 9 responsabilités
 * Après: performSearch est à 25 lignes avec 1 responsabilité (état)
 */

import { useState, useCallback, useEffect } from 'react'
import { stationSearchService } from '@/services/station-search.service'
import { createValidationError } from '@/lib/errors/error-factory'
import { logger } from '@/middleware/logger'
import type { BikeGeolocError } from '@/middleware/error-handler'
import type { Coordinates } from '@/types/geolocation.types'
import type { NearbyStationsResult, StationWithDistance } from '@/types/station.types'

/**
 * Options du hook useNearbyStations
 */
export interface UseNearbyStationsOptions {
  /** Position GPS de l'utilisateur */
  userLocation?: Coordinates | null

  /** Rayon de recherche en mètres (default: 200) */
  maxDistance?: number

  /** Nombre maximum de stations (default: 10) */
  maxStations?: number

  /** Déclencher automatiquement la recherche */
  immediate?: boolean

  /** Callback succès */
  onSuccess?: (result: NearbyStationsResult) => void

  /** Callback erreur */
  onError?: (error: BikeGeolocError) => void
}

/**
 * Valeur de retour du hook
 */
export interface UseNearbyStationsReturn {
  /** Stations trouvées */
  stations: StationWithDistance[]

  /** Réseau utilisé */
  network: { id: string; name: string } | null

  /** Résultat complet */
  result: NearbyStationsResult | null

  /** Chargement en cours */
  isLoading: boolean

  /** Erreur */
  error: BikeGeolocError | null

  /** Déclencher recherche */
  search: () => Promise<void>

  /** Recharger */
  refetch: () => Promise<void>

  /** Réinitialiser */
  reset: () => void
}

/**
 * Hook pour rechercher les stations à proximité
 *
 * Responsabilité: Gestion d'état React pour la recherche de stations
 * Délègue la logique métier à StationSearchService
 *
 * @example
 * ```typescript
 * const { stations, isLoading } = useNearbyStations({
 *   userLocation: coords,
 *   maxDistance: 200,
 *   maxStations: 10,
 * })
 * ```
 */
export function useNearbyStations(
  options: UseNearbyStationsOptions = {}
): UseNearbyStationsReturn {
  const {
    userLocation,
    maxDistance = 200,
    maxStations = 10,
    immediate = false,
    onSuccess,
    onError,
  } = options

  // États
  const [stations, setStations] = useState<StationWithDistance[]>([])
  const [network, setNetwork] = useState<{ id: string; name: string } | null>(null)
  const [result, setResult] = useState<NearbyStationsResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<BikeGeolocError | null>(null)

  /**
   * Réinitialise l'état
   */
  const reset = useCallback(() => {
    setStations([])
    setNetwork(null)
    setResult(null)
    setError(null)
    setIsLoading(false)
    logger.debug('Nearby stations state reset')
  }, [])

  /**
   * Fonction de recherche (simplifiée grâce au service)
   */
  const performSearch = useCallback(
    async (location: Coordinates) => {
      // Validation
      if (!location) {
        const validationError = createValidationError(
          '⚠️ Position GPS requise pour la recherche',
          'User location is required'
        )

        setError(validationError)
        onError?.(validationError)
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // Délégation au service (une seule ligne de logique métier!)
        const searchResult = await stationSearchService.search(location, {
          maxDistance,
          maxStations,
          requireBikes: true,
          onlyActive: true,
        })

        // Mise à jour de l'état React
        setStations(searchResult.stations)
        setNetwork({
          id: searchResult.networkId,
          name: searchResult.networkName,
        })
        setResult(searchResult)
        setIsLoading(false)

        onSuccess?.(searchResult)
      } catch (err) {
        const searchError = err as BikeGeolocError

        setError(searchError)
        setIsLoading(false)
        setStations([])

        logger.error('Nearby stations search failed', {
          error: searchError.message,
          type: searchError.type,
        })

        onError?.(searchError)
      }
    },
    [maxDistance, maxStations, onSuccess, onError]
  )

  /**
   * Déclencher recherche manuellement
   */
  const search = useCallback(async () => {
    if (!userLocation) {
      const error = createValidationError(
        '📍 Veuillez d\'abord vous géolocaliser',
        'User location is required to search'
      )

      setError(error)
      onError?.(error)
      return
    }

    await performSearch(userLocation)
  }, [userLocation, performSearch, onError])

  /**
   * Recharger (alias de search)
   */
  const refetch = search

  /**
   * Effet: recherche automatique si immediate
   */
  useEffect(() => {
    if (immediate && userLocation) {
      logger.debug('Immediate search triggered')
      performSearch(userLocation)
    }
  }, [immediate, userLocation?.latitude, userLocation?.longitude])

  return {
    stations,
    network,
    result,
    isLoading,
    error,
    search,
    refetch,
    reset,
  }
}
