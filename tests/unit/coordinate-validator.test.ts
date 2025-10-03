/**
 * ========================================
 * COORDINATE VALIDATOR - TESTS
 * ========================================
 * Tests pour la validation des coordonnées GPS
 */

import { describe, it, expect } from 'vitest'
import {
  validateCoordinates,
  isValidCoordinates,
  areCoordinatesEqual,
  normalizeLongitude,
  isWithinBounds,
} from '@/lib/validators/coordinate-validator'
import type { Coordinates } from '@/types/geolocation.types'

describe('Coordinate Validator', () => {
  describe('validateCoordinates', () => {
    it('should accept valid coordinates', () => {
      const validCoords: Coordinates = { latitude: 48.8566, longitude: 2.3522 }

      expect(() => validateCoordinates(validCoords)).not.toThrow()
    })

    it('should throw on null/undefined coordinates', () => {
      expect(() => validateCoordinates(null as any)).toThrow()
      expect(() => validateCoordinates(undefined as any)).toThrow()
    })

    it('should throw on invalid latitude (not a number)', () => {
      const invalid = { latitude: 'invalid' as any, longitude: 2.3522 }

      expect(() => validateCoordinates(invalid)).toThrow(/latitude/i)
    })

    it('should throw on latitude > 90', () => {
      const invalid = { latitude: 91, longitude: 2.3522 }

      expect(() => validateCoordinates(invalid)).toThrow(/latitude/)
    })

    it('should throw on latitude < -90', () => {
      const invalid = { latitude: -91, longitude: 2.3522 }

      expect(() => validateCoordinates(invalid)).toThrow(/latitude/)
    })

    it('should throw on invalid longitude (not a number)', () => {
      const invalid = { latitude: 48.8566, longitude: NaN }

      expect(() => validateCoordinates(invalid)).toThrow(/longitude/i)
    })

    it('should throw on longitude > 180', () => {
      const invalid = { latitude: 48.8566, longitude: 181 }

      expect(() => validateCoordinates(invalid)).toThrow(/longitude/)
    })

    it('should throw on longitude < -180', () => {
      const invalid = { latitude: 48.8566, longitude: -181 }

      expect(() => validateCoordinates(invalid)).toThrow(/longitude/)
    })

    it('should accept boundary values', () => {
      expect(() => validateCoordinates({ latitude: 90, longitude: 180 })).not.toThrow()
      expect(() => validateCoordinates({ latitude: -90, longitude: -180 })).not.toThrow()
      expect(() => validateCoordinates({ latitude: 0, longitude: 0 })).not.toThrow()
    })
  })

  describe('isValidCoordinates', () => {
    it('should return true for valid coordinates', () => {
      expect(isValidCoordinates({ latitude: 48.8566, longitude: 2.3522 })).toBe(true)
    })

    it('should return false for invalid coordinates', () => {
      expect(isValidCoordinates({ latitude: 200, longitude: 2 })).toBe(false)
      expect(isValidCoordinates({ latitude: 48, longitude: 200 })).toBe(false)
      expect(isValidCoordinates(null as any)).toBe(false)
    })
  })

  describe('areCoordinatesEqual', () => {
    it('should return true for identical coordinates', () => {
      const a = { latitude: 48.8566, longitude: 2.3522 }
      const b = { latitude: 48.8566, longitude: 2.3522 }

      expect(areCoordinatesEqual(a, b)).toBe(true)
    })

    it('should return true for coordinates within epsilon', () => {
      const a = { latitude: 48.8566, longitude: 2.3522 }
      const b = { latitude: 48.8567, longitude: 2.3523 } // ~0.0001° diff

      expect(areCoordinatesEqual(a, b, 0.001)).toBe(true)
    })

    it('should return false for coordinates beyond epsilon', () => {
      const a = { latitude: 48.8566, longitude: 2.3522 }
      const b = { latitude: 48.8600, longitude: 2.3522 } // 0.0034° diff

      expect(areCoordinatesEqual(a, b, 0.001)).toBe(false)
    })

    it('should use default epsilon of 0.0001', () => {
      const a = { latitude: 48.8566, longitude: 2.3522 }
      const b = { latitude: 48.85661, longitude: 2.35221 }

      expect(areCoordinatesEqual(a, b)).toBe(true)
    })
  })

  describe('normalizeLongitude', () => {
    it('should keep longitude in [-180, 180] unchanged', () => {
      expect(normalizeLongitude(0)).toBe(0)
      expect(normalizeLongitude(90)).toBe(90)
      expect(normalizeLongitude(-90)).toBe(-90)
      expect(normalizeLongitude(180)).toBe(180)
      expect(normalizeLongitude(-180)).toBe(-180)
    })

    it('should wrap longitude > 180', () => {
      expect(normalizeLongitude(190)).toBe(-170)
      expect(normalizeLongitude(360)).toBe(0)
      expect(normalizeLongitude(540)).toBe(180) // 540 - 360 = 180
    })

    it('should wrap longitude < -180', () => {
      expect(normalizeLongitude(-190)).toBe(170)
      expect(normalizeLongitude(-360)).toBe(0)
      expect(normalizeLongitude(-540)).toBe(-180) // -540 + 360 = -180
    })
  })

  describe('isWithinBounds', () => {
    it('should return true for coordinates within bounds', () => {
      const coords = { latitude: 48.8566, longitude: 2.3522 }
      const bounds = {
        north: 49,
        south: 48,
        east: 3,
        west: 2,
      }

      expect(isWithinBounds(coords, bounds)).toBe(true)
    })

    it('should return false for coordinates outside bounds (north)', () => {
      const coords = { latitude: 50, longitude: 2.3522 }
      const bounds = {
        north: 49,
        south: 48,
        east: 3,
        west: 2,
      }

      expect(isWithinBounds(coords, bounds)).toBe(false)
    })

    it('should return false for coordinates outside bounds (south)', () => {
      const coords = { latitude: 47, longitude: 2.3522 }
      const bounds = {
        north: 49,
        south: 48,
        east: 3,
        west: 2,
      }

      expect(isWithinBounds(coords, bounds)).toBe(false)
    })

    it('should return false for coordinates outside bounds (east)', () => {
      const coords = { latitude: 48.8566, longitude: 4 }
      const bounds = {
        north: 49,
        south: 48,
        east: 3,
        west: 2,
      }

      expect(isWithinBounds(coords, bounds)).toBe(false)
    })

    it('should return false for coordinates outside bounds (west)', () => {
      const coords = { latitude: 48.8566, longitude: 1 }
      const bounds = {
        north: 49,
        south: 48,
        east: 3,
        west: 2,
      }

      expect(isWithinBounds(coords, bounds)).toBe(false)
    })

    it('should include boundary coordinates', () => {
      const bounds = {
        north: 49,
        south: 48,
        east: 3,
        west: 2,
      }

      expect(isWithinBounds({ latitude: 49, longitude: 2.5 }, bounds)).toBe(true)
      expect(isWithinBounds({ latitude: 48, longitude: 2.5 }, bounds)).toBe(true)
      expect(isWithinBounds({ latitude: 48.5, longitude: 3 }, bounds)).toBe(true)
      expect(isWithinBounds({ latitude: 48.5, longitude: 2 }, bounds)).toBe(true)
    })
  })
})
