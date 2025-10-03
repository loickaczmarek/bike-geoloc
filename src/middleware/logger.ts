/**
 * ========================================
 * LOGGER MIDDLEWARE
 * ========================================
 * Logger structuré avec niveaux de log
 * - Respecte VITE_LOG_LEVEL et VITE_DEBUG_MODE
 * - Format console coloré en dev
 * - JSON structuré en prod (pour agrégateurs de logs)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  context?: Record<string, unknown>
}

class Logger {
  private isDevelopment: boolean
  private debugMode: boolean
  private logLevel: LogLevel

  constructor() {
    this.isDevelopment = import.meta.env.DEV
    this.debugMode = import.meta.env.VITE_DEBUG_MODE === 'true'
    this.logLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info'
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    const currentLevelIndex = levels.indexOf(this.logLevel)
    const messageLevelIndex = levels.indexOf(level)
    return messageLevelIndex >= currentLevelIndex
  }

  private formatMessage(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return
    }

    const emoji = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    }

    if (this.isDevelopment || this.debugMode) {
      // Format coloré en dev
      const styles = {
        debug: 'color: #6b7280',
        info: 'color: #3b82f6',
        warn: 'color: #f59e0b',
        error: 'color: #ef4444; font-weight: bold',
      }

      console.log(
        `%c${emoji[entry.level]} [${entry.level.toUpperCase()}] ${entry.message}`,
        styles[entry.level]
      )

      if (entry.context) {
        console.log('Context:', entry.context)
      }
    } else {
      // JSON structuré en prod
      console.log(JSON.stringify(entry))
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.formatMessage({
      level: 'debug',
      message,
      timestamp: new Date().toISOString(),
      context,
    })
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.formatMessage({
      level: 'info',
      message,
      timestamp: new Date().toISOString(),
      context,
    })
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.formatMessage({
      level: 'warn',
      message,
      timestamp: new Date().toISOString(),
      context,
    })
  }

  error(message: string, context?: Record<string, unknown>): void {
    this.formatMessage({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      context,
    })
  }

  /**
   * Log d'une requête API (pour debugging)
   */
  apiRequest(method: string, url: string, params?: Record<string, unknown>): void {
    this.debug(`API ${method} ${url}`, params)
  }

  /**
   * Log d'une réponse API
   */
  apiResponse(url: string, status: number, duration?: number): void {
    const message = `API Response ${url} - ${status}`
    const context = duration ? { duration: `${duration}ms` } : undefined

    if (status >= 400) {
      this.warn(message, context)
    } else {
      this.debug(message, context)
    }
  }

  /**
   * Log de performance (pour optimisations)
   */
  performance(label: string, duration: number): void {
    this.debug(`⚡ Performance: ${label}`, { duration: `${duration}ms` })
  }
}

// Export singleton
export const logger = new Logger()
