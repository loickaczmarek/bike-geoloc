/**
 * ========================================
 * SECURITY MIDDLEWARE - TESTS
 * ========================================
 * Tests for security middleware
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { IncomingMessage, ServerResponse } from 'http'
import {
  securityHeadersMiddleware,
  corsMiddleware,
  createRateLimitMiddleware,
  requestSizeLimitMiddleware,
  cleanupRateLimitStore,
  resetRateLimitStore,
} from '@/middleware/security.middleware'

// Mock config
vi.mock('@/config/env.config', () => ({
  config: {
    env: 'development',
    isDevelopment: true,
    isProduction: false,
    api: {
      cityBikes: {
        baseUrl: 'https://api.citybik.es/v2',
      },
    },
    security: {
      corsOrigins: ['http://localhost:5173'],
      rateLimit: {
        windowMs: 60000,
        maxRequests: 100,
      },
    },
    logging: {
      enableConsole: false, // Disable logs in tests
    },
  },
}))

// Mock security config
vi.mock('@/config/security.config', () => ({
  SECURITY_HEADERS: {
    'Content-Security-Policy': "default-src 'self'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  },
  getCORSConfig: () => ({
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Correlation-ID'],
    exposedHeaders: ['X-Correlation-ID'],
    credentials: false,
    maxAge: 86400,
  }),
  isAllowedOrigin: (origin: string) => origin === 'http://localhost:5173',
  logSecurityEvent: vi.fn(),
}))

describe('Security Middleware', () => {
  let mockReq: Partial<IncomingMessage>
  let mockRes: Partial<ServerResponse>
  let nextCalled: boolean

  beforeEach(() => {
    // Reset rate limit store before each test
    resetRateLimitStore()

    nextCalled = false

    mockReq = {
      method: 'GET',
      url: '/api/test',
      headers: {},
      socket: {
        remoteAddress: '127.0.0.1',
      } as any,
    }

    const headers: Record<string, string | string[]> = {}

    mockRes = {
      statusCode: 200,
      setHeader: vi.fn((name: string, value: string | string[]) => {
        headers[name] = value
      }),
      getHeader: vi.fn((name: string) => headers[name]),
      end: vi.fn(),
    }
  })

  const next = () => {
    nextCalled = true
  }

  describe('securityHeadersMiddleware', () => {
    it('should apply security headers', () => {
      securityHeadersMiddleware(
        mockReq as IncomingMessage,
        mockRes as ServerResponse,
        next
      )

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Security-Policy',
        "default-src 'self'"
      )
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff')
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY')
      expect(nextCalled).toBe(true)
    })
  })

  describe('corsMiddleware', () => {
    it('should allow all origins in development', () => {
      mockReq.headers = { origin: 'http://localhost:8080' }

      corsMiddleware(mockReq as IncomingMessage, mockRes as ServerResponse, next)

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'http://localhost:8080'
      )
      expect(nextCalled).toBe(true)
    })

    it('should handle OPTIONS preflight request', () => {
      mockReq.method = 'OPTIONS'
      mockReq.headers = { origin: 'http://localhost:5173' }

      corsMiddleware(mockReq as IncomingMessage, mockRes as ServerResponse, next)

      expect(mockRes.statusCode).toBe(204)
      expect(mockRes.end).toHaveBeenCalled()
      expect(nextCalled).toBe(false) // Should not call next() for OPTIONS
    })

    it('should set CORS headers for allowed methods', () => {
      mockReq.headers = { origin: 'http://localhost:5173' }

      corsMiddleware(mockReq as IncomingMessage, mockRes as ServerResponse, next)

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS'
      )
    })

    it('should set max-age for preflight cache', () => {
      mockReq.headers = { origin: 'http://localhost:5173' }

      corsMiddleware(mockReq as IncomingMessage, mockRes as ServerResponse, next)

      expect(mockRes.setHeader).toHaveBeenCalledWith('Access-Control-Max-Age', '86400')
    })
  })

  describe('createRateLimitMiddleware', () => {
    it('should allow requests within limit', () => {
      const rateLimitMiddleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 5,
      })

      rateLimitMiddleware(mockReq as IncomingMessage, mockRes as ServerResponse, next)

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '5')
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', '4')
      expect(nextCalled).toBe(true)
      expect(mockRes.statusCode).toBe(200)
    })

    it('should block requests exceeding limit', () => {
      const rateLimitMiddleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 1, // Only 1 request allowed
        message: 'Too many requests',
      })

      // First request - OK (count becomes 1)
      rateLimitMiddleware(mockReq as IncomingMessage, mockRes as ServerResponse, next)
      expect(nextCalled).toBe(true)

      // Reset for second request
      nextCalled = false
      mockRes.statusCode = 200

      // Second request - BLOCKED (count becomes 2, exceeds limit of 1)
      rateLimitMiddleware(mockReq as IncomingMessage, mockRes as ServerResponse, next)
      expect(mockRes.statusCode).toBe(429)
      expect(mockRes.end).toHaveBeenCalled()
      expect(nextCalled).toBe(false)
    })

    it('should set retry-after header when rate limited', () => {
      const rateLimitMiddleware = createRateLimitMiddleware({
        windowMs: 60000,
        maxRequests: 1,
      })

      // First request - OK
      rateLimitMiddleware(mockReq as IncomingMessage, mockRes as ServerResponse, next)

      // Second request - BLOCKED
      rateLimitMiddleware(mockReq as IncomingMessage, mockRes as ServerResponse, next)

      expect(mockRes.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(String))
    })
  })

  describe('requestSizeLimitMiddleware', () => {
    it('should allow requests within size limit', () => {
      mockReq.headers = { 'content-length': '5000' }

      const middleware = requestSizeLimitMiddleware(10000)
      middleware(mockReq as IncomingMessage, mockRes as ServerResponse, next)

      expect(nextCalled).toBe(true)
      expect(mockRes.statusCode).toBe(200)
    })

    it('should block requests exceeding size limit', () => {
      mockReq.headers = { 'content-length': '15000' }

      const middleware = requestSizeLimitMiddleware(10000)
      middleware(mockReq as IncomingMessage, mockRes as ServerResponse, next)

      expect(mockRes.statusCode).toBe(413)
      expect(mockRes.end).toHaveBeenCalled()
      expect(nextCalled).toBe(false)
    })

    it('should handle missing content-length header', () => {
      mockReq.headers = {}

      const middleware = requestSizeLimitMiddleware(10000)
      middleware(mockReq as IncomingMessage, mockRes as ServerResponse, next)

      expect(nextCalled).toBe(true)
    })
  })

  describe('cleanupRateLimitStore', () => {
    it('should cleanup expired rate limit records', () => {
      // This is a simple smoke test
      expect(() => cleanupRateLimitStore()).not.toThrow()
    })
  })
})
