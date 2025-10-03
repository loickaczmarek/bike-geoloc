/**
 * ========================================
 * STRUCTURED LOGGING
 * ========================================
 * Production-ready structured logging with correlation IDs
 *
 * CRAFT Principles:
 * - Structured logging (JSON in production)
 * - Correlation IDs for request tracing
 * - Contextual logging
 * - Performance-optimized (no logs in hot paths)
 */

import { config } from '@/config/env.config'
import { v4 as uuidv4 } from 'uuid'

/**
 * Log levels (RFC 5424)
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Log level priorities for filtering
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.DEBUG]: 0,
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
}

/**
 * Structured log entry
 */
export interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  correlationId?: string
  context?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
  }
  performance?: {
    duration: number
    operation: string
  }
}

/**
 * Logger context (thread-local storage simulation)
 */
class LoggerContext {
  private correlationId: string | null = null

  setCorrelationId(id: string): void {
    this.correlationId = id
  }

  getCorrelationId(): string | null {
    return this.correlationId
  }

  generateCorrelationId(): string {
    const id = uuidv4()
    this.setCorrelationId(id)
    return id
  }

  clear(): void {
    this.correlationId = null
  }
}

/**
 * Global logger context
 */
const loggerContext = new LoggerContext()

/**
 * Logger class
 */
export class Logger {
  private readonly minLevel: LogLevel
  private readonly pretty: boolean
  private readonly enableConsole: boolean

  constructor(
    minLevel: LogLevel = config.logging.level as LogLevel,
    pretty: boolean = config.logging.pretty,
    enableConsole: boolean = config.logging.enableConsole
  ) {
    this.minLevel = minLevel
    this.pretty = pretty
    this.enableConsole = enableConsole
  }

  /**
   * Check if log level should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.minLevel]
  }

  /**
   * Format log entry
   */
  private formatLogEntry(entry: LogEntry): string {
    if (this.pretty) {
      // Pretty format for development
      const timestamp = new Date(entry.timestamp).toLocaleTimeString()
      const correlationId = entry.correlationId ? ` [${entry.correlationId.slice(0, 8)}]` : ''
      const context = entry.context ? ` ${JSON.stringify(entry.context)}` : ''
      const performance = entry.performance
        ? ` (${entry.performance.duration}ms)`
        : ''

      return `[${timestamp}] ${entry.level.toUpperCase()}${correlationId}: ${entry.message}${context}${performance}`
    }

    // JSON format for production
    return JSON.stringify(entry)
  }

  /**
   * Write log entry
   */
  private writeLog(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return
    }

    if (!this.enableConsole) {
      return
    }

    const formatted = this.formatLogEntry(entry)

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formatted)
        break
      case LogLevel.WARN:
        console.warn(formatted)
        break
      case LogLevel.INFO:
        console.info(formatted)
        break
      case LogLevel.DEBUG:
        console.debug(formatted)
        break
    }
  }

  /**
   * Create log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      correlationId: loggerContext.getCorrelationId() || undefined,
    }

    if (context && Object.keys(context).length > 0) {
      entry.context = context
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: config.isDevelopment ? error.stack : undefined,
      }
    }

    return entry
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context)
    this.writeLog(entry)
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context)
    this.writeLog(entry)
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context)
    this.writeLog(entry)
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, error)
    this.writeLog(entry)
  }

  /**
   * Log performance metrics
   */
  performance(operation: string, duration: number, context?: Record<string, unknown>): void {
    const entry = this.createLogEntry(
      LogLevel.INFO,
      `Performance: ${operation}`,
      context
    )
    entry.performance = { operation, duration }
    this.writeLog(entry)
  }

  /**
   * Start performance timer
   */
  startTimer(operation: string): () => void {
    const start = performance.now()

    return () => {
      const duration = Math.round(performance.now() - start)
      this.performance(operation, duration)
    }
  }

  /**
   * Set correlation ID for current context
   */
  setCorrelationId(id: string): void {
    loggerContext.setCorrelationId(id)
  }

  /**
   * Generate and set correlation ID
   */
  generateCorrelationId(): string {
    return loggerContext.generateCorrelationId()
  }

  /**
   * Get current correlation ID
   */
  getCorrelationId(): string | null {
    return loggerContext.getCorrelationId()
  }

  /**
   * Clear correlation ID
   */
  clearCorrelationId(): void {
    loggerContext.clear()
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger()

/**
 * Create scoped logger with prefix
 */
export function createLogger(prefix: string): Logger {
  const scopedLogger = new Logger()

  // Wrap methods to add prefix
  const originalDebug = scopedLogger.debug.bind(scopedLogger)
  const originalInfo = scopedLogger.info.bind(scopedLogger)
  const originalWarn = scopedLogger.warn.bind(scopedLogger)
  const originalError = scopedLogger.error.bind(scopedLogger)

  scopedLogger.debug = (message: string, context?: Record<string, unknown>) =>
    originalDebug(`[${prefix}] ${message}`, context)

  scopedLogger.info = (message: string, context?: Record<string, unknown>) =>
    originalInfo(`[${prefix}] ${message}`, context)

  scopedLogger.warn = (message: string, context?: Record<string, unknown>) =>
    originalWarn(`[${prefix}] ${message}`, context)

  scopedLogger.error = (message: string, error?: Error, context?: Record<string, unknown>) =>
    originalError(`[${prefix}] ${message}`, error, context)

  return scopedLogger
}

/**
 * Middleware to add correlation ID to requests
 */
export function withCorrelationId<T>(fn: () => T): T {
  const correlationId = logger.generateCorrelationId()

  try {
    return fn()
  } finally {
    logger.clearCorrelationId()
  }
}

/**
 * Async middleware to add correlation ID to requests
 */
export async function withCorrelationIdAsync<T>(fn: () => Promise<T>): Promise<T> {
  const correlationId = logger.generateCorrelationId()

  try {
    return await fn()
  } finally {
    logger.clearCorrelationId()
  }
}
