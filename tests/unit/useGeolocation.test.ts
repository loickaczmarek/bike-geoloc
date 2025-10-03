/**
 * ========================================
 * USE GEOLOCATION HOOK - TESTS UNITAIRES
 * ========================================
 * Tests du hook useGeolocation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useGeolocation } from '@/hooks/useGeolocation'

// Mock du navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
}

describe('useGeolocation Hook', () => {
  beforeEach(() => {
    // @ts-expect-error - Mock pour tests
    global.navigator.geolocation = mockGeolocation
    vi.clearAllMocks()
  })

  describe('Initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useGeolocation())

      expect(result.current.position).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.status).toBe('idle')
      expect(result.current.isAvailable).toBe(true)
      expect(result.current.retryCount).toBe(0)
    })

    it('should detect when geolocation is not available', () => {
      // @ts-expect-error - Mock pour tests
      delete global.navigator.geolocation

      const { result } = renderHook(() => useGeolocation())

      expect(result.current.isAvailable).toBe(false)
    })
  })

  describe('getCurrentPosition', () => {
    it('should fetch position successfully', async () => {
      const mockPosition = {
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 10,
        },
        timestamp: Date.now(),
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      const { result } = renderHook(() => useGeolocation())

      act(() => {
        result.current.getCurrentPosition()
      })

      // Vérifier état loading
      expect(result.current.isLoading).toBe(true)
      expect(result.current.status).toBe('loading')

      await waitFor(() => {
        expect(result.current.position).not.toBeNull()
      })

      // Vérifier état success
      expect(result.current.status).toBe('success')
      expect(result.current.position?.coords.latitude).toBe(48.8566)
      expect(result.current.position?.coords.longitude).toBe(2.3522)
      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    it('should handle permission denied error', async () => {
      const mockError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied geolocation',
      }

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success, error) => {
          error(mockError)
        }
      )

      const { result } = renderHook(() => useGeolocation())

      act(() => {
        result.current.getCurrentPosition()
      })

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })

      expect(result.current.status).toBe('error')
      expect(result.current.error?.type).toBe('GEOLOCATION')
      expect(result.current.position).toBeNull()
    })

    it('should call onSuccess callback', async () => {
      const onSuccess = vi.fn()
      const mockPosition = {
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 10,
        },
        timestamp: Date.now(),
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      const { result } = renderHook(() => useGeolocation({ onSuccess }))

      act(() => {
        result.current.getCurrentPosition()
      })

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledTimes(1)
      })

      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          coords: { latitude: 48.8566, longitude: 2.3522 },
          accuracy: 10,
        })
      )
    })

    it('should call onError callback', async () => {
      const onError = vi.fn()
      const mockError = {
        code: 1,
        message: 'Permission denied',
      }

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success, error) => {
          error(mockError)
        }
      )

      const { result } = renderHook(() => useGeolocation({ onError }))

      act(() => {
        result.current.getCurrentPosition()
      })

      await waitFor(() => {
        expect(onError).toHaveBeenCalledTimes(1)
      })

      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'GEOLOCATION',
        })
      )
    })
  })

  describe('Immediate geolocation', () => {
    it('should trigger geolocation on mount when immediate is true', async () => {
      const mockPosition = {
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 10,
        },
        timestamp: Date.now(),
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      const { result } = renderHook(() => useGeolocation({ immediate: true }))

      await waitFor(() => {
        expect(result.current.position).not.toBeNull()
      })

      expect(result.current.status).toBe('success')
    })

    it('should not trigger on mount when immediate is false', () => {
      const { result } = renderHook(() => useGeolocation({ immediate: false }))

      expect(result.current.status).toBe('idle')
      expect(mockGeolocation.getCurrentPosition).not.toHaveBeenCalled()
    })
  })

  describe('Accuracy validation', () => {
    it('should reject position if accuracy is too low', async () => {
      const mockPosition = {
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 150, // Trop imprécis
        },
        timestamp: Date.now(),
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      const { result } = renderHook(() =>
        useGeolocation({ maxAccuracy: 100 })
      )

      act(() => {
        result.current.getCurrentPosition()
      })

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })

      expect(result.current.status).toBe('error')
      expect(result.current.error?.type).toBe('VALIDATION')
      expect(result.current.position).toBeNull()
    })

    it('should accept position if accuracy is good enough', async () => {
      const mockPosition = {
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 50, // Précision OK
        },
        timestamp: Date.now(),
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      const { result } = renderHook(() =>
        useGeolocation({ maxAccuracy: 100 })
      )

      act(() => {
        result.current.getCurrentPosition()
      })

      await waitFor(() => {
        expect(result.current.position).not.toBeNull()
      })

      expect(result.current.status).toBe('success')
    })
  })

  describe('Retry mechanism', () => {
    it('should retry on error', async () => {
      const mockError = {
        code: 3, // TIMEOUT
        message: 'Timeout',
      }

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success, error) => {
          error(mockError)
        }
      )

      const { result } = renderHook(() => useGeolocation({ maxRetries: 2 }))

      act(() => {
        result.current.getCurrentPosition()
      })

      await waitFor(() => {
        expect(result.current.error).not.toBeNull()
      })

      act(() => {
        result.current.retry()
      })

      await waitFor(() => {
        expect(result.current.retryCount).toBe(1)
      })
    })

    it('should reset retry count on manual trigger', async () => {
      const { result } = renderHook(() => useGeolocation())

      act(() => {
        result.current.getCurrentPosition()
      })

      await waitFor(() => {
        expect(result.current.retryCount).toBe(0)
      })
    })
  })

  describe('Reset functionality', () => {
    it('should reset all state', async () => {
      const mockPosition = {
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 10,
        },
        timestamp: Date.now(),
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      const { result } = renderHook(() => useGeolocation())

      act(() => {
        result.current.getCurrentPosition()
      })

      await waitFor(() => {
        expect(result.current.position).not.toBeNull()
      })

      act(() => {
        result.current.reset()
      })

      expect(result.current.position).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.status).toBe('idle')
      expect(result.current.retryCount).toBe(0)
    })
  })
})
