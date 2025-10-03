# 📘 Runbook Opérationnel - Bike Geoloc

**Version**: 1.0
**Dernière mise à jour**: 2025-01-15
**Équipe**: DevOps & SRE

---

## 🎯 Vue d'ensemble

### Architecture
- **Type**: Application web frontend-only (SPA React)
- **Stack**: React 18 + TypeScript + Vite
- **API externe**: CityBikes API (https://api.citybik.es/v2)
- **Hébergement**: Vercel (staging + production)
- **Container**: Docker + nginx

### Points de contact
- **Équipe Dev**: dev@bike-geoloc.app
- **Équipe Ops**: ops@bike-geoloc.app
- **On-call**: +33 X XX XX XX XX
- **Slack**: #bike-geoloc-alerts

---

## 🚀 Déploiement

### Prérequis
- Node.js 20+
- npm 9+
- Docker 24+ (optionnel)

### Déploiement local

```bash
# Installation
npm install

# Développement
npm run dev

# Production (build + preview)
npm run build
npm run preview
```

### Déploiement Docker

```bash
# Development
docker-compose up app-dev

# Production
docker-compose up app-prod

# Build manuel
docker build -t bike-geoloc:latest .
docker run -p 8080:8080 bike-geoloc:latest
```

### Déploiement CI/CD

**Staging** (automatique sur `main`):
```bash
git push origin main
# → GitHub Actions CI/CD
# → Déploiement automatique sur staging
# → URL: https://staging.bike-geoloc.app
```

**Production** (tag version):
```bash
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
# → GitHub Actions CI/CD
# → Déploiement sur production
# → URL: https://bike-geoloc.app
```

---

## 🔍 Monitoring

### Health Checks

**Endpoints**:
- `/health` - Health check global
- Attendu: `{"status":"UP","timestamp":"..."}`

**Kubernetes probes**:
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Métriques clés

| Métrique | Seuil | Action |
|----------|-------|--------|
| Disponibilité | > 99.9% | Alerte si < 99.5% |
| Temps de chargement | < 3s | Investigation si > 5s |
| Erreurs API CityBikes | < 1% | Alerte si > 5% |
| Build size | < 5MB | Warning si > 5MB |
| Coverage | ≥ 80% | CI fail si < 80% |

### Logs

**Accès aux logs**:
```bash
# Docker local
docker logs bike-geoloc-prod -f

# Production (Vercel)
vercel logs --follow
```

**Format de logs** (production):
```json
{
  "level": "info",
  "message": "Request processed",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "correlationId": "abc123",
  "performance": {
    "operation": "search-stations",
    "duration": 150
  }
}
```

---

## ⚠️ Incidents & Troubleshooting

### Incident P1: Application Down

**Symptômes**:
- Health check retourne 500
- Application inaccessible

**Diagnostic**:
```bash
# Vérifier logs
docker logs bike-geoloc-prod --tail 100

# Vérifier nginx
docker exec bike-geoloc-prod nginx -t

# Vérifier health check
curl http://localhost:8080/health
```

**Résolution**:
1. Redémarrer le container:
   ```bash
   docker-compose restart app-prod
   ```
2. Si échec, rollback:
   ```bash
   # Via GitHub Actions (workflow_dispatch)
   # Ou manuel:
   docker pull your-registry/bike-geoloc:previous-version
   docker-compose up -d
   ```

**Escalade**: Si résolution impossible en 10 minutes → on-call team

---

### Incident P2: API CityBikes Down

**Symptômes**:
- Stations ne se chargent pas
- Erreur "CityBikes API is unreachable"

**Diagnostic**:
```bash
# Tester API directement
curl https://api.citybik.es/v2/networks

# Vérifier logs application
docker logs bike-geoloc-prod | grep "CityBikes"
```

**Résolution**:
1. Vérifier status API CityBikes (https://status.citybik.es si existe)
2. Application continue de fonctionner (mode dégradé avec cache)
3. Monitorer et attendre rétablissement API
4. Communiquer aux utilisateurs (banner)

**Escalade**: Incident externe, pas d'escalade

---

### Incident P3: Performance Dégradée

**Symptômes**:
- Temps de chargement > 5s
- Latence API > 1s

**Diagnostic**:
```bash
# Vérifier métriques
curl http://localhost:8080/metrics

# Analyser performance
npm run build && npm run preview
# Lighthouse audit
```

**Résolution**:
1. Analyser bundle size: `npm run build` (check output)
2. Vérifier cache nginx
3. Analyser waterfall réseau (DevTools)
4. Si nécessaire: optimiser images, code-splitting

---

## 🔄 Rollback

### Rollback Automatique

Via GitHub Actions workflow `rollback`:
1. Aller sur Actions > CD Pipeline > Run workflow
2. Sélectionner version (tag ou commit)
3. Confirmer rollback

### Rollback Manuel (Docker)

```bash
# Lister versions
docker images | grep bike-geoloc

# Rollback
docker tag bike-geoloc:v1.0.0 bike-geoloc:latest
docker-compose up -d app-prod
```

### Rollback Manuel (Vercel)

```bash
# Lister déploiements
vercel ls

# Rollback
vercel rollback <deployment-url> --prod
```

**SLA Rollback**: < 5 minutes

---

## 🔐 Sécurité

### Audit de sécurité

```bash
# Audit npm
npm audit

# Audit complet
npm run audit:security

# Fix automatique
npm audit fix
```

### Secrets Management

**Ne JAMAIS commit**:
- `.env.local`
- Clés API
- Tokens

**GitHub Secrets requis**:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `SNYK_TOKEN`
- `SLACK_WEBHOOK`

### Réponse incident sécurité

**P0 (Critique)**:
1. Isoler l'application (mettre hors ligne)
2. Notifier équipe sécurité
3. Analyser logs (recherche indicateurs compromission)
4. Patcher vulnérabilité
5. Déploiement emergency
6. Post-mortem

**P1 (Haute)**:
1. Évaluer impact
2. Patcher dans les 24h
3. Déploiement urgent

---

## 📊 Maintenance

### Maintenance Préventive

**Hebdomadaire**:
- Vérifier logs erreurs
- Audit dépendances (`npm audit`)
- Vérifier métriques performance

**Mensuelle**:
- Update dépendances mineures
- Review security advisories
- Backup configuration

**Trimestrielle**:
- Update dépendances majeures
- Load testing
- Disaster recovery drill

### Fenêtres de maintenance

**Production**:
- Dimanche 02h-04h UTC
- Notification 72h à l'avance

**Staging**:
- Aucune fenêtre (disponible 24/7 pour tests)

---

## 📞 Contact & Escalade

### Escalation Path

1. **L1**: Developer on-call (< 10 min)
2. **L2**: Lead Developer (< 30 min)
3. **L3**: CTO (< 1h)

### Communication

**Incident mineur** (P3):
- Slack #bike-geoloc-alerts

**Incident majeur** (P1-P2):
- Slack #bike-geoloc-incidents
- Email équipe
- SMS on-call

**Incident critique** (P0):
- Tout ce qui précède
- Appel téléphonique équipe leadership

---

## 📚 Ressources

- **Documentation technique**: `/docs/`
- **Architecture**: `/docs/adr/`
- **Métriques qualité**: `QUALITY_REPORT.md`
- **Refactoring guide**: `docs/REFACTORING_GUIDE.md`
- **Roadmap**: `IMPLEMENTATION_ROADMAP.md`

---

**Dernière révision**: 2025-01-15
**Prochaine révision**: 2025-04-15
