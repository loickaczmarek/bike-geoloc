/**
 * ========================================
 * USE NEARBY STATIONS HOOK
 * ========================================
 * Hook React orchestrant la recherche complète de stations proches
 *
 * FLUX COMPLET :
 * 1. Prend en entrée la position GPS utilisateur
 * 2. Trouve le réseau de vélos le plus proche
 * 3. Récupère toutes les stations de ce réseau
 * 4. Filtre les stations (distance, vélos disponibles)
 * 5. Trie par distance croissante
 * 6. Limite aux N premières stations
 *
 * EXEMPLE D'UTILISATION :
 * ```typescript
 * function StationFinder() {
 *   const { position } = useGeolocation({ immediate: true })
 *
 *   const {
 *     stations,
 *     network,
 *     isLoading,
 *     error,
 *     search,
 *     refetch
 *   } = useNearbyStations({
 *     userLocation: position?.coords,
 *     immediate: true
 *   })
 *
 *   if (isLoading) return <LoadingState />
 *   if (error) return <ErrorState message={error.userMessage} />
 *
 *   return <StationList stations={stations} network={network} />
 * }
 * ```
 */

import { useState, useCallback, useEffect } from 'react'
import { findClosestNetwork } from '@/services/network-finder.service'
import { fetchNetworkDetails } from '@/services/citybikes-api.service'
import { filterStations } from '@/lib/station-filter'
import { sortAndLimit } from '@/lib/station-sorter'
import { logger } from '@/middleware/logger'
import { BikeGeolocError } from '@/middleware/error-handler'
import type { Coordinates } from '@/types/geolocation.types'
import type { NearbyStationsResult, StationWithDistance } from '@/types/station.types'

interface UseNearbyStationsOptions {
  /** Position GPS de l'utilisateur (requis pour démarrer la recherche) */
  userLocation?: Coordinates | null

  /** Rayon de recherche en mètres */
  maxDistance?: number

  /** Nombre maximum de stations à retourner */
  maxStations?: number

  /** Déclencher automatiquement la recherche quand userLocation est disponible */
  immediate?: boolean

  /** Callback appelé en cas de succès */
  onSuccess?: (result: NearbyStationsResult) => void

  /** Callback appelé en cas d'erreur */
  onError?: (error: BikeGeolocError) => void
}

interface UseNearbyStationsReturn {
  /** Stations trouvées (triées par distance) */
  stations: StationWithDistance[]

  /** Réseau de vélos utilisé */
  network: { id: string; name: string } | null

  /** Résultat complet avec métadonnées */
  result: NearbyStationsResult | null

  /** État de chargement */
  isLoading: boolean

  /** Erreur survenue */
  error: BikeGeolocError | null

  /** Déclencher manuellement la recherche */
  search: () => Promise<void>

  /** Recharger les données */
  refetch: () => Promise<void>

  /** Réinitialiser l'état */
  reset: () => void
}

export function useNearbyStations(
  options: UseNearbyStationsOptions = {}
): UseNearbyStationsReturn {
  logger.info('🔍 useNearbyStations hook called', { ...options })

  const {
    userLocation,
    maxDistance = 200,
    maxStations = 10,
    immediate = false,
    onSuccess,
    onError,
  } = options

  logger.debug('useNearbyStations hook mounted/updated', {
    hasUserLocation: !!userLocation,
    immediate,
    maxDistance,
    maxStations
  })

  // États
  const [stations, setStations] = useState<StationWithDistance[]>([])
  const [network, setNetwork] = useState<{ id: string; name: string } | null>(
    null
  )
  const [result, setResult] = useState<NearbyStationsResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<BikeGeolocError | null>(null)

  /**
   * Réinitialise tous les états
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
   * Fonction principale de recherche
   */
  const performSearch = useCallback(
    async (location: Coordinates) => {
      // Validation
      if (!location) {
        const validationError = {
          type: 'VALIDATION' as const,
          message: 'User location is required',
          userMessage: '⚠️ Position GPS requise pour la recherche',
          timestamp: new Date().toISOString(),
        } as BikeGeolocError

        setError(validationError)
        onError?.(validationError)
        return
      }

      setIsLoading(true)
      setError(null)

      const startTime = performance.now()

      try {
        logger.info('Starting nearby stations search', {
          userLocation: location,
          maxDistance,
          maxStations,
        })

        // ÉTAPE 1 : Trouver le réseau le plus proche
        logger.info('Step 1: Finding closest network...')
        const closestNetwork = await findClosestNetwork(location)

        logger.info('Closest network found', {
          networkId: closestNetwork.id,
          networkName: closestNetwork.name,
          networkDistance: `${Math.round(closestNetwork.distance)}m`,
        })

        setNetwork({
          id: closestNetwork.id,
          name: closestNetwork.name,
        })

        // ÉTAPE 2 : Récupérer les stations du réseau
        logger.info('Step 2: Fetching network stations...', {
          networkId: closestNetwork.id,
        })
        const networkDetails = await fetchNetworkDetails(closestNetwork.id)

        logger.info('Network stations fetched', {
          totalStations: networkDetails.stations.length,
        })

        // ÉTAPE 3 : Filtrer les stations
        logger.info('Step 3: Filtering stations...', {
          criteria: { maxDistance, requireBikes: true },
        })
        const filtered = filterStations(networkDetails.stations, location, {
          maxDistance,
          requireBikes: true,
          onlyActive: true,
        })

        logger.info('Stations filtered', {
          before: networkDetails.stations.length,
          after: filtered.length,
        })

        // ÉTAPE 4 : Trier et limiter
        logger.info('Step 4: Sorting and limiting stations...', {
          maxStations,
        })
        const sorted = sortAndLimit(filtered, {
          sortBy: 'distance',
          order: 'asc',
          limit: maxStations,
        })

        logger.info('Stations sorted and limited', {
          finalCount: sorted.length,
        })

        // Créer le résultat complet
        const searchResult: NearbyStationsResult = {
          stations: sorted,
          networkId: closestNetwork.id,
          networkName: closestNetwork.name,
          userLocation: location,
          timestamp: new Date().toISOString(),
          totalStations: networkDetails.stations.length,
          filteredStations: sorted.length,
        }

        // Mettre à jour les états
        setStations(sorted)
        setResult(searchResult)
        setIsLoading(false)

        const duration = performance.now() - startTime
        logger.performance('Nearby stations search completed', duration)

        logger.info('Search completed successfully', {
          stationsFound: sorted.length,
          network: closestNetwork.name,
          duration: `${Math.round(duration)}ms`,
        })

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
   * Déclencher manuellement la recherche
   */
  const search = useCallback(async () => {
    if (!userLocation) {
      const error = {
        type: 'VALIDATION' as const,
        message: 'User location is required to search',
        userMessage: '📍 Veuillez d\'abord vous géolocaliser',
        timestamp: new Date().toISOString(),
      } as BikeGeolocError

      setError(error)
      onError?.(error)
      return
    }

    await performSearch(userLocation)
  }, [userLocation, performSearch, onError])

  /**
   * Recharger les données (alias de search)
   */
  const refetch = search

  /**
   * Effet : recherche automatique si immediate = true et userLocation disponible
   */
  useEffect(() => {
    logger.debug('useNearbyStations effect triggered', {
      immediate,
      hasUserLocation: !!userLocation,
      latitude: userLocation?.latitude,
      longitude: userLocation?.longitude
    })

    if (immediate && userLocation) {
      logger.debug('Immediate search triggered', {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude
      })
      performSearch(userLocation)
    }
  }, [immediate, userLocation, performSearch]) // Dépendances simplifiées

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
