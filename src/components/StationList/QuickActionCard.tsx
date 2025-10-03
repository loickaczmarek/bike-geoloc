/**
 * ========================================
 * QUICK ACTION CARD
 * ========================================
 * Composant pour afficher LA station recommandée en priorité
 * Répond au besoin : "Quel vélo dois-je prendre MAINTENANT ?"
 *
 * VALEUR MÉTIER :
 * - Décision instantanée sans analyser toute la liste
 * - Mise en avant visuelle forte du meilleur choix
 * - Information minimale mais suffisante
 */

import { formatDistance } from '@/utils/format-distance'
import type { StationWithDistance } from '@/types/station.types'
import { StationPriority } from '@/lib/domain/StationPriority'

interface QuickActionCardProps {
  station: StationWithDistance
  onSelect?: (station: StationWithDistance) => void
}

export function QuickActionCard({ station, onSelect }: QuickActionCardProps) {
  const priority = StationPriority.fromStation(station)

  return (
    <button
      onClick={() => onSelect?.(station)}
      className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 p-6 text-left shadow-xl transition-all hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-primary-300"
      aria-label={`Station recommandée : ${station.name} à ${formatDistance(station.distance)}`}
    >
      {/* Badge "Meilleur choix" */}
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
        <svg
          className="h-4 w-4"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span>Meilleur choix</span>
      </div>

      {/* Nom de la station */}
      <h3 className="mb-4 text-2xl font-bold text-white">
        {station.name}
      </h3>

      {/* Informations clés en gros */}
      <div className="grid grid-cols-2 gap-4">
        {/* Distance */}
        <div>
          <p className="text-sm font-medium text-white/70">Distance</p>
          <p className="text-4xl font-bold text-white">
            {formatDistance(station.distance)}
          </p>
        </div>

        {/* Vélos disponibles */}
        <div>
          <p className="text-sm font-medium text-white/70">Vélos</p>
          <p className="text-4xl font-bold text-white">
            {station.free_bikes}
          </p>
        </div>
      </div>

      {/* Score de recommandation (optionnel) */}
      <div className="mt-4 flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/20">
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{ width: `${priority.recommendationScore}%` }}
          />
        </div>
        <span className="text-sm font-medium text-white/90">
          {priority.recommendationScore}%
        </span>
      </div>

      {/* Effet de brillance au hover */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}
