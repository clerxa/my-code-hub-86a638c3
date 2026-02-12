# Tests E2E FinCare

Ce dossier contient les tests End-to-End (E2E) utilisant Playwright.

## Configuration requise

### Variables d'environnement (GitHub Secrets)

Pour que les tests fonctionnent dans GitHub Actions, configurez les secrets suivants :

| Secret | Description |
|--------|-------------|
| `VITE_SUPABASE_URL` | URL de votre projet Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé publique Supabase |
| `TEST_USER_EMAIL` | Email d'un utilisateur de test |
| `TEST_USER_PASSWORD` | Mot de passe de l'utilisateur de test |
| `PLAYWRIGHT_BASE_URL` | (Optionnel) URL de base pour les tests |

### Créer un utilisateur de test

1. Créez un compte utilisateur dédié aux tests (ex: `test-e2e@fincare.test`)
2. Associez-le à une entreprise de test
3. Donnez-lui les permissions nécessaires pour utiliser les simulateurs

## Exécution locale

```bash
# Installer les dépendances
npm install

# Installer les navigateurs Playwright
npx playwright install chromium

# Créer le dossier d'auth
mkdir -p .auth
echo '{"cookies":[],"origins":[]}' > .auth/user.json

# Lancer les tests
npx playwright test

# Lancer les tests avec interface graphique
npx playwright test --ui

# Lancer un test spécifique
npx playwright test simulator-flow

# Voir le rapport HTML
npx playwright show-report
```

## Structure des tests

```
tests/
├── auth.setup.ts          # Configuration de l'authentification
├── simulator-flow.spec.ts # Tests du flux simulateur PER
└── README.md              # Ce fichier
```

## Scénarios couverts

### Simulateur PER - Critical Path
1. ✅ Authentification de l'utilisateur
2. ✅ Navigation vers `/simulateur-per`
3. ✅ Remplissage du formulaire multi-étapes
4. ✅ Calcul et affichage des résultats
5. ✅ Sauvegarde de la simulation
6. ✅ Vérification dans le dashboard

### Tests de robustesse
- ✅ Gestion des erreurs réseau
- ✅ Validation des valeurs limites

## Bonnes pratiques

- Les tests nettoient leurs données avant chaque exécution
- Utilisez des noms de simulation uniques (avec timestamp)
- Les tests sont indépendants et peuvent s'exécuter en parallèle
- Screenshots et vidéos sont capturés en cas d'échec

## Debugging

```bash
# Mode debug avec pause
npx playwright test --debug

# Voir les traces
npx playwright show-trace trace.zip
```
