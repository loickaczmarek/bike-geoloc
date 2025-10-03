/**
 * ========================================
 * STATION LIST COMPONENT (OPTIMIZED)
 * ========================================
 * Composant container avec QuickActionCard pour décision rapide
 *
 * VALEUR MÉTIER :
 * - Réponse immédiate : "Quel vélo prendre ?" → QuickActionCard
 * - Option de parcourir : Liste complète en dessous
 * - Actualisation facile
 */

import { QuickActionCard } from './QuickActionCard'
import { StationCard } from './StationCard'
import { RefreshIndicator } from './RefreshIndicator'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { useOptimalStation } from '@/hooks/useStationPriority'
import { useAutoRefresh } from '@/hooks/useAutoRefresh'
import type { StationWithDistance } from '@/types/station.types'
import type { BikeGeolocError } from '@/middleware/error-handler'

interface StationListProps {
  stations: StationWithDistance[]
  networkName?: string
  isLoading?: boolean
  error?: BikeGeolocError | null
  onRetry?: () => void
  onRefresh?: () => void
  lastUpdate?: string
  onStationSelect?: (station: StationWithDistance) => void
  /**
   * Activer le rafraîchissement automatique
   * @default false
   */
  autoRefresh?: boolean
  /**
   * Intervalle de rafraîchissement automatique (ms)
   * @default 60000 (60s)
   */
  autoRefreshInterval?: number
}

export function StationList({
  stations,
  networkName,
  isLoading = false,
  error = null,
  onRetry,
  onRefresh,
  lastUpdate,
  onStationSelect,
  autoRefresh = false,
  autoRefreshInterval = 60000,
}: StationListProps) {
  // Trouver la station optimale pour la QuickActionCard
  const optimalStation = useOptimalStation(stations)

  // Auto-refresh hook
  const { refreshState, timeUntilRefresh, isActive, toggle } = useAutoRefresh({
    interval: autoRefreshInterval,
    enabled: autoRefresh,
    onAutoRefresh: onRefresh,
    lastUpdate: lastUpdate || null,
    isLoading,
    pauseWhileLoading: true,
  })

  // État de chargement
  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-lg">
        <LoadingState message="Recherche des stations à proximité..." size="lg" />
      </div>
    )
  }

  // État d'erreur
  if (error) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-lg">
        <ErrorState
          title="Impossible de trouver les stations"
          message={error.userMessage}
          onRetry={onRetry}
        />
      </div>
    )
  }

  // État vide
  if (!stations || stations.length === 0) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-lg">
        <EmptyState
          message="Aucune station trouvée à proximité"
          description="Essayez d'élargir le rayon de recherche ou vérifiez votre position."
          action={
            onRefresh
              ? {
                  label: 'Réessayer',
                  onClick: onRefresh,
                }
              : undefined
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* QuickActionCard - Réponse immédiate "Quel vélo prendre ?" */}
      {optimalStation && (
        <div>
          <h2 className="mb-3 text-sm font-medium text-gray-600">
            🎯 Notre recommandation
          </h2>
          <QuickActionCard
            station={optimalStation}
            onSelect={onStationSelect}
          />
        </div>
      )}

      {/* RefreshIndicator - État du rafraîchissement */}
      {lastUpdate && (
        <RefreshIndicator
          refreshState={refreshState}
          timeUntilRefresh={timeUntilRefresh}
          showCountdown={autoRefresh}
          showRelativeTime={true}
          showFreshnessBadge={true}
        />
      )}

      {/* Header avec options */}
      <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Toutes les Stations
          </h2>
          {networkName && (
            <p className="mt-1 text-sm text-gray-600">
              Réseau : <span className="font-medium">{networkName}</span>
            </p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {stations.length} station{stations.length > 1 ? 's' : ''} disponible
            {stations.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Boutons refresh */}
        <div className="flex items-center gap-2">
          {/* Auto-refresh toggle */}
          {autoRefresh && onRefresh && (
            <button
              onClick={toggle}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                isActive
                  ? 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-label={isActive ? 'Désactiver le rafraîchissement automatique' : 'Activer le rafraîchissement automatique'}
              aria-pressed={isActive}
            >
              {isActive ? (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className="hidden sm:inline">{isActive ? 'Auto' : 'Manuel'}</span>
            </button>
          )}

          {/* Manual refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Actualiser la liste des stations"
            >
              <svg
                className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Actualiser</span>
            </button>
          )}
        </div>
      </div>

      {/* Liste des stations - Grid responsive */}
      <div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-2"
        role="list"
        aria-label="Liste des stations de vélos"
      >
        {stations.map((station, index) => (
          <div key={station.id} role="listitem">
            <StationCard
              station={station}
              rank={index + 1}
              onSelect={onStationSelect}
            />
          </div>
        ))}
      </div>


      {/* Indicateur de navigation au clavier */}
      <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-700">
        <p className="flex items-center gap-2">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span>
            💡 Astuce : Utilisez <kbd className="rounded border border-blue-300 bg-white px-1">Tab</kbd> pour naviguer entre les stations
          </span>
        </p>
      </div>
    </div>
  )
}
