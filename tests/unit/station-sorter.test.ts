/**
 * ========================================
 * STATION SORTER - TESTS UNITAIRES
 * ========================================
 */

import { describe, it, expect } from 'vitest'
import {
  sortStationsByDistance,
  sortStationsByBikes,
  sortStationsBySlots,
  sortStationsByName,
  limitStations,
  sortAndLimit,
  sortStationsByPriority,
} from '@/lib/station-sorter'
import type { StationWithDistance } from '@/types/station.types'

const mockStations: StationWithDistance[] = [
  {
    id: '1',
    name: 'Alpha Station',
    latitude: 48.8566,
    longitude: 2.3522,
    free_bikes: 5,
    empty_slots: 10,
    distance: 100,
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Beta Station',
    latitude: 48.8600,
    longitude: 2.3550,
    free_bikes: 10,
    empty_slots: 5,
    distance: 50,
    timestamp: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Gamma Station',
    latitude: 48.8700,
    longitude: 2.3600,
    free_bikes: 2,
    empty_slots: 15,
    distance: 200,
    timestamp: new Date().toISOString(),
  },
]

describe('Station Sorter', () => {
  describe('sortStationsByDistance', () => {
    it('should sort by distance ascending', () => {
      const sorted = sortStationsByDistance(mockStations, 'asc')

      expect(sorted[0]?.distance).toBe(50)
      expect(sorted[1]?.distance).toBe(100)
      expect(sorted[2]?.distance).toBe(200)
    })

    it('should sort by distance descending', () => {
      const sorted = sortStationsByDistance(mockStations, 'desc')

      expect(sorted[0]?.distance).toBe(200)
      expect(sorted[1]?.distance).toBe(100)
      expect(sorted[2]?.distance).toBe(50)
    })

    it('should not modify original array', () => {
      const original = [...mockStations]
      sortStationsByDistance(mockStations, 'asc')

      expect(mockStations).toEqual(original)
    })
  })

  describe('sortStationsByBikes', () => {
    it('should sort by bikes descending (most bikes first)', () => {
      const sorted = sortStationsByBikes(mockStations, 'desc')

      expect(sorted[0]?.free_bikes).toBe(10)
      expect(sorted[1]?.free_bikes).toBe(5)
      expect(sorted[2]?.free_bikes).toBe(2)
    })

    it('should sort by bikes ascending', () => {
      const sorted = sortStationsByBikes(mockStations, 'asc')

      expect(sorted[0]?.free_bikes).toBe(2)
      expect(sorted[1]?.free_bikes).toBe(5)
      expect(sorted[2]?.free_bikes).toBe(10)
    })
  })

  describe('sortStationsBySlots', () => {
    it('should sort by empty slots descending', () => {
      const sorted = sortStationsBySlots(mockStations, 'desc')

      expect(sorted[0]?.empty_slots).toBe(15)
      expect(sorted[1]?.empty_slots).toBe(10)
      expect(sorted[2]?.empty_slots).toBe(5)
    })
  })

  describe('sortStationsByName', () => {
    it('should sort by name alphabetically', () => {
      const sorted = sortStationsByName(mockStations, 'asc')

      expect(sorted[0]?.name).toBe('Alpha Station')
      expect(sorted[1]?.name).toBe('Beta Station')
      expect(sorted[2]?.name).toBe('Gamma Station')
    })

    it('should sort by name reverse alphabetically', () => {
      const sorted = sortStationsByName(mockStations, 'desc')

      expect(sorted[0]?.name).toBe('Gamma Station')
      expect(sorted[1]?.name).toBe('Beta Station')
      expect(sorted[2]?.name).toBe('Alpha Station')
    })
  })

  describe('limitStations', () => {
    it('should limit to specified number', () => {
      const limited = limitStations(mockStations, 2)

      expect(limited.length).toBe(2)
    })

    it('should return all if limit > array length', () => {
      const limited = limitStations(mockStations, 100)

      expect(limited.length).toBe(mockStations.length)
    })

    it('should throw error for negative limit', () => {
      expect(() => {
        limitStations(mockStations, -1)
      }).toThrow('Invalid limit')
    })
  })

  describe('sortAndLimit', () => {
    it('should sort and limit correctly', () => {
      const result = sortAndLimit(mockStations, {
        sortBy: 'distance',
        order: 'asc',
        limit: 2,
      })

      expect(result.length).toBe(2)
      expect(result[0]?.distance).toBe(50)
      expect(result[1]?.distance).toBe(100)
    })

    it('should use default options', () => {
      const result = sortAndLimit(mockStations)

      expect(result.length).toBeLessThanOrEqual(10) // MAX_STATIONS
      expect(result[0]?.distance).toBe(50) // Sorted by distance asc
    })

    it('should handle empty array', () => {
      const result = sortAndLimit([])

      expect(result).toEqual([])
    })
  })

  describe('sortStationsByPriority', () => {
    it('should prioritize closer stations', () => {
      const sorted = sortStationsByPriority(mockStations)

      expect(sorted[0]?.id).toBe('2') // Distance 50m
      expect(sorted[1]?.id).toBe('1') // Distance 100m
      expect(sorted[2]?.id).toBe('3') // Distance 200m
    })

    it('should sort by bikes when distance is similar', () => {
      const similarDistanceStations: StationWithDistance[] = [
        {
          id: '1',
          name: 'Station 1',
          latitude: 48.8566,
          longitude: 2.3522,
          free_bikes: 2,
          empty_slots: 10,
          distance: 100,
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Station 2',
          latitude: 48.8600,
          longitude: 2.3550,
          free_bikes: 8,
          empty_slots: 5,
          distance: 105, // Distance similaire (±10m)
          timestamp: new Date().toISOString(),
        },
      ]

      const sorted = sortStationsByPriority(similarDistanceStations)

      // Station 2 devrait être première (plus de vélos)
      expect(sorted[0]?.id).toBe('2')
      expect(sorted[0]?.free_bikes).toBe(8)
    })
  })
})
