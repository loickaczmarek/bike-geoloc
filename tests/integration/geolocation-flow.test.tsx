/**
 * ========================================
 * GEOLOCATION FLOW - TESTS D'INTÉGRATION
 * ========================================
 * Tests d'intégration du flux complet de géolocalisation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GeolocationButton } from '@/components/GeolocationButton'

// Mock du navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
}

describe('Geolocation Flow - Integration', () => {
  beforeEach(() => {
    // @ts-expect-error - Mock pour tests
    global.navigator.geolocation = mockGeolocation
    vi.clearAllMocks()
  })

  describe('Successful geolocation flow', () => {
    it('should display position after successful geolocation', async () => {
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

      const onPositionReceived = vi.fn()

      render(
        <GeolocationButton
          onPositionReceived={onPositionReceived}
          showDetails={true}
        />
      )

      // Cliquer sur le bouton de géolocalisation
      const button = screen.getByText(/Me localiser/i)
      await userEvent.click(button)

      // Attendre que la position soit affichée
      await waitFor(() => {
        expect(screen.getByText(/Position GPS détectée/i)).toBeInTheDocument()
      })

      // Vérifier que les coordonnées sont affichées
      expect(screen.getByText(/48.856600/i)).toBeInTheDocument()
      expect(screen.getByText(/2.352200/i)).toBeInTheDocument()

      // Vérifier que le callback a été appelé
      expect(onPositionReceived).toHaveBeenCalledWith({
        latitude: 48.8566,
        longitude: 2.3522,
      })
    })

    it('should show loading state during geolocation', async () => {
      const user = userEvent.setup()

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        setTimeout(() => {
          success({
            coords: {
              latitude: 48.8566,
              longitude: 2.3522,
              accuracy: 10,
            },
            timestamp: Date.now(),
          })
        }, 100)
      })

      render(<GeolocationButton />)

      const button = screen.getByText(/Me localiser/i)
      await user.click(button)

      // Vérifier que l'état de chargement est affiché
      expect(screen.getByText(/Localisation en cours/i)).toBeInTheDocument()

      // Attendre la fin du chargement
      await waitFor(() => {
        expect(
          screen.queryByText(/Localisation en cours/i)
        ).not.toBeInTheDocument()
      })
    })
  })

  describe('Error handling flow', () => {
    it('should display error when permission is denied', async () => {
      const mockError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied geolocation',
      }

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success, error) => {
          error(mockError)
        }
      )

      render(<GeolocationButton />)

      const button = screen.getByText(/Me localiser/i)
      await userEvent.click(button)

      // Attendre que l'erreur soit affichée
      await waitFor(() => {
        expect(
          screen.getByText(/Veuillez autoriser la géolocalisation/i)
        ).toBeInTheDocument()
      })

      // Vérifier que le titre d'erreur est présent
      expect(
        screen.getByText(/Erreur de géolocalisation/i)
      ).toBeInTheDocument()

      // Vérifier que les conseils sont affichés
      expect(
        screen.getByText(/Comment activer la géolocalisation/i)
      ).toBeInTheDocument()
    })

    it('should display error on timeout', async () => {
      const mockError = {
        code: 3, // TIMEOUT
        message: 'Timeout',
      }

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success, error) => {
          error(mockError)
        }
      )

      render(<GeolocationButton />)

      const button = screen.getByText(/Me localiser/i)
      await userEvent.click(button)

      await waitFor(() => {
        expect(
          screen.getByText(/prend trop de temps/i)
        ).toBeInTheDocument()
      })
    })

    it('should allow retry after error', async () => {
      const mockError = {
        code: 3,
        message: 'Timeout',
      }

      let callCount = 0
      mockGeolocation.getCurrentPosition.mockImplementation((success, error) => {
        callCount++
        if (callCount === 1) {
          error?.(mockError)
        } else {
          success({
            coords: {
              latitude: 48.8566,
              longitude: 2.3522,
              accuracy: 10,
            },
            timestamp: Date.now(),
          })
        }
      })

      render(<GeolocationButton />)

      // Première tentative (échec)
      const button = screen.getByText(/Me localiser/i)
      await userEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText(/Réessayer/i)).toBeInTheDocument()
      })

      // Cliquer sur retry
      const retryButton = screen.getByText(/Réessayer/i)
      await userEvent.click(retryButton)

      // Vérifier que la position est finalement affichée
      await waitFor(() => {
        expect(screen.getByText(/Position GPS détectée/i)).toBeInTheDocument()
      })
    })
  })

  describe('Refresh functionality', () => {
    it('should allow refreshing position', async () => {
      const mockPosition1 = {
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 10,
        },
        timestamp: Date.now(),
      }

      const mockPosition2 = {
        coords: {
          latitude: 48.8600,
          longitude: 2.3550,
          accuracy: 15,
        },
        timestamp: Date.now(),
      }

      let callCount = 0
      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        callCount++
        success(callCount === 1 ? mockPosition1 : mockPosition2)
      })

      render(<GeolocationButton showDetails={true} />)

      // Première localisation
      const button = screen.getByText(/Me localiser/i)
      await userEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText(/48.856600/i)).toBeInTheDocument()
      })

      // Actualiser la position
      const refreshButton = screen.getByText(/Actualiser ma position/i)
      await userEvent.click(refreshButton)

      // Vérifier que la nouvelle position est affichée
      await waitFor(() => {
        expect(screen.getByText(/48.860000/i)).toBeInTheDocument()
      })
    })
  })

  describe('Unavailable geolocation', () => {
    it('should display message when geolocation is not available', () => {
      // @ts-expect-error - Mock pour tests
      delete global.navigator.geolocation

      render(<GeolocationButton />)

      expect(
        screen.getByText(/ne supporte pas la géolocalisation/i)
      ).toBeInTheDocument()
    })
  })

  describe('Auto-trigger functionality', () => {
    it('should trigger geolocation automatically when autoTrigger is true', async () => {
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

      render(<GeolocationButton autoTrigger={true} showDetails={true} />)

      // Vérifier que la géolocalisation est déclenchée automatiquement
      await waitFor(() => {
        expect(screen.getByText(/Position GPS détectée/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accuracy validation', () => {
    it('should reject position with low accuracy', async () => {
      const mockPosition = {
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 150, // Précision trop basse
        },
        timestamp: Date.now(),
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      render(<GeolocationButton maxAccuracy={100} />)

      const button = screen.getByText(/Me localiser/i)
      await userEvent.click(button)

      await waitFor(() => {
        expect(
          screen.getByText(/Précision GPS insuffisante/i)
        ).toBeInTheDocument()
      })
    })

    it('should accept position with good accuracy', async () => {
      const mockPosition = {
        coords: {
          latitude: 48.8566,
          longitude: 2.3522,
          accuracy: 50, // Bonne précision
        },
        timestamp: Date.now(),
      }

      mockGeolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition)
      })

      render(<GeolocationButton maxAccuracy={100} showDetails={true} />)

      const button = screen.getByText(/Me localiser/i)
      await userEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText(/Position GPS détectée/i)).toBeInTheDocument()
      })
    })
  })

  describe('Compact mode', () => {
    it('should display compact version when showDetails is false', async () => {
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

      render(<GeolocationButton showDetails={false} />)

      const button = screen.getByText(/Me localiser/i)
      await userEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText(/Position GPS OK/i)).toBeInTheDocument()
      })

      // Vérifier que les détails ne sont pas affichés
      expect(screen.queryByText(/Latitude/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Longitude/i)).not.toBeInTheDocument()
    })
  })
})
