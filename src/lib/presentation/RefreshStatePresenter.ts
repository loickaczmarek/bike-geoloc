/**
 * ========================================
 * REFRESH STATE PRESENTER
 * ========================================
 * Présentation layer pour RefreshState
 *
 * CRAFT Principle: Single Responsibility Principle
 * Séparation domaine (RefreshState) et présentation (RefreshStatePresenter)
 *
 * Avant: RefreshState contenait logique métier + formatage UI (380 lignes)
 * Après: RefreshState = domain pur, RefreshStatePresenter = formatage UI
 */

import type { RefreshState, DataFreshness, RefreshStatus } from '@/lib/domain/RefreshState'
import { DataFreshness as FreshnessEnum, RefreshStatus as StatusEnum } from '@/lib/domain/RefreshState'

export interface FreshnessBadge {
  text: string
  color: string
}

/**
 * Presenter pour formater RefreshState pour l'UI
 *
 * Pattern: Presenter/ViewModel
 * Responsabilité: Transformer domain model en données affichables
 */
export class RefreshStatePresenter {
  constructor(private readonly state: RefreshState) {}

  /**
   * Retourne le texte de fraîcheur localisé
   */
  getFreshnessText(): string {
    switch (this.state.freshness) {
      case FreshnessEnum.FRESH:
        return 'Données à jour'
      case FreshnessEnum.RECENT:
        return 'Données récentes'
      case FreshnessEnum.STALE:
        return 'Données périmées'
      case FreshnessEnum.UNKNOWN:
        return 'Pas de données'
      default:
        return 'État inconnu'
    }
  }

  /**
   * Retourne la classe CSS Tailwind pour la couleur de fraîcheur
   */
  getFreshnessColor(): string {
    switch (this.state.freshness) {
      case FreshnessEnum.FRESH:
        return 'text-success-dark'
      case FreshnessEnum.RECENT:
        return 'text-gray-600'
      case FreshnessEnum.STALE:
        return 'text-warning-dark'
      case FreshnessEnum.UNKNOWN:
        return 'text-gray-400'
      default:
        return 'text-gray-500'
    }
  }

  /**
   * Retourne le badge de fraîcheur (seulement si pertinent)
   */
  getFreshnessBadge(): FreshnessBadge | null {
    if (this.state.freshness === FreshnessEnum.STALE) {
      return {
        text: 'Périmé',
        color: 'bg-warning-dark text-white',
      }
    }

    return null
  }

  /**
   * Retourne le temps relatif depuis la dernière mise à jour
   *
   * Format localisé français:
   * - < 60s: "il y a quelques secondes"
   * - 1-59min: "il y a X minute(s)"
   * - >= 60min: "il y a X heure(s)"
   */
  getRelativeTime(): string | null {
    if (!this.state.lastUpdate || this.state.timeSinceLastUpdate === null) {
      return null
    }

    const seconds = Math.floor(this.state.timeSinceLastUpdate / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (seconds < 60) {
      return 'il y a quelques secondes'
    } else if (minutes < 60) {
      return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`
    } else {
      return `il y a ${hours} heure${hours > 1 ? 's' : ''}`
    }
  }

  /**
   * Retourne le temps formaté jusqu'au prochain auto-refresh
   */
  getTimeUntilAutoRefresh(): string | null {
    if (this.state.nextAutoRefresh === null) {
      return null
    }

    const seconds = Math.ceil(this.state.nextAutoRefresh / 1000)

    if (seconds <= 0) {
      return 'Rafraîchissement imminent...'
    }

    return `Prochain rafraîchissement dans ${seconds}s`
  }

  /**
   * Retourne le pourcentage de progression vers le prochain auto-refresh
   *
   * @param autoRefreshInterval Intervalle total en ms (default 60000)
   * @returns Pourcentage 0-100
   */
  getAutoRefreshProgress(autoRefreshInterval: number = 60000): number {
    if (this.state.nextAutoRefresh === null || this.state.timeSinceLastUpdate === null) {
      return 0
    }

    const progress = (this.state.timeSinceLastUpdate / autoRefreshInterval) * 100
    return Math.min(100, Math.max(0, progress))
  }

  /**
   * Retourne l'icône appropriée pour le statut
   */
  getStatusIcon(): 'spinner' | 'check' | 'warning' | 'clock' {
    if (this.state.isRefreshing) {
      return 'spinner'
    }

    switch (this.state.freshness) {
      case FreshnessEnum.FRESH:
        return 'check'
      case FreshnessEnum.STALE:
        return 'warning'
      default:
        return 'clock'
    }
  }

  /**
   * Retourne le message d'encouragement si nécessaire
   */
  getEncouragementMessage(): string | null {
    if (this.state.shouldEncourageRefresh()) {
      return 'Les données sont périmées. Rafraîchissez pour éviter les mauvaises surprises.'
    }

    return null
  }

  /**
   * Retourne toutes les données formatées pour l'UI
   * (Utile pour passer en props à un composant)
   */
  toViewModel(): RefreshViewModel {
    return {
      // Status
      isRefreshing: this.state.isRefreshing,
      canRefresh: this.state.canRefresh,
      hasError: this.state.hasError(),

      // Freshness
      freshnessText: this.getFreshnessText(),
      freshnessColor: this.getFreshnessColor(),
      freshnessBadge: this.getFreshnessBadge(),

      // Time
      relativeTime: this.getRelativeTime(),
      timeUntilRefresh: this.getTimeUntilAutoRefresh(),
      refreshProgress: this.getAutoRefreshProgress(),

      // Visual
      statusIcon: this.getStatusIcon(),
      encouragementMessage: this.getEncouragementMessage(),

      // Raw state (if needed)
      status: this.state.status,
      freshness: this.state.freshness,
    }
  }
}

/**
 * ViewModel pour l'UI (toutes les données pré-formatées)
 */
export interface RefreshViewModel {
  // Status
  isRefreshing: boolean
  canRefresh: boolean
  hasError: boolean

  // Freshness
  freshnessText: string
  freshnessColor: string
  freshnessBadge: FreshnessBadge | null

  // Time
  relativeTime: string | null
  timeUntilRefresh: string | null
  refreshProgress: number

  // Visual
  statusIcon: 'spinner' | 'check' | 'warning' | 'clock'
  encouragementMessage: string | null

  // Raw state
  status: RefreshStatus
  freshness: DataFreshness
}

/**
 * Helper factory pour créer un presenter
 */
export function createRefreshPresenter(state: RefreshState): RefreshStatePresenter {
  return new RefreshStatePresenter(state)
}
