# ADR 002: Extraction de Service pour l'Orchestration

## Status
**Accepted** - 2025-01-15 (Refactoring CRAFT)

## Context
Le hook `useNearbyStations` contenait 304 lignes avec une fonction `performSearch` de 125 lignes et complexité cyclomatique de 15.

**Problèmes identifiés**:
1. **Violation SRP**: 9 responsabilités dans une seule fonction
2. **Testabilité**: Difficile de tester la logique sans React
3. **Réutilisabilité**: Impossible d'utiliser en dehors de React
4. **Maintenabilité**: Fonction trop longue et complexe

**Complexité avant refactoring**:
```
performSearch (lines 132-256):
- Validation input
- Finding network
- Fetching stations
- Filtering stations
- Sorting stations
- State management
- Performance tracking
- Error handling
- Logging

Cyclomatic Complexity: 15
Lines: 125
Parameters: 1 (+ 6 from closure)
```

## Decision
Extraction de la logique d'orchestration dans `StationSearchService`:

### Architecture
```
┌─────────────────────────────────────────────┐
│ Presentation Layer (React)                  │
│ - useNearbyStations (hook)                  │
│   → State management only                   │
│   → 120 lines (vs 304 before)              │
└─────────────────┬───────────────────────────┘
                  │ delegates to
┌─────────────────▼───────────────────────────┐
│ Application Layer (Service)                 │
│ - StationSearchService                      │
│   → Pure orchestration logic                │
│   → No React dependencies                   │
│   → 160 lines                               │
└─────────────────┬───────────────────────────┘
                  │ uses
┌─────────────────▼───────────────────────────┐
│ Domain Layer                                │
│ - findClosestNetwork()                      │
│ - fetchNetworkDetails()                     │
│ - filterStations()                          │
│ - sortAndLimit()                            │
└─────────────────────────────────────────────┘
```

### Implementation

**Service** (application logic):
```typescript
class StationSearchService {
  async search(
    location: Coordinates,
    options: SearchOptions
  ): Promise<SearchResult> {
    // 1. Validation
    validateCoordinates(location)

    // 2-5. Orchestration (delegate to domain services)
    const network = await findClosestNetwork(location)
    const details = await fetchNetworkDetails(network.id)
    const filtered = filterStations(details.stations, location, options)
    const sorted = sortAndLimit(filtered, options)

    return { stations: sorted, network, ... }
  }
}
```

**Hook** (state management only):
```typescript
function useNearbyStations(options) {
  const [state, setState] = useState(...)

  const performSearch = async (location) => {
    setState({ isLoading: true })

    // Delegate to service (1 line!)
    const result = await stationSearchService.search(location, options)

    setState({ stations: result.stations, isLoading: false })
  }

  return { ...state, search: performSearch }
}
```

## Consequences

### Positives ✅
1. **Complexité réduite**:
   - Hook: 15 → 5 cyclomatic complexity
   - Fonction performSearch: 125 → 25 lines

2. **Testabilité améliorée**:
   - Service testable sans React Testing Library
   - Tests unitaires purs (plus rapides)
   - Pas de mocks React nécessaires

3. **Réutilisabilité**:
   - Service utilisable en CLI, Mobile, Tests E2E
   - Pas de dépendance framework

4. **Maintenabilité**:
   - Responsabilité unique claire
   - Moins de lignes à lire
   - Modification plus sûre

### Negatives ⚠️
1. **Indirection**: Une couche supplémentaire
2. **Fichiers additionnels**: +1 fichier service
3. **Verbosité**: Interfaces supplémentaires

### Mitigations
- Documentation claire de l'architecture (ADR)
- Naming explicite (`StationSearchService`)
- Co-location des fichiers (dossier `services/`)

## Metrics

### Before Refactoring
| Metric | Value |
|--------|-------|
| Lines (hook) | 304 |
| Lines (performSearch) | 125 |
| Cyclomatic Complexity | 15 |
| Responsibilities | 9 |
| Testable without React | ❌ No |

### After Refactoring
| Metric | Value | Change |
|--------|-------|--------|
| Lines (hook) | 120 | -60% ✅ |
| Lines (performSearch) | 25 | -80% ✅ |
| Cyclomatic Complexity | 5 | -67% ✅ |
| Responsibilities | 1 (state) | -89% ✅ |
| Testable without React | ✅ Yes | +100% ✅ |
| Service Lines | 160 | New |
| Total Lines | 280 | -8% |

**Net benefit**: -24 lines, -67% complexity, +testability

## Alternatives Considered

### Alternative 1: Keep in Hook
**Rejected**: Violates SRP, impossible to test without React

### Alternative 2: Multiple Small Hooks
**Rejected**: Composition nightmare, shared state problematic

### Alternative 3: Custom Hook + Headless Hook
**Rejected**: Over-engineering for this use case

## Related Decisions
- ADR 001: Domain-Driven Design
- ADR 003: Error Factory Pattern (eliminates duplication)

## Migration Path
1. ✅ Create `StationSearchService`
2. ✅ Create `useNearbyStations.refactored.ts`
3. ⏳ Update imports gradually
4. ⏳ Deprecate old hook
5. ⏳ Remove old hook after migration

**Status**: Step 2/5 complete

## References
- Martin Fowler, "Refactoring" - Extract Method/Class
- Robert C. Martin, "Clean Architecture" - Dependency Rule
- [React Hooks Best Practices](https://react.dev/learn/reusing-logic-with-custom-hooks)
