# 📁 Structure du Projet

```
src/
├── components/              # Composants React réutilisables et features
│   ├── StationList/        # Feature principale - Liste des stations
│   │   ├── StationList.tsx          # Container orchestrant la logique
│   │   ├── StationCard.tsx          # Affichage d'une station individuelle
│   │   ├── RefreshButton.tsx        # Bouton de rafraîchissement manuel
│   │   └── index.ts                 # Barrel export
│   │
│   └── common/             # Composants génériques réutilisables
│       ├── LoadingState.tsx         # État de chargement (skeleton, spinner)
│       ├── ErrorState.tsx           # Affichage des erreurs utilisateur
│       ├── EmptyState.tsx           # État vide (aucune station)
│       └── index.ts
│
├── hooks/                   # Custom React hooks
│   ├── useGeolocation.ts            # Hook de géolocalisation du navigateur
│   ├── useNearbyStations.ts         # Hook orchestration complète (réseau + stations)
│   ├── useAutoRefresh.ts            # Auto-refresh toutes les 60s
│   └── index.ts
│
├── services/                # Services de communication externe
│   ├── citybikes-api.service.ts     # Appels API CityBikes (networks, stations)
│   ├── geolocation.service.ts       # Wrapper API Geolocation avec erreurs
│   ├── distance.service.ts          # Calculs Haversine pour distances
│   ├── network-finder.service.ts    # Trouve réseau vélos le plus proche
│   └── index.ts
│
├── lib/                     # Logique métier pure (business logic)
│   ├── station-filter.ts            # Filtrage 200m + free_bikes > 0
│   ├── station-sorter.ts            # Tri par distance croissante
│   ├── constants.ts                 # Constantes (RADIUS_METERS, MAX_STATIONS)
│   └── index.ts
│
├── types/                   # Définitions TypeScript
│   ├── citybikes.types.ts           # Types API CityBikes (Network, Station)
│   ├── station.types.ts             # Types métier enrichis (StationWithDistance)
│   ├── geolocation.types.ts         # Types géolocalisation
│   └── index.ts
│
├── config/                  # Configuration de l'application
│   ├── env.ts                       # Validation variables d'environnement
│   ├── query-client.ts              # Configuration TanStack Query
│   └── index.ts
│
├── middleware/              # Middleware et intercepteurs
│   ├── error-handler.ts             # Gestion centralisée des erreurs
│   ├── logger.ts                    # Logger console/Sentry
│   └── index.ts
│
├── utils/                   # Utilitaires génériques
│   ├── format-distance.ts           # Formatage distances (150m, 1.2km)
│   ├── format-time.ts               # Formatage timestamps
│   └── index.ts
│
├── assets/                  # Ressources statiques
│   └── icons/                       # Icônes SVG custom
│
├── App.tsx                  # Composant racine de l'application
├── main.tsx                 # Point d'entrée React (QueryClientProvider)
├── index.css                # Styles globaux + Tailwind imports
└── vite-env.d.ts           # Types Vite

public/                      # Assets publics statiques
└── favicon.ico

tests/                       # Tests organisés par type
├── unit/                    # Tests unitaires (services, utils)
├── integration/             # Tests d'intégration (hooks, composants)
└── e2e/                     # Tests end-to-end (Playwright)
```

## 🧩 Convention de Nommage

- **Components** : PascalCase (`StationCard.tsx`)
- **Hooks** : camelCase avec préfixe `use` (`useGeolocation.ts`)
- **Services** : kebab-case avec suffix `.service.ts` (`citybikes-api.service.ts`)
- **Types** : kebab-case avec suffix `.types.ts` (`station.types.ts`)
- **Utils/Lib** : kebab-case (`format-distance.ts`)

## 📦 Barrel Exports

Chaque dossier contient un `index.ts` pour des imports propres :
```typescript
// ❌ Éviter
import { StationCard } from '../components/StationList/StationCard'

// ✅ Préférer
import { StationCard } from '@/components/StationList'
```
