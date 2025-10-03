/**
 * ========================================
 * STATION SEARCH SERVICE
 * ========================================
 * Service orchestrateur pour la recherche de stations
 *
 * CRAFT Refactoring: Extract Orchestration Logic
 * Avant: Logique mélangée dans useNearbyStations (125 lignes, complexité 15)
 * Après: Service réutilisable, testable indépendamment du hook
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Uniquement orchestration de recherche
 * - Dependency Inversion: Dépend d'abstractions (pas d'implémentations concrètes)
 * - Open/Closed: Configurable via options
 */

import { findClosestNetwork } from './network-finder.service'
import { fetchNetworkDetails } from './citybikes-api.service'
import { filterStations } from '@/lib/station-filter'
import { sortAndLimit } from '@/lib/station-sorter'
import { validateCoordinates } from '@/lib/validators/coordinate-validator'
import { logger } from '@/middleware/logger'
import type { Coordinates } from '@/types/geolocation.types'
import type { StationWithDistance, NearbyStationsResult } from '@/types/station.types'

/**
 * Options de recherche de stations
 */
export interface StationSearchOptions {
  /** Distance maximale en mètres */
  maxDistance?: number

  /** Nombre maximum de stations */
  maxStations?: number

  /** Requiert des vélos disponibles */
  requireBikes?: boolean

  /** Uniquement stations actives */
  onlyActive?: boolean

  /** Critère de tri */
  sortBy?: 'distance' | 'bikes' | 'slots' | 'priority'
}

/**
 * Résultat de recherche de stations
 */
export interface StationSearchResult extends NearbyStationsResult {
  /** Métrique de performance */
  searchDurationMs: number
}

/**
 * Service de recherche de stations à proximité
 *
 * Responsabilité: Orchestrer le flux complet de recherche
 * - Trouver le réseau le plus proche
 * - Récupérer les stations du réseau
 * - Filtrer selon critères
 * - Trier et limiter
 *
 * @example
 * ```typescript
 * const service = new StationSearchService()
 * const result = await service.search(userCoords, { maxDistance: 200, maxStations: 10 })
 * ```
 */
export class StationSearchService {
  /**
   * Recherche les stations à proximité
   *
   * @throws {BikeGeolocError} Si erreur validation ou réseau
   */
  async search(
    userLocation: Coordinates,
    options: StationSearchOptions = {}
  ): Promise<StationSearchResult> {
    const startTime = performance.now()

    // Default options
    const {
      maxDistance = 200,
      maxStations = 10,
      requireBikes = true,
      onlyActive = true,
      sortBy = 'distance',
    } = options

    logger.info('Starting station search', {
      userLocation,
      maxDistance,
      maxStations,
    })

    // Étape 1: Validation
    validateCoordinates(userLocation)

    // Étape 2: Trouver le réseau le plus proche
    logger.debug('Step 1/4: Finding closest network')
    const closestNetwork = await findClosestNetwork(userLocation)

    logger.info('Closest network found', {
      networkId: closestNetwork.id,
      networkName: closestNetwork.name,
      networkDistance: `${Math.round(closestNetwork.distance)}m`,
    })

    // Étape 3: Récupérer les stations du réseau
    logger.debug('Step 2/4: Fetching network stations', {
      networkId: closestNetwork.id,
    })
    const networkDetails = await fetchNetworkDetails(closestNetwork.id)

    logger.info('Network stations fetched', {
      totalStations: networkDetails.stations.length,
    })

    // Étape 4: Filtrer les stations
    logger.debug('Step 3/4: Filtering stations', {
      criteria: { maxDistance, requireBikes, onlyActive },
    })
    const filteredStations = filterStations(networkDetails.stations, userLocation, {
      maxDistance,
      requireBikes,
      onlyActive,
    })

    logger.info('Stations filtered', {
      before: networkDetails.stations.length,
      after: filteredStations.length,
    })

    // Étape 5: Trier et limiter
    logger.debug('Step 4/4: Sorting and limiting stations', {
      sortBy,
      maxStations,
    })
    const sortedStations = sortAndLimit(filteredStations, {
      sortBy,
      order: 'asc',
      limit: maxStations,
    })

    logger.info('Stations sorted and limited', {
      finalCount: sortedStations.length,
    })

    // Construire le résultat
    const duration = performance.now() - startTime
    logger.performance('Station search completed', duration)

    const result: StationSearchResult = {
      stations: sortedStations,
      networkId: closestNetwork.id,
      networkName: closestNetwork.name,
      userLocation,
      timestamp: new Date().toISOString(),
      totalStations: networkDetails.stations.length,
      filteredStations: sortedStations.length,
      searchDurationMs: Math.round(duration),
    }

    logger.info('Search completed successfully', {
      stationsFound: sortedStations.length,
      network: closestNetwork.name,
      durationMs: result.searchDurationMs,
    })

    return result
  }
}

/**
 * Instance singleton du service
 * Peut être remplacée par dependency injection si nécessaire
 */
export const stationSearchService = new StationSearchService()
