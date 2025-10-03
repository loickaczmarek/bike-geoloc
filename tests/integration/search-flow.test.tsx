/**
 * ========================================
 * SEARCH FLOW - TESTS D'INTÉGRATION
 * ========================================
 * Tests d'intégration du flux complet de recherche de stations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useNearbyStations } from '@/hooks/useNearbyStations'

// Mock de fetch pour les appels API
global.fetch = vi.fn()

const mockNetworksResponse = {
  networks: [
    {
      id: 'velib',
      name: 'Vélib\' Métropole',
      href: '/v2/networks/velib',
      location: {
        city: 'Paris',
        country: 'FR',
        latitude: 48.8566,
        longitude: 2.3522,
      },
    },
    {
      id: 'citibike-nyc',
      name: 'Citi Bike',
      href: '/v2/networks/citibike-nyc',
      location: {
        city: 'New York',
        country: 'US',
        latitude: 40.7128,
        longitude: -74.0060,
      },
    },
  ],
}

const mockNetworkDetailsResponse = {
  network: {
    id: 'velib',
    name: 'Vélib\' Métropole',
    href: '/v2/networks/velib',
    location: {
      city: 'Paris',
      country: 'FR',
      latitude: 48.8566,
      longitude: 2.3522,
    },
    stations: [
      {
        id: '1',
        name: 'Station 1 - Proche',
        latitude: 48.8570, // ~44m de distance
        longitude: 2.3525,
        free_bikes: 5,
        empty_slots: 10,
        timestamp: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Station 2 - Loin',
        latitude: 48.8700, // ~1.5km de distance
        longitude: 2.3600,
        free_bikes: 3,
        empty_slots: 8,
        timestamp: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Station 3 - Moyenne distance',
        latitude: 48.8580, // ~150m de distance
        longitude: 2.3530,
        free_bikes: 8,
        empty_slots: 5,
        timestamp: new Date().toISOString(),
      },
      {
        id: '4',
        name: 'Station 4 - Vide',
        latitude: 48.8572,
        longitude: 2.3527,
        free_bikes: 0, // Pas de vélos
        empty_slots: 15,
        timestamp: new Date().toISOString(),
      },
    ],
  },
}

describe('Search Flow - Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup fetch mock
    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url) => {
      if (url.includes('/networks') && !url.includes('velib')) {
        // Liste des réseaux
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockNetworksResponse,
        } as Response)
      }

      if (url.includes('/networks/velib')) {
        // Détails du réseau Vélib
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockNetworkDetailsResponse,
        } as Response)
      }

      return Promise.reject(new Error('Unknown URL'))
    })
  })

  describe('Complete search flow', () => {
    it('should find nearest network and filter stations', async () => {
      const userLocation = {
        latitude: 48.8566, // Position Paris centre
        longitude: 2.3522,
      }

      const { result } = renderHook(() =>
        useNearbyStations({
          userLocation,
          maxDistance: 200, // 200m radius
          maxStations: 10,
          immediate: true,
        })
      )

      // Vérifier l'état initial
      expect(result.current.isLoading).toBe(true)
      expect(result.current.stations).toEqual([])

      // Attendre la fin du chargement
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false)
        },
        { timeout: 5000 }
      )

      // Vérifier les résultats
      expect(result.current.error).toBeNull()
      expect(result.current.network).toEqual({
        id: 'velib',
        name: 'Vélib\' Métropole',
      })

      // Vérifier que les stations sont filtrées et triées
      const { stations } = result.current

      // Station 4 exclue (pas de vélos)
      // Station 2 exclue (trop loin > 200m)
      // Reste: Station 1 (~44m) et Station 3 (~150m)
      expect(stations.length).toBe(2)

      // Vérifier le tri par distance
      expect(stations[0]?.name).toBe('Station 1 - Proche')
      expect(stations[1]?.name).toBe('Station 3 - Moyenne distance')

      // Vérifier que toutes ont des vélos
      stations.forEach((station) => {
        expect(station.free_bikes).toBeGreaterThan(0)
      })

      // Vérifier que toutes sont dans le rayon
      stations.forEach((station) => {
        expect(station.distance).toBeLessThanOrEqual(200)
      })
    })

    it('should call onSuccess callback with result', async () => {
      const onSuccess = vi.fn()
      const userLocation = {
        latitude: 48.8566,
        longitude: 2.3522,
      }

      const { result } = renderHook(() =>
        useNearbyStations({
          userLocation,
          immediate: true,
          onSuccess,
        })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(onSuccess).toHaveBeenCalledTimes(1)
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          networkId: 'velib',
          networkName: 'Vélib\' Métropole',
          stations: expect.any(Array),
          userLocation,
        })
      )
    })

    it('should handle API errors', async () => {
      // Mock fetch pour retourner une erreur
      ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(() =>
        Promise.resolve({
          ok: false,
          status: 500,
        } as Response)
      )

      const onError = vi.fn()
      const userLocation = {
        latitude: 48.8566,
        longitude: 2.3522,
      }

      const { result } = renderHook(() =>
        useNearbyStations({
          userLocation,
          immediate: true,
          onError,
        })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.error).not.toBeNull()
      expect(result.current.stations).toEqual([])
      expect(onError).toHaveBeenCalled()
    })

    it('should refetch data when refetch is called', async () => {
      const userLocation = {
        latitude: 48.8566,
        longitude: 2.3522,
      }

      const { result } = renderHook(() =>
        useNearbyStations({
          userLocation,
          immediate: true,
        })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const firstStations = result.current.stations

      // Refetch
      result.current.refetch()

      // Vérifier que le loading est actif
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Attendre la fin
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Les résultats devraient être identiques
      expect(result.current.stations.length).toBe(firstStations.length)
    })

    it('should reset state correctly', async () => {
      const userLocation = {
        latitude: 48.8566,
        longitude: 2.3522,
      }

      const { result } = renderHook(() =>
        useNearbyStations({
          userLocation,
          immediate: true,
        })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.stations.length).toBeGreaterThan(0)

      // Reset
      result.current.reset()

      // Vérifier que tout est réinitialisé
      expect(result.current.stations).toEqual([])
      expect(result.current.network).toBeNull()
      expect(result.current.result).toBeNull()
      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('Edge cases', () => {
    it('should handle no stations in range', async () => {
      const userLocation = {
        latitude: 48.8566,
        longitude: 2.3522,
      }

      const { result } = renderHook(() =>
        useNearbyStations({
          userLocation,
          maxDistance: 1, // 1m seulement - très restrictif
          immediate: true,
        })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.stations).toEqual([])
    })

    it('should not search without user location', async () => {
      const { result } = renderHook(() =>
        useNearbyStations({
          userLocation: null,
          immediate: true,
        })
      )

      // Ne devrait pas charger sans location
      expect(result.current.isLoading).toBe(false)
      expect(result.current.stations).toEqual([])
    })

    it('should handle manual search with validation error', async () => {
      const onError = vi.fn()

      const { result } = renderHook(() =>
        useNearbyStations({
          userLocation: null, // Pas de location
          onError,
        })
      )

      // Essayer de chercher manuellement
      await result.current.search()

      // Devrait avoir une erreur de validation
      expect(result.current.error).not.toBeNull()
      expect(result.current.error?.type).toBe('VALIDATION')
      expect(onError).toHaveBeenCalled()
    })
  })

  describe('Limit and sorting', () => {
    it('should respect maxStations limit', async () => {
      const userLocation = {
        latitude: 48.8566,
        longitude: 2.3522,
      }

      const { result } = renderHook(() =>
        useNearbyStations({
          userLocation,
          maxDistance: 2000, // Large radius
          maxStations: 2, // Limiter à 2
          immediate: true,
        })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Maximum 2 stations
      expect(result.current.stations.length).toBeLessThanOrEqual(2)
    })

    it('should sort stations by distance', async () => {
      const userLocation = {
        latitude: 48.8566,
        longitude: 2.3522,
      }

      const { result } = renderHook(() =>
        useNearbyStations({
          userLocation,
          maxDistance: 2000,
          immediate: true,
        })
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const { stations } = result.current

      // Vérifier le tri croissant
      for (let i = 0; i < stations.length - 1; i++) {
        expect(stations[i]!.distance).toBeLessThanOrEqual(
          stations[i + 1]!.distance
        )
      }
    })
  })
})
