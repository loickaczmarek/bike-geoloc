/**
 * ========================================
 * ERROR STATE COMPONENT
 * ========================================
 * Composant d'affichage des erreurs avec action de retry
 */

interface ErrorStateProps {
  /** Message d'erreur à afficher */
  message: string
  /** Callback pour réessayer */
  onRetry?: () => void
  /** Texte du bouton retry */
  retryText?: string
  /** Titre de l'erreur */
  title?: string
}

export function ErrorState({
  message,
  onRetry,
  retryText = 'Réessayer',
  title = 'Une erreur est survenue',
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-error-light bg-error-light/10 p-8">
      {/* Icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-error-light">
        <svg
          className="h-6 w-6 text-error-dark"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      {/* Titre */}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

      {/* Message */}
      <p className="text-center text-sm text-gray-600">{message}</p>

      {/* Bouton Retry */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-lg bg-primary-500 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          {retryText}
        </button>
      )}
    </div>
  )
}
