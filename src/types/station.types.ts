/**
 * ========================================
 * STATION TYPES (BUSINESS LOGIC)
 * ========================================
 * Types métier enrichis avec calculs de distance
 */

import type { Station } from './citybikes.types'

/**
 * Station enrichie avec distance calculée depuis position utilisateur
 */
export interface StationWithDistance extends Station {
  distance: number // en mètres (calculé via Haversine)
}

/**
 * Résultat de recherche de stations proches
 */
export interface NearbyStationsResult {
  stations: StationWithDistance[]
  networkId: string
  networkName: string
  userLocation: {
    latitude: number
    longitude: number
  }
  timestamp: string
  totalStations: number // Total de stations dans le réseau
  filteredStations: number // Nombre de stations après filtrage
}
