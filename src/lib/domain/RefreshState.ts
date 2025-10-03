/**
 * ========================================
 * REFRESH STATE - DOMAIN MODEL
 * ========================================
 * Value Object pour gérer l'état de rafraîchissement
 * Approche CRAFT : Modèle riche avec règles métier
 */

/**
 * RÈGLES MÉTIER :
 * - Données fraîches : < 2 minutes
 * - Données récentes : 2-10 minutes
 * - Données périmées : > 10 minutes
 * - Auto-refresh : toutes les 60 secondes
 * - Debounce manuel : 1 seconde minimum entre refreshes
 */

export enum RefreshStatus {
  IDLE = 'IDLE',
  REFRESHING = 'REFRESHING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export enum DataFreshness {
  FRESH = 'FRESH', // < 2 minutes
  RECENT = 'RECENT', // 2-10 minutes
  STALE = 'STALE', // > 10 minutes
  UNKNOWN = 'UNKNOWN', // Pas de timestamp
}

/**
 * Value Object immuable pour l'état de rafraîchissement
 */
export class RefreshState {
  private constructor(
    public readonly status: RefreshStatus,
    public readonly lastUpdate: Date | null,
    public readonly freshness: DataFreshness,
    public readonly isRefreshing: boolean,
    public readonly canRefresh: boolean,
    public readonly timeSinceLastUpdate: number | null, // milliseconds
    public readonly nextAutoRefresh: number | null // milliseconds until next auto-refresh
  ) {
    // Invariant: timeSinceLastUpdate ne peut pas être négatif
    if (timeSinceLastUpdate !== null && timeSinceLastUpdate < 0) {
      throw new Error('timeSinceLastUpdate cannot be negative')
    }

    // Invariant: nextAutoRefresh ne peut pas être négatif
    if (nextAutoRefresh !== null && nextAutoRefresh < 0) {
      throw new Error('nextAutoRefresh cannot be negative')
    }

    // Invariant: isRefreshing doit correspondre au status
    if (isRefreshing && status !== RefreshStatus.REFRESHING) {
      throw new Error('isRefreshing must match status REFRESHING')
    }
  }

  /**
   * Crée un RefreshState initial (pas encore de données)
   */
  static initial(): RefreshState {
    return new RefreshState(
      RefreshStatus.IDLE,
      null,
      DataFreshness.UNKNOWN,
      false,
      true,
      null,
      null
    )
  }

  /**
   * Crée un RefreshState à partir d'un timestamp
   */
  static fromTimestamp(
    timestamp: string | Date,
    options: {
      status?: RefreshStatus
      autoRefreshInterval?: number // milliseconds
      minRefreshInterval?: number // milliseconds
      lastManualRefresh?: Date | null
    } = {}
  ): RefreshState {
    const {
      status = RefreshStatus.IDLE,
      autoRefreshInterval = 60000, // 60 seconds
      minRefreshInterval = 1000, // 1 second
      lastManualRefresh = null,
    } = options

    const lastUpdate = timestamp instanceof Date ? timestamp : new Date(timestamp)
    const now = new Date()
    const timeSinceLastUpdate = now.getTime() - lastUpdate.getTime()

    // Calculate freshness
    const freshness = this.calculateFreshness(timeSinceLastUpdate)

    // Calculate if can refresh (debounce)
    const canRefresh = this.canPerformRefresh(
      lastManualRefresh,
      minRefreshInterval,
      status
    )

    // Calculate next auto-refresh
    const nextAutoRefresh =
      status === RefreshStatus.REFRESHING
        ? null
        : Math.max(0, autoRefreshInterval - timeSinceLastUpdate)

    return new RefreshState(
      status,
      lastUpdate,
      freshness,
      status === RefreshStatus.REFRESHING,
      canRefresh,
      timeSinceLastUpdate,
      nextAutoRefresh
    )
  }

  /**
   * Crée un RefreshState en cours de rafraîchissement
   */
  static refreshing(lastUpdate: Date | null): RefreshState {
    return new RefreshState(
      RefreshStatus.REFRESHING,
      lastUpdate,
      lastUpdate ? this.calculateFreshness(new Date().getTime() - lastUpdate.getTime()) : DataFreshness.UNKNOWN,
      true,
      false, // Cannot refresh while already refreshing
      lastUpdate ? new Date().getTime() - lastUpdate.getTime() : null,
      null // No auto-refresh while refreshing
    )
  }

  /**
   * Crée un RefreshState après succès
   */
  static success(timestamp: Date | string = new Date()): RefreshState {
    return RefreshState.fromTimestamp(timestamp, {
      status: RefreshStatus.SUCCESS,
    })
  }

  /**
   * Crée un RefreshState après erreur
   */
  static error(lastUpdate: Date | null): RefreshState {
    return new RefreshState(
      RefreshStatus.ERROR,
      lastUpdate,
      lastUpdate ? this.calculateFreshness(new Date().getTime() - lastUpdate.getTime()) : DataFreshness.UNKNOWN,
      false,
      true, // Can retry after error
      lastUpdate ? new Date().getTime() - lastUpdate.getTime() : null,
      null
    )
  }

  /**
   * Calcule la fraîcheur des données
   */
  private static calculateFreshness(timeSinceUpdate: number): DataFreshness {
    const FRESH_THRESHOLD = 2 * 60 * 1000 // 2 minutes
    const RECENT_THRESHOLD = 10 * 60 * 1000 // 10 minutes

    if (timeSinceUpdate < FRESH_THRESHOLD) {
      return DataFreshness.FRESH
    } else if (timeSinceUpdate < RECENT_THRESHOLD) {
      return DataFreshness.RECENT
    } else {
      return DataFreshness.STALE
    }
  }

  /**
   * Vérifie si on peut effectuer un refresh (debounce)
   */
  private static canPerformRefresh(
    lastManualRefresh: Date | null,
    minRefreshInterval: number,
    currentStatus: RefreshStatus
  ): boolean {
    // Cannot refresh while already refreshing
    if (currentStatus === RefreshStatus.REFRESHING) {
      return false
    }

    // Can always refresh if never refreshed manually
    if (!lastManualRefresh) {
      return true
    }

    // Check debounce interval
    const timeSinceLastManual = new Date().getTime() - lastManualRefresh.getTime()
    return timeSinceLastManual >= minRefreshInterval
  }

  // ====================================
  // PRÉDICATS MÉTIER
  // ====================================

  /**
   * Les données sont-elles fraîches ?
   */
  isFresh(): boolean {
    return this.freshness === DataFreshness.FRESH
  }

  /**
   * Les données sont-elles périmées ?
   */
  isStale(): boolean {
    return this.freshness === DataFreshness.STALE
  }

  /**
   * Doit-on encourager l'utilisateur à rafraîchir ?
   */
  shouldEncourageRefresh(): boolean {
    return this.isStale() && !this.isRefreshing
  }

  /**
   * Doit-on auto-refresh ?
   */
  shouldAutoRefresh(): boolean {
    return (
      !this.isRefreshing &&
      this.nextAutoRefresh !== null &&
      this.nextAutoRefresh <= 0
    )
  }

  /**
   * Y a-t-il une erreur ?
   */
  hasError(): boolean {
    return this.status === RefreshStatus.ERROR
  }

  // ====================================
  // MÉTHODES D'AFFICHAGE (DEPRECATED - Use RefreshStatePresenter)
  // ====================================
  // Ces méthodes sont conservées pour compatibilité ascendante
  // Mais devraient être remplacées par RefreshStatePresenter
  // @deprecated Use RefreshStatePresenter.getFreshnessText() instead

  /**
   * @deprecated Use RefreshStatePresenter.getFreshnessText() instead
   * @see RefreshStatePresenter
   */
  getFreshnessText(): string {
    switch (this.freshness) {
      case DataFreshness.FRESH:
        return 'Données à jour'
      case DataFreshness.RECENT:
        return 'Données récentes'
      case DataFreshness.STALE:
        return 'Données périmées'
      case DataFreshness.UNKNOWN:
        return 'Pas de données'
    }
  }

  /**
   * @deprecated Use RefreshStatePresenter.getFreshnessColor() instead
   * @see RefreshStatePresenter
   */
  getFreshnessColor(): string {
    switch (this.freshness) {
      case DataFreshness.FRESH:
        return 'text-success-dark'
      case DataFreshness.RECENT:
        return 'text-gray-600'
      case DataFreshness.STALE:
        return 'text-warning-dark'
      case DataFreshness.UNKNOWN:
        return 'text-gray-400'
    }
  }

  /**
   * @deprecated Use RefreshStatePresenter.getFreshnessBadge() instead
   * @see RefreshStatePresenter
   */
  getFreshnessBadge(): { text: string; color: string } | null {
    if (this.freshness === DataFreshness.STALE) {
      return {
        text: 'Périmé',
        color: 'bg-warning-dark text-white',
      }
    }

    return null
  }

  /**
   * @deprecated Use RefreshStatePresenter.getRelativeTime() instead
   * @see RefreshStatePresenter
   */
  getRelativeTime(): string | null {
    if (!this.lastUpdate || this.timeSinceLastUpdate === null) {
      return null
    }

    const seconds = Math.floor(this.timeSinceLastUpdate / 1000)
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
   * @deprecated Use RefreshStatePresenter.getTimeUntilAutoRefresh() instead
   * @see RefreshStatePresenter
   */
  getTimeUntilAutoRefresh(): string | null {
    if (this.nextAutoRefresh === null) {
      return null
    }

    const seconds = Math.ceil(this.nextAutoRefresh / 1000)

    if (seconds <= 0) {
      return 'Rafraîchissement imminent...'
    }

    return `Prochain rafraîchissement dans ${seconds}s`
  }

  /**
   * @deprecated Use RefreshStatePresenter.getAutoRefreshProgress() instead
   * @see RefreshStatePresenter
   */
  getAutoRefreshProgress(autoRefreshInterval: number = 60000): number {
    if (this.nextAutoRefresh === null || this.timeSinceLastUpdate === null) {
      return 0
    }

    return Math.min(100, (this.timeSinceLastUpdate / autoRefreshInterval) * 100)
  }

  // ====================================
  // VALUE OBJECT EQUALITY
  // ====================================

  equals(other: RefreshState): boolean {
    return (
      this.status === other.status &&
      this.lastUpdate?.getTime() === other.lastUpdate?.getTime() &&
      this.freshness === other.freshness &&
      this.isRefreshing === other.isRefreshing &&
      this.canRefresh === other.canRefresh
    )
  }

  /**
   * Retourne une copie avec status mis à jour
   */
  withStatus(status: RefreshStatus): RefreshState {
    if (!this.lastUpdate) {
      return RefreshState.initial()
    }

    return RefreshState.fromTimestamp(this.lastUpdate, { status })
  }

  /**
   * Retourne une copie avec timestamp mis à jour
   */
  withTimestamp(timestamp: Date | string): RefreshState {
    return RefreshState.fromTimestamp(timestamp, {
      status: this.status,
    })
  }
}
