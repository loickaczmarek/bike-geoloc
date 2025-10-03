/**
 * ========================================
 * SECURITY CONFIGURATION - TESTS
 * ========================================
 * Tests for security configuration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateCSPHeader,
  getCORSConfig,
  getRateLimitConfig,
  isAllowedOrigin,
  sanitizeInput,
} from '@/config/security.config'

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
      corsOrigins: ['http://localhost:5173', 'http://localhost:3000'],
      rateLimit: {
        windowMs: 60000,
        maxRequests: 100,
      },
    },
  },
}))

describe('Security Configuration', () => {
  describe('generateCSPHeader', () => {
    it('should generate valid CSP header string', () => {
      const csp = generateCSPHeader()

      expect(csp).toContain("default-src 'self'")
      expect(csp).toContain("frame-ancestors 'none'")
      expect(csp).toContain('connect-src')
    })

    it('should include unsafe-inline for dev environment', () => {
      const csp = generateCSPHeader()

      expect(csp).toContain("'unsafe-inline'")
      expect(csp).toContain("'unsafe-eval'")
    })

    it('should include CityBikes API in connect-src', () => {
      const csp = generateCSPHeader()

      expect(csp).toContain('https://api.citybik.es/v2')
    })
  })

  describe('getCORSConfig', () => {
    it('should return permissive config for development', () => {
      const corsConfig = getCORSConfig()

      expect(corsConfig.origin).toBe(true) // Allow all
      expect(corsConfig.methods).toContain('GET')
      expect(corsConfig.methods).toContain('POST')
      expect(corsConfig.methods).toContain('OPTIONS')
    })

    it('should include correlation ID headers', () => {
      const corsConfig = getCORSConfig()

      expect(corsConfig.allowedHeaders).toContain('X-Correlation-ID')
      expect(corsConfig.exposedHeaders).toContain('X-Correlation-ID')
    })

    it('should not use credentials for frontend-only app', () => {
      const corsConfig = getCORSConfig()

      expect(corsConfig.credentials).toBe(false)
    })

    it('should set 24h preflight cache', () => {
      const corsConfig = getCORSConfig()

      expect(corsConfig.maxAge).toBe(86400)
    })
  })

  describe('getRateLimitConfig', () => {
    it('should return default rate limit config', () => {
      const rateLimitConfig = getRateLimitConfig('/unknown')

      expect(rateLimitConfig.windowMs).toBe(60000)
      expect(rateLimitConfig.maxRequests).toBe(100)
      expect(rateLimitConfig.standardHeaders).toBe(true)
    })

    it('should return endpoint-specific config for /api/geolocation', () => {
      const rateLimitConfig = getRateLimitConfig('/api/geolocation')

      expect(rateLimitConfig.maxRequests).toBe(30)
      expect(rateLimitConfig.message).toContain('geolocation')
    })

    it('should return endpoint-specific config for /api/search', () => {
      const rateLimitConfig = getRateLimitConfig('/api/search')

      expect(rateLimitConfig.maxRequests).toBe(20)
      expect(rateLimitConfig.message).toContain('search')
    })

    it('should have high limit for health check', () => {
      const rateLimitConfig = getRateLimitConfig('/health')

      expect(rateLimitConfig.maxRequests).toBe(1000)
    })
  })

  describe('isAllowedOrigin', () => {
    it('should allow all origins in development', () => {
      expect(isAllowedOrigin('http://localhost:8080')).toBe(true)
      expect(isAllowedOrigin('https://example.com')).toBe(true)
      expect(isAllowedOrigin('http://malicious.com')).toBe(true)
    })
  })

  describe('sanitizeInput', () => {
    it('should sanitize HTML tags', () => {
      const input = '<script>alert("xss")</script>'
      const sanitized = sanitizeInput(input)

      expect(sanitized).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;')
      expect(sanitized).not.toContain('<script>')
    })

    it('should sanitize quotes', () => {
      const input = 'Hello "World" and \'everyone\''
      const sanitized = sanitizeInput(input)

      expect(sanitized).toContain('&quot;')
      expect(sanitized).toContain('&#x27;')
    })

    it('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('')
    })

    it('should handle normal text without changes', () => {
      const input = 'Hello World 123'
      const sanitized = sanitizeInput(input)

      expect(sanitized).toBe(input)
    })
  })
})
