/**
 * ========================================
 * LOADING STATE COMPONENT
 * ========================================
 * Composant d'affichage de l'état de chargement
 */

interface LoadingStateProps {
  /** Message de chargement à afficher */
  message?: string
  /** Taille du spinner (sm | md | lg) */
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-8 h-8 border-2',
  md: 'w-12 h-12 border-3',
  lg: 'w-16 h-16 border-4',
}

export function LoadingState({
  message = 'Chargement...',
  size = 'md',
}: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      {/* Spinner */}
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-primary-500 border-t-transparent`}
        role="status"
        aria-label="Chargement en cours"
      />

      {/* Message */}
      <p className="text-center text-sm text-gray-600">{message}</p>
    </div>
  )
}
