/**
 * ========================================
 * ERROR FACTORY
 * ========================================
 * Factory functions pour créer des erreurs typées
 * Élimine la duplication de code (DRY principle)
 *
 * CRAFT Principle: Don't Repeat Yourself
 * Avant: Création d'erreurs dupliquée dans 5+ fichiers
 * Après: Fonction centralisée, type-safe, testable
 */

import { BikeGeolocError, ErrorType } from '@/middleware/error-handler'

/**
 * Crée une erreur de validation
 *
 * @example
 * ```typescript
 * throw createValidationError('Position GPS requise', 'User location is required')
 * ```
 */
export function createValidationError(
  userMessage: string,
  technicalMessage?: string,
  context?: Record<string, unknown>
): BikeGeolocError {
  return new BikeGeolocError(
    ErrorType.VALIDATION,
    technicalMessage || userMessage,
    userMessage,
    {
      ...context,
      timestamp: new Date().toISOString(),
    }
  )
}

/**
 * Crée une erreur réseau
 */
export function createNetworkError(
  userMessage: string,
  technicalMessage?: string,
  context?: Record<string, unknown>
): BikeGeolocError {
  return new BikeGeolocError(
    ErrorType.NETWORK_ERROR,
    technicalMessage || userMessage,
    userMessage,
    {
      ...context,
      timestamp: new Date().toISOString(),
    }
  )
}

/**
 * Crée une erreur d'API
 */
export function createApiError(
  userMessage: string,
  technicalMessage?: string,
  context?: Record<string, unknown>
): BikeGeolocError {
  return new BikeGeolocError(
    ErrorType.API_ERROR,
    technicalMessage || userMessage,
    userMessage,
    {
      ...context,
      timestamp: new Date().toISOString(),
    }
  )
}

/**
 * Crée une erreur de permission de géolocalisation
 */
export function createGeolocationPermissionError(
  context?: Record<string, unknown>
): BikeGeolocError {
  return new BikeGeolocError(
    ErrorType.GEOLOCATION_PERMISSION_DENIED,
    'Geolocation permission denied',
    '🚫 Veuillez autoriser la géolocalisation dans les paramètres de votre navigateur',
    {
      ...context,
      timestamp: new Date().toISOString(),
    }
  )
}

/**
 * Crée une erreur de position GPS indisponible
 */
export function createGeolocationUnavailableError(
  context?: Record<string, unknown>
): BikeGeolocError {
  return new BikeGeolocError(
    ErrorType.GEOLOCATION_POSITION_UNAVAILABLE,
    'Geolocation position unavailable',
    '📡 Impossible de déterminer votre position. Vérifiez que le GPS est activé.',
    {
      ...context,
      timestamp: new Date().toISOString(),
    }
  )
}

/**
 * Crée une erreur de timeout de géolocalisation
 */
export function createGeolocationTimeoutError(
  timeoutMs: number,
  context?: Record<string, unknown>
): BikeGeolocError {
  return new BikeGeolocError(
    ErrorType.GEOLOCATION_TIMEOUT,
    `Geolocation timeout after ${timeoutMs}ms`,
    `⏱️ La localisation prend trop de temps (délai dépassé : ${timeoutMs / 1000}s)`,
    {
      ...context,
      timeoutMs,
      timestamp: new Date().toISOString(),
    }
  )
}

/**
 * Crée une erreur de précision GPS insuffisante
 */
export function createGeolocationAccuracyError(
  actualAccuracy: number,
  requiredAccuracy: number,
  context?: Record<string, unknown>
): BikeGeolocError {
  return new BikeGeolocError(
    ErrorType.GEOLOCATION_ACCURACY_TOO_LOW,
    `Geolocation accuracy too low: ${actualAccuracy}m > ${requiredAccuracy}m`,
    `🎯 Précision GPS insuffisante (${Math.round(actualAccuracy)}m). Sortez à l'extérieur ou attendez quelques secondes.`,
    {
      ...context,
      actualAccuracy,
      requiredAccuracy,
      timestamp: new Date().toISOString(),
    }
  )
}

/**
 * Crée une erreur de timeout d'API
 */
export function createApiTimeoutError(
  url: string,
  timeoutMs: number,
  context?: Record<string, unknown>
): BikeGeolocError {
  return new BikeGeolocError(
    ErrorType.TIMEOUT,
    `API request timeout: ${url} (${timeoutMs}ms)`,
    '⏱️ Le serveur met trop de temps à répondre. Veuillez réessayer.',
    {
      ...context,
      url,
      timeoutMs,
      timestamp: new Date().toISOString(),
    }
  )
}

/**
 * Crée une erreur de données non trouvées
 */
export function createNotFoundError(
  resource: string,
  userMessage?: string,
  context?: Record<string, unknown>
): BikeGeolocError {
  return new BikeGeolocError(
    ErrorType.NOT_FOUND,
    `Resource not found: ${resource}`,
    userMessage || `❌ ${resource} introuvable`,
    {
      ...context,
      resource,
      timestamp: new Date().toISOString(),
    }
  )
}

/**
 * Crée une erreur générique inattendue
 */
export function createUnexpectedError(
  originalError: unknown,
  userMessage: string = 'Une erreur inattendue est survenue',
  context?: Record<string, unknown>
): BikeGeolocError {
  const technicalMessage =
    originalError instanceof Error
      ? originalError.message
      : String(originalError)

  return new BikeGeolocError(
    ErrorType.UNKNOWN,
    technicalMessage,
    `❌ ${userMessage}`,
    {
      ...context,
      originalError:
        originalError instanceof Error
          ? {
              name: originalError.name,
              message: originalError.message,
              stack: originalError.stack,
            }
          : originalError,
      timestamp: new Date().toISOString(),
    }
  )
}
