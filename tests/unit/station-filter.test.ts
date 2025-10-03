/**
 * ========================================
 * STATION FILTER - TESTS UNITAIRES
 * ========================================
 */

import { describe, it, expect } from 'vitest'
import {
  filterStationsByDistance,
  filterStationsWithBikes,
  filterActiveStations,
  filterStations,
  enrichStationWithDistance,
} from '@/lib/station-filter'
import type { Station } from '@/types/citybikes.types'

const mockStations: Station[] = [
  {
    id: '1',
    name: 'Station 1',
    latitude: 48.8566,
    longitude: 2.3522,
    free_bikes: 5,
    empty_slots: 10,
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Station 2',
    latitude: 48.8600,
    longitude: 2.3550,
    free_bikes: 0,
    empty_slots: 15,
    timestamp: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Station 3',
    latitude: 48.8700,
    longitude: 2.3600,
    free_bikes: 3,
    empty_slots: 8,
    timestamp: new Date().toISOString(),
    extra: { status: 'closed' },
  },
]

describe('Station Filter', () => {
  describe('enrichStationWithDistance', () => {
    it('should add distance property to station', () => {
      const userLocation = { latitude: 48.8566, longitude: 2.3522 }
      const enriched = enrichStationWithDistance(mockStations[0]!, userLocation)

      expect(enriched).toHaveProperty('distance')
      expect(typeof enriched.distance).toBe('number')
      expect(enriched.distance).toBe(0) // Même position
    })
  })

  describe('filterStationsByDistance', () => {
    it('should filter stations within max distance', () => {
      const userLocation = { latitude: 48.8566, longitude: 2.3522 }
      const filtered = filterStationsByDistance(
        mockStations,
        userLocation,
        500 // 500m radius
      )

      expect(filtered.length).toBeGreaterThan(0)
      filtered.forEach((station) => {
        expect(station.distance).toBeLessThanOrEqual(500)
      })
    })

    it('should return empty array if no stations in range', () => {
      const userLocation = { latitude: 48.8566, longitude: 2.3522 }
      const filtered = filterStationsByDistance(
        mockStations,
        userLocation,
        1 // 1m radius - très petit
      )

      expect(filtered.length).toBe(1) // Seulement la station exactement à la même position
    })

    it('should throw error for invalid userLocation', () => {
      expect(() => {
        filterStationsByDistance(
          mockStations,
          // @ts-expect-error - Test validation
          { latitude: 'invalid' },
          200
        )
      }).toThrow('Invalid userLocation')
    })

    it('should throw error for negative maxDistance', () => {
      const userLocation = { latitude: 48.8566, longitude: 2.3522 }
      expect(() => {
        filterStationsByDistance(mockStations, userLocation, -100)
      }).toThrow('Invalid maxDistance')
    })
  })

  describe('filterStationsWithBikes', () => {
    it('should filter stations with free_bikes > 0', () => {
      const filtered = filterStationsWithBikes(mockStations)

      expect(filtered.length).toBe(2) // Stations 1 et 3
      filtered.forEach((station) => {
        expect(station.free_bikes).toBeGreaterThan(0)
      })
    })

    it('should return empty array if no bikes available', () => {
      const noBikesStations: Station[] = [
        {
          id: '1',
          name: 'Empty Station',
          latitude: 48.8566,
          longitude: 2.3522,
          free_bikes: 0,
          empty_slots: 10,
          timestamp: new Date().toISOString(),
        },
      ]

      const filtered = filterStationsWithBikes(noBikesStations)
      expect(filtered).toEqual([])
    })
  })

  describe('filterActiveStations', () => {
    it('should filter out closed stations', () => {
      const filtered = filterActiveStations(mockStations)

      expect(filtered.length).toBe(2) // Stations 1 et 2 (3 est closed)
      filtered.forEach((station) => {
        if (station.extra?.status) {
          expect(station.extra.status.toLowerCase()).not.toBe('closed')
        }
      })
    })

    it('should keep stations without status field', () => {
      const stationsWithoutStatus: Station[] = [
        {
          id: '1',
          name: 'Station',
          latitude: 48.8566,
          longitude: 2.3522,
          free_bikes: 5,
          empty_slots: 10,
          timestamp: new Date().toISOString(),
        },
      ]

      const filtered = filterActiveStations(stationsWithoutStatus)
      expect(filtered.length).toBe(1)
    })
  })

  describe('filterStations (pipeline complet)', () => {
    it('should apply all filters correctly', () => {
      const userLocation = { latitude: 48.8566, longitude: 2.3522 }

      const filtered = filterStations(mockStations, userLocation, {
        maxDistance: 5000, // Large radius
        requireBikes: true,
        onlyActive: true,
      })

      // Devrait exclure la station 2 (no bikes) et 3 (closed)
      expect(filtered.length).toBe(1)
      expect(filtered[0]?.id).toBe('1')
      expect(filtered[0]?.free_bikes).toBeGreaterThan(0)
    })

    it('should return all stations when filters disabled', () => {
      const userLocation = { latitude: 48.8566, longitude: 2.3522 }

      const filtered = filterStations(mockStations, userLocation, {
        maxDistance: 10000,
        requireBikes: false,
        onlyActive: false,
      })

      expect(filtered.length).toBe(mockStations.length)
    })

    it('should handle empty station array', () => {
      const userLocation = { latitude: 48.8566, longitude: 2.3522 }
      const filtered = filterStations([], userLocation)

      expect(filtered).toEqual([])
    })
  })
})
