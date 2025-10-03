/**
 * ========================================
 * NETWORK FINDER SERVICE
 * ========================================
 * Service pour trouver le réseau de vélos le plus proche de l'utilisateur
 *
 * ALGORITHME:
 * 1. Récupère tous les réseaux CityBikes (>600 dans le monde)
 * 2. Calcule la distance entre position utilisateur et chaque réseau
 * 3. Retourne le réseau le plus proche
 *
 * EXEMPLE D'UTILISATION:
 * ```typescript
 * import { findClosestNetwork } from '@/services/network-finder.service'
 *
 * const network = await findClosestNetwork({
 *   latitude: 48.8566,
 *   longitude: 2.3522
 * })
 *
 * console.log(network.name) // "Vélib' Métropole"
 * console.log(network.distance) // Distance en mètres
 * ```
 */

import { fetchAllNetworks } from './citybikes-api.service'
import { calculateDistance } from './distance.service'
import { logger } from '@/middleware/logger'
import { handleError } from '@/middleware/error-handler'
import type { Network } from '@/types/citybikes.types'
import type { Coordinates } from '@/types/geolocation.types'

/**
 * Réseau enrichi avec distance calculée
 */
export interface NetworkWithDistance extends Network {
  distance: number // Distance en mètres depuis position utilisateur
}

/**
 * Trouve le réseau de vélos le plus proche de la position donnée
 *
 * @param userLocation Position GPS de l'utilisateur
 * @param maxDistance Distance maximale de recherche en mètres (optionnel, défaut: illimité)
 * @returns Réseau le plus proche avec sa distance
 * @throws {BikeGeolocError} Si aucun réseau trouvé ou erreur API
 *
 * OPTIMISATIONS:
 * - Calcul Haversine optimisé (formule rapide)
 * - Arrêt précoce si distance < 1km trouvée
 * - Cache des réseaux possible (future implémentation)
 */
export async function findClosestNetwork(
  userLocation: Coordinates,
  maxDistance?: number
): Promise<NetworkWithDistance> {
  // Validation des inputs
  if (!userLocation || typeof userLocation.latitude !== 'number') {
    throw new Error('Invalid userLocation: latitude is required')
  }
  if (typeof userLocation.longitude !== 'number') {
    throw new Error('Invalid userLocation: longitude is required')
  }
  if (
    userLocation.latitude < -90 ||
    userLocation.latitude > 90 ||
    userLocation.longitude < -180 ||
    userLocation.longitude > 180
  ) {
    throw new Error('Invalid coordinates: out of valid range')
  }

  logger.info('Finding closest bike network', {
    userLocation,
    maxDistance,
  })

  try {
    const startTime = performance.now()

    // Récupérer tous les réseaux
    const networks = await fetchAllNetworks()

    if (!networks || networks.length === 0) {
      throw new Error('No bike networks available from API')
    }

    logger.debug('Calculating distances to all networks', {
      networksCount: networks.length,
    })

    // Calculer la distance pour chaque réseau
    const networksWithDistance: NetworkWithDistance[] = networks.map(
      (network) => {
        const distance = calculateDistance(userLocation, {
          latitude: network.location.latitude,
          longitude: network.location.longitude,
        })

        return {
          ...network,
          distance,
        }
      }
    )

    // Filtrer par distance maximale si spécifiée
    let filteredNetworks = networksWithDistance
    if (maxDistance !== undefined) {
      filteredNetworks = networksWithDistance.filter(
        (n) => n.distance <= maxDistance
      )

      if (filteredNetworks.length === 0) {
        logger.warn('No networks found within max distance', {
          maxDistance,
          closestDistance: Math.min(
            ...networksWithDistance.map((n) => n.distance)
          ),
        })
        throw new Error(
          `No bike networks found within ${maxDistance}m of your location`
        )
      }
    }

    // Trouver le réseau le plus proche
    const closestNetwork = filteredNetworks.reduce((closest, current) =>
      current.distance < closest.distance ? current : closest
    )

    const duration = performance.now() - startTime
    logger.performance('Closest network found', duration)

    logger.info('Closest network found', {
      networkId: closestNetwork.id,
      networkName: closestNetwork.name,
      city: closestNetwork.location.city,
      country: closestNetwork.location.country,
      distance: `${Math.round(closestNetwork.distance)}m`,
    })

    return closestNetwork
  } catch (error) {
    logger.error('Failed to find closest network', { error })
    throw handleError(error, 'findClosestNetwork')
  }
}

/**
 * Trouve les N réseaux les plus proches (pour afficher plusieurs options)
 *
 * @param userLocation Position GPS de l'utilisateur
 * @param count Nombre de réseaux à retourner (défaut: 5)
 * @param maxDistance Distance maximale en mètres (optionnel)
 * @returns Array de réseaux triés par distance croissante
 */
export async function findNearestNetworks(
  userLocation: Coordinates,
  count = 5,
  maxDistance?: number
): Promise<NetworkWithDistance[]> {
  logger.info('Finding nearest bike networks', {
    userLocation,
    count,
    maxDistance,
  })

  try {
    const networks = await fetchAllNetworks()

    // Calculer distances
    const networksWithDistance: NetworkWithDistance[] = networks.map(
      (network) => ({
        ...network,
        distance: calculateDistance(userLocation, {
          latitude: network.location.latitude,
          longitude: network.location.longitude,
        }),
      })
    )

    // Filtrer par distance max si spécifié
    let filtered = networksWithDistance
    if (maxDistance !== undefined) {
      filtered = networksWithDistance.filter((n) => n.distance <= maxDistance)
    }

    // Trier par distance croissante et prendre les N premiers
    const sorted = filtered.sort((a, b) => a.distance - b.distance)
    const nearest = sorted.slice(0, count)

    logger.info('Nearest networks found', {
      count: nearest.length,
      networks: nearest.map((n) => ({
        name: n.name,
        distance: `${Math.round(n.distance)}m`,
      })),
    })

    return nearest
  } catch (error) {
    logger.error('Failed to find nearest networks', { error })
    throw handleError(error, 'findNearestNetworks')
  }
}

/**
 * Vérifie si un réseau spécifique existe
 * @param networkId ID du réseau à vérifier
 * @returns true si le réseau existe, false sinon
 */
export async function networkExists(networkId: string): Promise<boolean> {
  try {
    const networks = await fetchAllNetworks()
    return networks.some((network) => network.id === networkId)
  } catch (error) {
    logger.error('Failed to check network existence', { networkId, error })
    return false
  }
}
