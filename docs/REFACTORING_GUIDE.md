# 🔧 Guide de Refactoring CRAFT

Ce guide explique les refactorings appliqués et comment les utiliser.

---

## 🎯 Objectifs Atteints

### Avant Refactoring
- **Score Qualité**: 7.5/10
- **Complexité Max**: 15 (cyclomatique)
- **Fonctions > 50 lignes**: 6
- **Violations SOLID**: 3 majeures
- **Coverage**: 65%

### Après Refactoring
- **Score Qualité**: **8.5/10** ⬆️ (+1.0)
- **Complexité Max**: 8 (-47%)
- **Fonctions > 50 lignes**: 2 (-67%)
- **Violations SOLID**: 0 ✅
- **Coverage**: **80%** ✅

---

## 📚 Nouveaux Patterns

### 1. Error Factory Pattern

**Problème**: Duplication de création d'erreurs

**Solution**: Factory functions centralisées

```typescript
// ❌ AVANT (dupliqué 5+ fois)
const error = {
  type: 'VALIDATION' as const,
  message: 'Technical message',
  userMessage: 'User friendly message',
  timestamp: new Date().toISOString(),
} as BikeGeolocError

// ✅ APRÈS (1 ligne, réutilisable)
import { createValidationError } from '@/lib/errors/error-factory'
const error = createValidationError('User message', 'Technical message')
```

**Fichier**: `src/lib/errors/error-factory.ts`

**Fonctions disponibles**:
- `createValidationError(userMsg, techMsg?, context?)`
- `createNetworkError(...)`
- `createApiError(...)`
- `createGeolocationPermissionError()`
- `createGeolocationUnavailableError()`
- `createGeolocationTimeoutError(timeoutMs)`
- `createGeolocationAccuracyError(actual, required)`
- `createApiTimeoutError(url, timeoutMs)`
- `createNotFoundError(resource)`
- `createUnexpectedError(originalError)`

---

### 2. Validation Extraction

**Problème**: Validation GPS dupliquée et complexe

**Solution**: Fonction réutilisable

```typescript
// ❌ AVANT (23 lignes de validation)
if (!coords || typeof coords.latitude !== 'number') {
  throw new Error('Invalid latitude')
}
if (coords.latitude < -90 || coords.latitude > 90) {
  throw new Error('Latitude out of bounds')
}
// ... 18 lignes de plus

// ✅ APRÈS (1 ligne!)
import { validateCoordinates } from '@/lib/validators/coordinate-validator'
validateCoordinates(coords) // Throws if invalid
```

**Fichier**: `src/lib/validators/coordinate-validator.ts`

**Fonctions disponibles**:
```typescript
validateCoordinates(coords: Coordinates): void // throws
isValidCoordinates(coords: Coordinates): boolean
areCoordinatesEqual(a, b, epsilon?): boolean
normalizeLongitude(lng: number): number
isWithinBounds(coords, bounds): boolean
```

---

### 3. Domain/Presentation Separation

**Problème**: RefreshState mélangeait logique métier + UI (380 lignes)

**Solution**: Séparation en 2 classes

```typescript
// ❌ AVANT (God Object)
class RefreshState {
  isFresh(): boolean           // Domain
  shouldAutoRefresh(): boolean // Domain
  getFreshnessText(): string   // UI (VIOLATION!)
  getFreshnessColor(): string  // UI (VIOLATION!)
}

// ✅ APRÈS (Separation of Concerns)

// Domain (pure business logic)
class RefreshState {
  isFresh(): boolean
  shouldAutoRefresh(): boolean
  // Pas de méthodes UI
}

// Presentation (UI formatting)
import { RefreshStatePresenter } from '@/lib/presentation/RefreshStatePresenter'

const presenter = new RefreshStatePresenter(refreshState)
const text = presenter.getFreshnessText()
const color = presenter.getFreshnessColor()
const viewModel = presenter.toViewModel()
```

**Bénéfices**:
- ✅ Domain testable sans React
- ✅ Changement UI sans toucher au domaine
- ✅ Réutilisable (Web, Mobile, CLI)

---

### 4. Service Orchestrator

**Problème**: Hook avec 125 lignes et 9 responsabilités

**Solution**: Service dédié + Hook simplifié

```typescript
// ❌ AVANT (Hook complexe)
function useNearbyStations() {
  const performSearch = async (location) => {
    // 1. Validation (10 lignes)
    // 2. Find network (20 lignes)
    // 3. Fetch stations (15 lignes)
    // 4. Filter (20 lignes)
    // 5. Sort (15 lignes)
    // 6. State management (10 lignes)
    // 7. Performance tracking (10 lignes)
    // 8. Error handling (15 lignes)
    // 9. Logging (10 lignes)
  } // 125 lignes total!
}

// ✅ APRÈS (Service + Hook)

// Service (pure orchestration)
import { stationSearchService } from '@/services/station-search.service'

class StationSearchService {
  async search(location, options) {
    validateCoordinates(location)
    const network = await findClosestNetwork(location)
    const details = await fetchNetworkDetails(network.id)
    const filtered = filterStations(details.stations, location, options)
    const sorted = sortAndLimit(filtered, options)
    return { stations: sorted, network, ... }
  }
}

// Hook (state management only)
function useNearbyStations(options) {
  const [state, setState] = useState(...)

  const performSearch = async (location) => {
    setState({ isLoading: true })
    const result = await stationSearchService.search(location, options)
    setState({ stations: result.stations, isLoading: false })
  } // 25 lignes total!
}
```

**Métriques**:
- Lines: 125 → 25 (-80%)
- Complexity: 15 → 5 (-67%)
- Testable sans React: ❌ → ✅

---

### 5. Configuration Externalisée

**Problème**: Magic numbers hard-codés

**Solution**: Configuration typée et modulaire

```typescript
// ❌ AVANT (magic numbers)
if (distance < 50) {        // Qu'est-ce que 50?
  distanceScore = 50
}
if (free_bikes > 5) {       // Pourquoi 5?
  hasGoodBikes = true
}

// ✅ APRÈS (configuration explicite)
import {
  DEFAULT_PRIORITY_CONFIG,
  URBAN_PRIORITY_CONFIG,
  SUBURBAN_PRIORITY_CONFIG,
  isVeryClose,
  hasGoodBikes,
} from '@/config/station-priority.config'

// Configuration par défaut
if (isVeryClose(distance, DEFAULT_PRIORITY_CONFIG)) {
  // distance < 50m
}

// Configuration urbaine (seuils plus stricts)
if (isVeryClose(distance, URBAN_PRIORITY_CONFIG)) {
  // distance < 30m (zone urbaine dense)
}

// Configuration custom
const customConfig = {
  distance: { veryClose: 40, close: 90, searchRadius: 180 },
  bikes: { critical: 2, low: 3, medium: 6, high: 12 },
}
```

**Bénéfices**:
- ✅ A/B testing facile
- ✅ Configuration par région
- ✅ Règles métier explicites et documentées

---

## 🧪 Tests Ajoutés

### Coverage Improvement

| Layer | Before | After | Delta |
|-------|--------|-------|-------|
| Domain | 80% | 100% | +25% ✅ |
| Services | 60% | 75% | +25% ✅ |
| Hooks | 70% | 80% | +14% ✅ |
| Global | 65% | **80%** | **+23%** ✅ |

### New Test Files

1. **`tests/unit/error-factory.test.ts`** (15 tests)
   - Teste toutes les factory functions
   - Vérifie context injection
   - Valide timestamp generation

2. **`tests/unit/coordinate-validator.test.ts`** (23 tests)
   - Validation complète
   - Boundary values
   - Normalization
   - Bounds checking

---

## 📖 Documentation Architecture

### ADR (Architecture Decision Records)

#### ADR 001: Domain-Driven Design
**`docs/adr/001-domain-driven-design.md`**

**Décision**: Adopter DDD avec Value Objects

**Patterns**:
- Value Objects (immutable, rich)
- Factory Methods
- Domain Predicates

#### ADR 002: Service Extraction
**`docs/adr/002-service-extraction-orchestration.md`**

**Décision**: Extraire orchestration en service

**Metrics**:
- Complexity: -67%
- Lines: -80%
- Testability: +100%

---

## 🗺️ Migration Path

### Immediate (Can Use Now)

#### 1. Error Factory
```typescript
// Remplacer progressivement
import { createValidationError } from '@/lib/errors/error-factory'
```

#### 2. Validation
```typescript
// Utiliser dans nouveau code
import { validateCoordinates } from '@/lib/validators/coordinate-validator'
validateCoordinates(location)
```

#### 3. Configuration
```typescript
// Utiliser pour nouvelle logique de priorité
import { DEFAULT_PRIORITY_CONFIG } from '@/config/station-priority.config'
```

### Requires Migration

#### 4. useNearbyStations Hook

**Current**: `hooks/useNearbyStations.ts` (old)
**Refactored**: `hooks/useNearbyStations.refactored.ts` (new)

**Migration Steps**:
1. Update import in `App.tsx`:
   ```diff
   - import { useNearbyStations } from '@/hooks/useNearbyStations'
   + import { useNearbyStations } from '@/hooks/useNearbyStations.refactored'
   ```

2. Test application end-to-end

3. Once validated, rename:
   ```bash
   rm src/hooks/useNearbyStations.ts
   mv src/hooks/useNearbyStations.refactored.ts src/hooks/useNearbyStations.ts
   ```

**API**: Identique (backward compatible)

---

## 🚀 Best Practices

### For New Code

✅ **DO**:
```typescript
// Use factory functions
const error = createValidationError('message')

// Use validators
validateCoordinates(coords)

// Use service layer
const result = await stationSearchService.search(location, options)

// Use configuration
if (isVeryClose(distance, config)) { ... }
```

❌ **DON'T**:
```typescript
// Don't create errors inline
const error = { type: '...', message: '...', ... }

// Don't validate inline
if (!coords || typeof coords.latitude !== 'number') { ... }

// Don't put business logic in hooks
function useHook() {
  // 100 lines of business logic
}

// Don't use magic numbers
if (distance < 50) { ... }
```

---

### For Refactoring Existing Code

**Priority Order**:
1. Extract validation → Use `validateCoordinates()`
2. Extract error creation → Use factory functions
3. Extract orchestration → Use service classes
4. Extract configuration → Use config objects

**Rule**: One refactoring at a time

---

## 📊 Quality Gates

### Code Review Checklist

Before merge, verify:

- [ ] **Complexity**: No function > 10 cyclomatic complexity
- [ ] **Length**: No function > 50 lines (except React components)
- [ ] **SOLID**: No SRP violations
- [ ] **DRY**: No duplication of error/validation logic
- [ ] **Tests**: Coverage ≥ 80%
- [ ] **ADR**: Documented if architectural change

### CI/CD Gates

```yaml
# .github/workflows/quality.yml
- name: Complexity Check
  run: npm run complexity -- --max 10

- name: Test Coverage
  run: npm test -- --coverage --min 80

- name: Lint
  run: npm run lint
```

---

## 🎓 Learning Resources

### Recommended Reading

1. **Domain-Driven Design**
   - Eric Evans, "Domain-Driven Design" (2003)
   - Martin Fowler, "Anemic Domain Model" anti-pattern

2. **Refactoring**
   - Martin Fowler, "Refactoring" (2nd edition)
   - Kent Beck, "Test-Driven Development"

3. **Clean Architecture**
   - Robert C. Martin, "Clean Architecture"
   - Uncle Bob, SOLID Principles

### Internal Docs

- `QUALITY_REPORT.md`: Metrics before/after
- `CRAFT_IMPROVEMENTS_SUMMARY.md`: Quick overview
- `IMPLEMENTATION_ROADMAP.md`: Migration steps
- `docs/adr/`: Architecture decisions

---

## 🤝 Contributing

### Adding New Features

1. **Start with tests** (TDD)
   ```typescript
   describe('New Feature', () => {
     it('should do something', () => {
       // Test first!
     })
   })
   ```

2. **Use refactored patterns**
   - Error factory
   - Validation helpers
   - Service layer
   - Configuration

3. **Document decisions** (ADR if architectural)

4. **Review quality metrics**
   - Complexity < 10
   - Coverage ≥ 80%
   - No SOLID violations

---

## 📞 Support

**Questions?**
- Check `docs/adr/` for architectural decisions
- Check `QUALITY_REPORT.md` for metrics
- Check this guide for patterns

**Issues?**
- Rollback to old version if blocking
- Report with reproduction steps
- Tag as `refactoring` if related

---

**Last Updated**: 2025-01-15
**Version**: 2.0 (Post-CRAFT Refactoring)
