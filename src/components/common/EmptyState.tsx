/**
 * ========================================
 * EMPTY STATE COMPONENT
 * ========================================
 * Composant d'affichage de l'état vide (aucun résultat)
 */

interface EmptyStateProps {
  /** Message principal */
  message: string
  /** Description optionnelle */
  description?: string
  /** Action optionnelle */
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ message, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8">
      {/* Icon */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <svg
          className="h-8 w-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      </div>

      {/* Message */}
      <div className="text-center">
        <p className="text-base font-medium text-gray-900">{message}</p>
        {description && (
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        )}
      </div>

      {/* Action */}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
