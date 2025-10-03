/**
 * ========================================
 * DISTANCE SERVICE (HAVERSINE)
 * ========================================
 * Calcul de distance orthodromique entre deux points GPS
 * Utilise la formule de Haversine pour précision au mètre près
 *
 * EXEMPLE D'UTILISATION:
 * ```typescript
 * import { calculateDistance } from '@/services/distance.service'
 *
 * const distance = calculateDistance(
 *   { latitude: 48.8566, longitude: 2.3522 }, // Paris
 *   { latitude: 48.8584, longitude: 2.3470 }  // Notre-Dame
 * )
 * console.log(`${distance}m`) // ~450m
 * ```
 */

import { EARTH_RADIUS_KM } from '@/lib/constants'
import type { Coordinates } from '@/types/geolocation.types'

/**
 * Convertit des degrés en radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calcule la distance entre deux points GPS via formule de Haversine
 * @returns Distance en mètres
 *
 * Formule Haversine:
 * a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
 * c = 2 ⋅ atan2(√a, √(1−a))
 * d = R ⋅ c
 */
export function calculateDistance(
  point1: Coordinates,
  point2: Coordinates
): number {
  const lat1 = toRadians(point1.latitude)
  const lat2 = toRadians(point2.latitude)
  const deltaLat = toRadians(point2.latitude - point1.latitude)
  const deltaLon = toRadians(point2.longitude - point1.longitude)

  // Formule de Haversine
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  // Distance en kilomètres
  const distanceKm = EARTH_RADIUS_KM * c

  // Retourne en mètres, arrondi
  return Math.round(distanceKm * 1000)
}

/**
 * Vérifie si un point est dans un rayon donné
 */
export function isWithinRadius(
  point1: Coordinates,
  point2: Coordinates,
  radiusMeters: number
): boolean {
  return calculateDistance(point1, point2) <= radiusMeters
}

/**
 * Trie un tableau de points par distance croissante depuis une position
 */
export function sortByDistance<T extends { latitude: number; longitude: number }>(
  points: T[],
  userLocation: Coordinates
): T[] {
  return [...points].sort((a, b) => {
    const distA = calculateDistance(userLocation, {
      latitude: a.latitude,
      longitude: a.longitude,
    })
    const distB = calculateDistance(userLocation, {
      latitude: b.latitude,
      longitude: b.longitude,
    })
    return distA - distB
  })
}
