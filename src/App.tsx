/**
 * ========================================
 * APP COMPONENT
 * ========================================
 * Composant racine de l'application
 * Intègre la géolocalisation et la recherche de stations
 */

import { useState, useCallback } from 'react'
import { GeolocationButton } from '@/components/GeolocationButton'
import { StationList } from '@/components/StationList'
import { useNearbyStations } from '@/hooks/useNearbyStations'
import { logger } from '@/middleware/logger'
import type { Coordinates } from '@/types/geolocation.types'

function App() {
  logger.info('🚀 App component rendering')

  // État de la position
  const [userPosition, setUserPosition] = useState<Coordinates | null>(null)

  logger.info('📍 Position state', {
    hasPosition: !!userPosition,
    coords: userPosition
  })

  // Callback de succès de recherche
  const handleSearchSuccess = useCallback((searchResult) => {
    logger.info('Search completed', {
      stationsFound: searchResult.stations.length,
      network: searchResult.networkName,
    })
  }, [])

  // Recherche de stations avec déclenchement automatique
  const {
    stations,
    network,
    result,
    isLoading: isSearching,
    error: searchError,
    search,
    refetch,
  } = useNearbyStations({
    userLocation: userPosition,
    maxDistance: 500,
    maxStations: 10,
    immediate: true, // Recherche automatique quand userLocation est disponible
    onSuccess: handleSearchSuccess,
  })

  // Handler appelé quand la position est reçue
  const handlePositionReceived = useCallback((coords: Coordinates) => {
    logger.info('Position received in App', coords)
    setUserPosition(coords)
  }, [])

  // Handler pour déclencher la recherche manuellement
  const handleSearchStations = async () => {
    if (userPosition) {
      await search()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="mx-auto max-w-6xl space-y-6 py-8">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            🚴 Bike Geoloc
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Trouvez rapidement un vélo en libre-service près de vous
          </p>
        </header>

        {/* Main Content */}
        <main className="space-y-6">
          {/* Carte de géolocalisation */}
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              📍 Étape 1 : Localisation
            </h2>
            <GeolocationButton
              onPositionReceived={handlePositionReceived}
              showDetails={true}
              maxAccuracy={200}
            />

            {/* Bouton de recherche (si position disponible et pas encore cherché) */}
            {userPosition && !isSearching && stations.length === 0 && !searchError && (
              <div className="mt-4">
                <button
                  onClick={handleSearchStations}
                  className="w-full rounded-lg bg-primary-500 px-6 py-3 font-medium text-white transition-all hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                  🔍 Rechercher les stations à proximité
                </button>
              </div>
            )}
          </div>

          {/* Résultats de recherche */}
          {(isSearching || stations.length > 0 || searchError) && (
            <div>
              <StationList
                stations={stations}
                networkName={network?.name}
                isLoading={isSearching}
                error={searchError}
                onRetry={search}
                onRefresh={refetch}
                lastUpdate={result?.timestamp}
                autoRefresh={true}
                autoRefreshInterval={60000}
              />
            </div>
          )}

          {/* Informations d'aide (si pas encore de recherche) */}
          {!userPosition && (
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <h2 className="mb-4 text-xl font-semibold text-gray-900">
                ℹ️ Comment ça marche ?
              </h2>
              <ol className="space-y-3 text-sm text-gray-700">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                    1
                  </span>
                  <span>
                    Cliquez sur <strong>"Me localiser"</strong> et autorisez
                    l'accès à votre position GPS
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                    2
                  </span>
                  <span>
                    L'application détecte automatiquement le réseau de vélos le
                    plus proche parmi{' '}
                    <strong>plus de 600 réseaux mondiaux</strong>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                    3
                  </span>
                  <span>
                    Consultez les <strong>10 stations les plus proches</strong>{' '}
                    (dans un rayon de 500m) avec vélos disponibles, triées par
                    distance
                  </span>
                </li>
              </ol>

              {/* Features highlights */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-lg bg-success-light/10 p-3">
                  <span className="text-lg">⚡</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Recherche ultra-rapide
                    </p>
                    <p className="text-xs text-gray-600">
                      Résultats en moins de 3 secondes
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-primary-50 p-3">
                  <span className="text-lg">🎯</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Filtrage précis
                    </p>
                    <p className="text-xs text-gray-600">
                      Rayon de 500m, vélos disponibles uniquement
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-warning-light/10 p-3">
                  <span className="text-lg">📏</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Distance précise
                    </p>
                    <p className="text-xs text-gray-600">
                      Calcul Haversine au mètre près
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                  <span className="text-lg">🌍</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Couverture mondiale
                    </p>
                    <p className="text-xs text-gray-600">
                      600+ réseaux dans le monde entier
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-3 sm:col-span-2">
                  <span className="text-lg">🔄</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Rafraîchissement automatique
                    </p>
                    <p className="text-xs text-gray-600">
                      Données mises à jour toutes les 60 secondes
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statistiques (si résultats disponibles) */}
          {result && stations.length > 0 && (
            <div className="rounded-xl bg-white p-6 shadow-lg">
              <h3 className="mb-3 text-lg font-semibold text-gray-900">
                📊 Statistiques de recherche
              </h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-lg bg-primary-50 p-4 text-center">
                  <p className="text-2xl font-bold text-primary-700">
                    {result.filteredStations}
                  </p>
                  <p className="text-xs text-gray-600">
                    Stations trouvées
                  </p>
                </div>
                <div className="rounded-lg bg-success-light/10 p-4 text-center">
                  <p className="text-2xl font-bold text-success-dark">
                    {result.totalStations}
                  </p>
                  <p className="text-xs text-gray-600">
                    Stations dans le réseau
                  </p>
                </div>
                <div className="rounded-lg bg-warning-light/10 p-4 text-center">
                  <p className="text-2xl font-bold text-warning-dark">
                    500m
                  </p>
                  <p className="text-xs text-gray-600">
                    Rayon de recherche
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500">
          <p>
            Propulsé par{' '}
            <a
              href="https://api.citybik.es/v2/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              CityBikes API
            </a>
            {' • '}
            Données en temps réel
          </p>
        </footer>
      </div>
    </div>
  )
}

export default App
