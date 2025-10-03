/**
 * ========================================
 * SECURITY MIDDLEWARE
 * ========================================
 * Express/Vite middleware for security headers and CORS
 *
 * CRAFT Principles:
 * - Defense in Depth
 * - Fail Secure
 * - Audit All Security Events
 */

import type { IncomingMessage, ServerResponse } from 'http'
import {
  SECURITY_HEADERS,
  getCORSConfig,
  isAllowedOrigin,
  logSecurityEvent,
} from '@/config/security.config'
import { config } from '@/config/env.config'

/**
 * Security headers middleware
 * Applies OWASP recommended headers to all responses
 */
export function securityHeadersMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
): void {
  // Apply all security headers
  Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
    res.setHeader(header, value)
  })

  next()
}

/**
 * CORS middleware
 * Handles Cross-Origin Resource Sharing
 */
export function corsMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
): void {
  const origin = req.headers.origin as string | undefined
  const corsConfig = getCORSConfig()

  // Development: Allow all origins
  if (config.isDevelopment) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*')
    res.setHeader('Access-Control-Allow-Methods', corsConfig.methods.join(', '))
    res.setHeader('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '))
    res.setHeader('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '))

    if (corsConfig.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true')
    }

    res.setHeader('Access-Control-Max-Age', String(corsConfig.maxAge))

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.statusCode = 204
      res.end()
      return
    }

    next()
    return
  }

  // Production: Strict origin validation
  if (!origin) {
    // No origin header (same-origin request or direct access)
    next()
    return
  }

  // Validate origin
  if (!isAllowedOrigin(origin)) {
    logSecurityEvent({
      type: 'CORS_VIOLATION',
      severity: 'MEDIUM',
      message: `CORS violation: Origin ${origin} is not allowed`,
      origin,
      endpoint: req.url,
    })

    res.statusCode = 403
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Origin not allowed' }))
    return
  }

  // Origin allowed - set CORS headers
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', corsConfig.methods.join(', '))
  res.setHeader('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '))
  res.setHeader('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '))

  if (corsConfig.credentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }

  res.setHeader('Access-Control-Max-Age', String(corsConfig.maxAge))

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  next()
}

/**
 * Rate limiting middleware (simple in-memory implementation)
 * For production, use Redis-backed rate limiter
 */
interface RateLimitRecord {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(req: IncomingMessage): string {
  // Use X-Forwarded-For if behind proxy, otherwise socket IP
  const forwardedFor = req.headers['x-forwarded-for'] as string | undefined
  const ip = forwardedFor?.split(',')[0] || req.socket.remoteAddress || 'unknown'

  return ip
}

/**
 * Rate limiting middleware factory
 */
export function createRateLimitMiddleware(options: {
  windowMs: number
  maxRequests: number
  message?: string
}) {
  return function rateLimitMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    next: () => void
  ): void {
    const clientId = getClientIdentifier(req)
    const now = Date.now()

    // Get or create rate limit record
    let record = rateLimitStore.get(clientId)

    // Reset if window expired
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + options.windowMs,
      }
      rateLimitStore.set(clientId, record)
    }

    // Increment request count
    record.count++

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', String(options.maxRequests))
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, options.maxRequests - record.count)))
    res.setHeader('X-RateLimit-Reset', String(Math.floor(record.resetTime / 1000)))

    // Check if limit exceeded
    if (record.count > options.maxRequests) {
      logSecurityEvent({
        type: 'RATE_LIMIT_EXCEEDED',
        severity: 'LOW',
        message: `Rate limit exceeded for ${clientId}`,
        endpoint: req.url,
      })

      res.statusCode = 429
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Retry-After', String(Math.ceil((record.resetTime - now) / 1000)))
      res.end(
        JSON.stringify({
          error: options.message || 'Too many requests',
          retryAfter: Math.ceil((record.resetTime - now) / 1000),
        })
      )
      return
    }

    next()
  }
}

/**
 * Cleanup expired rate limit records (call periodically)
 */
export function cleanupRateLimitStore(): void {
  const now = Date.now()

  for (const [clientId, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(clientId)
    }
  }
}

/**
 * Reset rate limit store (for testing only)
 */
export function resetRateLimitStore(): void {
  rateLimitStore.clear()
}

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000)
}

/**
 * Request size limiting middleware
 */
export function requestSizeLimitMiddleware(maxBytes: number) {
  return function (req: IncomingMessage, res: ServerResponse, next: () => void): void {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10)

    if (contentLength > maxBytes) {
      logSecurityEvent({
        type: 'SUSPICIOUS_REQUEST',
        severity: 'MEDIUM',
        message: `Request size ${contentLength} exceeds limit ${maxBytes}`,
        endpoint: req.url,
      })

      res.statusCode = 413
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Request entity too large' }))
      return
    }

    next()
  }
}

/**
 * Combine all security middleware
 */
export function applySecurityMiddleware(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
): void {
  // Chain middleware
  securityHeadersMiddleware(req, res, () => {
    corsMiddleware(req, res, () => {
      requestSizeLimitMiddleware(10 * 1024)(req, res, next) // 10KB limit
    })
  })
}
