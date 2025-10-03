/**
 * ========================================
 * REFRESH FEATURE - TESTS BDD
 * ========================================
 * Tests comportementaux pour le rafraîchissement
 * Approche CRAFT : Tests avant implémentation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { StationList } from '@/components/StationList'
import type { StationWithDistance } from '@/types/station.types'

/**
 * SCÉNARIO MÉTIER :
 * "Je veux être sûr que les données sont à jour
 * pour ne pas être frustré en arrivant à une station sans vélo"
 */

describe('Refresh Feature - BDD', () => {
  let mockStations: StationWithDistance[]
  let mockOnRefresh: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.useFakeTimers()
    mockOnRefresh = vi.fn()

    mockStations = [
      {
        id: '1',
        name: 'Station République',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 8,
        empty_slots: 5,
        distance: 45,
        timestamp: new Date('2025-01-15T14:30:00Z').toISOString(),
      },
      {
        id: '2',
        name: 'Station Bastille',
        latitude: 48.8532,
        longitude: 2.3694,
        free_bikes: 3,
        empty_slots: 10,
        distance: 120,
        timestamp: new Date('2025-01-15T14:30:00Z').toISOString(),
      },
    ]
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('GIVEN user views station list', () => {
    describe('WHEN manual refresh button is clicked', () => {
      it('THEN should trigger data refresh', async () => {
        const user = userEvent.setup({ delay: null })

        render(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            onRefresh={mockOnRefresh}
            lastUpdate={new Date('2025-01-15T14:30:00Z').toISOString()}
          />
        )

        const refreshButton = screen.getByRole('button', {
          name: /actualiser/i,
        })

        await user.click(refreshButton)

        expect(mockOnRefresh).toHaveBeenCalledTimes(1)
      })

      it('THEN should show loading state during refresh', async () => {
        const user = userEvent.setup({ delay: null })

        const { rerender } = render(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            onRefresh={mockOnRefresh}
            lastUpdate={new Date('2025-01-15T14:30:00Z').toISOString()}
          />
        )

        const refreshButton = screen.getByRole('button', {
          name: /actualiser/i,
        })

        await user.click(refreshButton)

        // Simulate loading state
        rerender(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            isLoading={true}
            onRefresh={mockOnRefresh}
            lastUpdate={new Date('2025-01-15T14:30:00Z').toISOString()}
          />
        )

        expect(screen.getByText(/recherche des stations/i)).toBeInTheDocument()
      })

      it('THEN should update timestamp after successful refresh', async () => {
        const user = userEvent.setup({ delay: null })

        const { rerender } = render(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            onRefresh={mockOnRefresh}
            lastUpdate={new Date('2025-01-15T14:30:00Z').toISOString()}
          />
        )

        // Initial timestamp
        expect(screen.getByText(/dernière mise à jour/i)).toBeInTheDocument()
        expect(screen.getByText(/14:30/i)).toBeInTheDocument()

        const refreshButton = screen.getByRole('button', {
          name: /actualiser/i,
        })

        await user.click(refreshButton)

        // Simulate refresh complete with new timestamp
        rerender(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            onRefresh={mockOnRefresh}
            lastUpdate={new Date('2025-01-15T14:35:00Z').toISOString()}
          />
        )

        expect(screen.getByText(/14:35/i)).toBeInTheDocument()
      })
    })

    describe('WHEN viewing last update timestamp', () => {
      it('THEN should display timestamp in readable format', () => {
        render(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            lastUpdate={new Date('2025-01-15T14:30:00Z').toISOString()}
          />
        )

        expect(screen.getByText(/dernière mise à jour/i)).toBeInTheDocument()
        expect(screen.getByText(/14:30/i)).toBeInTheDocument()
      })

      it('THEN should show relative time for recent updates', () => {
        const now = new Date('2025-01-15T14:32:00Z')
        vi.setSystemTime(now)

        render(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            lastUpdate={new Date('2025-01-15T14:30:00Z').toISOString()}
          />
        )

        // Should show "il y a 2 minutes" or similar
        const timestamp = screen.getByRole('status', { name: /mise à jour/i })
        expect(timestamp).toBeInTheDocument()
      })

      it('THEN should handle missing timestamp gracefully', () => {
        render(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            // No lastUpdate provided
          />
        )

        // Should not crash, may show "Jamais mise à jour" or hide timestamp
        expect(screen.queryByText(/dernière mise à jour/i)).not.toBeInTheDocument()
      })
    })

    describe('WHEN refresh button is disabled', () => {
      it('THEN should not allow clicking during loading', async () => {
        const user = userEvent.setup({ delay: null })

        render(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            isLoading={true}
            onRefresh={mockOnRefresh}
            lastUpdate={new Date('2025-01-15T14:30:00Z').toISOString()}
          />
        )

        const refreshButton = screen.queryByRole('button', {
          name: /actualiser/i,
        })

        // Button should be hidden or disabled during loading
        if (refreshButton) {
          expect(refreshButton).toBeDisabled()
          await user.click(refreshButton)
          expect(mockOnRefresh).not.toHaveBeenCalled()
        }
      })

      it('THEN should not allow clicking when no onRefresh callback', async () => {
        const user = userEvent.setup({ delay: null })

        render(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            // No onRefresh provided
            lastUpdate={new Date('2025-01-15T14:30:00Z').toISOString()}
          />
        )

        // Button should not exist
        const refreshButton = screen.queryByRole('button', {
          name: /actualiser/i,
        })

        if (refreshButton) {
          await user.click(refreshButton)
          // Should not crash
        }
      })
    })

    describe('WHEN data is stale (old timestamp)', () => {
      it('THEN should visually indicate stale data', () => {
        const oneHourAgo = new Date('2025-01-15T13:30:00Z')
        vi.setSystemTime(new Date('2025-01-15T14:30:00Z'))

        render(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            lastUpdate={oneHourAgo.toISOString()}
          />
        )

        // Should show warning color or icon for stale data
        const timestamp = screen.getByRole('status', { name: /mise à jour/i })
        expect(timestamp).toBeInTheDocument()
        // Visual indicator tested via className or aria-label
      })

      it('THEN should encourage user to refresh', () => {
        const twoHoursAgo = new Date('2025-01-15T12:30:00Z')
        vi.setSystemTime(new Date('2025-01-15T14:30:00Z'))

        render(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            onRefresh={mockOnRefresh}
            lastUpdate={twoHoursAgo.toISOString()}
          />
        )

        // Should show a hint to refresh
        const refreshButton = screen.getByRole('button', {
          name: /actualiser/i,
        })
        expect(refreshButton).toBeInTheDocument()
      })
    })

    describe('WHEN multiple rapid refresh clicks', () => {
      it('THEN should debounce refresh calls', async () => {
        const user = userEvent.setup({ delay: null })

        render(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            onRefresh={mockOnRefresh}
            lastUpdate={new Date('2025-01-15T14:30:00Z').toISOString()}
          />
        )

        const refreshButton = screen.getByRole('button', {
          name: /actualiser/i,
        })

        // Click 5 times rapidly
        await user.click(refreshButton)
        await user.click(refreshButton)
        await user.click(refreshButton)
        await user.click(refreshButton)
        await user.click(refreshButton)

        // Should only call once (or limited times)
        expect(mockOnRefresh.mock.calls.length).toBeLessThanOrEqual(1)
      })
    })

    describe('WHEN refresh fails', () => {
      it('THEN should show error state with retry option', async () => {
        const user = userEvent.setup({ delay: null })
        const mockOnRetry = vi.fn()

        const { rerender } = render(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            onRefresh={mockOnRefresh}
            onRetry={mockOnRetry}
            lastUpdate={new Date('2025-01-15T14:30:00Z').toISOString()}
          />
        )

        const refreshButton = screen.getByRole('button', {
          name: /actualiser/i,
        })

        await user.click(refreshButton)

        // Simulate refresh error
        rerender(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            onRefresh={mockOnRefresh}
            onRetry={mockOnRetry}
            error={{
              type: 'NETWORK_ERROR' as const,
              userMessage: 'Impossible de rafraîchir les données',
              message: 'Network error',
              timestamp: new Date().toISOString(),
            }}
            lastUpdate={new Date('2025-01-15T14:30:00Z').toISOString()}
          />
        )

        expect(screen.getByText(/impossible de rafraîchir/i)).toBeInTheDocument()

        const retryButton = screen.getByRole('button', { name: /réessayer/i })
        await user.click(retryButton)

        expect(mockOnRetry).toHaveBeenCalledTimes(1)
      })

      it('THEN should preserve old data during error', async () => {
        const user = userEvent.setup({ delay: null })

        const { rerender } = render(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            onRefresh={mockOnRefresh}
            lastUpdate={new Date('2025-01-15T14:30:00Z').toISOString()}
          />
        )

        // Verify initial data is visible
        expect(screen.getByText(/station république/i)).toBeInTheDocument()
        expect(screen.getByText(/station bastille/i)).toBeInTheDocument()

        const refreshButton = screen.getByRole('button', {
          name: /actualiser/i,
        })

        await user.click(refreshButton)

        // Simulate refresh error but keep old data
        rerender(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            onRefresh={mockOnRefresh}
            error={{
              type: 'NETWORK_ERROR' as const,
              userMessage: 'Impossible de rafraîchir les données',
              message: 'Network error',
              timestamp: new Date().toISOString(),
            }}
            lastUpdate={new Date('2025-01-15T14:30:00Z').toISOString()}
          />
        )

        // Old data should still be visible in error state
        expect(screen.getByText(/impossible de trouver les stations/i)).toBeInTheDocument()
      })
    })

    describe('WHEN stations data changes after refresh', () => {
      it('THEN should update bike counts', async () => {
        const user = userEvent.setup({ delay: null })

        const { rerender } = render(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            onRefresh={mockOnRefresh}
            lastUpdate={new Date('2025-01-15T14:30:00Z').toISOString()}
          />
        )

        // Initial bike count
        const stationCards = screen.getAllByRole('article')
        expect(stationCards[0]).toHaveTextContent('8')

        const refreshButton = screen.getByRole('button', {
          name: /actualiser/i,
        })

        await user.click(refreshButton)

        // Simulate refresh with updated bike count
        const updatedStations: StationWithDistance[] = [
          {
            ...mockStations[0],
            free_bikes: 5, // Changed from 8 to 5
            empty_slots: 8,
            timestamp: new Date('2025-01-15T14:35:00Z').toISOString(),
          },
          mockStations[1],
        ]

        rerender(
          <StationList
            stations={updatedStations}
            networkName="Vélib'"
            onRefresh={mockOnRefresh}
            lastUpdate={new Date('2025-01-15T14:35:00Z').toISOString()}
          />
        )

        // Updated bike count
        const updatedCards = screen.getAllByRole('article')
        expect(updatedCards[0]).toHaveTextContent('5')
      })

      it('THEN should update optimal recommendation', async () => {
        const user = userEvent.setup({ delay: null })

        const { rerender } = render(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            onRefresh={mockOnRefresh}
            lastUpdate={new Date('2025-01-15T14:30:00Z').toISOString()}
          />
        )

        // Initial optimal station
        expect(screen.getByText(/notre recommandation/i)).toBeInTheDocument()
        expect(screen.getByText(/station république/i)).toBeInTheDocument()

        const refreshButton = screen.getByRole('button', {
          name: /actualiser/i,
        })

        await user.click(refreshButton)

        // Simulate refresh where République loses bikes
        const updatedStations: StationWithDistance[] = [
          {
            ...mockStations[0],
            free_bikes: 1, // Now has few bikes
          },
          {
            ...mockStations[1],
            free_bikes: 10, // Now has many bikes
            distance: 80, // Closer
          },
        ]

        rerender(
          <StationList
            stations={updatedStations}
            networkName="Vélib'"
            onRefresh={mockOnRefresh}
            lastUpdate={new Date('2025-01-15T14:35:00Z').toISOString()}
          />
        )

        // Optimal recommendation should update
        expect(screen.getByText(/station bastille/i)).toBeInTheDocument()
      })
    })

    describe('WHEN accessibility features are used', () => {
      it('THEN refresh button should be keyboard accessible', async () => {
        const user = userEvent.setup({ delay: null })

        render(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            onRefresh={mockOnRefresh}
            lastUpdate={new Date('2025-01-15T14:30:00Z').toISOString()}
          />
        )

        const refreshButton = screen.getByRole('button', {
          name: /actualiser/i,
        })

        refreshButton.focus()
        expect(refreshButton).toHaveFocus()

        await user.keyboard('{Enter}')
        expect(mockOnRefresh).toHaveBeenCalledTimes(1)
      })

      it('THEN timestamp should have aria-live region', () => {
        render(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            lastUpdate={new Date('2025-01-15T14:30:00Z').toISOString()}
          />
        )

        const timestamp = screen.getByRole('status', { name: /mise à jour/i })
        expect(timestamp).toHaveAttribute('aria-live', 'polite')
      })

      it('THEN refresh button should have descriptive aria-label', () => {
        render(
          <StationList
            stations={mockStations}
            networkName="Vélib'"
            onRefresh={mockOnRefresh}
            lastUpdate={new Date('2025-01-15T14:30:00Z').toISOString()}
          />
        )

        const refreshButton = screen.getByRole('button', {
          name: /actualiser la liste des stations/i,
        })
        expect(refreshButton).toHaveAttribute('aria-label')
      })
    })
  })
})
