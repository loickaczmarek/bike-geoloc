/**
 * ========================================
 * REFRESH INDICATOR COMPONENT
 * ========================================
 * Composant pour afficher le statut de rafraîchissement
 * Approche CRAFT : Présentation pure, logique dans le domain model
 */

import type { RefreshState } from '@/lib/domain/RefreshState'

export interface RefreshIndicatorProps {
  /**
   * État du rafraîchissement (RefreshState domain model)
   */
  refreshState: RefreshState

  /**
   * Temps restant jusqu'au prochain rafraîchissement (ms)
   */
  timeUntilRefresh: number | null

  /**
   * Afficher le countdown
   * @default true
   */
  showCountdown?: boolean

  /**
   * Afficher le temps relatif
   * @default true
   */
  showRelativeTime?: boolean

  /**
   * Afficher le badge de fraîcheur
   * @default true
   */
  showFreshnessBadge?: boolean

  /**
   * Variante compact (moins de détails)
   * @default false
   */
  compact?: boolean
}

/**
 * Composant pour afficher l'état de rafraîchissement
 *
 * @example
 * ```tsx
 * <RefreshIndicator
 *   refreshState={refreshState}
 *   timeUntilRefresh={30000}
 *   showCountdown={true}
 * />
 * ```
 */
export function RefreshIndicator({
  refreshState,
  timeUntilRefresh,
  showCountdown = true,
  showRelativeTime = true,
  showFreshnessBadge = true,
  compact = false,
}: RefreshIndicatorProps) {
  const freshnessBadge = refreshState.getFreshnessBadge()

  // Calculer le countdown en secondes
  const countdownSeconds =
    timeUntilRefresh !== null ? Math.ceil(timeUntilRefresh / 1000) : null

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 text-xs"
        role="status"
        aria-live="polite"
        aria-label="État de mise à jour"
      >
        {/* Icône de fraîcheur */}
        <span className={refreshState.getFreshnessColor()} aria-hidden="true">
          {refreshState.isRefreshing ? (
            <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            '•'
          )}
        </span>

        {/* Temps relatif */}
        {showRelativeTime && refreshState.getRelativeTime() && (
          <span className="text-gray-600">{refreshState.getRelativeTime()}</span>
        )}

        {/* Countdown si proche */}
        {showCountdown && countdownSeconds !== null && countdownSeconds <= 10 && (
          <span className="text-primary-600 font-medium">{countdownSeconds}s</span>
        )}
      </div>
    )
  }

  return (
    <div
      className="rounded-lg bg-gray-50 p-3"
      role="status"
      aria-live="polite"
      aria-label="État de mise à jour"
    >
      <div className="flex items-center justify-between gap-4">
        {/* Section gauche : Fraîcheur + Timestamp */}
        <div className="flex items-center gap-3">
          {/* Icône de statut */}
          <div className="flex-shrink-0">
            {refreshState.isRefreshing ? (
              <svg
                className="h-5 w-5 animate-spin text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : refreshState.isStale() ? (
              <svg
                className="h-5 w-5 text-warning-dark"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-success-dark"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>

          {/* Texte de fraîcheur */}
          <div>
            <p className={`text-sm font-medium ${refreshState.getFreshnessColor()}`}>
              {refreshState.isRefreshing
                ? 'Rafraîchissement en cours...'
                : refreshState.getFreshnessText()}
            </p>

            {/* Temps relatif */}
            {showRelativeTime && refreshState.getRelativeTime() && (
              <p className="mt-0.5 text-xs text-gray-500">
                {refreshState.getRelativeTime()}
              </p>
            )}
          </div>

          {/* Badge de fraîcheur (si périmé) */}
          {showFreshnessBadge && freshnessBadge && !refreshState.isRefreshing && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${freshnessBadge.color}`}
            >
              {freshnessBadge.text}
            </span>
          )}
        </div>

        {/* Section droite : Countdown auto-refresh */}
        {showCountdown && countdownSeconds !== null && !refreshState.isRefreshing && (
          <div className="flex items-center gap-2">
            {/* Progress bar */}
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-primary-500 transition-all duration-1000 ease-linear"
                style={{
                  width: `${refreshState.getAutoRefreshProgress()}%`,
                }}
                aria-hidden="true"
              />
            </div>

            {/* Countdown text */}
            <span className="text-xs font-medium text-gray-600 tabular-nums">
              {countdownSeconds > 0 ? `${countdownSeconds}s` : 'Maintenant'}
            </span>
          </div>
        )}
      </div>

      {/* Message d'encouragement si périmé */}
      {refreshState.shouldEncourageRefresh() && !refreshState.isRefreshing && (
        <div className="mt-2 flex items-center gap-2 text-xs text-warning-dark">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <span>Les données sont périmées. Rafraîchissez pour éviter les mauvaises surprises.</span>
        </div>
      )}
    </div>
  )
}
