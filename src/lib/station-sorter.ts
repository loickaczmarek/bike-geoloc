/**
 * ========================================
 * STATION SORTER
 * ========================================
 * Logique métier pour trier les stations selon différents critères
 *
 * CRITÈRES DE TRI :
 * - Distance croissante (défaut)
 * - Nombre de vélos disponibles
 * - Nombre d'emplacements libres
 * - Nom de la station (alphabétique)
 *
 * EXEMPLE D'UTILISATION :
 * ```typescript
 * import { sortStationsByDistance, limitStations } from '@/lib/station-sorter'
 *
 * const sorted = sortStationsByDistance(stations)
 * const top10 = limitStations(sorted, 10)
 * ```
 */

import { MAX_STATIONS } from './constants'
import type { StationWithDistance } from '@/types/station.types'

/**
 * Type de tri disponible
 */
export type SortType =
  | 'distance'
  | 'bikes'
  | 'slots'
  | 'name'

/**
 * Ordre de tri (ascendant ou descendant)
 */
export type SortOrder = 'asc' | 'desc'

/**
 * Trie les stations par distance croissante (la plus proche en premier)
 *
 * @param stations Array de stations avec distance calculée
 * @param order Ordre de tri (asc = proche → loin, desc = loin → proche)
 * @returns Stations triées par distance
 */
export function sortStationsByDistance(
  stations: StationWithDistance[],
  order: SortOrder = 'asc'
): StationWithDistance[] {
  if (!Array.isArray(stations)) {
    throw new Error('Invalid stations: must be an array')
  }

  const sorted = [...stations].sort((a, b) => {
    const diff = a.distance - b.distance
    return order === 'asc' ? diff : -diff
  })

  return sorted
}

/**
 * Trie les stations par nombre de vélos disponibles
 *
 * @param stations Array de stations
 * @param order Ordre (asc = moins → plus, desc = plus → moins)
 * @returns Stations triées par nombre de vélos
 */
export function sortStationsByBikes(
  stations: StationWithDistance[],
  order: SortOrder = 'desc'
): StationWithDistance[] {
  if (!Array.isArray(stations)) {
    throw new Error('Invalid stations: must be an array')
  }

  const sorted = [...stations].sort((a, b) => {
    const diff = a.free_bikes - b.free_bikes
    return order === 'asc' ? diff : -diff
  })

  return sorted
}

/**
 * Trie les stations par nombre d'emplacements libres
 *
 * @param stations Array de stations
 * @param order Ordre (asc = moins → plus, desc = plus → moins)
 * @returns Stations triées par emplacements libres
 */
export function sortStationsBySlots(
  stations: StationWithDistance[],
  order: SortOrder = 'desc'
): StationWithDistance[] {
  if (!Array.isArray(stations)) {
    throw new Error('Invalid stations: must be an array')
  }

  const sorted = [...stations].sort((a, b) => {
    const diff = a.empty_slots - b.empty_slots
    return order === 'asc' ? diff : -diff
  })

  return sorted
}

/**
 * Trie les stations par nom alphabétique
 *
 * @param stations Array de stations
 * @param order Ordre (asc = A→Z, desc = Z→A)
 * @returns Stations triées par nom
 */
export function sortStationsByName(
  stations: StationWithDistance[],
  order: SortOrder = 'asc'
): StationWithDistance[] {
  if (!Array.isArray(stations)) {
    throw new Error('Invalid stations: must be an array')
  }

  const sorted = [...stations].sort((a, b) => {
    const comparison = a.name.localeCompare(b.name)
    return order === 'asc' ? comparison : -comparison
  })

  return sorted
}

/**
 * Trie les stations selon le type et l'ordre spécifiés
 *
 * @param stations Array de stations
 * @param sortType Type de tri à appliquer
 * @param order Ordre de tri
 * @returns Stations triées
 */
export function sortStations(
  stations: StationWithDistance[],
  sortType: SortType = 'distance',
  order: SortOrder = 'asc'
): StationWithDistance[] {
  switch (sortType) {
    case 'distance':
      return sortStationsByDistance(stations, order)
    case 'bikes':
      return sortStationsByBikes(stations, order)
    case 'slots':
      return sortStationsBySlots(stations, order)
    case 'name':
      return sortStationsByName(stations, order)
    default:
      throw new Error(`Unknown sort type: ${sortType}`)
  }
}

/**
 * Limite le nombre de stations retournées
 *
 * @param stations Array de stations (déjà triées de préférence)
 * @param limit Nombre maximum de stations (défaut: MAX_STATIONS)
 * @returns Stations limitées au nombre spécifié
 */
export function limitStations(
  stations: StationWithDistance[],
  limit: number = MAX_STATIONS
): StationWithDistance[] {
  if (!Array.isArray(stations)) {
    throw new Error('Invalid stations: must be an array')
  }

  if (limit <= 0) {
    throw new Error('Invalid limit: must be positive')
  }

  return stations.slice(0, limit)
}

/**
 * Pipeline complet de tri et limitation
 * Applique le tri puis limite le nombre de résultats
 *
 * @param stations Array de stations
 * @param options Options de tri et limitation
 * @returns Stations triées et limitées
 *
 * EXEMPLE :
 * ```typescript
 * const top10 = sortAndLimit(stations, {
 *   sortBy: 'distance',
 *   order: 'asc',
 *   limit: 10
 * })
 * ```
 */
export function sortAndLimit(
  stations: StationWithDistance[],
  options: {
    sortBy?: SortType
    order?: SortOrder
    limit?: number
  } = {}
): StationWithDistance[] {
  const {
    sortBy = 'distance',
    order = 'asc',
    limit = MAX_STATIONS,
  } = options

  // Validation
  if (!stations || stations.length === 0) {
    return []
  }

  // Trier puis limiter
  const sorted = sortStations(stations, sortBy, order)
  return limitStations(sorted, limit)
}

/**
 * Trie les stations par priorité :
 * 1. Distance (plus proche en premier)
 * 2. Si distance égale (±10m), trier par nombre de vélos disponibles
 *
 * @param stations Array de stations
 * @returns Stations triées par priorité
 */
export function sortStationsByPriority(
  stations: StationWithDistance[]
): StationWithDistance[] {
  if (!Array.isArray(stations)) {
    throw new Error('Invalid stations: must be an array')
  }

  const DISTANCE_THRESHOLD = 10 // Considérer comme "même distance" si différence < 10m

  return [...stations].sort((a, b) => {
    const distanceDiff = a.distance - b.distance

    // Si distance significativement différente, trier par distance
    if (Math.abs(distanceDiff) > DISTANCE_THRESHOLD) {
      return distanceDiff
    }

    // Si distance similaire, trier par nombre de vélos (plus de vélos en premier)
    return b.free_bikes - a.free_bikes
  })
}
