/**
 * ========================================
 * ERROR HANDLER MIDDLEWARE
 * ========================================
 * Gestion centralisée des erreurs de l'application
 * - Parsing des erreurs API
 * - Formatage des messages utilisateur
 * - Logging structuré
 */

import { logger } from './logger'

export enum ErrorType {
  GEOLOCATION = 'GEOLOCATION',
  GEOLOCATION_PERMISSION_DENIED = 'GEOLOCATION_PERMISSION_DENIED',
  GEOLOCATION_POSITION_UNAVAILABLE = 'GEOLOCATION_POSITION_UNAVAILABLE',
  GEOLOCATION_TIMEOUT = 'GEOLOCATION_TIMEOUT',
  GEOLOCATION_ACCURACY_TOO_LOW = 'GEOLOCATION_ACCURACY_TOO_LOW',
  API = 'API',
  API_ERROR = 'API_ERROR',
  NETWORK = 'NETWORK',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType
  message: string
  userMessage: string // Message friendly pour l'UI
  originalError?: unknown
  timestamp: string
  context?: Record<string, unknown>
}

/**
 * Classe d'erreur personnalisée pour l'application
 */
export class BikeGeolocError extends Error {
  public readonly type: ErrorType
  public readonly userMessage: string
  public readonly context?: Record<string, unknown>
  public readonly timestamp: string

  constructor(
    type: ErrorType,
    message: string,
    userMessage: string,
    context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'BikeGeolocError'
    this.type = type
    this.userMessage = userMessage
    this.context = context
    this.timestamp = new Date().toISOString()

    // Maintient la stack trace correcte
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BikeGeolocError)
    }
  }

  toJSON(): AppError {
    return {
      type: this.type,
      message: this.message,
      userMessage: this.userMessage,
      timestamp: this.timestamp,
      context: this.context,
    }
  }
}

/**
 * Parse les erreurs de géolocalisation du navigateur
 */
export function parseGeolocationError(error: GeolocationPositionError): BikeGeolocError {
  const errorMap: Record<number, { message: string; userMessage: string }> = {
    [GeolocationPositionError.PERMISSION_DENIED]: {
      message: 'Geolocation permission denied by user',
      userMessage: '🚫 Veuillez autoriser la géolocalisation dans votre navigateur',
    },
    [GeolocationPositionError.POSITION_UNAVAILABLE]: {
      message: 'Geolocation position unavailable',
      userMessage: '📍 Impossible de déterminer votre position. Vérifiez votre GPS.',
    },
    [GeolocationPositionError.TIMEOUT]: {
      message: 'Geolocation timeout',
      userMessage: '⏱️ La géolocalisation prend trop de temps. Réessayez.',
    },
  }

  const errorInfo = errorMap[error.code] ?? {
    message: 'Unknown geolocation error',
    userMessage: '❌ Erreur de géolocalisation inconnue',
  }

  return new BikeGeolocError(
    ErrorType.GEOLOCATION,
    errorInfo.message,
    errorInfo.userMessage,
    { code: error.code }
  )
}

/**
 * Parse les erreurs réseau / API
 */
export function parseApiError(error: unknown, endpoint?: string): BikeGeolocError {
  // Erreur réseau (fetch failed)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return new BikeGeolocError(
      ErrorType.NETWORK,
      `Network error on ${endpoint}`,
      '🌐 Problème de connexion. Vérifiez votre réseau.',
      { endpoint }
    )
  }

  // Erreur HTTP avec response
  if (error instanceof Response) {
    return new BikeGeolocError(
      ErrorType.API,
      `API error ${error.status} on ${endpoint}`,
      `⚠️ Erreur API (${error.status}). Réessayez plus tard.`,
      { status: error.status, endpoint }
    )
  }

  // Timeout
  if (error instanceof Error && error.name === 'AbortError') {
    return new BikeGeolocError(
      ErrorType.NETWORK,
      `Request timeout on ${endpoint}`,
      '⏱️ La requête a pris trop de temps. Réessayez.',
      { endpoint }
    )
  }

  // Erreur générique
  return new BikeGeolocError(
    ErrorType.UNKNOWN,
    error instanceof Error ? error.message : 'Unknown API error',
    '❌ Une erreur est survenue. Veuillez réessayer.',
    { endpoint, originalError: error }
  )
}

/**
 * Gestionnaire global d'erreurs
 * Log et optionnellement envoie à un service de monitoring (Sentry)
 */
export function handleError(error: unknown, context?: string): BikeGeolocError {
  let appError: BikeGeolocError

  if (error instanceof BikeGeolocError) {
    appError = error
  } else if (error instanceof GeolocationPositionError) {
    appError = parseGeolocationError(error)
  } else {
    appError = parseApiError(error, context)
  }

  // Log l'erreur
  logger.error('Application error', {
    type: appError.type,
    message: appError.message,
    context: appError.context,
    stack: appError.stack,
  })

  // TODO: Envoyer à Sentry en production
  // if (import.meta.env.VITE_SENTRY_DSN) {
  //   Sentry.captureException(appError)
  // }

  return appError
}

/**
 * Helper pour créer des erreurs de validation
 */
export function createValidationError(
  field: string,
  message: string
): BikeGeolocError {
  return new BikeGeolocError(
    ErrorType.VALIDATION,
    `Validation error on ${field}: ${message}`,
    `⚠️ ${message}`,
    { field }
  )
}
