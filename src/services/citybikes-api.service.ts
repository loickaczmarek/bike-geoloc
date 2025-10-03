/**
 * ========================================
 * CITYBIKES API SERVICE
 * ========================================
 * Service pour interagir avec l'API CityBikes v2
 * Documentation: https://api.citybik.es/v2/
 *
 * ENDPOINTS:
 * - GET /networks - Liste tous les réseaux de vélos mondiaux
 * - GET /networks/{network_id} - Détails d'un réseau + ses stations
 *
 * EXEMPLE D'UTILISATION:
 * ```typescript
 * import { fetchAllNetworks, fetchNetworkDetails } from '@/services/citybikes-api.service'
 *
 * // Récupérer tous les réseaux
 * const networks = await fetchAllNetworks()
 *
 * // Récupérer les stations d'un réseau
 * const details = await fetchNetworkDetails('velib')
 * console.log(details.stations) // Array de stations avec coordonnées
 * ```
 */

import { logger } from '@/middleware/logger'
import { handleError, BikeGeolocError } from '@/middleware/error-handler'
import { env } from '@/config/env'
import type {
  Network,
  NetworksResponse,
  NetworkDetails,
  NetworkDetailsResponse,
} from '@/types/citybikes.types'

/**
 * Configuration de base pour les requêtes
 */
const API_BASE_URL = env.cityBikesApiUrl
const TIMEOUT = env.apiTimeout

/**
 * Wrapper fetch avec timeout et gestion d'erreurs
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT)

  try {
    logger.apiRequest('GET', url)
    const startTime = performance.now()

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    const duration = performance.now() - startTime
    logger.apiResponse(url, response.status, duration)

    if (!response.ok) {
      throw handleError(response, url)
    }

    return response
  } catch (error) {
    if (error instanceof BikeGeolocError) {
      throw error
    }
    throw handleError(error, url)
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Récupère la liste de tous les réseaux de vélos dans le monde
 * @returns Liste des réseaux (> 600 réseaux)
 * @throws {BikeGeolocError} En cas d'erreur réseau ou API
 */
export async function fetchAllNetworks(): Promise<Network[]> {
  logger.info('Fetching all bike networks...')

  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/networks`)
    const data: NetworksResponse = await response.json()

    if (!data.networks || !Array.isArray(data.networks)) {
      throw new Error('Invalid API response format: missing networks array')
    }

    logger.info('Networks fetched successfully', {
      count: data.networks.length,
    })

    return data.networks
  } catch (error) {
    logger.error('Failed to fetch networks', { error })
    throw handleError(error, 'fetchAllNetworks')
  }
}

/**
 * Récupère les détails d'un réseau spécifique avec ses stations
 * @param networkId ID du réseau (ex: "velib", "villo", "citibike-nyc")
 * @returns Détails du réseau incluant toutes ses stations
 * @throws {BikeGeolocError} En cas d'erreur réseau ou API
 *
 * VALIDATION:
 * - networkId ne doit pas être vide
 * - networkId ne doit contenir que des caractères alphanumériques et tirets
 */
export async function fetchNetworkDetails(
  networkId: string
): Promise<NetworkDetails> {
  // Validation de l'input (sécurité)
  if (!networkId || typeof networkId !== 'string') {
    throw new Error('Invalid networkId: must be a non-empty string')
  }

  // Sanitization: autoriser seulement alphanumeric + tirets
  if (!/^[a-z0-9-]+$/i.test(networkId)) {
    throw new Error(
      'Invalid networkId format: only alphanumeric and hyphens allowed'
    )
  }

  logger.info('Fetching network details', { networkId })

  try {
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/networks/${networkId}`
    )
    const data: NetworkDetailsResponse = await response.json()

    if (!data.network) {
      throw new Error('Invalid API response format: missing network object')
    }

    if (!data.network.stations || !Array.isArray(data.network.stations)) {
      logger.warn('Network has no stations', { networkId })
      data.network.stations = []
    }

    logger.info('Network details fetched successfully', {
      networkId,
      stationsCount: data.network.stations.length,
    })

    return data.network
  } catch (error) {
    logger.error('Failed to fetch network details', { networkId, error })
    throw handleError(error, `fetchNetworkDetails(${networkId})`)
  }
}

/**
 * Récupère les stations d'un réseau (version simplifiée)
 * @param networkId ID du réseau
 * @returns Array de stations uniquement
 */
export async function fetchStations(networkId: string) {
  const network = await fetchNetworkDetails(networkId)
  return network.stations
}

/**
 * Vérifie si l'API CityBikes est accessible
 * @returns true si l'API répond, false sinon
 */
export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/networks`, {
      method: 'HEAD',
    })
    return response.ok
  } catch (error) {
    logger.warn('CityBikes API health check failed', { error })
    return false
  }
}
