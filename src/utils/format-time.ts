/**
 * ========================================
 * FORMAT TIME UTILITY
 * ========================================
 * Formatage des timestamps pour affichage utilisateur
 */

/**
 * Formate un timestamp en format "il y a X minutes"
 * @param timestamp Timestamp en millisecondes
 * @returns Texte formaté (ex: "il y a 2 min")
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now()
  const diffMs = now - timestamp
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)

  if (diffSeconds < 60) {
    return 'à l\'instant'
  }

  if (diffMinutes < 60) {
    return `il y a ${diffMinutes} min`
  }

  if (diffHours < 24) {
    return `il y a ${diffHours}h`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `il y a ${diffDays}j`
}

/**
 * Formate un timestamp en heure locale (ex: "14:35")
 */
export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formate un timestamp en date complète (ex: "12 mars 2024 à 14:35")
 */
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
