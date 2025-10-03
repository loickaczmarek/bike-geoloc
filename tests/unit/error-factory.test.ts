/**
 * ========================================
 * ERROR FACTORY - TESTS
 * ========================================
 * Tests pour les fonctions factory d'erreurs
 */

import { describe, it, expect } from 'vitest'
import {
  createValidationError,
  createNetworkError,
  createApiError,
  createGeolocationPermissionError,
  createGeolocationUnavailableError,
  createGeolocationTimeoutError,
  createGeolocationAccuracyError,
  createApiTimeoutError,
  createNotFoundError,
  createUnexpectedError,
} from '@/lib/errors/error-factory'
import { ErrorType } from '@/middleware/error-handler'

describe('Error Factory', () => {
  describe('createValidationError', () => {
    it('should create validation error with user message', () => {
      const error = createValidationError('Position GPS requise')

      expect(error.type).toBe(ErrorType.VALIDATION)
      expect(error.userMessage).toBe('Position GPS requise')
      expect(error.message).toBe('Position GPS requise')
      expect(error.timestamp).toBeDefined()
    })

    it('should create validation error with separate technical message', () => {
      const error = createValidationError(
        'Position GPS requise',
        'User location is required'
      )

      expect(error.userMessage).toBe('Position GPS requise')
      expect(error.message).toBe('User location is required')
    })

    it('should include context if provided', () => {
      const error = createValidationError('Erreur', 'Error', { field: 'latitude' })

      expect(error.context).toHaveProperty('field', 'latitude')
      expect(error.context).toHaveProperty('timestamp')
    })
  })

  describe('createGeolocationPermissionError', () => {
    it('should create permission denied error', () => {
      const error = createGeolocationPermissionError()

      expect(error.type).toBe(ErrorType.GEOLOCATION_PERMISSION_DENIED)
      expect(error.userMessage).toContain('autoriser la géolocalisation')
    })
  })

  describe('createGeolocationAccuracyError', () => {
    it('should create accuracy error with metrics', () => {
      const error = createGeolocationAccuracyError(150, 100)

      expect(error.type).toBe(ErrorType.GEOLOCATION_ACCURACY_TOO_LOW)
      expect(error.context).toHaveProperty('actualAccuracy', 150)
      expect(error.context).toHaveProperty('requiredAccuracy', 100)
      expect(error.userMessage).toContain('150')
    })
  })

  describe('createGeolocationTimeoutError', () => {
    it('should create timeout error with duration', () => {
      const error = createGeolocationTimeoutError(10000)

      expect(error.type).toBe(ErrorType.GEOLOCATION_TIMEOUT)
      expect(error.context).toHaveProperty('timeoutMs', 10000)
      expect(error.userMessage).toContain('10s')
    })
  })

  describe('createApiTimeoutError', () => {
    it('should create API timeout error with URL', () => {
      const error = createApiTimeoutError('https://api.example.com', 5000)

      expect(error.type).toBe(ErrorType.TIMEOUT)
      expect(error.context).toHaveProperty('url')
      expect(error.context).toHaveProperty('timeoutMs', 5000)
    })
  })

  describe('createNotFoundError', () => {
    it('should create not found error with resource name', () => {
      const error = createNotFoundError('Network')

      expect(error.type).toBe(ErrorType.NOT_FOUND)
      expect(error.context).toHaveProperty('resource', 'Network')
      expect(error.userMessage).toContain('introuvable')
    })

    it('should use custom user message if provided', () => {
      const error = createNotFoundError('Network', 'Custom message')

      expect(error.userMessage).toBe('Custom message')
    })
  })

  describe('createUnexpectedError', () => {
    it('should wrap Error instance', () => {
      const originalError = new Error('Original error')
      const error = createUnexpectedError(originalError)

      expect(error.type).toBe(ErrorType.UNKNOWN)
      expect(error.context?.originalError).toHaveProperty('message', 'Original error')
    })

    it('should wrap non-Error values', () => {
      const error = createUnexpectedError('String error')

      expect(error.message).toBe('String error')
    })

    it('should use custom user message', () => {
      const error = createUnexpectedError(new Error('Tech'), 'User friendly message')

      expect(error.userMessage).toContain('User friendly message')
    })
  })

  describe('Error timestamp', () => {
    it('should include timestamp in all errors', () => {
      const errors = [
        createValidationError('test'),
        createNetworkError('test'),
        createApiError('test'),
        createGeolocationPermissionError(),
        createNotFoundError('test'),
      ]

      errors.forEach((error) => {
        expect(error.context).toHaveProperty('timestamp')
        expect(typeof error.context?.timestamp).toBe('string')
        // Should be valid ISO date
        expect(() => new Date(error.context!.timestamp as string)).not.toThrow()
      })
    })
  })
})
