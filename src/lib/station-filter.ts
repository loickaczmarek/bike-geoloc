/**
 * ========================================
 * STATION FILTER
 * ========================================
 * Logique métier pour filtrer les stations selon les critères
 *
 * CRITÈRES DE FILTRAGE :
 * - Distance maximale depuis position utilisateur (200m par défaut)
 * - Vélos disponibles (free_bikes > 0)
 * - Status actif (si disponible dans extra.status)
 *
 * EXEMPLE D'UTILISATION :
 * ```typescript
 * import { filterStationsByDistance, filterStationsWithBikes } from '@/lib/station-filter'
 *
 * const filtered = filterStationsByDistance(
 *   stations,
 *   userLocation,
 *   200 // rayon en mètres
 * )
 *
 * const withBikes = filterStationsWithBikes(filtered)
 * ```
 */

import { calculateDistance } from '@/services/distance.service'
import { SEARCH_RADIUS_METERS } from './constants'
import type { Station } from '@/types/citybikes.types'
import type { Coordinates } from '@/types/geolocation.types'
import type { StationWithDistance } from '@/types/station.types'

/**
 * Enrichit une station avec sa distance depuis la position utilisateur
 *
 * @param station Station à enrichir
 * @param userLocation Position GPS de l'utilisateur
 * @returns Station avec propriété distance ajoutée
 */
export function enrichStationWithDistance(
  station: Station,
  userLocation: Coordinates
): StationWithDistance {
  const distance = calculateDistance(userLocation, {
    latitude: station.latitude,
    longitude: station.longitude,
  })

  return {
    ...station,
    distance,
  }
}

/**
 * Filtre les stations par distance maximale depuis position utilisateur
 *
 * @param stations Array de stations à filtrer
 * @param userLocation Position GPS de l'utilisateur
 * @param maxDistance Distance maximale en mètres (défaut: SEARCH_RADIUS_METERS)
 * @returns Stations dans le rayon spécifié avec distance calculée
 *
 * VALIDATION :
 * - userLocation doit être valide (lat/lng dans les ranges valides)
 * - maxDistance doit être positif
 * - stations doit être un array non vide
 */
export function filterStationsByDistance(
  stations: Station[],
  userLocation: Coordinates,
  maxDistance: number = SEARCH_RADIUS_METERS
): StationWithDistance[] {
  // Validation des inputs
  if (!Array.isArray(stations)) {
    throw new Error('Invalid stations: must be an array')
  }

  if (!userLocation || typeof userLocation.latitude !== 'number') {
    throw new Error('Invalid userLocation: latitude is required')
  }

  if (typeof userLocation.longitude !== 'number') {
    throw new Error('Invalid userLocation: longitude is required')
  }

  if (maxDistance <= 0) {
    throw new Error('Invalid maxDistance: must be positive')
  }

  // Enrichir chaque station avec sa distance
  const stationsWithDistance = stations.map((station) =>
    enrichStationWithDistance(station, userLocation)
  )

  // Filtrer par distance
  return stationsWithDistance.filter(
    (station) => station.distance <= maxDistance
  )
}

/**
 * Filtre les stations ayant au moins un vélo disponible
 *
 * @param stations Array de stations (avec ou sans distance)
 * @returns Stations avec free_bikes > 0
 */
export function filterStationsWithBikes<
  T extends Station | StationWithDistance,
>(stations: T[]): T[] {
  if (!Array.isArray(stations)) {
    throw new Error('Invalid stations: must be an array')
  }

  return stations.filter((station) => {
    // Vérifier que free_bikes existe et est > 0
    return (
      typeof station.free_bikes === 'number' && station.free_bikes > 0
    )
  })
}

/**
 * Filtre les stations actives (si status disponible dans extra)
 *
 * @param stations Array de stations
 * @returns Stations avec status !== 'closed' ou sans information status
 */
export function filterActiveStations<T extends Station | StationWithDistance>(
  stations: T[]
): T[] {
  if (!Array.isArray(stations)) {
    throw new Error('Invalid stations: must be an array')
  }

  return stations.filter((station) => {
    // Si pas de status dans extra, considérer comme active
    if (!station.extra?.status) {
      return true
    }

    // Filtrer les stations fermées
    const status = station.extra.status.toLowerCase()
    return status !== 'closed' && status !== 'inactive'
  })
}

/**
 * Pipeline complet de filtrage
 * Applique tous les filtres dans l'ordre optimal
 *
 * @param stations Array de stations brutes
 * @param userLocation Position GPS de l'utilisateur
 * @param options Options de filtrage
 * @returns Stations filtrées et enrichies avec distance
 *
 * ORDRE D'APPLICATION :
 * 1. Distance (élimine les stations trop loin)
 * 2. Vélos disponibles (élimine les stations vides)
 * 3. Status actif (élimine les stations fermées)
 */
export function filterStations(
  stations: Station[],
  userLocation: Coordinates,
  options: {
    maxDistance?: number
    requireBikes?: boolean
    onlyActive?: boolean
  } = {}
): StationWithDistance[] {
  const {
    maxDistance = SEARCH_RADIUS_METERS,
    requireBikes = true,
    onlyActive = true,
  } = options

  // Validation
  if (!stations || stations.length === 0) {
    return []
  }

  // 1. Filtrer par distance (le plus restrictif en premier)
  let filtered = filterStationsByDistance(stations, userLocation, maxDistance)

  // 2. Filtrer par vélos disponibles si requis
  if (requireBikes) {
    filtered = filterStationsWithBikes(filtered)
  }

  // 3. Filtrer les stations actives si requis
  if (onlyActive) {
    filtered = filterActiveStations(filtered)
  }

  return filtered
}

/**
 * Compte le nombre de stations dans chaque catégorie (pour debug/stats)
 *
 * @param stations Stations filtrées
 * @returns Statistiques de filtrage
 */
export function getFilterStats(
  allStations: Station[],
  filteredStations: StationWithDistance[]
): {
  total: number
  filtered: number
  withBikes: number
  empty: number
  percentageFiltered: number
} {
  const withBikes = filteredStations.filter((s) => s.free_bikes > 0).length
  const empty = filteredStations.filter((s) => s.free_bikes === 0).length

  return {
    total: allStations.length,
    filtered: filteredStations.length,
    withBikes,
    empty,
    percentageFiltered:
      allStations.length > 0
        ? Math.round((filteredStations.length / allStations.length) * 100)
        : 0,
  }
}
