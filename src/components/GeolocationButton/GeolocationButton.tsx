/**
 * ========================================
 * GEOLOCATION BUTTON COMPONENT
 * ========================================
 * Bouton de géolocalisation avec états visuels et feedback utilisateur
 *
 * FONCTIONNALITÉS :
 * - Affichage des coordonnées GPS avec précision
 * - États visuels (idle, loading, success, error)
 * - Messages d'erreur contextuels
 * - Retry automatique et manuel
 * - Validation de la précision GPS
 */

import { useGeolocation } from '@/hooks/useGeolocation'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { logger } from '@/middleware/logger'

interface GeolocationButtonProps {
  /** Callback appelé avec la position GPS */
  onPositionReceived?: (position: {
    latitude: number
    longitude: number
  }) => void

  /** Déclencher automatiquement au montage */
  autoTrigger?: boolean

  /** Précision maximale en mètres */
  maxAccuracy?: number

  /** Afficher les détails de la position */
  showDetails?: boolean
}

export function GeolocationButton({
  onPositionReceived,
  autoTrigger = false,
  maxAccuracy,
  showDetails = true,
}: GeolocationButtonProps) {
  const {
    position,
    error,
    isLoading,
    isAvailable,
    getCurrentPosition,
    retry,
    retryCount,
  } = useGeolocation({
    immediate: autoTrigger,
    maxAccuracy,
    onSuccess: (result) => {
      logger.info('GeolocationButton onSuccess, calling onPositionReceived', { ...result.coords })
      onPositionReceived?.(result.coords)
    },
  })

  // Géolocalisation non disponible dans le navigateur
  if (!isAvailable) {
    return (
      <div className="rounded-lg border border-error-light bg-error-light/10 p-4">
        <p className="text-sm text-error-dark">
          🚫 Votre navigateur ne supporte pas la géolocalisation
        </p>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4">
      {/* Bouton principal */}
      {!position && !isLoading && (
        <button
          onClick={getCurrentPosition}
          disabled={isLoading}
          className="w-full rounded-lg bg-primary-500 px-6 py-3 font-medium text-white transition-all hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          📍 Me localiser
        </button>
      )}

      {/* État de chargement */}
      {isLoading && (
        <LoadingState message="Localisation en cours..." size="md" />
      )}

      {/* Erreur */}
      {error && !isLoading && (
        <div className="space-y-2">
          <ErrorState
            title="Erreur de géolocalisation"
            message={error.userMessage}
            onRetry={retry}
            retryText={
              retryCount > 0 ? `Réessayer (${retryCount})` : 'Réessayer'
            }
          />

          {/* Conseils selon le type d'erreur */}
          {error.type === 'GEOLOCATION' && (
            <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
              <p className="font-medium">💡 Comment activer la géolocalisation ?</p>
              <ul className="ml-4 mt-1 list-disc space-y-1">
                <li>Chrome : Cliquez sur le cadenas 🔒 dans la barre d'adresse</li>
                <li>
                  Firefox : Cliquez sur l'icône d'informations ℹ️ puis
                  "Permissions"
                </li>
                <li>Safari : Préférences → Sites web → Localisation</li>
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Succès - Affichage de la position */}
      {position && !isLoading && showDetails && (
        <div className="space-y-3 rounded-lg border border-success-light bg-success-light/10 p-4">
          {/* Header avec icône succès */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-light">
              <svg
                className="h-5 w-5 text-success-dark"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="font-semibold text-success-dark">
              Position GPS détectée
            </h3>
          </div>

          {/* Coordonnées */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Latitude :</span>
              <span className="font-mono font-medium text-gray-900">
                {position.coords.latitude.toFixed(6)}°
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Longitude :</span>
              <span className="font-mono font-medium text-gray-900">
                {position.coords.longitude.toFixed(6)}°
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Précision :</span>
              <span
                className={`font-medium ${
                  position.accuracy <= 50
                    ? 'text-success-dark'
                    : position.accuracy <= 100
                      ? 'text-warning-dark'
                      : 'text-error-dark'
                }`}
              >
                ± {Math.round(position.accuracy)}m
              </span>
            </div>
          </div>

          {/* Bouton pour relocaliser */}
          <button
            onClick={getCurrentPosition}
            className="w-full rounded-lg border border-primary-500 bg-white px-4 py-2 text-sm font-medium text-primary-500 transition-colors hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            🔄 Actualiser ma position
          </button>
        </div>
      )}

      {/* Version compacte si showDetails = false */}
      {position && !isLoading && !showDetails && (
        <div className="flex items-center justify-between rounded-lg border border-success-light bg-success-light/10 p-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-success-dark">✓ Position GPS OK</span>
            <span className="text-xs text-gray-500">
              (±{Math.round(position.accuracy)}m)
            </span>
          </div>
          <button
            onClick={getCurrentPosition}
            className="text-sm text-primary-500 hover:underline"
          >
            Actualiser
          </button>
        </div>
      )}
    </div>
  )
}
