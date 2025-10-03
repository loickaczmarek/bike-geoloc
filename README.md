# 🚴 Bike Geoloc - Localisation Vélos en Libre-Service

> Application web React permettant de localiser en temps réel les vélos en libre-service disponibles à proximité de votre position.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff)](https://vite.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)

---

## 🎯 Fonctionnalités

✅ **Géolocalisation automatique** - Détecte votre position GPS avec gestion complète des erreurs
✅ **Recherche intelligente** - Trouve automatiquement le réseau de vélos le plus proche (CityBikes API)
✅ **Filtrage précis** - Affiche les 10 stations les plus proches (max 200m) avec vélos disponibles
✅ **Calcul de distance** - Utilise la formule de Haversine pour une précision au mètre près
✅ **Rafraîchissement** - Actualisation manuelle + auto-refresh toutes les 60 secondes
✅ **Responsive** - Optimisé mobile-first (compatible smartphone)

---

## 🏗️ Architecture

```
Frontend Only (SPA)
├── React 18 + TypeScript
├── TanStack Query (cache & auto-refresh)
├── Tailwind CSS (responsive design)
└── Vite (build ultra-rapide)

API Externe
└── CityBikes v2 (https://api.citybik.es/v2)
```

### Architecture de Haut Niveau

```
┌─────────────────────────────────────────┐
│         User Interface (React)          │
│  ┌────────────┐    ┌─────────────────┐  │
│  │ Station    │◄───│ TanStack Query  │  │
│  │ List UI    │    │ (Cache + Retry) │  │
│  └────────────┘    └─────────────────┘  │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│        Business Logic Layer             │
│  ┌──────────┐  ┌──────────┐  ┌────────┐│
│  │Geolocation│ │ Distance │  │Network ││
│  │  Service  │ │Calculator│  │ Finder ││
│  └──────────┘  └──────────┘  └────────┘│
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│       CityBikes API (REST)              │
│  GET /networks                          │
│  GET /networks/{network_id}             │
└─────────────────────────────────────────┘
```

---

## 📦 Prérequis

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Navigateur moderne** avec API Geolocation (Chrome, Firefox, Safari, Edge)

---

## 🚀 Installation

### 1️⃣ Cloner et installer les dépendances

```bash
npm install
```

### 2️⃣ Configurer l'environnement (optionnel)

```bash
cp .env.example .env
# Éditer .env si besoin de personnaliser les paramètres
```

**Configuration par défaut :**
- Rayon de recherche : **200 mètres**
- Nombre max de stations : **10**
- Auto-refresh : **60 secondes**

### 3️⃣ Lancer en développement

```bash
npm run dev
```

L'application sera accessible sur **http://localhost:3000**

---

## 🛠️ Scripts Disponibles

| Commande               | Description                                   |
|------------------------|-----------------------------------------------|
| `npm run dev`          | Démarre le serveur de développement (port 3000) |
| `npm run build`        | Build de production dans `/dist`             |
| `npm run preview`      | Prévisualise le build de production          |
| `npm run lint`         | Analyse le code avec ESLint                   |
| `npm run lint:fix`     | Corrige automatiquement les erreurs ESLint    |
| `npm run format`       | Formatte le code avec Prettier                |
| `npm run format:check` | Vérifie le formatage sans modifier            |
| `npm run test`         | Lance les tests unitaires (Vitest)            |
| `npm run test:ui`      | Interface UI pour les tests                   |
| `npm run test:coverage`| Génère un rapport de couverture               |
| `npm run type-check`   | Vérifie les types TypeScript                  |
| `npm run setup`        | Installation complète + vérification TypeScript |
| `npm run docker:up`    | Lance Redis (optionnel, pour cache futur)     |
| `npm run docker:down`  | Arrête les services Docker                    |

---

## 📁 Structure du Projet

```
src/
├── components/          # Composants React
│   ├── StationList/    # Feature principale (liste stations)
│   └── common/         # Composants réutilisables (Loading, Error, Empty)
├── hooks/              # Custom React hooks
│   ├── useGeolocation.ts
│   ├── useNearbyStations.ts
│   └── useAutoRefresh.ts
├── services/           # Services de communication externe
│   ├── citybikes-api.service.ts
│   ├── geolocation.service.ts
│   ├── distance.service.ts
│   └── network-finder.service.ts
├── lib/                # Logique métier pure
│   ├── station-filter.ts
│   ├── station-sorter.ts
│   └── constants.ts
├── types/              # Définitions TypeScript
├── config/             # Configuration (env, query-client)
├── middleware/         # Error handler, Logger
├── utils/              # Utilitaires (formatage)
└── assets/             # Ressources statiques

tests/                  # Tests organisés par type
├── unit/               # Tests unitaires
├── integration/        # Tests d'intégration
└── e2e/                # Tests end-to-end
```

📖 **Documentation détaillée de la structure** : [src/README.md](src/README.md)

---

## 🧪 Tests

```bash
# Tests unitaires
npm run test

# Tests avec interface UI
npm run test:ui

# Couverture de code
npm run test:coverage
```

---

## 🐳 Docker (Optionnel)

Services Docker pour le développement :
- **Redis** - Cache pour proxy API futur
- **Redis Commander** - UI de debug (http://localhost:8081)

```bash
# Démarrer les services
npm run docker:up

# Arrêter les services
npm run docker:down
```

---

## 🔧 Configuration

### Variables d'environnement (.env)

Toutes les variables sont préfixées par `VITE_` pour être exposées au client.

| Variable                          | Défaut                        | Description                          |
|-----------------------------------|-------------------------------|--------------------------------------|
| `VITE_CITYBIKES_API_URL`          | `https://api.citybik.es/v2`   | URL de base API CityBikes            |
| `VITE_SEARCH_RADIUS_METERS`       | `200`                         | Rayon de recherche (mètres)          |
| `VITE_MAX_STATIONS`               | `10`                          | Nombre max de stations affichées     |
| `VITE_GEOLOCATION_TIMEOUT`        | `10000`                       | Timeout géolocalisation (ms)         |
| `VITE_GEOLOCATION_HIGH_ACCURACY`  | `true`                        | Haute précision GPS                  |
| `VITE_AUTO_REFRESH_INTERVAL`      | `60000`                       | Intervalle auto-refresh (ms)         |
| `VITE_QUERY_STALE_TIME`           | `300000`                      | Cache React Query (ms)               |
| `VITE_DEBUG_MODE`                 | `false`                       | Logs détaillés en console            |

📄 **Voir le fichier complet** : [.env.example](.env.example)

---

## 📊 Middleware et Gestion d'Erreurs

### Error Handler (`src/middleware/error-handler.ts`)

Gestion centralisée des erreurs avec messages utilisateur friendly :

```typescript
import { handleError } from '@/middleware/error-handler'

try {
  await getCurrentPosition()
} catch (error) {
  const appError = handleError(error)
  console.error(appError.userMessage) // "🚫 Veuillez autoriser la géolocalisation"
}
```

**Types d'erreurs gérés :**
- ✅ Erreurs de géolocalisation (permission, timeout, indisponibilité)
- ✅ Erreurs réseau (fetch failed, timeout)
- ✅ Erreurs API (4xx, 5xx)
- ✅ Erreurs de validation

### Logger (`src/middleware/logger.ts`)

Logger structuré avec niveaux de log :

```typescript
import { logger } from '@/middleware/logger'

logger.info('User position acquired', { lat: 48.8566, lng: 2.3522 })
logger.error('API request failed', { endpoint: '/networks', status: 500 })
logger.performance('Geolocation acquired', 1234) // "⚡ Performance: Geolocation acquired (1234ms)"
```

**Niveaux disponibles :** `debug` | `info` | `warn` | `error`

---

## 📖 Exemple d'Utilisation

### Geolocation Service

```typescript
import { getCurrentPosition, isGeolocationAvailable } from '@/services/geolocation.service'

if (!isGeolocationAvailable()) {
  alert('Votre navigateur ne supporte pas la géolocalisation')
  return
}

try {
  const position = await getCurrentPosition()
  console.log(`Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`)
  console.log(`Précision: ${position.accuracy}m`)
} catch (error) {
  console.error(error.userMessage) // Message friendly
}
```

### Distance Calculator (Haversine)

```typescript
import { calculateDistance } from '@/services/distance.service'

const distance = calculateDistance(
  { latitude: 48.8566, longitude: 2.3522 }, // Paris
  { latitude: 48.8584, longitude: 2.3470 }  // Notre-Dame
)
console.log(`Distance: ${distance}m`) // ~450m
```

---

## 🚨 Risques Identifiés & Mitigations

| Risque                               | Mitigation                                              |
|--------------------------------------|---------------------------------------------------------|
| **CORS - Blocage API CityBikes**     | Proxy CORS via Docker Nginx (config fournie)            |
| **Performance API lente (>3s)**      | Cache React Query (5min) + Retry automatique (3x)       |
| **GPS imprécis mobile (±50m)**       | `enableHighAccuracy: true` + Timeout 10s                |
| **Aucune station disponible**        | Message explicite + Suggestion élargir rayon            |
| **Données API non temps réel**       | Timestamp dernière MAJ + Auto-refresh 60s               |

---

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

**Linting & Formatage automatique :**
```bash
npm run lint:fix && npm run format
```

---

## 📝 Licence

MIT - Voir le fichier [LICENSE](LICENSE)

---

## 🔗 Ressources

- **API CityBikes Documentation** : https://api.citybik.es/v2/
- **React Query Docs** : https://tanstack.com/query/latest
- **Vite Documentation** : https://vite.dev/
- **Tailwind CSS** : https://tailwindcss.com/

---

## 📧 Support

Pour toute question ou problème :
- Ouvrir une **Issue** sur GitHub
- Consulter la **documentation** dans `/src/README.md`

---

**Développé avec ❤️ pour simplifier l'usage des vélos partagés 🚴‍♀️**
