/**
 * ========================================
 * ENVIRONMENT CONFIGURATION
 * ========================================
 * Configuration centralisée avec validation stricte
 *
 * CRAFT Principles:
 * - Fail Fast: Validation au démarrage
 * - 12-Factor App: Configuration via environnement
 * - Type Safety: TypeScript strict
 * - Security: Pas de secrets en code
 */

/**
 * Environment types
 */
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

/**
 * Configuration typée de l'application
 */
export interface AppConfig {
  // Environment
  env: Environment
  nodeEnv: string
  isDevelopment: boolean
  isProduction: boolean
  isTest: boolean

  // Application
  app: {
    name: string
    version: string
    port: number
  }

  // API External
  api: {
    cityBikes: {
      baseUrl: string
      timeout: number
      retries: number
    }
  }

  // Frontend
  frontend: {
    baseUrl: string
    enableAnalytics: boolean
  }

  // Logging
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'
    pretty: boolean
    enableConsole: boolean
  }

  // Security
  security: {
    corsOrigins: string[]
    rateLimit: {
      windowMs: number
      maxRequests: number
    }
  }

  // Feature Flags
  features: {
    autoRefresh: boolean
    analytics: boolean
    errorReporting: boolean
  }
}

/**
 * Validation error
 */
class ConfigurationError extends Error {
  constructor(message: string) {
    super(`[Configuration Error] ${message}`)
    this.name = 'ConfigurationError'
  }
}

/**
 * Get environment variable with validation
 */
function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue

  if (value === undefined) {
    throw new ConfigurationError(
      `Missing required environment variable: ${key}`
    )
  }

  return value
}

/**
 * Get environment variable as number
 */
function getEnvNumber(key: string, defaultValue?: number): number {
  const value = process.env[key]

  if (value === undefined) {
    if (defaultValue === undefined) {
      throw new ConfigurationError(
        `Missing required environment variable: ${key}`
      )
    }
    return defaultValue
  }

  const parsed = parseInt(value, 10)

  if (isNaN(parsed)) {
    throw new ConfigurationError(
      `Environment variable ${key} must be a valid number, got: ${value}`
    )
  }

  return parsed
}

/**
 * Get environment variable as boolean
 */
function getEnvBoolean(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key]

  if (value === undefined) {
    return defaultValue
  }

  return value.toLowerCase() === 'true' || value === '1'
}

/**
 * Get environment variable as array (comma-separated)
 */
function getEnvArray(key: string, defaultValue: string[] = []): string[] {
  const value = process.env[key]

  if (!value) {
    return defaultValue
  }

  return value.split(',').map((v) => v.trim()).filter(Boolean)
}

/**
 * Parse and validate environment
 */
function parseEnvironment(): Environment {
  const env = getEnv('VITE_APP_ENV', process.env.NODE_ENV || 'development')

  if (!Object.values(Environment).includes(env as Environment)) {
    throw new ConfigurationError(
      `Invalid environment: ${env}. Must be one of: ${Object.values(Environment).join(', ')}`
    )
  }

  return env as Environment
}

/**
 * Load and validate configuration
 *
 * @throws {ConfigurationError} Si configuration invalide
 */
function loadConfig(): AppConfig {
  const env = parseEnvironment()
  const nodeEnv = process.env.NODE_ENV || 'development'

  const config: AppConfig = {
    // Environment
    env,
    nodeEnv,
    isDevelopment: env === Environment.DEVELOPMENT,
    isProduction: env === Environment.PRODUCTION,
    isTest: env === Environment.TEST,

    // Application
    app: {
      name: getEnv('VITE_APP_NAME', 'Bike Geoloc'),
      version: getEnv('VITE_APP_VERSION', '1.0.0'),
      port: getEnvNumber('PORT', 5173),
    },

    // API External
    api: {
      cityBikes: {
        baseUrl: getEnv('VITE_CITYBIKES_API_URL', 'https://api.citybik.es/v2'),
        timeout: getEnvNumber('VITE_API_TIMEOUT', 5000),
        retries: getEnvNumber('VITE_API_RETRIES', 3),
      },
    },

    // Frontend
    frontend: {
      baseUrl: getEnv('VITE_FRONTEND_URL', 'http://localhost:5173'),
      enableAnalytics: getEnvBoolean('VITE_ENABLE_ANALYTICS', false),
    },

    // Logging
    logging: {
      level: (getEnv('VITE_LOG_LEVEL', env === Environment.PRODUCTION ? 'info' : 'debug') as AppConfig['logging']['level']),
      pretty: getEnvBoolean('VITE_LOG_PRETTY', env !== Environment.PRODUCTION),
      enableConsole: getEnvBoolean('VITE_LOG_CONSOLE', true),
    },

    // Security
    security: {
      corsOrigins: getEnvArray(
        'VITE_CORS_ORIGINS',
        env === Environment.PRODUCTION ? [] : ['http://localhost:5173']
      ),
      rateLimit: {
        windowMs: getEnvNumber('VITE_RATE_LIMIT_WINDOW_MS', 60000), // 1 minute
        maxRequests: getEnvNumber('VITE_RATE_LIMIT_MAX_REQUESTS', 100),
      },
    },

    // Feature Flags
    features: {
      autoRefresh: getEnvBoolean('VITE_FEATURE_AUTO_REFRESH', true),
      analytics: getEnvBoolean('VITE_FEATURE_ANALYTICS', false),
      errorReporting: getEnvBoolean('VITE_FEATURE_ERROR_REPORTING', env === Environment.PRODUCTION),
    },
  }

  // Validate configuration
  validateConfig(config)

  return config
}

/**
 * Validate configuration cohérence
 */
function validateConfig(config: AppConfig): void {
  // Production-specific validations
  if (config.isProduction) {
    // CORS origins must be explicitly set in production
    if (config.security.corsOrigins.length === 0) {
      throw new ConfigurationError(
        'CORS origins must be explicitly configured in production (VITE_CORS_ORIGINS)'
      )
    }

    // No wildcard CORS in production
    if (config.security.corsOrigins.includes('*')) {
      throw new ConfigurationError(
        'Wildcard CORS origin (*) is not allowed in production'
      )
    }

    // Logging should not be in debug mode in production
    if (config.logging.level === 'debug') {
      console.warn(
        '[Warning] Debug logging is enabled in production. Consider using "info" or "warn".'
      )
    }

    // Pretty logging should be disabled in production
    if (config.logging.pretty) {
      console.warn(
        '[Warning] Pretty logging is enabled in production. Consider disabling for structured JSON logs.'
      )
    }
  }

  // API timeout validation
  if (config.api.cityBikes.timeout < 1000 || config.api.cityBikes.timeout > 30000) {
    console.warn(
      `[Warning] API timeout (${config.api.cityBikes.timeout}ms) is outside recommended range (1000-30000ms)`
    )
  }

  // Rate limit validation
  if (config.security.rateLimit.maxRequests < 10) {
    console.warn(
      `[Warning] Rate limit is very restrictive (${config.security.rateLimit.maxRequests} requests). Users may be blocked.`
    )
  }
}

/**
 * Configuration singleton
 * Loaded and validated once at startup
 */
let configInstance: AppConfig | null = null

/**
 * Get application configuration
 *
 * @throws {ConfigurationError} Si configuration invalide
 */
export function getConfig(): AppConfig {
  if (!configInstance) {
    configInstance = loadConfig()

    // Log configuration summary (sans secrets)
    if (configInstance.logging.enableConsole) {
      console.info('[Config] Application configuration loaded:', {
        env: configInstance.env,
        version: configInstance.app.version,
        features: configInstance.features,
        logLevel: configInstance.logging.level,
      })
    }
  }

  return configInstance
}

/**
 * Reset configuration (pour tests uniquement)
 */
export function resetConfig(): void {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('resetConfig() can only be called in test environment')
  }
  configInstance = null
}

/**
 * Export default config instance
 */
export const config = getConfig()
