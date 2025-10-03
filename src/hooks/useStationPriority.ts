/**
 * ========================================
 * USE STATION PRIORITY HOOK
 * ========================================
 * Hook de domaine pour calculer la priorité visuelle des stations
 * Séparation présentation / logique métier
 */

import { useMemo } from 'react'
import { StationPriority } from '@/lib/domain/StationPriority'
import type { StationWithDistance } from '@/types/station.types'

interface StationWithPriority extends StationWithDistance {
  priority: StationPriority
}

/**
 * Hook pour enrichir les stations avec leur priorité
 * Mémoïsé pour éviter recalculs inutiles
 */
export function useStationPriority(
  stations: StationWithDistance[]
): StationWithPriority[] {
  return useMemo(() => {
    return stations.map((station) => ({
      ...station,
      priority: StationPriority.fromStation(station),
    }))
  }, [stations])
}

/**
 * Hook pour obtenir la station optimale (meilleur score)
 */
export function useOptimalStation(
  stations: StationWithDistance[]
): StationWithPriority | null {
  const stationsWithPriority = useStationPriority(stations)

  return useMemo(() => {
    if (stationsWithPriority.length === 0) {
      return null
    }

    return stationsWithPriority.reduce((best, current) =>
      current.priority.recommendationScore > best.priority.recommendationScore
        ? current
        : best
    )
  }, [stationsWithPriority])
}

/**
 * Hook pour trier les stations par score de recommandation
 * (plutôt que seulement par distance)
 */
export function useStationsByRecommendation(
  stations: StationWithDistance[]
): StationWithPriority[] {
  const stationsWithPriority = useStationPriority(stations)

  return useMemo(() => {
    return [...stationsWithPriority].sort(
      (a, b) => b.priority.recommendationScore - a.priority.recommendationScore
    )
  }, [stationsWithPriority])
}
