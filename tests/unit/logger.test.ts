/**
 * ========================================
 * LOGGER - TESTS
 * ========================================
 * Tests for structured logging
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Logger, LogLevel, createLogger, withCorrelationId } from '@/lib/logging/logger'

// Mock config
vi.mock('@/config/env.config', () => ({
  config: {
    isDevelopment: true,
    logging: {
      level: 'debug',
      pretty: true,
      enableConsole: true,
    },
  },
}))

describe('Logger', () => {
  let logger: Logger
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    logger = new Logger(LogLevel.DEBUG, true, true)

    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    logger.clearCorrelationId()
    vi.restoreAllMocks()
  })

  describe('Basic logging', () => {
    it('should log debug message', () => {
      logger.debug('Test debug message')

      expect(consoleDebugSpy).toHaveBeenCalledOnce()
      expect(consoleDebugSpy.mock.calls[0]?.[0]).toContain('Test debug message')
      expect(consoleDebugSpy.mock.calls[0]?.[0]).toContain('DEBUG')
    })

    it('should log info message', () => {
      logger.info('Test info message')

      expect(consoleInfoSpy).toHaveBeenCalledOnce()
      expect(consoleInfoSpy.mock.calls[0]?.[0]).toContain('Test info message')
      expect(consoleInfoSpy.mock.calls[0]?.[0]).toContain('INFO')
    })

    it('should log warn message', () => {
      logger.warn('Test warn message')

      expect(consoleWarnSpy).toHaveBeenCalledOnce()
      expect(consoleWarnSpy.mock.calls[0]?.[0]).toContain('Test warn message')
      expect(consoleWarnSpy.mock.calls[0]?.[0]).toContain('WARN')
    })

    it('should log error message', () => {
      logger.error('Test error message')

      expect(consoleErrorSpy).toHaveBeenCalledOnce()
      expect(consoleErrorSpy.mock.calls[0]?.[0]).toContain('Test error message')
      expect(consoleErrorSpy.mock.calls[0]?.[0]).toContain('ERROR')
    })
  })

  describe('Context logging', () => {
    it('should log message with context', () => {
      logger.info('User action', { userId: '123', action: 'login' })

      expect(consoleInfoSpy).toHaveBeenCalledOnce()
      const logMessage = consoleInfoSpy.mock.calls[0]?.[0] as string
      expect(logMessage).toContain('User action')
      expect(logMessage).toContain('userId')
      expect(logMessage).toContain('123')
    })

    it('should log error with Error object', () => {
      const error = new Error('Test error')
      logger.error('Operation failed', error)

      expect(consoleErrorSpy).toHaveBeenCalledOnce()
    })
  })

  describe('Correlation ID', () => {
    it('should generate correlation ID', () => {
      const correlationId = logger.generateCorrelationId()

      expect(correlationId).toBeDefined()
      expect(typeof correlationId).toBe('string')
      expect(correlationId.length).toBeGreaterThan(0)
    })

    it('should include correlation ID in logs', () => {
      logger.generateCorrelationId()
      logger.info('Test message')

      expect(consoleInfoSpy).toHaveBeenCalledOnce()
      const logMessage = consoleInfoSpy.mock.calls[0]?.[0] as string
      expect(logMessage).toMatch(/\[[\da-f]{8}\]/) // First 8 chars of UUID
    })

    it('should set custom correlation ID', () => {
      logger.setCorrelationId('custom-id-123')
      const currentId = logger.getCorrelationId()

      expect(currentId).toBe('custom-id-123')
    })

    it('should clear correlation ID', () => {
      logger.generateCorrelationId()
      expect(logger.getCorrelationId()).not.toBeNull()

      logger.clearCorrelationId()
      expect(logger.getCorrelationId()).toBeNull()
    })
  })

  describe('Performance logging', () => {
    it('should log performance metrics', () => {
      logger.performance('database-query', 150)

      expect(consoleInfoSpy).toHaveBeenCalledOnce()
      const logMessage = consoleInfoSpy.mock.calls[0]?.[0] as string
      expect(logMessage).toContain('Performance')
      expect(logMessage).toContain('150ms')
    })

    it('should measure operation duration with timer', () => {
      const stopTimer = logger.startTimer('test-operation')

      // Simulate some work
      let sum = 0
      for (let i = 0; i < 1000; i++) {
        sum += i
      }

      stopTimer()

      expect(consoleInfoSpy).toHaveBeenCalledOnce()
      const logMessage = consoleInfoSpy.mock.calls[0]?.[0] as string
      expect(logMessage).toContain('Performance')
      expect(logMessage).toContain('test-operation')
    })
  })

  describe('Log level filtering', () => {
    it('should not log debug when level is INFO', () => {
      const infoLogger = new Logger(LogLevel.INFO, true, true)

      const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})

      infoLogger.debug('This should not be logged')

      expect(spy).not.toHaveBeenCalled()

      spy.mockRestore()
    })

    it('should log warn when level is INFO', () => {
      const infoLogger = new Logger(LogLevel.INFO, true, true)

      infoLogger.warn('This should be logged')

      expect(consoleWarnSpy).toHaveBeenCalledOnce()
    })

    it('should log error when level is ERROR only', () => {
      const errorLogger = new Logger(LogLevel.ERROR, true, true)

      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      errorLogger.info('This should not be logged')
      errorLogger.error('This should be logged')

      expect(infoSpy).not.toHaveBeenCalled()
      expect(errorSpy).toHaveBeenCalledOnce()

      infoSpy.mockRestore()
      errorSpy.mockRestore()
    })
  })

  describe('Console enable/disable', () => {
    it('should not log when console is disabled', () => {
      const silentLogger = new Logger(LogLevel.DEBUG, true, false)

      const spy = vi.spyOn(console, 'info').mockImplementation(() => {})

      silentLogger.info('This should not be logged')

      expect(spy).not.toHaveBeenCalled()

      spy.mockRestore()
    })
  })

  describe('Scoped logger', () => {
    it('should add prefix to log messages', () => {
      const scopedLogger = createLogger('API')

      scopedLogger.info('Request received')

      expect(consoleInfoSpy).toHaveBeenCalledOnce()
      const logMessage = consoleInfoSpy.mock.calls[0]?.[0] as string
      expect(logMessage).toContain('[API]')
      expect(logMessage).toContain('Request received')
    })
  })

  describe('withCorrelationId helper', () => {
    it('should execute function with correlation ID', () => {
      const result = withCorrelationId(() => {
        logger.info('Inside correlation context')
        return 42
      })

      expect(result).toBe(42)
      expect(consoleInfoSpy).toHaveBeenCalledOnce()

      // Correlation ID should be cleared after execution
      expect(logger.getCorrelationId()).toBeNull()
    })
  })
})
