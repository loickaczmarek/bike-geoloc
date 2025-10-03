# 🗺️ Roadmap d'Implémentation - Refactoring CRAFT

**Objectif**: Migrer progressivement vers le code refactorisé sans casser l'application

---

## ✅ Phase 1: Foundation (COMPLETED)

### 1.1 Error Management ✅
- [x] Créer `lib/errors/error-factory.ts`
- [x] Tests: 15 tests, 100% coverage
- [x] **Action**: Aucune migration requise (backward compatible)

**Utilisation immédiate possible**:
```typescript
// Remplacer progressivement les créations d'erreur inline
import { createValidationError } from '@/lib/errors/error-factory'
```

---

### 1.2 Validation Layer ✅
- [x] Créer `lib/validators/coordinate-validator.ts`
- [x] Tests: 23 tests, 100% coverage
- [x] **Action**: Peut être utilisé immédiatement

**Migration suggérée**:
```typescript
// Dans network-finder.service.ts (lines 58-72)
// AVANT
if (!userLocation || typeof userLocation.latitude !== 'number') {
  throw new Error('Invalid userLocation: latitude is required')
}

// APRÈS
import { validateCoordinates } from '@/lib/validators/coordinate-validator'
validateCoordinates(userLocation) // Plus simple!
```

---

### 1.3 Presentation Layer ✅
- [x] Créer `lib/presentation/RefreshStatePresenter.ts`
- [x] Marquer méthodes RefreshState comme @deprecated
- [x] **Action**: Migration optionnelle (backward compatible)

**Migration future** (optionnel, pour nouveau code):
```typescript
// AVANT (deprecated mais fonctionne)
const text = refreshState.getFreshnessText()

// APRÈS (nouveau pattern)
const presenter = new RefreshStatePresenter(refreshState)
const text = presenter.getFreshnessText()
```

---

### 1.4 Configuration ✅
- [x] Créer `config/station-priority.config.ts`
- [x] **Action**: Peut être utilisé immédiatement

**Utilisation**:
```typescript
// Dans nouveau code utilisant StationPriority
import { DEFAULT_PRIORITY_CONFIG } from '@/config/station-priority.config'

// Permet facilement de tester différentes configurations
const score = calculateScore(station, URBAN_PRIORITY_CONFIG)
```

---

### 1.5 Service Layer ✅
- [x] Créer `services/station-search.service.ts`
- [x] Créer `hooks/useNearbyStations.refactored.ts`
- [x] **Action**: MIGRATION REQUISE (breaking change potentiel)

---

## 🔄 Phase 2: Migration (CURRENT)

### 2.1 Migration useNearbyStations (Priority: HIGH)

**Status**: ⏳ In Progress

**Steps**:

#### Step 1: Deprecate Old Hook ✅ (À faire)
```typescript
// src/hooks/useNearbyStations.ts
/**
 * @deprecated Use useNearbyStations from 'hooks/useNearbyStations.refactored'
 * This version will be removed in v2.0
 * Migration guide: See IMPLEMENTATION_ROADMAP.md
 */
export function useNearbyStations(options) {
  // Keep current implementation
}
```

#### Step 2: Update Imports (Progressive)
Fichiers à mettre à jour:
- [ ] `src/App.tsx` (ligne 12)

```diff
// src/App.tsx
- import { useNearbyStations } from '@/hooks/useNearbyStations'
+ import { useNearbyStations } from '@/hooks/useNearbyStations.refactored'
```

**Tests à adapter**: Aucun (API identique)

#### Step 3: Validate (Testing)
```bash
npm run dev
# Vérifier que l'application fonctionne
# Tester le flux complet: géolocalisation → recherche → affichage

npm test
# Tous les tests doivent passer
```

#### Step 4: Remove Old Hook (Après validation)
```bash
# Supprimer ancien fichier
rm src/hooks/useNearbyStations.ts

# Renommer refactored → standard
mv src/hooks/useNearbyStations.refactored.ts src/hooks/useNearbyStations.ts
```

---

### 2.2 Migration Error Factory (Priority: MEDIUM)

**Status**: ⏳ Pending

**Fichiers à migrer**:

#### File 1: `useNearbyStations.ts` (lines 136-141, 263-268)
```diff
- const validationError = {
-   type: 'VALIDATION' as const,
-   message: 'User location is required',
-   userMessage: '⚠️ Position GPS requise',
-   timestamp: new Date().toISOString(),
- } as BikeGeolocError

+ import { createValidationError } from '@/lib/errors/error-factory'
+ const validationError = createValidationError(
+   '⚠️ Position GPS requise',
+   'User location is required'
+ )
```

**Impact**: -10 lignes, +lisibilité

---

#### File 2: `useGeolocation.ts` (lignes similaires)
Même pattern de migration

**Estimated Effort**: 30 minutes

---

### 2.3 Migration Validation (Priority: MEDIUM)

**Status**: ⏳ Pending

#### File: `network-finder.service.ts` (lines 58-80)

**Avant** (23 lignes de validation):
```typescript
// Validation inline complexe
if (!userLocation || typeof userLocation.latitude !== 'number') {
  throw new Error('Invalid userLocation: latitude is required')
}

if (typeof userLocation.longitude !== 'number') {
  throw new Error('Invalid userLocation: longitude is required')
}

if (userLocation.latitude < -90 || userLocation.latitude > 90) {
  throw new Error(`Invalid latitude: ${userLocation.latitude}`)
}

if (userLocation.longitude < -180 || userLocation.longitude > 180) {
  throw new Error(`Invalid longitude: ${userLocation.longitude}`)
}
```

**Après** (1 ligne):
```typescript
import { validateCoordinates } from '@/lib/validators/coordinate-validator'

validateCoordinates(userLocation)
```

**Impact**: -22 lignes, +robustesse (meilleurs messages d'erreur)

**Estimated Effort**: 15 minutes

---

## 🚧 Phase 3: Remaining Refactorings (FUTURE)

### 3.1 Refactor fetchPosition (Priority: HIGH)

**File**: `src/hooks/useGeolocation.ts`
**Current**: 102 lines, complexity 12
**Target**: 50 lines, complexity 6

**Plan**:
1. Extract `validateGeolocationResult(result, maxAccuracy)`
2. Extract `RetryManager` class
3. Simplify main function

**Estimated Effort**: 2-3 hours

---

### 3.2 Break Down StationList (Priority: LOW)

**File**: `src/components/StationList/StationList.tsx`
**Current**: 209 lines
**Target**: 3 components (70 lines each)

**Plan**:
1. Extract `StationListHeader.tsx`
2. Extract `StationListControls.tsx`
3. Extract `StationGrid.tsx`
4. Keep `StationList.tsx` as orchestrator

**Estimated Effort**: 3-4 hours

---

### 3.3 Add Missing Tests (Priority: HIGH)

**Status**: ⏳ Pending

**Tests to Add**:

#### 3.3.1 StationSearchService (Integration)
```typescript
// tests/integration/station-search.service.test.ts
describe('StationSearchService', () => {
  it('should search stations successfully')
  it('should throw on invalid coordinates')
  it('should filter by distance')
  it('should sort by distance')
  it('should limit results')
})
```

**Estimated**: 20 tests, 2 hours

---

#### 3.3.2 RefreshStatePresenter (Unit)
```typescript
// tests/unit/RefreshStatePresenter.test.ts
describe('RefreshStatePresenter', () => {
  it('should format FRESH state')
  it('should format STALE state')
  it('should return badge for stale')
  it('should format relative time')
  it('should generate view model')
})
```

**Estimated**: 15 tests, 1 hour

---

#### 3.3.3 useNearbyStations.refactored (React Testing Library)
```typescript
// tests/unit/useNearbyStations.refactored.test.ts
describe('useNearbyStations (refactored)', () => {
  it('should fetch stations on search')
  it('should handle errors')
  it('should refetch on demand')
  it('should validate location')
})
```

**Estimated**: 18 tests, 2 hours

---

## 📊 Progress Tracking

### Overall Progress

| Phase | Tasks | Completed | Progress |
|-------|-------|-----------|----------|
| **Phase 1: Foundation** | 5 | 5 | 100% ✅ |
| **Phase 2: Migration** | 3 | 0 | 0% ⏳ |
| **Phase 3: Future** | 3 | 0 | 0% 🔵 |
| **TOTAL** | 11 | 5 | **45%** |

---

### Detailed Checklist

#### Foundation (5/5) ✅
- [x] Error Factory + Tests
- [x] Validation Layer + Tests
- [x] Presentation Layer
- [x] Configuration
- [x] Service Orchestrator

#### Migration (0/3) ⏳
- [ ] Migrate useNearbyStations imports
- [ ] Migrate error creation to factory
- [ ] Migrate validation to helper

#### Testing (0/3) 🔵
- [ ] StationSearchService integration tests
- [ ] RefreshStatePresenter unit tests
- [ ] useNearbyStations.refactored tests

#### Future Refactorings (0/3) 🔵
- [ ] Refactor fetchPosition
- [ ] Break down StationList
- [ ] Add Dependency Injection

---

## 🎯 Sprint Planning

### Sprint +1 (Next 2 Weeks)
**Goal**: Complete Phase 2 Migration

**Tasks**:
1. **Day 1-2**: Migrate useNearbyStations
   - Deprecate old hook
   - Update App.tsx import
   - Validate functionality

2. **Day 3-4**: Migrate error factory
   - Update useNearbyStations
   - Update useGeolocation
   - Run full test suite

3. **Day 5**: Migrate validation
   - Update network-finder.service
   - Validate error messages

4. **Day 6-7**: Add missing tests
   - StationSearchService integration
   - RefreshStatePresenter unit

5. **Day 8**: Validation & Documentation
   - Full regression testing
   - Update QUALITY_REPORT.md

**Estimated Velocity**: 80% confidence

---

### Sprint +2 (Weeks 3-4)
**Goal**: Complete Phase 3 Refactorings

**Tasks**:
1. Refactor fetchPosition
2. Break down StationList
3. Add remaining tests
4. Performance benchmarking

---

## 🚀 Quick Start Guide

### For New Features

**Always use refactored code**:
```typescript
// ✅ DO
import { createValidationError } from '@/lib/errors/error-factory'
import { validateCoordinates } from '@/lib/validators/coordinate-validator'
import { stationSearchService } from '@/services/station-search.service'

// ❌ DON'T
// Create errors inline
// Validate inline
// Use deprecated hooks
```

---

### For Bug Fixes

**Priority**:
1. Fix bug in current code
2. Add regression test
3. **Then** migrate to refactored version (if touched)

**Don't**: Block bugfixes on refactoring

---

## 📞 Help & Support

### Questions?
- **ADR**: Check `docs/adr/` for architectural decisions
- **Quality Report**: Check `QUALITY_REPORT.md` for metrics
- **Summary**: Check `CRAFT_IMPROVEMENTS_SUMMARY.md` for overview

### Found Issues?
1. Check if related to refactoring
2. If yes: Rollback to previous version
3. Report in issue tracker with:
   - File affected
   - Expected vs Actual behavior
   - Steps to reproduce

---

**Last Updated**: 2025-01-15
**Next Review**: After Sprint +1 completion
