/**
 * ========================================
 * AUTO-REFRESH HOOK
 * ========================================
 * Hook pour gérer le rafraîchissement automatique
 * Approche CRAFT : Use case séparé de la présentation
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { RefreshState, RefreshStatus } from '@/lib/domain/RefreshState'

export interface UseAutoRefreshOptions {
  /**
   * Intervalle de rafraîchissement automatique en millisecondes
   * @default 60000 (60 secondes)
   */
  interval?: number

  /**
   * Activer le rafraîchissement automatique
   * @default false
   */
  enabled?: boolean

  /**
   * Callback appelé lors du rafraîchissement automatique
   */
  onAutoRefresh?: () => void | Promise<void>

  /**
   * Timestamp de la dernière mise à jour
   */
  lastUpdate?: Date | string | null

  /**
   * Mettre en pause pendant le chargement
   * @default true
   */
  pauseWhileLoading?: boolean

  /**
   * État de chargement actuel
   */
  isLoading?: boolean
}

export interface UseAutoRefreshReturn {
  /**
   * État du rafraîchissement (RefreshState domain model)
   */
  refreshState: RefreshState

  /**
   * Temps restant jusqu'au prochain rafraîchissement (ms)
   */
  timeUntilRefresh: number | null

  /**
   * Rafraîchissement automatique est actif
   */
  isActive: boolean

  /**
   * Démarrer le rafraîchissement automatique
   */
  start: () => void

  /**
   * Arrêter le rafraîchissement automatique
   */
  stop: () => void

  /**
   * Redémarrer le rafraîchissement automatique (reset timer)
   */
  restart: () => void

  /**
   * Mettre en pause / reprendre
   */
  toggle: () => void
}

/**
 * Hook pour gérer le rafraîchissement automatique avec intervalle
 *
 * @example
 * ```tsx
 * const { refreshState, start, stop } = useAutoRefresh({
 *   interval: 60000,
 *   enabled: true,
 *   onAutoRefresh: async () => {
 *     await refetchStations()
 *   },
 *   lastUpdate: result?.timestamp
 * })
 * ```
 */
export function useAutoRefresh(options: UseAutoRefreshOptions = {}): UseAutoRefreshReturn {
  const {
    interval = 60000,
    enabled = false,
    onAutoRefresh,
    lastUpdate = null,
    pauseWhileLoading = true,
    isLoading = false,
  } = options

  const [isActive, setIsActive] = useState(enabled)
  const [timeUntilRefresh, setTimeUntilRefresh] = useState<number | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const countdownRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Nettoie les timers
   */
  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
  }, [])

  /**
   * Démarre le rafraîchissement automatique
   */
  const start = useCallback(() => {
    setIsActive(true)
  }, [])

  /**
   * Arrête le rafraîchissement automatique
   */
  const stop = useCallback(() => {
    setIsActive(false)
    cleanup()
    setTimeUntilRefresh(null)
  }, [cleanup])

  /**
   * Redémarre le rafraîchissement automatique
   */
  const restart = useCallback(() => {
    cleanup()
    if (isActive) {
      start()
    }
  }, [cleanup, isActive, start])

  /**
   * Basculer pause/reprise
   */
  const toggle = useCallback(() => {
    if (isActive) {
      stop()
    } else {
      start()
    }
  }, [isActive, start, stop])

  /**
   * Calcule le RefreshState actuel
   */
  const refreshState = useRef(RefreshState.initial()).current

  useEffect(() => {
    const currentState = lastUpdate
      ? RefreshState.fromTimestamp(lastUpdate, {
          status: isLoading ? RefreshStatus.REFRESHING : RefreshStatus.IDLE,
          autoRefreshInterval: interval,
        })
      : RefreshState.initial()

    // Update time until refresh
    setTimeUntilRefresh(currentState.nextAutoRefresh)

    // Mise à jour du refreshState
    Object.assign(refreshState, currentState)
  }, [lastUpdate, isLoading, interval, refreshState])

  /**
   * Gère le timer de rafraîchissement automatique
   */
  useEffect(() => {
    // Ne pas démarrer si désactivé
    if (!isActive) {
      cleanup()
      return
    }

    // Ne pas démarrer si pas de callback
    if (!onAutoRefresh) {
      cleanup()
      return
    }

    // Mettre en pause pendant le chargement si demandé
    if (pauseWhileLoading && isLoading) {
      cleanup()
      return
    }

    // Calculer le temps avant le prochain refresh
    const now = new Date().getTime()
    const lastUpdateTime = lastUpdate
      ? typeof lastUpdate === 'string'
        ? new Date(lastUpdate).getTime()
        : lastUpdate.getTime()
      : now

    const timeSinceLastUpdate = now - lastUpdateTime
    const timeUntilNext = Math.max(0, interval - timeSinceLastUpdate)

    // Si refresh immédiat nécessaire
    if (timeUntilNext === 0) {
      onAutoRefresh()
      return
    }

    // Démarrer le countdown
    const updateCountdown = () => {
      const newNow = new Date().getTime()
      const newTimeSince = newNow - lastUpdateTime
      const newTimeUntil = Math.max(0, interval - newTimeSince)

      setTimeUntilRefresh(newTimeUntil)

      // Trigger refresh quand le temps est écoulé
      if (newTimeUntil === 0) {
        onAutoRefresh()
      }
    }

    // Update countdown every second
    countdownRef.current = setInterval(updateCountdown, 1000)

    // Initial countdown value
    setTimeUntilRefresh(timeUntilNext)

    return cleanup
  }, [isActive, onAutoRefresh, lastUpdate, interval, pauseWhileLoading, isLoading, cleanup])

  return {
    refreshState,
    timeUntilRefresh,
    isActive,
    start,
    stop,
    restart,
    toggle,
  }
}
