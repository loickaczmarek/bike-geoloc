/**
 * ========================================
 * REFRESH STATE - TESTS DOMAINE
 * ========================================
 * Tests du Value Object RefreshState
 * Vérifie les règles métier de rafraîchissement
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { RefreshState, RefreshStatus, DataFreshness } from '@/lib/domain/RefreshState'

describe('RefreshState - Domain Model', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Factory methods', () => {
    it('should create initial state with UNKNOWN freshness', () => {
      const state = RefreshState.initial()

      expect(state.status).toBe(RefreshStatus.IDLE)
      expect(state.lastUpdate).toBeNull()
      expect(state.freshness).toBe(DataFreshness.UNKNOWN)
      expect(state.isRefreshing).toBe(false)
      expect(state.canRefresh).toBe(true)
      expect(state.timeSinceLastUpdate).toBeNull()
      expect(state.nextAutoRefresh).toBeNull()
    })

    it('should create state from recent timestamp (FRESH)', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const oneMinuteAgo = new Date('2025-01-15T14:29:00Z')
      const state = RefreshState.fromTimestamp(oneMinuteAgo)

      expect(state.status).toBe(RefreshStatus.IDLE)
      expect(state.lastUpdate).toEqual(oneMinuteAgo)
      expect(state.freshness).toBe(DataFreshness.FRESH)
      expect(state.timeSinceLastUpdate).toBe(60000) // 1 minute
      expect(state.isFresh()).toBe(true)
    })

    it('should create state from 5 minutes ago (RECENT)', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const fiveMinutesAgo = new Date('2025-01-15T14:25:00Z')
      const state = RefreshState.fromTimestamp(fiveMinutesAgo)

      expect(state.freshness).toBe(DataFreshness.RECENT)
      expect(state.timeSinceLastUpdate).toBe(5 * 60 * 1000)
      expect(state.isFresh()).toBe(false)
      expect(state.isStale()).toBe(false)
    })

    it('should create state from 15 minutes ago (STALE)', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const fifteenMinutesAgo = new Date('2025-01-15T14:15:00Z')
      const state = RefreshState.fromTimestamp(fifteenMinutesAgo)

      expect(state.freshness).toBe(DataFreshness.STALE)
      expect(state.timeSinceLastUpdate).toBe(15 * 60 * 1000)
      expect(state.isStale()).toBe(true)
      expect(state.shouldEncourageRefresh()).toBe(true)
    })

    it('should create refreshing state', () => {
      const lastUpdate = new Date('2025-01-15T14:25:00Z')
      const state = RefreshState.refreshing(lastUpdate)

      expect(state.status).toBe(RefreshStatus.REFRESHING)
      expect(state.isRefreshing).toBe(true)
      expect(state.canRefresh).toBe(false)
      expect(state.nextAutoRefresh).toBeNull()
    })

    it('should create success state with current timestamp', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const state = RefreshState.success()

      expect(state.status).toBe(RefreshStatus.SUCCESS)
      expect(state.lastUpdate).toEqual(now)
      expect(state.freshness).toBe(DataFreshness.FRESH)
      expect(state.isRefreshing).toBe(false)
    })

    it('should create error state preserving last update', () => {
      const lastUpdate = new Date('2025-01-15T14:20:00Z')
      const state = RefreshState.error(lastUpdate)

      expect(state.status).toBe(RefreshStatus.ERROR)
      expect(state.lastUpdate).toEqual(lastUpdate)
      expect(state.hasError()).toBe(true)
      expect(state.canRefresh).toBe(true) // Can retry
    })
  })

  describe('Auto-refresh calculation', () => {
    it('should calculate next auto-refresh correctly', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      // Last update 30 seconds ago, auto-refresh every 60 seconds
      const lastUpdate = new Date('2025-01-15T14:29:30Z')
      const state = RefreshState.fromTimestamp(lastUpdate, {
        autoRefreshInterval: 60000,
      })

      expect(state.nextAutoRefresh).toBe(30000) // 30 seconds remaining
    })

    it('should indicate auto-refresh is due when interval passed', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      // Last update 65 seconds ago, auto-refresh every 60 seconds
      const lastUpdate = new Date('2025-01-15T14:28:55Z')
      const state = RefreshState.fromTimestamp(lastUpdate, {
        autoRefreshInterval: 60000,
      })

      expect(state.nextAutoRefresh).toBe(0)
      expect(state.shouldAutoRefresh()).toBe(true)
    })

    it('should not auto-refresh while already refreshing', () => {
      const lastUpdate = new Date('2025-01-15T14:20:00Z')
      const state = RefreshState.refreshing(lastUpdate)

      expect(state.shouldAutoRefresh()).toBe(false)
    })

    it('should calculate auto-refresh progress percentage', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      // Last update 30 seconds ago, 60s interval = 50% progress
      const lastUpdate = new Date('2025-01-15T14:29:30Z')
      const state = RefreshState.fromTimestamp(lastUpdate)

      expect(state.getAutoRefreshProgress(60000)).toBe(50)
    })
  })

  describe('Debounce logic', () => {
    it('should allow refresh if never manually refreshed', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const lastUpdate = new Date('2025-01-15T14:29:00Z')
      const state = RefreshState.fromTimestamp(lastUpdate, {
        lastManualRefresh: null,
        minRefreshInterval: 1000,
      })

      expect(state.canRefresh).toBe(true)
    })

    it('should prevent refresh within debounce interval', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const lastUpdate = new Date('2025-01-15T14:29:00Z')
      const lastManualRefresh = new Date('2025-01-15T14:29:59.500Z') // 500ms ago

      const state = RefreshState.fromTimestamp(lastUpdate, {
        lastManualRefresh,
        minRefreshInterval: 1000, // 1 second
      })

      expect(state.canRefresh).toBe(false)
    })

    it('should allow refresh after debounce interval passed', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const lastUpdate = new Date('2025-01-15T14:29:00Z')
      const lastManualRefresh = new Date('2025-01-15T14:29:58.500Z') // 1.5 seconds ago

      const state = RefreshState.fromTimestamp(lastUpdate, {
        lastManualRefresh,
        minRefreshInterval: 1000, // 1 second
      })

      expect(state.canRefresh).toBe(true)
    })

    it('should not allow refresh while refreshing regardless of debounce', () => {
      const state = RefreshState.refreshing(new Date())

      expect(state.canRefresh).toBe(false)
    })
  })

  describe('Business predicates', () => {
    it('should identify fresh data correctly', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const oneMinuteAgo = new Date('2025-01-15T14:29:00Z')
      const state = RefreshState.fromTimestamp(oneMinuteAgo)

      expect(state.isFresh()).toBe(true)
      expect(state.isStale()).toBe(false)
      expect(state.shouldEncourageRefresh()).toBe(false)
    })

    it('should identify stale data correctly', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const fifteenMinutesAgo = new Date('2025-01-15T14:15:00Z')
      const state = RefreshState.fromTimestamp(fifteenMinutesAgo)

      expect(state.isFresh()).toBe(false)
      expect(state.isStale()).toBe(true)
      expect(state.shouldEncourageRefresh()).toBe(true)
    })

    it('should not encourage refresh while already refreshing', () => {
      const fifteenMinutesAgo = new Date('2025-01-15T14:15:00Z')
      const state = RefreshState.refreshing(fifteenMinutesAgo)

      expect(state.isStale()).toBe(true)
      expect(state.shouldEncourageRefresh()).toBe(false) // Refreshing
    })

    it('should detect error state', () => {
      const state = RefreshState.error(new Date())

      expect(state.hasError()).toBe(true)
    })
  })

  describe('UI Display methods', () => {
    it('should return freshness text for FRESH data', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const oneMinuteAgo = new Date('2025-01-15T14:29:00Z')
      const state = RefreshState.fromTimestamp(oneMinuteAgo)

      expect(state.getFreshnessText()).toBe('Données à jour')
      expect(state.getFreshnessColor()).toBe('text-success-dark')
      expect(state.getFreshnessBadge()).toBeNull()
    })

    it('should return freshness text for RECENT data', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const fiveMinutesAgo = new Date('2025-01-15T14:25:00Z')
      const state = RefreshState.fromTimestamp(fiveMinutesAgo)

      expect(state.getFreshnessText()).toBe('Données récentes')
      expect(state.getFreshnessColor()).toBe('text-gray-600')
      expect(state.getFreshnessBadge()).toBeNull()
    })

    it('should return freshness text and badge for STALE data', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const fifteenMinutesAgo = new Date('2025-01-15T14:15:00Z')
      const state = RefreshState.fromTimestamp(fifteenMinutesAgo)

      expect(state.getFreshnessText()).toBe('Données périmées')
      expect(state.getFreshnessColor()).toBe('text-warning-dark')
      expect(state.getFreshnessBadge()).toEqual({
        text: 'Périmé',
        color: 'bg-warning-dark text-white',
      })
    })

    it('should return relative time for seconds', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const thirtySecondsAgo = new Date('2025-01-15T14:29:30Z')
      const state = RefreshState.fromTimestamp(thirtySecondsAgo)

      expect(state.getRelativeTime()).toBe('il y a quelques secondes')
    })

    it('should return relative time for minutes', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const fiveMinutesAgo = new Date('2025-01-15T14:25:00Z')
      const state = RefreshState.fromTimestamp(fiveMinutesAgo)

      expect(state.getRelativeTime()).toBe('il y a 5 minutes')
    })

    it('should return relative time for single minute', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const oneMinuteAgo = new Date('2025-01-15T14:29:00Z')
      const state = RefreshState.fromTimestamp(oneMinuteAgo)

      expect(state.getRelativeTime()).toBe('il y a 1 minute')
    })

    it('should return relative time for hours', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const twoHoursAgo = new Date('2025-01-15T12:30:00Z')
      const state = RefreshState.fromTimestamp(twoHoursAgo)

      expect(state.getRelativeTime()).toBe('il y a 2 heures')
    })

    it('should return null relative time when no lastUpdate', () => {
      const state = RefreshState.initial()

      expect(state.getRelativeTime()).toBeNull()
    })

    it('should return time until auto-refresh', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const fortySecondsAgo = new Date('2025-01-15T14:29:20Z')
      const state = RefreshState.fromTimestamp(fortySecondsAgo, {
        autoRefreshInterval: 60000,
      })

      expect(state.getTimeUntilAutoRefresh()).toBe('Prochain rafraîchissement dans 20s')
    })

    it('should return imminent message when auto-refresh is due', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const seventySecondsAgo = new Date('2025-01-15T14:28:50Z')
      const state = RefreshState.fromTimestamp(seventySecondsAgo, {
        autoRefreshInterval: 60000,
      })

      expect(state.getTimeUntilAutoRefresh()).toBe('Rafraîchissement imminent...')
    })

    it('should return null time until auto-refresh when refreshing', () => {
      const state = RefreshState.refreshing(new Date())

      expect(state.getTimeUntilAutoRefresh()).toBeNull()
    })
  })

  describe('Value Object equality', () => {
    it('should be equal when all properties match', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const timestamp = new Date('2025-01-15T14:29:00Z')
      const state1 = RefreshState.fromTimestamp(timestamp)
      const state2 = RefreshState.fromTimestamp(timestamp)

      expect(state1.equals(state2)).toBe(true)
    })

    it('should not be equal when status differs', () => {
      const timestamp = new Date('2025-01-15T14:29:00Z')
      const state1 = RefreshState.fromTimestamp(timestamp, {
        status: RefreshStatus.IDLE,
      })
      const state2 = RefreshState.fromTimestamp(timestamp, {
        status: RefreshStatus.SUCCESS,
      })

      expect(state1.equals(state2)).toBe(false)
    })

    it('should not be equal when timestamp differs', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const state1 = RefreshState.fromTimestamp(new Date('2025-01-15T14:29:00Z'))
      const state2 = RefreshState.fromTimestamp(new Date('2025-01-15T14:28:00Z'))

      expect(state1.equals(state2)).toBe(false)
    })
  })

  describe('Immutability and copying', () => {
    it('should return new instance with updated status', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const timestamp = new Date('2025-01-15T14:29:00Z')
      const state = RefreshState.fromTimestamp(timestamp, {
        status: RefreshStatus.IDLE,
      })

      const updatedState = state.withStatus(RefreshStatus.SUCCESS)

      expect(state.status).toBe(RefreshStatus.IDLE) // Original unchanged
      expect(updatedState.status).toBe(RefreshStatus.SUCCESS)
      expect(updatedState.lastUpdate).toEqual(state.lastUpdate)
    })

    it('should return new instance with updated timestamp', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const oldTimestamp = new Date('2025-01-15T14:29:00Z')
      const state = RefreshState.fromTimestamp(oldTimestamp)

      const newTimestamp = new Date('2025-01-15T14:30:00Z')
      const updatedState = state.withTimestamp(newTimestamp)

      expect(state.lastUpdate).toEqual(oldTimestamp) // Original unchanged
      expect(updatedState.lastUpdate).toEqual(newTimestamp)
      expect(updatedState.status).toEqual(state.status)
    })
  })

  describe('Domain invariants', () => {
    it('should throw when timeSinceLastUpdate is negative', () => {
      expect(() => {
        // @ts-expect-error - Testing invariant violation
        new RefreshState(
          RefreshStatus.IDLE,
          new Date(),
          DataFreshness.FRESH,
          false,
          true,
          -1000, // Invalid negative
          null
        )
      }).toThrow('timeSinceLastUpdate cannot be negative')
    })

    it('should throw when nextAutoRefresh is negative', () => {
      expect(() => {
        // @ts-expect-error - Testing invariant violation
        new RefreshState(
          RefreshStatus.IDLE,
          new Date(),
          DataFreshness.FRESH,
          false,
          true,
          1000,
          -5000 // Invalid negative
        )
      }).toThrow('nextAutoRefresh cannot be negative')
    })

    it('should throw when isRefreshing does not match status', () => {
      expect(() => {
        // @ts-expect-error - Testing invariant violation
        new RefreshState(
          RefreshStatus.IDLE,
          new Date(),
          DataFreshness.FRESH,
          true, // isRefreshing true but status is IDLE
          true,
          1000,
          null
        )
      }).toThrow('isRefreshing must match status REFRESHING')
    })

    it('should allow isRefreshing true when status is REFRESHING', () => {
      expect(() => {
        new RefreshState(
          RefreshStatus.REFRESHING,
          new Date(),
          DataFreshness.FRESH,
          true,
          false,
          1000,
          null
        )
      }).not.toThrow()
    })
  })

  describe('Edge cases', () => {
    it('should handle exactly 2 minutes threshold (FRESH boundary)', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const exactlyTwoMinutesAgo = new Date('2025-01-15T14:28:00Z')
      const state = RefreshState.fromTimestamp(exactlyTwoMinutesAgo)

      // Should be RECENT, not FRESH
      expect(state.freshness).toBe(DataFreshness.RECENT)
    })

    it('should handle exactly 10 minutes threshold (RECENT boundary)', () => {
      const now = new Date('2025-01-15T14:30:00Z')
      vi.setSystemTime(now)

      const exactlyTenMinutesAgo = new Date('2025-01-15T14:20:00Z')
      const state = RefreshState.fromTimestamp(exactlyTenMinutesAgo)

      // Should be STALE, not RECENT
      expect(state.freshness).toBe(DataFreshness.STALE)
    })

    it('should handle refreshing state with null lastUpdate', () => {
      const state = RefreshState.refreshing(null)

      expect(state.freshness).toBe(DataFreshness.UNKNOWN)
      expect(state.timeSinceLastUpdate).toBeNull()
      expect(state.isRefreshing).toBe(true)
    })

    it('should handle error state with null lastUpdate', () => {
      const state = RefreshState.error(null)

      expect(state.freshness).toBe(DataFreshness.UNKNOWN)
      expect(state.timeSinceLastUpdate).toBeNull()
      expect(state.canRefresh).toBe(true)
    })
  })
})
