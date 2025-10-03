/**
 * ========================================
 * SECURITY CONFIGURATION
 * ========================================
 * Production-ready security configuration
 *
 * CRAFT Principles:
 * - Defense in Depth
 * - Secure by Default
 * - OWASP Top 10 Protection
 * - Zero Trust Architecture
 */

import { config } from './env.config'

/**
 * Content Security Policy Configuration
 * Prevents XSS, code injection, clickjacking
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    // Allow Vite dev server scripts in development
    ...(config.isDevelopment ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for Tailwind CSS
  ],
  'img-src': [
    "'self'",
    'data:', // For inline images
    'https:', // External images (bike network logos)
  ],
  'font-src': ["'self'", 'data:'],
  'connect-src': [
    "'self'",
    config.api.cityBikes.baseUrl, // CityBikes API
    ...(config.isDevelopment ? ['ws://localhost:*', 'wss://localhost:*'] : []), // Vite HMR
  ],
  'frame-ancestors': ["'none'"], // Prevent clickjacking
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'upgrade-insecure-requests': config.isProduction ? [] : undefined,
} as const

/**
 * Generate CSP header string
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => {
      if (Array.isArray(value) && value.length === 0) {
        return key // Directives without values (upgrade-insecure-requests)
      }
      return `${key} ${Array.isArray(value) ? value.join(' ') : value}`
    })
    .join('; ')
}

/**
 * Security Headers Configuration
 * Implements OWASP Secure Headers Project
 */
export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': generateCSPHeader(),

  // Strict Transport Security (HTTPS only)
  // Only enabled in production with HTTPS
  ...(config.isProduction
    ? {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      }
    : {}),

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Clickjacking protection
  'X-Frame-Options': 'DENY',

  // XSS Protection (legacy browsers)
  'X-XSS-Protection': '1; mode=block',

  // Referrer policy (privacy)
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Permissions policy (limit browser features)
  'Permissions-Policy': [
    'geolocation=(self)', // Required for bike geolocation
    'camera=()',
    'microphone=()',
    'payment=()',
    'usb=()',
  ].join(', '),
} as const

/**
 * CORS Configuration
 */
export interface CORSConfig {
  origin: string[] | boolean
  methods: string[]
  allowedHeaders: string[]
  exposedHeaders: string[]
  credentials: boolean
  maxAge: number
}

/**
 * Get CORS configuration based on environment
 */
export function getCORSConfig(): CORSConfig {
  const allowedOrigins = config.security.corsOrigins

  return {
    // Allowed origins (strict in production)
    origin: config.isProduction ? allowedOrigins : true,

    // Allowed HTTP methods
    methods: ['GET', 'POST', 'OPTIONS'],

    // Allowed request headers
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-Correlation-ID', // For request tracing
    ],

    // Exposed response headers
    exposedHeaders: ['X-Correlation-ID', 'X-RateLimit-Limit', 'X-RateLimit-Remaining'],

    // Credentials (cookies, auth)
    credentials: false, // Frontend-only app, no auth cookies

    // Preflight cache duration (seconds)
    maxAge: 86400, // 24 hours
  }
}

/**
 * Rate Limiting Configuration
 */
export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message: string
  standardHeaders: boolean
  legacyHeaders: boolean
  skipSuccessfulRequests: boolean
  skipFailedRequests: boolean
}

/**
 * Default rate limit configuration
 */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: config.security.rateLimit.windowMs,
  maxRequests: config.security.rateLimit.maxRequests,
  message: 'Too many requests, please try again later',
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable legacy X-RateLimit-* headers
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
}

/**
 * Endpoint-specific rate limits (intelligent rate limiting)
 */
export const ENDPOINT_RATE_LIMITS: Record<string, Partial<RateLimitConfig>> = {
  // Geolocation endpoint (more permissive)
  '/api/geolocation': {
    windowMs: 60000, // 1 minute
    maxRequests: 30, // User may retry multiple times
    message: 'Too many geolocation requests, please wait a moment',
  },

  // Search endpoint (stricter)
  '/api/search': {
    windowMs: 60000, // 1 minute
    maxRequests: 20, // Limit search frequency
    message: 'Too many search requests, please wait a moment',
  },

  // Health check (no limit)
  '/health': {
    maxRequests: 1000, // Very high limit
  },
}

/**
 * Get rate limit configuration for specific endpoint
 */
export function getRateLimitConfig(endpoint: string): RateLimitConfig {
  const endpointConfig = ENDPOINT_RATE_LIMITS[endpoint] || {}

  return {
    ...DEFAULT_RATE_LIMIT,
    ...endpointConfig,
  }
}

/**
 * Security validation helpers
 */

/**
 * Validate CORS origin
 */
export function isAllowedOrigin(origin: string): boolean {
  if (config.isDevelopment) {
    return true // Allow all in development
  }

  const allowedOrigins = config.security.corsOrigins

  // Exact match
  if (allowedOrigins.includes(origin)) {
    return true
  }

  // Pattern match (e.g., *.example.com)
  return allowedOrigins.some((allowed) => {
    if (allowed.includes('*')) {
      const regex = new RegExp('^' + allowed.replace(/\*/g, '.*') + '$')
      return regex.test(origin)
    }
    return false
  })
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validate request size to prevent DoS
 */
export const REQUEST_SIZE_LIMITS = {
  json: '10kb',
  urlencoded: '10kb',
  text: '10kb',
} as const

/**
 * Security audit logging
 */
export interface SecurityEvent {
  type: 'CORS_VIOLATION' | 'RATE_LIMIT_EXCEEDED' | 'INVALID_ORIGIN' | 'SUSPICIOUS_REQUEST'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  message: string
  origin?: string
  endpoint?: string
  timestamp: string
}

/**
 * Log security event
 */
export function logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
  const securityEvent: SecurityEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  }

  // In production, send to security monitoring system
  if (config.isProduction && config.logging.enableConsole) {
    console.warn('[SECURITY]', JSON.stringify(securityEvent))
  } else if (config.isDevelopment) {
    console.warn('[SECURITY]', securityEvent)
  }
}
