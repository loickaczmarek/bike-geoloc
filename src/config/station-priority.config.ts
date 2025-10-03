/**
 * ========================================
 * STATION PRIORITY CONFIGURATION
 * ========================================
 * Configuration des seuils de priorité des stations
 *
 * CRAFT Principle: Open/Closed Principle
 * Avant: Magic numbers en dur dans StationPriority (non configurable)
 * Après: Configuration centralisée, facilement ajustable
 *
 * Benefits:
 * - Facilite les A/B tests
 * - Permet l'ajustement par région/réseau
 * - Rend les règles métier explicites
 */

/**
 * Configuration des distances (en mètres)
 */
export interface DistanceThresholds {
  /** Distance considérée comme très proche (default: 50m) */
  veryClose: number

  /** Distance considérée comme proche (default: 100m) */
  close: number

  /** Distance maximale de recherche (default: 200m) */
  searchRadius: number
}

/**
 * Configuration de la disponibilité des vélos
 */
export interface BikeAvailabilityThresholds {
  /** Seuil critique (default: 1 vélo) */
  critical: number

  /** Seuil faible (default: 2 vélos) */
  low: number

  /** Seuil moyen (default: 5 vélos) */
  medium: number

  /** Seuil élevé (default: 10 vélos) */
  high: number
}

/**
 * Configuration des scores de distance
 * Plus la station est proche, plus le score est élevé
 */
export interface DistanceScoreRanges {
  ranges: Array<{
    /** Distance maximale pour ce range (en mètres) */
    threshold: number
    /** Score attribué (0-50) */
    score: number
  }>
}

/**
 * Configuration des scores de vélos disponibles
 * Plus il y a de vélos, plus le score est élevé
 */
export interface BikeScoreRanges {
  ranges: Array<{
    /** Nombre minimum de vélos pour ce range */
    threshold: number
    /** Score attribué (0-50) */
    score: number
  }>
}

/**
 * Configuration complète de priorité des stations
 */
export interface StationPriorityConfig {
  distance: DistanceThresholds
  bikes: BikeAvailabilityThresholds
  distanceScoring: DistanceScoreRanges
  bikeScoring: BikeScoreRanges
}

/**
 * Configuration par défaut (règles métier actuelles)
 */
export const DEFAULT_PRIORITY_CONFIG: StationPriorityConfig = {
  distance: {
    veryClose: 50, // < 50m = très proche
    close: 100, // < 100m = proche
    searchRadius: 200, // < 200m = rayon de recherche
  },

  bikes: {
    critical: 1, // 0-1 vélos = critique
    low: 2, // 2 vélos = faible
    medium: 5, // 3-5 vélos = moyen
    high: 10, // 6-10 vélos = élevé, >10 = abondant
  },

  distanceScoring: {
    ranges: [
      { threshold: 50, score: 50 }, // < 50m → 50 points
      { threshold: 100, score: 40 }, // < 100m → 40 points
      { threshold: 150, score: 30 }, // < 150m → 30 points
      { threshold: 200, score: 20 }, // < 200m → 20 points
      { threshold: Infinity, score: 10 }, // > 200m → 10 points
    ],
  },

  bikeScoring: {
    ranges: [
      { threshold: 0, score: 10 }, // 0-1 vélos → 10 points
      { threshold: 2, score: 20 }, // 2 vélos → 20 points
      { threshold: 3, score: 30 }, // 3-5 vélos → 30 points
      { threshold: 6, score: 40 }, // 6-10 vélos → 40 points
      { threshold: 11, score: 50 }, // >10 vélos → 50 points
    ],
  },
}

/**
 * Configuration optimisée pour zones urbaines denses
 * (distances plus courtes, exigences vélos plus élevées)
 */
export const URBAN_PRIORITY_CONFIG: StationPriorityConfig = {
  distance: {
    veryClose: 30, // Zone urbaine: < 30m est très proche
    close: 75,
    searchRadius: 150,
  },

  bikes: {
    critical: 2,
    low: 3,
    medium: 7,
    high: 12,
  },

  distanceScoring: {
    ranges: [
      { threshold: 30, score: 50 },
      { threshold: 75, score: 40 },
      { threshold: 100, score: 30 },
      { threshold: 150, score: 20 },
      { threshold: Infinity, score: 10 },
    ],
  },

  bikeScoring: {
    ranges: [
      { threshold: 0, score: 10 },
      { threshold: 3, score: 20 },
      { threshold: 5, score: 30 },
      { threshold: 8, score: 40 },
      { threshold: 13, score: 50 },
    ],
  },
}

/**
 * Configuration pour zones suburbaines
 * (distances plus longues acceptables, moins d'exigences)
 */
export const SUBURBAN_PRIORITY_CONFIG: StationPriorityConfig = {
  distance: {
    veryClose: 100,
    close: 200,
    searchRadius: 500,
  },

  bikes: {
    critical: 1,
    low: 2,
    medium: 4,
    high: 8,
  },

  distanceScoring: {
    ranges: [
      { threshold: 100, score: 50 },
      { threshold: 200, score: 40 },
      { threshold: 300, score: 30 },
      { threshold: 500, score: 20 },
      { threshold: Infinity, score: 10 },
    ],
  },

  bikeScoring: {
    ranges: [
      { threshold: 0, score: 10 },
      { threshold: 2, score: 20 },
      { threshold: 3, score: 30 },
      { threshold: 5, score: 40 },
      { threshold: 9, score: 50 },
    ],
  },
}

/**
 * Helper pour calculer le score de distance avec config
 */
export function calculateDistanceScore(
  distance: number,
  config: DistanceScoreRanges = DEFAULT_PRIORITY_CONFIG.distanceScoring
): number {
  for (const range of config.ranges) {
    if (distance < range.threshold) {
      return range.score
    }
  }
  return config.ranges[config.ranges.length - 1].score
}

/**
 * Helper pour calculer le score de vélos avec config
 */
export function calculateBikeScore(
  bikeCount: number,
  config: BikeScoreRanges = DEFAULT_PRIORITY_CONFIG.bikeScoring
): number {
  // Trouver le range approprié (dernier seuil dépassé)
  let score = config.ranges[0].score

  for (const range of config.ranges) {
    if (bikeCount >= range.threshold) {
      score = range.score
    } else {
      break
    }
  }

  return score
}

/**
 * Helper pour déterminer si une station est "très proche"
 */
export function isVeryClose(
  distance: number,
  config: DistanceThresholds = DEFAULT_PRIORITY_CONFIG.distance
): boolean {
  return distance < config.veryClose
}

/**
 * Helper pour déterminer si une station est "proche"
 */
export function isClose(
  distance: number,
  config: DistanceThresholds = DEFAULT_PRIORITY_CONFIG.distance
): boolean {
  return distance < config.close
}

/**
 * Helper pour déterminer si une station a suffisamment de vélos
 */
export function hasGoodBikes(
  bikeCount: number,
  config: BikeAvailabilityThresholds = DEFAULT_PRIORITY_CONFIG.bikes
): boolean {
  return bikeCount > config.medium
}
