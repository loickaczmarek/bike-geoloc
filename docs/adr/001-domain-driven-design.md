# ADR 001: Adoption du Domain-Driven Design

## Status
**Accepted** - 2025-01-15

## Context
L'application doit gérer plusieurs concepts métier complexes:
- Priorisation des stations (distance + disponibilité)
- État de rafraîchissement avec règles de fraîcheur
- Filtrage et tri de stations selon critères multiples

**Problème**: Comment organiser la logique métier pour qu'elle soit:
- Testable indépendamment de l'UI
- Réutilisable
- Compréhensible par les non-développeurs (Product Owners)
- Facile à maintenir et faire évoluer

## Decision
Nous adoptons le Domain-Driven Design (DDD) avec les patterns suivants:

### 1. Value Objects
Objets immutables encapsulant la logique métier

**Exemples**:
- `StationPriority`: Calcul de priorité des stations
- `RefreshState`: État et règles de fraîchissement

**Avantages**:
- Logique métier co-localisée avec les données
- Pas d'anemic models (modèles riches)
- Type-safe avec TypeScript
- Testabilité maximale

```typescript
// Avant (anemic model)
interface Station {
  distance: number
  freeBikes: number
}

function isOptimal(station: Station): boolean {
  return station.distance < 50 && station.freeBikes > 5
}

// Après (rich domain model)
class StationPriority {
  static fromStation(station: Station): StationPriority
  isOptimal(): boolean
  needsWarning(): boolean
  getRecommendationScore(): number
}
```

### 2. Factory Methods
Construction contrôlée avec validation

**Pattern**:
```typescript
class RefreshState {
  private constructor() {} // Pas de new direct

  static initial(): RefreshState
  static fromTimestamp(date: Date): RefreshState
  static refreshing(lastUpdate: Date): RefreshState
}
```

**Avantages**:
- Validation à la construction
- API claire et intentionnelle
- Évite les états invalides

### 3. Séparation Domain / Presentation
- **Domain Layer**: Règles métier pures (ne dépend pas de React/UI)
- **Presentation Layer**: Formatage pour l'UI (RefreshStatePresenter)

**Bénéfices**:
- Domain model testable sans framework UI
- Réutilisable (Web, Mobile, CLI)
- Single Responsibility Principle respecté

## Consequences

### Positives ✅
- **Testabilité**: 100% de couverture possible sur le domaine
- **Maintenabilité**: Règles métier centralisées
- **Évolutivité**: Facile d'ajouter de nouvelles règles
- **Documentation**: Le code est la documentation
- **Type Safety**: Compilation garantit la cohérence

### Negatives ⚠️
- **Courbe d'apprentissage**: Patterns DDD pour nouveaux développeurs
- **Verbosité**: Plus de code que des fonctions simples
- **Performance**: Factory methods + immutability (négligeable en pratique)

### Mitigations
- Documentation ADR et exemples
- Revues de code systématiques
- Formation à DDD pour l'équipe

## Alternatives Considered

### Alternative 1: Functional Programming pur
**Rejetée car**: TypeScript n'a pas les outils FP (pattern matching, types ADT)

### Alternative 2: Anemic Models + Services
**Rejetée car**: Logique métier dispersée, difficile à tester et maintenir

## Related Decisions
- ADR 002: Separation Domain/Presentation
- ADR 003: Value Objects Immutability

## References
- Eric Evans, "Domain-Driven Design" (2003)
- Martin Fowler, "Anemic Domain Model" anti-pattern
- [TypeScript DDD Patterns](https://github.com/node-typescript-boilerplate/node-typescript-boilerplate)
