/**
 * ========================================
 * STATION PRIORITY - TESTS DOMAINE
 * ========================================
 * Tests du Value Object StationPriority
 * Vérifie les règles métier de priorisation
 */

import { describe, it, expect } from 'vitest'
import { StationPriority, StationPriorityLevel, BikeAvailability } from '@/lib/domain/StationPriority'
import type { StationWithDistance } from '@/types/station.types'

describe('StationPriority - Domain Model', () => {
  describe('Factory method - fromStation', () => {
    it('should create OPTIMAL priority for very close station with many bikes', () => {
      const station: StationWithDistance = {
        id: '1',
        name: 'Station Test',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 8,
        empty_slots: 5,
        distance: 40, // < 50m
        timestamp: new Date().toISOString(),
      }

      const priority = StationPriority.fromStation(station)

      expect(priority.level).toBe(StationPriorityLevel.OPTIMAL)
      expect(priority.isVeryClose).toBe(true)
      expect(priority.hasGoodAvailability).toBe(true)
      expect(priority.isOptimal()).toBe(true)
    })

    it('should create WARNING priority when few bikes (≤2)', () => {
      const station: StationWithDistance = {
        id: '1',
        name: 'Station Test',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 2,
        empty_slots: 15,
        distance: 30, // Même très proche
        timestamp: new Date().toISOString(),
      }

      const priority = StationPriority.fromStation(station)

      expect(priority.level).toBe(StationPriorityLevel.WARNING)
      expect(priority.needsWarning()).toBe(true)
      expect(priority.bikeAvailability).toBe(BikeAvailability.LOW)
    })

    it('should create WARNING priority for critical bikes (0-1)', () => {
      const station: StationWithDistance = {
        id: '1',
        name: 'Station Test',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 1,
        empty_slots: 20,
        distance: 50,
        timestamp: new Date().toISOString(),
      }

      const priority = StationPriority.fromStation(station)

      expect(priority.level).toBe(StationPriorityLevel.WARNING)
      expect(priority.bikeAvailability).toBe(BikeAvailability.CRITICAL)
    })

    it('should create GOOD priority for close station (< 100m)', () => {
      const station: StationWithDistance = {
        id: '1',
        name: 'Station Test',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 4,
        empty_slots: 10,
        distance: 80, // < 100m mais pas très proche
        timestamp: new Date().toISOString(),
      }

      const priority = StationPriority.fromStation(station)

      expect(priority.level).toBe(StationPriorityLevel.GOOD)
      expect(priority.isVeryClose).toBe(false)
    })

    it('should create GOOD priority for far station with many bikes', () => {
      const station: StationWithDistance = {
        id: '1',
        name: 'Station Test',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 12,
        empty_slots: 5,
        distance: 150, // Loin mais beaucoup de vélos
        timestamp: new Date().toISOString(),
      }

      const priority = StationPriority.fromStation(station)

      expect(priority.level).toBe(StationPriorityLevel.GOOD)
      expect(priority.hasGoodAvailability).toBe(true)
      expect(priority.bikeAvailability).toBe(BikeAvailability.ABUNDANT)
    })

    it('should create NORMAL priority for standard case', () => {
      const station: StationWithDistance = {
        id: '1',
        name: 'Station Test',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 4,
        empty_slots: 10,
        distance: 150, // Ni proche ni loin
        timestamp: new Date().toISOString(),
      }

      const priority = StationPriority.fromStation(station)

      expect(priority.level).toBe(StationPriorityLevel.NORMAL)
    })
  })

  describe('Recommendation Score', () => {
    it('should give highest score to optimal station', () => {
      const optimal: StationWithDistance = {
        id: '1',
        name: 'Optimal',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 15,
        empty_slots: 5,
        distance: 30,
        timestamp: new Date().toISOString(),
      }

      const priority = StationPriority.fromStation(optimal)
      expect(priority.recommendationScore).toBeGreaterThan(90)
    })

    it('should give low score to far station with few bikes', () => {
      const poor: StationWithDistance = {
        id: '1',
        name: 'Poor',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 1,
        empty_slots: 20,
        distance: 250,
        timestamp: new Date().toISOString(),
      }

      const priority = StationPriority.fromStation(poor)
      expect(priority.recommendationScore).toBeLessThan(40)
    })

    it('should score distance higher than availability for very close stations', () => {
      const closeWithFewBikes: StationWithDistance = {
        id: '1',
        name: 'Close Few Bikes',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 3,
        empty_slots: 10,
        distance: 30,
        timestamp: new Date().toISOString(),
      }

      const farWithManyBikes: StationWithDistance = {
        id: '2',
        name: 'Far Many Bikes',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 15,
        empty_slots: 5,
        distance: 180,
        timestamp: new Date().toISOString(),
      }

      const closeScore = StationPriority.fromStation(closeWithFewBikes).recommendationScore
      const farScore = StationPriority.fromStation(farWithManyBikes).recommendationScore

      // La station proche devrait avoir un meilleur score
      expect(closeScore).toBeGreaterThan(farScore)
    })
  })

  describe('Bike Availability Categories', () => {
    it('should categorize CRITICAL availability (0-1 bikes)', () => {
      const station: StationWithDistance = {
        id: '1',
        name: 'Station',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 0,
        empty_slots: 15,
        distance: 50,
        timestamp: new Date().toISOString(),
      }

      const priority = StationPriority.fromStation(station)
      expect(priority.bikeAvailability).toBe(BikeAvailability.CRITICAL)
    })

    it('should categorize LOW availability (2 bikes)', () => {
      const station: StationWithDistance = {
        id: '1',
        name: 'Station',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 2,
        empty_slots: 15,
        distance: 50,
        timestamp: new Date().toISOString(),
      }

      const priority = StationPriority.fromStation(station)
      expect(priority.bikeAvailability).toBe(BikeAvailability.LOW)
    })

    it('should categorize MEDIUM availability (3-5 bikes)', () => {
      const station: StationWithDistance = {
        id: '1',
        name: 'Station',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 4,
        empty_slots: 10,
        distance: 50,
        timestamp: new Date().toISOString(),
      }

      const priority = StationPriority.fromStation(station)
      expect(priority.bikeAvailability).toBe(BikeAvailability.MEDIUM)
    })

    it('should categorize HIGH availability (6-10 bikes)', () => {
      const station: StationWithDistance = {
        id: '1',
        name: 'Station',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 8,
        empty_slots: 10,
        distance: 50,
        timestamp: new Date().toISOString(),
      }

      const priority = StationPriority.fromStation(station)
      expect(priority.bikeAvailability).toBe(BikeAvailability.HIGH)
    })

    it('should categorize ABUNDANT availability (>10 bikes)', () => {
      const station: StationWithDistance = {
        id: '1',
        name: 'Station',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 15,
        empty_slots: 5,
        distance: 50,
        timestamp: new Date().toISOString(),
      }

      const priority = StationPriority.fromStation(station)
      expect(priority.bikeAvailability).toBe(BikeAvailability.ABUNDANT)
    })
  })

  describe('Visual Indicators', () => {
    it('should return badge text only for OPTIMAL and WARNING levels', () => {
      const optimal: StationWithDistance = {
        id: '1',
        name: 'Optimal',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 10,
        empty_slots: 5,
        distance: 30,
        timestamp: new Date().toISOString(),
      }

      const warning: StationWithDistance = {
        id: '2',
        name: 'Warning',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 1,
        empty_slots: 15,
        distance: 50,
        timestamp: new Date().toISOString(),
      }

      const normal: StationWithDistance = {
        id: '3',
        name: 'Normal',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 4,
        empty_slots: 10,
        distance: 150,
        timestamp: new Date().toISOString(),
      }

      expect(StationPriority.fromStation(optimal).getBadgeText()).toBe('Choix optimal')
      expect(StationPriority.fromStation(warning).getBadgeText()).toBe('Peu de vélos')
      expect(StationPriority.fromStation(normal).getBadgeText()).toBeNull()
    })

    it('should return correct colors for bike count', () => {
      const critical: StationWithDistance = {
        id: '1',
        name: 'Critical',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 0,
        empty_slots: 15,
        distance: 50,
        timestamp: new Date().toISOString(),
      }

      const abundant: StationWithDistance = {
        id: '2',
        name: 'Abundant',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 15,
        empty_slots: 5,
        distance: 50,
        timestamp: new Date().toISOString(),
      }

      const criticalPriority = StationPriority.fromStation(critical)
      const abundantPriority = StationPriority.fromStation(abundant)

      expect(criticalPriority.getBikeCountColor()).toContain('error')
      expect(abundantPriority.getBikeCountColor()).toContain('success')
    })
  })

  describe('Value Object Equality', () => {
    it('should be equal when all properties match', () => {
      const station: StationWithDistance = {
        id: '1',
        name: 'Station',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 8,
        empty_slots: 5,
        distance: 40,
        timestamp: new Date().toISOString(),
      }

      const priority1 = StationPriority.fromStation(station)
      const priority2 = StationPriority.fromStation(station)

      expect(priority1.equals(priority2)).toBe(true)
    })

    it('should not be equal when properties differ', () => {
      const station1: StationWithDistance = {
        id: '1',
        name: 'Station',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 8,
        empty_slots: 5,
        distance: 40,
        timestamp: new Date().toISOString(),
      }

      const station2: StationWithDistance = {
        ...station1,
        free_bikes: 2, // Différent
      }

      const priority1 = StationPriority.fromStation(station1)
      const priority2 = StationPriority.fromStation(station2)

      expect(priority1.equals(priority2)).toBe(false)
    })
  })

  describe('Domain Invariants', () => {
    it('should ensure recommendation score is between 0 and 100', () => {
      const station: StationWithDistance = {
        id: '1',
        name: 'Station',
        latitude: 48.8566,
        longitude: 2.3522,
        free_bikes: 8,
        empty_slots: 5,
        distance: 50,
        timestamp: new Date().toISOString(),
      }

      const priority = StationPriority.fromStation(station)

      expect(priority.recommendationScore).toBeGreaterThanOrEqual(0)
      expect(priority.recommendationScore).toBeLessThanOrEqual(100)
    })
  })
})
