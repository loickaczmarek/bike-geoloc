# 🎮 Playbook - Bike Geoloc

Guide procédural pour opérations courantes et résolution d'incidents.

---

## 📋 Table des matières

1. [Déploiement](#déploiement)
2. [Monitoring](#monitoring)
3. [Troubleshooting](#troubleshooting)
4. [Rollback](#rollback)
5. [Sécurité](#sécurité)

---

## 🚀 Déploiement

### Déploiement Production (Tag Release)

**Prérequis**:
- [ ] Tests CI passent ✅
- [ ] Code review approuvé
- [ ] Staging validé
- [ ] Changelog mis à jour

**Procédure**:

```bash
# 1. Créer et pusher tag
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release 1.0.0 - Feature XYZ"
git push origin v1.0.0

# 2. Vérifier déploiement GitHub Actions
# Actions > CD Pipeline > Deploy to Production

# 3. Vérifier health check
curl https://bike-geoloc.app/health

# 4. Smoke tests
npm run test:e2e:production

# 5. Monitorer logs (10 min)
vercel logs --follow

# 6. Communiquer déploiement
# Slack #releases: "✅ v1.0.0 deployed to production"
```

**Rollback si échec**:
- Si smoke tests échouent → rollback immédiat
- Si incidents utilisateurs → rollback sous 5 min

---

### Déploiement Hotfix

**Situation**: Bug critique en production

**Procédure**:

```bash
# 1. Créer branche hotfix depuis main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# 2. Fix + Tests
# ... faire le fix
npm test -- --run
npm run lint

# 3. Commit + Push
git add .
git commit -m "hotfix: Fix critical bug XYZ"
git push origin hotfix/critical-bug-fix

# 4. Merge direct main (skip PR si critique)
git checkout main
git merge hotfix/critical-bug-fix
git push origin main

# 5. Tag + Deploy
git tag -a v1.0.1 -m "Hotfix: Critical bug XYZ"
git push origin v1.0.1

# 6. Vérifier déploiement
curl https://bike-geoloc.app/health

# 7. Post-mortem
# Créer incident report dans /docs/incidents/
```

---

## 🔍 Monitoring

### Vérification Santé Quotidienne

**Routine** (5 min):

```bash
# 1. Health checks
curl https://bike-geoloc.app/health | jq
curl https://staging.bike-geoloc.app/health | jq

# 2. Vérifier GitHub Actions
# https://github.com/org/bike-geoloc/actions
# → Tous verts ✅

# 3. Vérifier métriques Vercel
# https://vercel.com/dashboard
# - Uptime > 99.9%
# - Response time < 500ms

# 4. Vérifier erreurs Sentry (si configuré)
# https://sentry.io/bike-geoloc
# - Erreurs < 0.1%

# 5. Vérifier logs
vercel logs --since 24h | grep -i error | wc -l
# → Moins de 10 erreurs OK
```

**Si anomalie détectée** → Investigation

---

### Investigation Performance

**Symptôme**: Latence > 3s

**Diagnostic**:

```bash
# 1. Lighthouse audit local
npm run build
npx serve dist &
npx lighthouse http://localhost:3000 --view

# 2. Vérifier bundle size
npm run build
ls -lh dist/assets/*.js
# → JS < 500KB, CSS < 100KB

# 3. Analyser waterfall
# DevTools > Network
# - TTFB < 200ms
# - FCP < 1s
# - LCP < 2.5s

# 4. Vérifier API CityBikes
time curl https://api.citybik.es/v2/networks
# → < 500ms

# 5. Vérifier CDN/Edge
curl -I https://bike-geoloc.app
# → X-Vercel-Cache: HIT (cachée)
```

**Actions correctives**:
- Bundle > 500KB → Code splitting
- TTFB > 500ms → Vérifier edge caching
- API lente → Implémenter cache local
- Images lourdes → Optimiser/compresser

---

## 🔧 Troubleshooting

### Problème: Application ne charge pas

**Symptômes**:
- Écran blanc
- Erreur 500
- Health check DOWN

**Checklist**:

```bash
# 1. Vérifier déploiement Vercel
vercel ls --prod
# → Status: READY ✅

# 2. Vérifier logs récents
vercel logs --since 10m

# 3. Vérifier nginx (si Docker)
docker exec bike-geoloc-prod nginx -t
docker exec bike-geoloc-prod cat /var/log/nginx/error.log

# 4. Vérifier build
npm run build
# → Pas d'erreurs TypeScript/ESLint

# 5. Tester en local
npm run preview
curl http://localhost:4173/health
```

**Solutions par cause**:

| Cause | Solution |
|-------|----------|
| Déploiement failed | Redéployer ou rollback |
| Erreur build | Fix errors + redeploy |
| Nginx misconfigured | Restaurer nginx.conf |
| API CityBikes down | Attendre ou mode dégradé |

---

### Problème: Géolocalisation ne fonctionne pas

**Symptômes**:
- Erreur "Position GPS requise"
- Timeout géolocalisation

**Diagnostic**:

```bash
# 1. Vérifier logs console navigateur
# F12 > Console
# → Rechercher erreurs Geolocation API

# 2. Vérifier HTTPS
# Geolocation nécessite HTTPS (sauf localhost)
curl -I https://bike-geoloc.app | grep -i strict-transport

# 3. Vérifier permissions navigateur
# Site Settings > Location > Allow

# 4. Tester timeout config
# .env → VITE_GEOLOCATION_TIMEOUT=10000
```

**Solutions**:
- HTTP → Forcer HTTPS (HSTS)
- Timeout trop court → Augmenter à 15s
- Permissions refusées → Guide utilisateur
- API bloquée → Vérifier CSP headers

---

### Problème: Aucune station trouvée

**Symptômes**:
- "Aucune station dans un rayon de 200m"
- Recherche retourne vide

**Diagnostic**:

```bash
# 1. Vérifier API CityBikes
curl "https://api.citybik.es/v2/networks" | jq '.networks | length'
# → Doit retourner ~600 réseaux

# 2. Tester recherche réseau
curl "https://api.citybik.es/v2/networks" | jq '.networks[] | select(.location.city=="Paris")'

# 3. Vérifier logs
# DevTools > Network > Rechercher appels API
# → Status 200, données présentes

# 4. Vérifier filtre distance
# Config → VITE_SEARCH_RADIUS_METERS=200
# → Augmenter temporairement à 500m pour tester
```

**Solutions**:
- API down → Communiquer status
- Réseau inconnu → Vérifier ville utilisateur
- Rayon trop strict → Suggérer augmentation
- Coordonnées invalides → Validation GPS

---

## 🔄 Rollback

### Rollback Production (Procédure urgente)

**Quand**:
- P0/P1 incident
- Erreurs critiques
- Perte de fonctionnalité majeure

**Procédure** (< 5 min):

```bash
# Option 1: Via Vercel CLI (PLUS RAPIDE)
vercel ls --prod
# → Copier URL déploiement précédent
vercel rollback <previous-deployment-url> --prod

# Option 2: Via GitHub Actions
# Actions > CD Pipeline > Run workflow > Rollback
# Input: v1.0.0 (version précédente)

# Option 3: Via tag Git
git checkout v1.0.0
git tag -a v1.0.1-rollback -m "Rollback to v1.0.0"
git push origin v1.0.1-rollback

# Vérification
curl https://bike-geoloc.app/health | jq '.version'
# → Doit afficher version précédente

# Communication
# Slack #incidents: "🔄 Rollback to v1.0.0 completed"
# Status page: Update incident
```

**Post-rollback**:
- [ ] Monitorer 15 min
- [ ] Vérifier métriques (erreurs, latence)
- [ ] Créer incident report
- [ ] Planifier fix

---

### Rollback Partiel (Feature Flag)

**Situation**: Feature spécifique problématique

**Procédure**:

```bash
# 1. Désactiver feature flag
# Via .env.production
VITE_FEATURE_AUTO_REFRESH=false

# 2. Redéployer sans rebuild
vercel --prod

# 3. Vérifier feature désactivée
# Tester manuellement

# 4. Communication
# Slack: "⚠️ Feature auto-refresh temporairement désactivée"
```

---

## 🔐 Sécurité

### Incident Sécurité (Procédure)

**P0 - Critique** (Data breach, RCE):

```bash
# 1. ISOLER (< 5 min)
vercel env rm PRODUCTION
# → Application hors ligne

# 2. NOTIFIER
# Slack #security-incidents @channel
# Email: security@bike-geoloc.app
# SMS: On-call security team

# 3. ANALYSER
vercel logs --since 24h > incident-logs.txt
# Rechercher:
# - Accès non autorisés
# - Patterns d'attaque
# - Données exposées

# 4. CONTENIR
# - Révoquer tokens compromis
# - Changer secrets GitHub
# - Bloquer IPs malveillantes (si applicable)

# 5. PATCHER
git checkout -b hotfix/security-critical
# ... fix
git push origin hotfix/security-critical
# Deploy emergency

# 6. POST-MORTEM
# Template: /docs/incidents/YYYY-MM-DD-security.md
```

**P1 - Haute** (Vulnérabilité découverte):

```bash
# 1. Évaluer impact
npm audit
# → Vérifier severity: HIGH

# 2. Tester exploit
# En staging uniquement

# 3. Patcher
npm audit fix
# Ou update manuelle

# 4. Tester
npm test -- --run
npm run build

# 5. Déployer (< 24h)
git commit -m "security: Fix CVE-XXXX-YYYY"
git push origin main

# 6. Communiquer
# Changelog: Mention fix (sans détails exploit)
```

---

### Audit Sécurité Mensuel

**Checklist**:

```bash
# 1. Audit dépendances
npm audit --audit-level=moderate
npm outdated

# 2. Scan Snyk
npx snyk test
npx snyk monitor

# 3. Vérifier secrets
# GitHub > Settings > Secrets
# → Aucun secret expiré

# 4. Review permissions
# Vercel > Team Settings > Members
# → Principe moindre privilège

# 5. Vérifier CSP headers
curl -I https://bike-geoloc.app | grep -i content-security-policy

# 6. Test pénétration (si budget)
# Contracter pentest externe

# 7. Report
# /docs/security/audit-YYYY-MM.md
```

---

## 📊 Métriques de Succès

### Objectifs Opérationnels

| Métrique | Objectif | Seuil Alerte |
|----------|----------|--------------|
| Uptime | 99.9% | < 99.5% |
| MTTR (Mean Time To Repair) | < 30 min | > 1h |
| MTTD (Mean Time To Deploy) | < 10 min | > 20 min |
| Rollback success | 100% | < 100% |
| Incident P0 | 0/mois | > 1/mois |
| Incident P1 | < 2/mois | > 5/mois |
| Security patches | < 24h | > 48h |
| Test coverage | ≥ 80% | < 80% |

### Review Hebdomadaire

**Agenda** (30 min):
1. Review incidents semaine
2. Métriques vs objectifs
3. Actions correctives
4. Améliorations process

---

**Dernière mise à jour**: 2025-01-15
**Mainteneur**: DevOps Team
