/**
 * ========================================
 * HEALTH CHECK ENDPOINTS
 * ========================================
 * Kubernetes-compatible health checks
 *
 * CRAFT Principles:
 * - K8s readiness/liveness probes
 * - Service dependency checks
 * - Graceful degradation
 */

import { config } from '@/config/env.config'
import { logger } from '@/lib/logging/logger'

/**
 * Health check status
 */
export enum HealthStatus {
  UP = 'UP',
  DOWN = 'DOWN',
  DEGRADED = 'DEGRADED',
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: HealthStatus
  timestamp: string
  version: string
  uptime: number
  checks: {
    [key: string]: {
      status: HealthStatus
      message?: string
      responseTime?: number
    }
  }
}

/**
 * Metrics data
 */
export interface MetricsData {
  uptime: number
  timestamp: string
  version: string
  environment: string
  performance: {
    avgResponseTime: number
    requestCount: number
  }
  memory?: {
    used: number
    total: number
    percentage: number
  }
}

/**
 * Application start time
 */
const startTime = Date.now()

/**
 * Request metrics (simple in-memory)
 */
let requestCount = 0
let totalResponseTime = 0

/**
 * Record request metrics
 */
export function recordRequestMetric(responseTime: number): void {
  requestCount++
  totalResponseTime += responseTime
}

/**
 * Check CityBikes API health
 */
async function checkCityBikesAPI(): Promise<{
  status: HealthStatus
  message?: string
  responseTime?: number
}> {
  const startTime = performance.now()

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

    const response = await fetch(`${config.api.cityBikes.baseUrl}/networks`, {
      signal: controller.signal,
      method: 'HEAD', // Just check if endpoint is reachable
    })

    clearTimeout(timeoutId)

    const responseTime = Math.round(performance.now() - startTime)

    if (response.ok) {
      return {
        status: HealthStatus.UP,
        message: 'CityBikes API is reachable',
        responseTime,
      }
    }

    return {
      status: HealthStatus.DEGRADED,
      message: `CityBikes API returned ${response.status}`,
      responseTime,
    }
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime)

    logger.warn('CityBikes API health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return {
      status: HealthStatus.DOWN,
      message: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
    }
  }
}

/**
 * Liveness probe
 * Returns 200 if application is alive (not deadlocked)
 */
export function livenessProbe(): { status: HealthStatus; timestamp: string } {
  return {
    status: HealthStatus.UP,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Readiness probe
 * Returns 200 if application is ready to serve traffic
 */
export async function readinessProbe(): Promise<HealthCheckResult> {
  const uptime = Math.floor((Date.now() - startTime) / 1000)

  // Check CityBikes API
  const cityBikesCheck = await checkCityBikesAPI()

  // Determine overall status
  let overallStatus = HealthStatus.UP

  if (cityBikesCheck.status === HealthStatus.DOWN) {
    overallStatus = HealthStatus.DEGRADED // Can still serve cached data
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: config.app.version,
    uptime,
    checks: {
      cityBikesAPI: cityBikesCheck,
    },
  }
}

/**
 * Health endpoint (combined liveness + readiness)
 */
export async function healthCheck(): Promise<HealthCheckResult> {
  return readinessProbe()
}

/**
 * Metrics endpoint
 */
export function metricsEndpoint(): MetricsData {
  const uptime = Math.floor((Date.now() - startTime) / 1000)
  const avgResponseTime = requestCount > 0 ? Math.round(totalResponseTime / requestCount) : 0

  const metrics: MetricsData = {
    uptime,
    timestamp: new Date().toISOString(),
    version: config.app.version,
    environment: config.env,
    performance: {
      avgResponseTime,
      requestCount,
    },
  }

  // Add memory metrics if available (Node.js)
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memUsage = process.memoryUsage()
    const used = Math.round(memUsage.heapUsed / 1024 / 1024) // MB
    const total = Math.round(memUsage.heapTotal / 1024 / 1024) // MB

    metrics.memory = {
      used,
      total,
      percentage: Math.round((used / total) * 100),
    }
  }

  return metrics
}

/**
 * Reset metrics (for testing)
 */
export function resetMetrics(): void {
  requestCount = 0
  totalResponseTime = 0
}
