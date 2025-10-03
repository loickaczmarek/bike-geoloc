# 🎬 GUIDE DE DÉMARRAGE RAPIDE

## ✅ Étape 1 : Installation

```bash
npm install
```

**Ce qui est installé :**
- React 18 + TypeScript
- TanStack Query (gestion cache + auto-refresh)
- Tailwind CSS (styles responsive)
- Vitest + Testing Library (tests)
- ESLint + Prettier (linting & formatage)

---

## ✅ Étape 2 : Configuration (Optionnel)

Le projet fonctionne avec les valeurs par défaut. Pour personnaliser :

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer les variables si besoin
nano .env
```

**Configuration par défaut :**
- ✅ Rayon de recherche : **200m**
- ✅ Stations max : **10**
- ✅ Auto-refresh : **60s**

---

## ✅ Étape 3 : Lancer l'application

```bash
npm run dev
```

🎉 **Application disponible sur http://localhost:3000**

---

## 🔧 Commandes de Développement

### Développement
```bash
npm run dev           # Démarre le serveur (port 3000)
npm run build         # Build de production
npm run preview       # Prévisualise le build
```

### Qualité du code
```bash
npm run lint          # Analyse ESLint
npm run lint:fix      # Corrige automatiquement
npm run format        # Formatte avec Prettier
npm run type-check    # Vérifie TypeScript
```

### Tests
```bash
npm run test          # Lance les tests
npm run test:ui       # Interface UI pour tests
npm run test:coverage # Couverture de code
```

### Docker (Optionnel)
```bash
npm run docker:up     # Lance Redis (cache futur)
npm run docker:down   # Arrête les services
```

---

## 📦 Structure des Fichiers Créés

```
✅ package.json              # Dépendances + scripts
✅ tsconfig.json             # Configuration TypeScript (strict mode)
✅ vite.config.ts            # Configuration Vite + path aliases
✅ tailwind.config.js        # Thème Tailwind personnalisé
✅ eslint.config.js          # Règles ESLint + TypeScript
✅ .prettierrc               # Formatage code
✅ .env.example              # Variables d'environnement
✅ .env                      # Config locale (dev)
✅ docker-compose.yml        # Redis (optionnel)
✅ README.md                 # Documentation complète

src/
  ✅ middleware/
     ├── error-handler.ts   # Gestion centralisée erreurs
     └── logger.ts          # Logger structuré
  ✅ services/
     ├── geolocation.service.ts  # Géolocalisation navigateur
     └── distance.service.ts     # Calcul Haversine
  ✅ types/
     ├── geolocation.types.ts
     ├── citybikes.types.ts
     └── station.types.ts
  ✅ lib/
     └── constants.ts       # Constantes app (rayon, etc.)
  ✅ config/
     └── env.ts             # Validation variables env
  ✅ index.css              # Styles Tailwind
  ✅ vite-env.d.ts          # Types environnement

tests/
  ✅ setup.ts               # Configuration Vitest

.vscode/
  ✅ extensions.json        # Extensions recommandées
  ✅ settings.json          # Config ESLint + Prettier auto
```

---

## 🧪 Vérifier l'Installation

### 1. Test TypeScript
```bash
npm run type-check
```
✅ **Attendu :** "Aucune erreur TypeScript"

### 2. Test Linting
```bash
npm run lint
```
✅ **Attendu :** "Aucune erreur ESLint"

### 3. Test Build
```bash
npm run build
```
✅ **Attendu :** Dossier `dist/` créé avec fichiers optimisés

---

## 📚 Prochaines Étapes

### Phase 1 : Core Services ✅
- ✅ Middleware (error-handler, logger)
- ✅ Geolocation Service (avec exemples)
- ✅ Distance Service (Haversine)
- ✅ Types TypeScript complets

### Phase 2 : API Integration (à développer)
- ⏳ CityBikes API Service
- ⏳ Network Finder Service
- ⏳ Station Filter & Sorter

### Phase 3 : React Components (à développer)
- ⏳ Custom Hooks (useGeolocation, useNearbyStations)
- ⏳ Station List UI
- ⏳ Error/Loading/Empty States

---

## 🆘 Troubleshooting

### Port 3000 déjà utilisé
```bash
# Modifier le port dans vite.config.ts (ligne server.port)
# ou tuer le processus occupant le port
lsof -ti:3000 | xargs kill -9
```

### Erreur CORS API CityBikes
```bash
# Lancer le proxy Docker CORS
npm run docker:up
# Puis modifier VITE_CITYBIKES_API_URL dans .env
```

### Problème de géolocalisation (HTTPS requis)
- ✅ En dev : `localhost` fonctionne sans HTTPS
- ⚠️ En prod : Nécessite HTTPS (Vercel/Netlify le gèrent)

---

## 🎯 Exemple de Développement

### Tester le Geolocation Service

Créer un fichier `src/test-geo.ts` :

```typescript
import { getCurrentPosition } from '@/services/geolocation.service'
import { logger } from '@/middleware/logger'

async function testGeo() {
  try {
    const position = await getCurrentPosition()
    logger.info('Position acquise!', {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: `${position.accuracy}m`
    })
  } catch (error) {
    logger.error('Erreur géolocalisation', error)
  }
}

testGeo()
```

Lancer : `npm run dev` puis ouvrir la console navigateur

---

## ✅ Checklist Installation Complète

- [ ] `npm install` réussi
- [ ] `.env` créé (optionnel)
- [ ] `npm run dev` démarre sans erreur
- [ ] http://localhost:3000 accessible
- [ ] `npm run type-check` sans erreur
- [ ] `npm run lint` sans erreur
- [ ] Extensions VSCode recommandées installées
- [ ] Formatage auto à la sauvegarde activé

---

**🎉 Prêt à développer ! Consultez README.md pour la documentation complète.**
