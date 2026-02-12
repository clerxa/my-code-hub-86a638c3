# 📚 Manuel Technique de l'Application FinCare

## Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Technique](#architecture-technique)
3. [Structure des Fichiers](#structure-des-fichiers)
4. [Système d'Authentification](#système-dauthentification)
5. [Base de Données](#base-de-données)
6. [Portail Employé](#portail-employé)
7. [Dashboard Entreprise](#dashboard-entreprise)
8. [Panneau d'Administration](#panneau-dadministration)
9. [Simulateurs Financiers](#simulateurs-financiers)
10. [Système de Formations & Parcours](#système-de-formations--parcours)
11. [Forum Communautaire](#forum-communautaire)
12. [Système de Notifications](#système-de-notifications)
13. [Edge Functions (Backend)](#edge-functions-backend)
14. [Hooks Personnalisés](#hooks-personnalisés)
15. [Système de Design](#système-de-design)
16. [Sécurité](#sécurité)
17. [Glossaire](#glossaire)

---

## Vue d'ensemble

### Qu'est-ce que FinCare ?

**FinCare** est une plateforme SaaS B2B2C de gestion de patrimoine financier et d'épargne salariale. Elle permet aux entreprises partenaires d'offrir à leurs employés :

- 📊 Des **simulateurs financiers** (impôts, PER, ESPP, immobilier, etc.)
- 🎓 Des **formations** et **parcours éducatifs** en finance personnelle
- 💬 Un **forum communautaire** pour échanger entre collègues
- 📋 Un **profil financier complet** avec suivi du patrimoine
- 📅 La **prise de rendez-vous** avec des experts financiers
- 🏆 Un système de **gamification** avec points et classements

### Modèle Multi-tenant

L'application fonctionne sur un modèle **multi-tenant** où :
- Chaque **entreprise** (company) a ses propres employés, configurations et contenus
- Les **employés** voient uniquement les contenus de leur entreprise
- Les **administrateurs** gèrent l'ensemble de la plateforme
- Les **contacts entreprise** gèrent leur propre organisation

---

## Architecture Technique

### Stack Technologique

| Couche | Technologie | Rôle |
|--------|-------------|------|
| **Frontend** | React 19 + TypeScript | Interface utilisateur |
| **Routing** | React Router v6 | Navigation SPA |
| **State Management** | TanStack Query | Cache et synchronisation API |
| **Styling** | Tailwind CSS + shadcn/ui | Design system |
| **Backend** | Supabase (Lovable Cloud) | BDD, Auth, Storage, Edge Functions |
| **Animation** | Framer Motion | Animations fluides |
| **Build** | Vite | Bundler rapide |

### Flux de Données

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React UI  │────▶│  TanStack Query  │────▶│    Supabase     │
│  Components │◀────│   (useQuery)     │◀────│   PostgreSQL    │
└─────────────┘     └──────────────────┘     └─────────────────┘
       │                                              │
       │                                              ▼
       │                                     ┌─────────────────┐
       │                                     │  Edge Functions │
       │                                     │   (Deno)        │
       └────────────────────────────────────▶└─────────────────┘
```

### Providers Globaux (App.tsx)

L'application utilise plusieurs providers imbriqués :

```tsx
<QueryClientProvider>        // Cache des requêtes API
  <TooltipProvider>          // Tooltips globaux
    <BrowserRouter>          // Routing
      <AuthProvider>         // État d'authentification
        <MultiThemeProvider> // Thème sombre/clair + thèmes custom
          <GlobalSettingsProvider>  // Paramètres globaux configurables
            <NotificationManager /> // Notifications temps réel
            <Routes>...</Routes>
          </GlobalSettingsProvider>
        </MultiThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
</QueryClientProvider>
```

---

## Structure des Fichiers

```
src/
├── App.tsx                 # Point d'entrée, routing principal
├── main.tsx                # Bootstrap React
├── index.css               # Variables CSS globales, thème
│
├── components/
│   ├── ui/                 # Composants shadcn/ui (Button, Card, etc.)
│   ├── admin/              # Composants du back-office
│   ├── employee/           # Composants du portail employé
│   ├── company/            # Composants dashboard entreprise
│   ├── company-dashboard/  # Onglets du dashboard entreprise
│   ├── forum/              # Composants du forum
│   ├── modules/            # Contenu des modules de formation
│   ├── simulators/         # UI des simulateurs
│   ├── onboarding/         # Écrans d'onboarding
│   ├── notifications/      # Système de notifications
│   ├── csat/               # Sondages de satisfaction
│   └── ...
│
├── pages/
│   ├── Employee.tsx        # Page principale employé
│   ├── Admin.tsx           # Back-office administrateur
│   ├── CompanyDashboard.tsx # Dashboard contact entreprise
│   ├── Simulateur*.tsx     # Pages des simulateurs
│   ├── Parcours.tsx        # Parcours de formation
│   ├── Forum*.tsx          # Pages du forum
│   └── ...
│
├── hooks/
│   ├── useUserFinancialProfile.ts  # Gestion profil financier
│   ├── use*Calculations.ts         # Logiques de calcul simulateurs
│   ├── useSidebarConfig.ts         # Configuration menu latéral
│   ├── useGlobalSettings.ts        # Paramètres globaux
│   └── ...
│
├── contexts/
│   ├── ThemeContext.tsx            # Thèmes
│   └── GlobalSettingsContext.tsx   # Paramètres configurables
│
├── types/
│   ├── database.ts         # Types pour les tables Supabase
│   ├── *.ts                # Types par domaine
│
├── lib/
│   ├── utils.ts            # Utilitaires (cn, formatters, etc.)
│   ├── sanitize.ts         # Sanitisation des inputs
│   └── ...
│
└── integrations/
    └── supabase/
        ├── client.ts       # Client Supabase (auto-généré)
        └── types.ts        # Types BDD (auto-généré)

supabase/
├── config.toml             # Configuration Supabase
├── functions/              # Edge Functions (backend serverless)
│   ├── auto-signup/
│   ├── send-invitations/
│   ├── livestorm-webhook/
│   └── ...
└── migrations/             # Migrations SQL (lecture seule)
```

---

## Système d'Authentification

### AuthProvider

Le composant `AuthProvider` (`src/components/AuthProvider.tsx`) gère l'état global d'authentification :

```tsx
interface AuthContextType {
  user: User | null;        // Utilisateur Supabase Auth
  session: Session | null;  // Session active
  signOut: () => Promise<void>;
}
```

**Fonctionnalités :**
- Écoute les changements de session (`onAuthStateChange`)
- Fournit `user`, `session` et `signOut` via le contexte
- Affiche un loader pendant la vérification initiale

### ProtectedRoute

Le composant `ProtectedRoute` (`src/components/ProtectedRoute.tsx`) protège les routes selon le rôle :

```tsx
<ProtectedRoute>                     // Authentifié seulement
<ProtectedRoute requireAdmin>        // Admin seulement
<ProtectedRoute requireCompanyContact> // Contact entreprise ou Admin
```

**Logique de rôles :**
- Vérifie le rôle dans la table `user_roles`
- Redirige vers `/login` si non authentifié
- Redirige vers `/employee` si accès insuffisant

### Rôles Utilisateurs

| Rôle | Description | Accès |
|------|-------------|-------|
| `user` (défaut) | Employé standard | Portail employé |
| `contact_entreprise` | Responsable RH/Admin | + Dashboard entreprise |
| `admin` | Administrateur FinCare | Tout, dont back-office |

---

## Base de Données

### Tables Principales (98 tables)

#### Utilisateurs & Entreprises

| Table | Description |
|-------|-------------|
| `profiles` | Profils utilisateurs (extension de auth.users) |
| `user_roles` | Rôles et permissions |
| `companies` | Entreprises partenaires |
| `company_contacts` | Contacts RH des entreprises |
| `company_modules` | Modules assignés par entreprise |

#### Profil Financier

| Table | Description |
|-------|-------------|
| `user_financial_profiles` | Patrimoine et revenus complets |
| `risk_profile` | Profil de risque investisseur |
| `user_risk_responses` | Réponses au questionnaire risque |

#### Formations & Gamification

| Table | Description |
|-------|-------------|
| `modules` | Modules de formation (vidéo, quiz, webinar) |
| `parcours` | Parcours = ensemble de modules |
| `parcours_modules` | Liaison parcours ↔ modules |
| `module_validations` | Validations par utilisateur |
| `points_configuration` | Configuration des points |

#### Simulations

| Table | Description |
|-------|-------------|
| `per_simulations` | Simulations Plan Épargne Retraite |
| `lmnp_simulations` | Simulations LMNP |
| `espp_plans` | Plans ESPP |
| `espp_lots` | Lots d'actions ESPP |
| `capacite_emprunt_simulations` | Capacité d'emprunt |
| `optimisation_fiscale_simulations` | Optimisation fiscale |
| `simulation_logs` | Journal de toutes les simulations |

#### Forum & Communication

| Table | Description |
|-------|-------------|
| `forum_categories` | Catégories du forum |
| `forum_posts` | Publications |
| `forum_comments` | Commentaires |
| `notifications` | Notifications système |
| `colleague_invitations` | Invitations de collègues |

#### Configuration

| Table | Description |
|-------|-------------|
| `global_settings` | Paramètres globaux (règles fiscales, etc.) |
| `themes` | Thèmes personnalisés |
| `sidebar_configurations` | Configuration des menus |
| `block_orders` | Ordre des blocs sur les pages |

### Row Level Security (RLS)

Toutes les tables sensibles ont des politiques RLS :

```sql
-- Exemple : un utilisateur ne voit que son profil
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (id = auth.uid());

-- Les admins voient tout
CREATE POLICY "Admins can view all"
ON profiles FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
```

---

## Portail Employé

### Page Principale (`/employee`)

**Fichier :** `src/pages/Employee.tsx`

La page employé est modulaire avec des **blocs réordonnables** :

```
┌──────────────────────────────────────────────────────┐
│  Sidebar          │        Contenu Principal         │
│  (navigation)     │  ┌─────────────────────────────┐ │
│                   │  │  Bloc: Profil & Stats       │ │
│  📊 Dashboard     │  ├─────────────────────────────┤ │
│  👤 Profil        │  │  Bloc: Progression          │ │
│  📈 Simulations   │  ├─────────────────────────────┤ │
│  🎓 Formations    │  │  Bloc: Recommandations      │ │
│  💬 Forum         │  ├─────────────────────────────┤ │
│  📅 RDV           │  │  Bloc: Simulations          │ │
│                   │  └─────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

**Blocs disponibles :**
- `profile` : Avatar, points, rang dans l'entreprise
- `stats` : Statistiques (parcours complétés, collègues invités, etc.)
- `progression` : Barre de progression globale
- `recommendations` : Actions recommandées (basées sur les règles)
- `leaderboard` : Classement de l'entreprise
- `simulations` : Tableau des simulations sauvegardées
- `webinars` : Prochains webinaires
- `appointments` : Rendez-vous à venir

### Profil Financier (`/employee/profile`)

**Fichier :** `src/pages/EmployeeProfile.tsx`

7 onglets de gestion du patrimoine :

1. **Finances** : Revenus et épargne
2. **Patrimoine** : Actifs financiers (PER, PEA, crypto, etc.)
3. **Professionnel** : Contrat, ancienneté, dispositifs (RSU, ESPP)
4. **Objectifs** : Projets immobiliers
5. **Fiscalité** : TMI, parts fiscales
6. **Charges** : Dépenses mensuelles détaillées
7. **Synthèse** : Vue consolidée

**Hook principal :** `useUserFinancialProfile.ts`

```tsx
const { 
  profile,           // Données du profil
  saveProfile,       // Sauvegarder les modifications
  completeness,      // % de complétion (0-100)
  missingFields,     // Champs manquants
  isComplete         // true si 100%
} = useUserFinancialProfile();
```

### Système de Recommandations

Les recommandations sont générées dynamiquement via la table `recommendation_rules` :

```tsx
// Conditions disponibles :
- "no_risk_profile"              // Pas de profil de risque
- "simulation_threshold"         // Simulation > seuil
- "no_modules"                   // Aucun module complété
- "financial_profile_incomplete" // Profil < 100%
- "always"                       // Toujours afficher
```

---

## Dashboard Entreprise

### Accès

Accessible aux rôles `contact_entreprise` et `admin` via `/company/:id/dashboard`.

**Fichier :** `src/pages/CompanyDashboard.tsx`

### Onglets

1. **Tableau de bord** : Statistiques globales de l'entreprise
2. **Configuration** : Personnalisation (logo, couleurs, modules)
3. **Webinaires** : Gestion des webinaires Livestorm
4. **Communication** : Templates et ressources visuelles
5. **Communauté** : Modération du forum

### Statistiques Disponibles

Fonctions SQL dédiées dans la base :

```sql
-- Statistiques détaillées
SELECT * FROM get_company_extended_stats(company_id, start_date, end_date);

-- Progression des parcours
SELECT * FROM get_company_parcours_stats(company_id);

-- Utilisation des simulateurs
SELECT * FROM get_company_simulation_stats(company_id, start_date, end_date);

-- Tendances d'engagement
SELECT * FROM get_company_engagement_trends(company_id, period);
```

---

## Panneau d'Administration

### Accès

Réservé aux `admin` via `/admin/*`.

**Fichier :** `src/pages/Admin.tsx`

### Structure du Menu Admin

Organisé en catégories dans `AdminSidebar.tsx` :

#### Général
- 📄 Documentation
- 🖼️ Landing Pages
- 📅 RDV Expert
- 📋 Rendez-vous

#### Entreprises
- 🏢 Companies
- 🏆 Rangs entreprises
- 👥 Utilisateurs
- 👨‍💼 Conseillers

#### Contenu
- 📚 Modules
- 🎯 Parcours
- 📖 Formations
- 💳 Produits financiers

#### Configuration
- ⚙️ Permissions
- 🔔 Notifications
- 🎨 Design System
- 🗂️ Menus latéraux
- etc.

### Onglets Principaux

| Onglet | Fichier | Description |
|--------|---------|-------------|
| Companies | `CompaniesTab.tsx` | CRUD entreprises |
| Users | `UsersAndEmployeesTab.tsx` | Gestion utilisateurs |
| Modules | `ModulesTab.tsx` | Création/édition modules |
| Parcours | `ParcoursTab.tsx` | Assemblage de parcours |
| Onboarding CMS | `OnboardingCMSTab.tsx` | Éditeur d'onboarding dynamique |
| Global Settings | `GlobalSettingsTab.tsx` | Règles fiscales, seuils |
| Workflow Hub | `WorkflowHubTab.tsx` | Centre de configuration des workflows |

---

## Simulateurs Financiers

### Liste des Simulateurs

| Simulateur | Route | Hook | Table |
|------------|-------|------|-------|
| Impôts | `/simulateur-impots` | - | `simulations_impots` |
| PER | `/simulateur-per` | `usePERCalculations` | `per_simulations` |
| ESPP | `/simulateur-espp` | `useESPPCalculations` | `espp_plans` |
| LMNP | `/simulateur-lmnp` | `useLMNPCalculations` | `lmnp_simulations` |
| Épargne Précaution | `/simulateur-epargne-precaution` | `useEpargnePrecautionCalculations` | `epargne_precaution_simulations` |
| Intérêts Composés | `/simulateur-interets-composes` | - | - |
| Prêt Immobilier | `/simulateur-pret-immobilier` | `usePretImmobilierCalculations` | `pret_immobilier_simulations` |
| Capacité d'Emprunt | `/simulateur-capacite-emprunt` | `useCapaciteEmpruntCalculations` | `capacite_emprunt_simulations` |
| Optimisation Fiscale | `/optimisation-fiscale` | `useOptimisationFiscaleCalculations` | `optimisation_fiscale_simulations` |

### Architecture d'un Simulateur

```tsx
// Structure type d'un simulateur
const SimulateurPER = () => {
  // 1. Hook de calcul avec les règles fiscales
  const { calculerSimulation, calculerTMI } = usePERCalculations();
  
  // 2. Hook de sauvegarde
  const { saveSimulation } = useSimulationSave('per');
  
  // 3. Hook de tracking
  useSimulationTracking('per');
  
  // 4. État du formulaire
  const [inputs, setInputs] = useState<PERInputs>({...});
  
  // 5. Calcul des résultats
  const results = useMemo(() => 
    calculerSimulation(inputs), 
    [inputs]
  );
  
  return (
    <SimulatorLayout>
      <SimulatorWizard steps={steps} />
      <SimulatorResultsSection results={results} />
      <SaveSimulationDialog onSave={saveSimulation} />
    </SimulatorLayout>
  );
};
```

### Règles Fiscales Configurables

Les simulateurs utilisent les règles stockées dans `global_settings` :

```tsx
const { fiscalRules } = useFiscalRules();

// Exemple de règles
fiscalRules.taxBrackets      // Tranches d'imposition
fiscalRules.socialCharges    // Prélèvements sociaux (17.2%)
fiscalRules.perCeiling       // Plafond PER (10% revenus)
fiscalRules.microBicRate     // Abattement micro-BIC (50%)
```

---

## Système de Formations & Parcours

### Modules

**Types de modules :**
- `video` : Vidéo avec quiz optionnel
- `quiz` : Questionnaire à choix multiples
- `formation` : Contenu textuel/slides
- `webinar` : Webinaire Livestorm
- `appointment` : Prise de rendez-vous
- `guide` : Guide PDF téléchargeable
- `financial_profile` : Formulaire de profil

**Table `modules` :**
```sql
id, order_num, title, type, description, points, duration,
video_url, quiz_data, formation_content, slides_data, ...
```

### Parcours

Un **parcours** est un ensemble ordonné de modules :

```
Parcours "Optimiser ses impôts"
├── Module 1: Vidéo introduction (10 pts)
├── Module 2: Quiz connaissances (20 pts)
├── Module 3: Simulateur PER (30 pts)
└── Module 4: RDV expert (50 pts)
```

**Affectation :**
- Un parcours peut être **générique** (tous) ou **assigné** à des entreprises
- La progression est stockée dans `profiles.completed_modules[]`

### Validation des Modules

```tsx
// Hook de validation
const validateModule = async (moduleId: number) => {
  // 1. Marquer comme complété
  await supabase.from('module_validations').insert({
    user_id: userId,
    module_id: moduleId,
    success: true
  });
  
  // 2. Ajouter les points
  await supabase.rpc('add_points', { 
    user_id: userId, 
    points: module.points 
  });
  
  // 3. Mettre à jour completed_modules
  await supabase.from('profiles').update({
    completed_modules: [...current, moduleId]
  });
};
```

---

## Forum Communautaire

### Structure

```
/forum                     # Liste des catégories
/forum/category/:slug      # Posts d'une catégorie
/forum/post/:postId        # Discussion complète
```

### Tables

| Table | Description |
|-------|-------------|
| `forum_categories` | Catégories (slug, name, color, icon) |
| `forum_posts` | Publications (title, content, author_id) |
| `forum_comments` | Commentaires imbriqués |
| `forum_post_likes` | Likes sur les posts |
| `forum_comment_likes` | Likes sur les commentaires |
| `forum_moderation_logs` | Actions de modération |

### Anonymat

Les utilisateurs peuvent poster de manière anonyme :
- `is_anonymous: true` sur le post/commentaire
- Le nom affiché devient "Membre anonyme"
- Seuls les modérateurs voient l'auteur réel

### Système de Contribution

Points de contribution calculés automatiquement :

```sql
score = (posts_count × points_per_post) + (comments_count × points_per_comment)
```

Niveaux configurables dans `forum_settings.contribution_levels`.

---

## Système de Notifications

### Architecture

```
┌─────────────────────┐     ┌──────────────────┐
│  notification_rules │────▶│  NotificationManager │
│  (conditions)       │     │  (évalue + crée)     │
└─────────────────────┘     └──────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │   notifications   │
                            │   (table)         │
                            └──────────────────┘
                                     │
                                     ▼
                            ┌──────────────────┐
                            │  NotificationBell │
                            │  (affichage)      │
                            └──────────────────┘
```

### Règles de Notification

Configurées dans `notification_rules` avec des conditions :

```json
{
  "condition_type": "simulation_completed",
  "condition_config": { "simulator": "per" },
  "title": "Simulation PER terminée",
  "message": "Découvrez vos économies d'impôts !",
  "action_url": "/simulateur-per"
}
```

### Types de Conditions

- `module_completed` : Module terminé
- `simulation_completed` : Simulation effectuée
- `financial_profile_complete` : Profil à 100%
- `points_milestone` : Seuil de points atteint
- `scheduled` : Date/heure programmée

---

## Edge Functions (Backend)

### Liste des Fonctions

| Fonction | Déclencheur | Description |
|----------|-------------|-------------|
| `auto-signup` | Webhook | Inscription automatique depuis formulaire |
| `import-employees` | Admin | Import CSV d'employés |
| `send-invitations` | Admin | Envoi d'emails d'invitation |
| `send-colleague-invitation` | User | Invitation de collègue |
| `livestorm-webhook` | Livestorm | Sync inscriptions webinaires |
| `sync-livestorm-registrations` | Cron | Synchronisation périodique |
| `fillout-appointment-webhook` | Fillout | Réception des RDV |
| `track-invitation` | Tracking | Suivi des clics sur liens |

### Structure Type

```typescript
// supabase/functions/send-invitations/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  // 1. Vérifier la méthode
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  
  // 2. Parser le body
  const { employeeIds, templateId } = await req.json();
  
  // 3. Créer le client Supabase avec service role
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  
  // 4. Logique métier
  // ...
  
  // 5. Retourner la réponse
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
});
```

---

## Hooks Personnalisés

### Hooks de Données

| Hook | Description |
|------|-------------|
| `useUserFinancialProfile` | CRUD profil financier |
| `useBlockLayoutConfig` | Configuration des blocs de page |
| `useSidebarConfig` | Configuration menu employé |
| `useAdminSidebarConfig` | Configuration menu admin |
| `useGlobalSettings` | Paramètres globaux |
| `useContributionLevels` | Niveaux forum |

### Hooks de Calcul (Simulateurs)

| Hook | Description |
|------|-------------|
| `usePERCalculations` | Calculs Plan Épargne Retraite |
| `useLMNPCalculations` | Calculs LMNP |
| `useESPPCalculations` | Calculs ESPP |
| `useCapaciteEmpruntCalculations` | Calculs capacité emprunt |
| `usePretImmobilierCalculations` | Calculs prêt immobilier |
| `useOptimisationFiscaleCalculations` | Optimisation fiscale |
| `useEpargnePrecautionCalculations` | Épargne de précaution |

### Hooks Utilitaires

| Hook | Description |
|------|-------------|
| `useAuth` | Accès au contexte d'authentification |
| `useMobile` | Détection mobile |
| `useScrollAnimation` | Animation au scroll |
| `useCSATTrigger` | Déclenchement sondage satisfaction |
| `useVideoTracking` | Suivi progression vidéo |

---

## Système de Design

### Variables CSS (index.css)

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 217 91% 60%;
  --primary-foreground: 0 0% 100%;
  --secondary: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
  --border: 214.3 31.8% 91.4%;
  --ring: 217 91% 60%;
}

.dark {
  --background: 0 0% 3.9%;
  --foreground: 0 0% 98%;
  /* ... */
}
```

### Composants UI (shadcn/ui)

Tous dans `src/components/ui/` :

- `Button`, `Card`, `Input`, `Select`, `Dialog`
- `Tabs`, `Accordion`, `Collapsible`
- `Table`, `Badge`, `Avatar`
- `Toast`, `Sonner`, `Tooltip`
- `Sidebar`, `Sheet`, `Drawer`
- etc.

### Classes Utilitaires Custom

```css
.hero-gradient {
  background: linear-gradient(135deg, 
    hsl(var(--primary)) 0%, 
    hsl(var(--accent)) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.glass-card {
  background: hsl(var(--card) / 0.8);
  backdrop-filter: blur(10px);
}
```

---

## Sécurité

### Row Level Security (RLS)

Toutes les tables sensibles ont des politiques RLS actives :

**Principes :**
1. Un utilisateur ne voit que **ses propres données**
2. Les **admins** voient tout
3. Les **contacts entreprise** voient les données de leur entreprise

```sql
-- Pattern type
CREATE POLICY "Users view own data"
ON table_name FOR SELECT
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
```

### Validation des Entrées

- **DOMPurify** pour le HTML (forum, éditeurs)
- **Zod** pour la validation des schémas
- **emailSanitize.ts** pour les emails

### Protection des Secrets

- Clés API stockées dans les **secrets Supabase**
- Variables d'environnement `.env` (auto-générées)
- Jamais de secrets dans le code frontend

---

## Glossaire

| Terme | Définition |
|-------|------------|
| **ESPP** | Employee Stock Purchase Plan - Plan d'achat d'actions |
| **PER** | Plan Épargne Retraite |
| **LMNP** | Loueur Meublé Non Professionnel |
| **TMI** | Taux Marginal d'Imposition |
| **RSU** | Restricted Stock Units - Actions gratuites |
| **PEE** | Plan Épargne Entreprise |
| **PERCO** | Plan Épargne Retraite Collectif |
| **RLS** | Row Level Security - Sécurité au niveau des lignes |
| **Edge Function** | Fonction serverless Supabase (Deno) |
| **Parcours** | Ensemble ordonné de modules de formation |
| **Module** | Unité de contenu (vidéo, quiz, webinar, etc.) |
| **CSAT** | Customer Satisfaction Score |

---

## Références

- **Documentation Supabase** : https://supabase.com/docs
- **Documentation React Query** : https://tanstack.com/query
- **Documentation shadcn/ui** : https://ui.shadcn.com
- **Documentation Tailwind** : https://tailwindcss.com/docs

---

*Documentation générée le 22 janvier 2026*
*Version de l'application : FinCare v2.0*
