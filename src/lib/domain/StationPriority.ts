/**
 * ========================================
 * STATION PRIORITY - DOMAIN MODEL
 * ========================================
 * Value Object représentant la priorité visuelle d'une station
 * selon les critères métier de décision rapide
 *
 * RÈGLES MÉTIER :
 * - OPTIMAL : Très proche (< 50m) ET bon nombre de vélos (> 5)
 * - GOOD : Proche (< 100m) OU bon nombre de vélos
 * - WARNING : Peu de vélos (≤ 2) quel que soit la distance
 * - NORMAL : Autres cas
 */

import type { StationWithDistance } from '@/types/station.types'

/**
 * Niveau de priorité visuelle d'une station
 */
export enum StationPriorityLevel {
  OPTIMAL = 'optimal',      // Meilleur choix - mise en avant forte
  GOOD = 'good',           // Bon choix
  WARNING = 'warning',     // Attention - peu de vélos
  NORMAL = 'normal',       // Choix standard
}

/**
 * Catégorie de disponibilité de vélos
 */
export enum BikeAvailability {
  CRITICAL = 'critical',   // 0-1 vélos
  LOW = 'low',            // 2 vélos
  MEDIUM = 'medium',      // 3-5 vélos
  HIGH = 'high',          // 6-10 vélos
  ABUNDANT = 'abundant',  // > 10 vélos
}

/**
 * Value Object StationPriority
 * Immuable et validé à la construction
 */
export class StationPriority {
  private constructor(
    public readonly level: StationPriorityLevel,
    public readonly bikeAvailability: BikeAvailability,
    public readonly isVeryClose: boolean,
    public readonly hasGoodAvailability: boolean,
    public readonly recommendationScore: number // 0-100
  ) {
    // Invariants du domaine
    if (recommendationScore < 0 || recommendationScore > 100) {
      throw new Error('Recommendation score must be between 0 and 100')
    }
  }

  /**
   * Factory method - calcule la priorité selon les règles métier
   */
  static fromStation(station: StationWithDistance): StationPriority {
    const { distance, free_bikes } = station

    // Calcul des critères métier
    const isVeryClose = distance < 50
    const isClose = distance < 100
    const hasCriticalBikes = free_bikes <= 1
    const hasLowBikes = free_bikes === 2
    const hasGoodBikes = free_bikes > 5
    const hasAbundantBikes = free_bikes > 10

    // Déterminer la disponibilité de vélos
    let bikeAvailability: BikeAvailability
    if (hasCriticalBikes) {
      bikeAvailability = BikeAvailability.CRITICAL
    } else if (hasLowBikes) {
      bikeAvailability = BikeAvailability.LOW
    } else if (free_bikes <= 5) {
      bikeAvailability = BikeAvailability.MEDIUM
    } else if (hasAbundantBikes) {
      bikeAvailability = BikeAvailability.ABUNDANT
    } else {
      bikeAvailability = BikeAvailability.HIGH
    }

    // Déterminer le niveau de priorité selon règles métier
    let level: StationPriorityLevel
    if (hasCriticalBikes || hasLowBikes) {
      level = StationPriorityLevel.WARNING
    } else if (isVeryClose && hasGoodBikes) {
      level = StationPriorityLevel.OPTIMAL
    } else if (isClose || hasGoodBikes) {
      level = StationPriorityLevel.GOOD
    } else {
      level = StationPriorityLevel.NORMAL
    }

    // Calculer le score de recommandation (0-100)
    const recommendationScore = this.calculateRecommendationScore(
      distance,
      free_bikes
    )

    return new StationPriority(
      level,
      bikeAvailability,
      isVeryClose,
      hasGoodBikes,
      recommendationScore
    )
  }

  /**
   * Calcule un score de recommandation basé sur distance et vélos
   * Score plus élevé = meilleure recommandation
   */
  private static calculateRecommendationScore(
    distance: number,
    free_bikes: number
  ): number {
    // Score de distance (0-50 points)
    // Plus proche = plus de points
    let distanceScore: number
    if (distance < 50) {
      distanceScore = 50
    } else if (distance < 100) {
      distanceScore = 40
    } else if (distance < 150) {
      distanceScore = 30
    } else if (distance < 200) {
      distanceScore = 20
    } else {
      distanceScore = 10
    }

    // Score de disponibilité (0-50 points)
    let bikeScore: number
    if (free_bikes <= 1) {
      bikeScore = 10
    } else if (free_bikes === 2) {
      bikeScore = 20
    } else if (free_bikes <= 5) {
      bikeScore = 30
    } else if (free_bikes <= 10) {
      bikeScore = 40
    } else {
      bikeScore = 50
    }

    return distanceScore + bikeScore
  }

  /**
   * Prédicat - est-ce un choix optimal ?
   */
  isOptimal(): boolean {
    return this.level === StationPriorityLevel.OPTIMAL
  }

  /**
   * Prédicat - faut-il afficher un warning ?
   */
  needsWarning(): boolean {
    return this.level === StationPriorityLevel.WARNING
  }

  /**
   * Retourne la couleur Tailwind appropriée pour le badge
   */
  getBadgeColor(): string {
    switch (this.level) {
      case StationPriorityLevel.OPTIMAL:
        return 'bg-success-dark text-white'
      case StationPriorityLevel.GOOD:
        return 'bg-primary-500 text-white'
      case StationPriorityLevel.WARNING:
        return 'bg-warning-dark text-white'
      case StationPriorityLevel.NORMAL:
        return 'bg-gray-200 text-gray-700'
    }
  }

  /**
   * Retourne le texte du badge de priorité
   */
  getBadgeText(): string | null {
    switch (this.level) {
      case StationPriorityLevel.OPTIMAL:
        return 'Choix optimal'
      case StationPriorityLevel.WARNING:
        return 'Peu de vélos'
      default:
        return null
    }
  }

  /**
   * Retourne la couleur pour le compteur de vélos
   */
  getBikeCountColor(): string {
    switch (this.bikeAvailability) {
      case BikeAvailability.CRITICAL:
        return 'text-error-dark'
      case BikeAvailability.LOW:
        return 'text-warning-dark'
      case BikeAvailability.MEDIUM:
        return 'text-gray-700'
      case BikeAvailability.HIGH:
        return 'text-success-dark'
      case BikeAvailability.ABUNDANT:
        return 'text-success-dark font-bold'
    }
  }

  /**
   * Equality check (Value Object pattern)
   */
  equals(other: StationPriority): boolean {
    return (
      this.level === other.level &&
      this.bikeAvailability === other.bikeAvailability &&
      this.recommendationScore === other.recommendationScore
    )
  }
}
