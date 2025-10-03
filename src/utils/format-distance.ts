/**
 * ========================================
 * FORMAT DISTANCE UTILITY
 * ========================================
 * Formatage des distances pour affichage utilisateur
 */

/**
 * Formate une distance en mètres pour affichage
 * - < 1000m : affiche en mètres (ex: "150m")
 * - >= 1000m : affiche en kilomètres (ex: "1.2km")
 *
 * @param meters Distance en mètres
 * @returns Distance formatée avec unité
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }

  const kilometers = meters / 1000
  return `${kilometers.toFixed(1)}km`
}

/**
 * Formate une distance de manière plus verbale
 * @param meters Distance en mètres
 * @returns Description textuelle (ex: "à 150 mètres")
 */
export function formatDistanceVerbose(meters: number): string {
  if (meters < 1000) {
    return `à ${Math.round(meters)} mètres`
  }

  const kilometers = meters / 1000
  return `à ${kilometers.toFixed(1)} kilomètres`
}
