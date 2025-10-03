/**
 * ========================================
 * COORDINATE VALIDATOR
 * ========================================
 * Validation des coordonnées GPS
 *
 * CRAFT Principle: Single Responsibility
 * Extraction de la logique de validation réutilisable
 */

import { createValidationError } from '@/lib/errors/error-factory'
import type { Coordinates } from '@/types/geolocation.types'

/**
 * Valide que des coordonnées GPS sont correctes
 *
 * @throws {BikeGeolocError} Si les coordonnées sont invalides
 *
 * @example
 * ```typescript
 * validateCoordinates({ latitude: 48.8566, longitude: 2.3522 }) // OK
 * validateCoordinates({ latitude: 200, longitude: 2 }) // Throws
 * ```
 */
export function validateCoordinates(coords: Coordinates): void {
  if (!coords) {
    throw createValidationError(
      '📍 Coordonnées GPS manquantes',
      'Coordinates object is null or undefined',
      { coords }
    )
  }

  // Validate latitude
  if (typeof coords.latitude !== 'number' || isNaN(coords.latitude)) {
    throw createValidationError(
      '📍 Latitude invalide',
      'Invalid latitude: not a number',
      { latitude: coords.latitude }
    )
  }

  if (coords.latitude < -90 || coords.latitude > 90) {
    throw createValidationError(
      '📍 Latitude hors limites (-90 à 90)',
      `Invalid latitude: ${coords.latitude} (must be between -90 and 90)`,
      { latitude: coords.latitude }
    )
  }

  // Validate longitude
  if (typeof coords.longitude !== 'number' || isNaN(coords.longitude)) {
    throw createValidationError(
      '📍 Longitude invalide',
      'Invalid longitude: not a number',
      { longitude: coords.longitude }
    )
  }

  if (coords.longitude < -180 || coords.longitude > 180) {
    throw createValidationError(
      '📍 Longitude hors limites (-180 à 180)',
      `Invalid longitude: ${coords.longitude} (must be between -180 and 180)`,
      { longitude: coords.longitude }
    )
  }
}

/**
 * Vérifie si des coordonnées sont valides sans throw
 *
 * @returns true si valides, false sinon
 */
export function isValidCoordinates(coords: Coordinates): boolean {
  try {
    validateCoordinates(coords)
    return true
  } catch {
    return false
  }
}

/**
 * Vérifie si deux coordonnées sont identiques (à la précision près)
 *
 * @param epsilon Précision (par défaut 0.0001° ≈ 11m)
 */
export function areCoordinatesEqual(
  a: Coordinates,
  b: Coordinates,
  epsilon: number = 0.0001
): boolean {
  return (
    Math.abs(a.latitude - b.latitude) < epsilon &&
    Math.abs(a.longitude - b.longitude) < epsilon
  )
}

/**
 * Normalise la longitude dans la plage [-180, 180]
 * (Utile pour gérer le passage de -180° à +180°)
 */
export function normalizeLongitude(longitude: number): number {
  // Ramener dans [-180, 180]
  while (longitude > 180) longitude -= 360
  while (longitude < -180) longitude += 360
  return longitude
}

/**
 * Vérifie si des coordonnées sont dans une bounding box
 */
export function isWithinBounds(
  coords: Coordinates,
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
): boolean {
  validateCoordinates(coords)

  return (
    coords.latitude <= bounds.north &&
    coords.latitude >= bounds.south &&
    coords.longitude <= bounds.east &&
    coords.longitude >= bounds.west
  )
}
