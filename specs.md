\# Spécifications Métier - Application de Localisation de Vélos pour https://api.citybik.es/v2/

\## 1. Vue d'ensemble

Application web permettant aux utilisateurs de localiser les vélos disponibles à proximité via l'API CityBikes.

\## 2. Fonctionnalités principales

\### 2.1 Géolocalisation de l'utilisateur

**Objectif** : Obtenir la position géographique de l'utilisateur pour calculer les distances aux stations de vélos.

**Critères d'acceptation** :

\- L'application demande l'autorisation de géolocalisation au chargement ou via un bouton dédié

\- Un message clair explique pourquoi la géolocalisation est nécessaire

\- La position de l'utilisateur (latitude, longitude) est récupérée via l'API Geolocation du navigateur

\- Un indicateur visuel (spinner/loader) s'affiche pendant la récupération de la position

\- En cas de refus ou d'erreur de géolocalisation, un message d'erreur approprié s'affiche avec des instructions alternatives

**Gestion des erreurs** :

\- Autorisation refusée : "Veuillez autoriser la géolocalisation pour trouver les vélos près de vous"

\- Géolocalisation indisponible : "La géolocalisation n'est pas disponible sur votre appareil"

\- Timeout : "Impossible de vous localiser, veuillez réessayer"

\### 2.2 Récupération des données de vélos

**Source de données** : API CityBikes (https://api.citybik.es/v2/)

**Endpoints utilisés** :

\- Liste des réseaux : `GET /v2/networks`

\- Détails d'un réseau : `GET /v2/networks/{network_id}`

**Logique métier** :

1. Identifier le réseau de vélos le plus proche de la position de l'utilisateur
2. Récupérer toutes les stations du réseau identifié
3. Filtrer les stations ayant au moins 1 vélo disponible (`free_bikes > 0`)
4. Calculer la distance entre la position de l'utilisateur et chaque station
5. Filtrer les stations dans un rayon de 200 mètres maximum

\### 2.3 Calcul des distances

**Méthode** : Formule de Haversine (distance orthodromique entre deux points GPS)

**Critères** :

\- La distance doit être calculée en mètres

\- Seules les stations à moins de 200m sont retenues

\- La précision du calcul doit être d'au moins 1 mètre

\### 2.4 Affichage de la liste des vélos disponibles

**Format d'affichage** :

Pour chaque station (maximum 10 résultats) :

\- **Nom de la station** (nom ou adresse)

\- **Distance** (en mètres, arrondie à l'unité)

\- **Nombre de vélos disponibles**

\- **Nombre d'emplacements libres** (optionnel mais recommandé)

**Règles de tri et filtrage** :

\- Tri par distance croissante (du plus proche au plus éloigné)

\- Maximum 10 résultats affichés

\- Seules les stations avec au moins 1 vélo disponible sont affichées

\- Seules les stations à 200m ou moins sont affichées

**Cas particuliers** :

\- Si aucune station n'est trouvée dans le rayon : "Aucun vélo disponible dans un rayon de 200m"

\- Si aucun vélo n'est disponible dans les stations proches : "Aucun vélo disponible actuellement dans les stations à proximité"

\- Si aucun réseau de vélos n'est disponible dans la zone : "Aucun service de vélos partagés disponible dans votre zone"

\### 2.5 Rafraîchissement des données

**Comportement** :

\- Bouton "Actualiser" permettant de recharger les données

\- Les données sont rechargées automatiquement toutes les 60 secondes (optionnel)

\- Indication de la dernière mise à jour (horodatage)

\## 3. Parcours utilisateur

1. L'utilisateur arrive sur l'application
2. Un bouton "Me géolocaliser" ou une demande automatique de géolocalisation apparaît
3. L'utilisateur accepte la géolocalisation
4. L'application affiche un loader pendant la récupération des données
5. La liste des 10 vélos les plus proches s'affiche, triée par distance
6. L'utilisateur peut rafraîchir les données à tout moment

\## 4. Contraintes techniques

\- **Périmètre de recherche** : 200 mètres maximum

\- **Nombre de résultats** : 10 stations maximum

\- **Temps de réponse** : Affichage des résultats en moins de 3 secondes

\- **Compatibilité** : Navigateurs modernes supportant l'API Geolocation

\## 5. Règles métier prioritaires

1. **Disponibilité** : Seuls les vélos réellement disponibles (`free_bikes > 0`) sont comptabilisés
2. **Distance** : Le calcul doit être précis pour garantir que les stations sont bien à moins de 200m
3. **Tri** : L'ordre de tri par distance est strict et non modifiable par l'utilisateur
4. **Limite géographique** : Aucune station au-delà de 200m ne doit apparaître, même s'il y a moins de 10 résultats

\## 6. Évolutions futures possibles

\- Filtrage par nombre minimum de vélos disponibles

\- Affichage sur une carte interactive

\- Calcul d'itinéraire vers la station sélectionnée

\- Notifications temps réel de disponibilité

\- Sauvegarde des stations favorites