/**
 * ========================================
 * STATION CARD COMPONENT (OPTIMIZED)
 * ========================================
 * Carte affichant les informations d'une station avec hiérarchie visuelle
 *
 * PRINCIPES UX :
 * - Information critique en gros et en couleur
 * - Distance toujours visible (coin supérieur droit)
 * - Nombre de vélos avec code couleur sémantique
 * - Badge de priorité si pertinent
 * - Accessible au clavier et lecteur d'écran
 */

import { formatDistance } from '@/utils/format-distance'
import { StationPriority } from '@/lib/domain/StationPriority'
import type { StationWithDistance } from '@/types/station.types'

interface StationCardProps {
  station: StationWithDistance
  rank: number
  onSelect?: (station: StationWithDistance) => void
}

export function StationCard({ station, rank, onSelect }: StationCardProps) {
  const priority = StationPriority.fromStation(station)

  // Classes CSS conditionnelles selon priorité
  const cardClasses = priority.isOptimal()
    ? 'border-primary-400 bg-primary-50/50 shadow-md'
    : priority.needsWarning()
      ? 'border-warning-300 bg-warning-50/30'
      : 'border-gray-200 bg-white'

  return (
    <article
      role="article"
      className={`group relative overflow-hidden rounded-lg border p-4 transition-all hover:shadow-lg ${cardClasses}`}
      tabIndex={onSelect ? 0 : undefined}
      onClick={() => onSelect?.(station)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onSelect) {
          e.preventDefault()
          onSelect(station)
        }
      }}
      aria-label={`Station ${station.name}, rang ${rank}, ${station.free_bikes} vélos disponibles, à ${formatDistance(station.distance)}`}
    >
      {/* Badge de priorité si applicable */}
      {priority.getBadgeText() && (
        <div className="absolute right-2 top-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${priority.getBadgeColor()}`}
          >
            {priority.getBadgeText()}
          </span>
        </div>
      )}

      {/* Header avec rang et nom */}
      <div className="mb-3 flex items-start gap-3">
        {/* Rang - hiérarchie visuelle claire */}
        <div
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-base font-bold ${
            priority.isOptimal()
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
          aria-label={`Rang ${rank}`}
        >
          {rank}
        </div>

        {/* Nom de la station */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-primary-700">
            {station.name}
          </h3>
          {station.extra?.address && (
            <p className="mt-1 text-xs text-gray-500 truncate">
              {station.extra.address}
            </p>
          )}
        </div>
      </div>

      {/* Informations critiques - HIÉRARCHIE VISUELLE FORTE */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        {/* Distance - TRÈS VISIBLE */}
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-600">Distance</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatDistance(station.distance)}
          </p>
        </div>

        {/* Vélos disponibles - TRÈS VISIBLE avec code couleur */}
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium text-gray-600">Vélos</p>
          <p
            className={`mt-1 text-2xl font-bold ${priority.getBikeCountColor()}`}
            data-testid="bike-count"
            aria-label={`${station.free_bikes} vélos disponibles`}
          >
            {station.free_bikes}
          </p>
        </div>
      </div>

      {/* Informations secondaires - plus discrètes */}
      <div className="flex items-center justify-between text-sm">
        {/* Emplacements libres */}
        <div className="flex items-center gap-1 text-gray-600">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
          </svg>
          <span>{station.empty_slots} places libres</span>
        </div>

        {/* Score de recommandation (optionnel) */}
        {priority.recommendationScore > 70 && (
          <div className="flex items-center gap-1 text-primary-600">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs font-medium">Recommandé</span>
          </div>
        )}
      </div>

      {/* Indicateur d'interactivité si cliquable */}
      {onSelect && (
        <div className="pointer-events-none absolute bottom-2 right-2 opacity-0 transition-opacity group-hover:opacity-100">
          <svg
            className="h-5 w-5 text-primary-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </div>
      )}
    </article>
  )
}
