/**
 * ===========================================================
 * 📄 File: theme.ts
 * 📌 Rôle du fichier : Définit les types TypeScript pour le système multi-thèmes
 * 🧩 Dépendances importantes : Aucune
 * 🔁 Logiques principales :
 *   - Types pour les thèmes et leurs variantes
 *   - Types pour les données de vilains par thème
 *   - Types pour les labels personnalisés par thème
 * ===========================================================
 */

/**
 * 🔹 Identifiant de thème
 * 🔸 Les valeurs possibles pour identifier un thème dans l'application
 */
export type ThemeId = 'villains' | 'obstacles' | 'challenges' | 'perlib' | 'expedition-financiere' | string;

/**
 * 🔹 Token de couleur du design system
 * 🔸 Définit un token de couleur individuel avec ses propriétés
 * 
 * @interface DesignToken
 * @property {string} value - Valeur HSL de la couleur (ex: "217 91% 60%")
 * @property {string} [description] - Description optionnelle de l'usage du token
 */
export interface DesignToken {
  value: string;
  description?: string;
}

/**
 * 🔹 Ensemble complet des tokens de design d'un thème
 * 🔸 Contient tous les tokens de couleur utilisés dans l'interface
 * 
 * @interface DesignTokens
 */
export interface DesignTokens {
  background: string;
  foreground: string;
  primary: string;
  "primary-foreground": string;
  secondary: string;
  "secondary-foreground": string;
  accent: string;
  "accent-foreground": string;
  muted: string;
  "muted-foreground": string;
  card: string;
  "card-foreground": string;
  border: string;
  input: string;
  ring: string;
  success: string;
  "success-foreground": string;
  destructive: string;
  "destructive-foreground": string;
  warning: string;
  "warning-foreground": string;
  [key: string]: string; // Pour permettre des tokens personnalisés
}

/**
 * 🔹 Labels personnalisés par thème
 * 🔸 Définit tous les termes narratifs qui changent selon le thème choisi
 * 
 * @interface ThemeLabels
 * @property {string} villainLabel - Label au singulier (ex: "Vilain", "Obstacle", "Défi")
 * @property {string} villainLabelPlural - Label au pluriel (ex: "Vilains", "Obstacles", "Défis")
 * @property {string} weaknessLabel - Label pour les faiblesses/solutions/clés
 * @property {string} powerLabel - Label pour les pouvoirs/défis/enjeux
 * @property {string} originLabel - Label pour l'histoire/contexte/description
 * @property {string} defeatLabel - Verbe d'action (ex: "Battre", "Surmonter", "Relever")
 * @property {string} defeatedLabel - Participe passé (ex: "Battu", "Surmonté", "Relevé")
 */
export interface ThemeLabels {
  villainLabel: string;
  villainLabelPlural: string;
  weaknessLabel: string;
  powerLabel: string;
  originLabel: string;
  defeatLabel: string;
  defeatedLabel: string;
}

/**
 * 🔹 Configuration complète d'un thème
 * 🔸 Représente un thème disponible dans l'application avec toutes ses propriétés
 * 
 * @interface Theme
 * @property {ThemeId} id - Identifiant unique du thème
 * @property {string} name - Nom complet du thème (affiché dans l'interface)
 * @property {string} label - Label court du thème
 * @property {string} description - Description du thème pour aider l'utilisateur à choisir
 * @property {DesignTokens} design_tokens - Tokens de design complets du thème
 * @property {ThemeLabels} labels - Labels personnalisés du thème
 * @property {boolean} is_active - Indique si le thème est disponible pour les utilisateurs
 * @property {string} created_at - Date de création du thème
 * @property {string} updated_at - Date de dernière modification du thème
 */
export interface Theme {
  id: ThemeId;
  name: string;
  label: string;
  description: string | null;
  design_tokens: DesignTokens;
  labels: ThemeLabels;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 🔹 Données d'un vilain pour un thème spécifique
 * 🔸 Contient toutes les informations narratives d'un vilain dans une variante de thème
 * 
 * @interface VillainThemeData
 * @property {string} nom - Nom du vilain dans ce thème
 * @property {string} theme - Thème principal (catégorie financière)
 * @property {string} description - Description courte du vilain
 * @property {number} score_a_battre - Points nécessaires pour battre ce vilain
 * @property {string} image_url - URL de l'image du vilain pour ce thème
 * @property {string} origine - Histoire/contexte du vilain
 * @property {string[]} pouvoirs - Liste des pouvoirs/défis/enjeux
 * @property {string[]} faiblesses - Liste des faiblesses/solutions/clés
 */
export interface VillainThemeData {
  nom: string;
  theme: string;
  description: string;
  score_a_battre: number;
  image_url: string;
  origine: string;
  pouvoirs: string[];
  faiblesses: string[];
}

/**
 * 🔹 Données multi-thèmes d'un vilain
 * 🔸 Objet JSONB contenant les variantes du vilain pour chaque thème disponible
 * 
 * @interface VillainMultiThemeData
 * @property {VillainThemeData} [themeId] - Données du vilain pour chaque thème (clé dynamique)
 * 
 * @example
 * {
 *   "villains": { nom: "Lord Taxon", ... },
 *   "obstacles": { nom: "Barrière Fiscale", ... },
 *   "challenges": { nom: "Défi de l'Optimisation", ... }
 * }
 */
export type VillainMultiThemeData = Record<ThemeId, VillainThemeData>;

/**
 * 🔹 Vilain complet avec support multi-thèmes
 * 🔸 Représente un vilain avec toutes ses variantes pour les différents thèmes
 * 
 * @interface Villain
 * @property {string} id - Identifiant unique du vilain
 * @property {string} nom - Nom par défaut (legacy, utilisé comme fallback)
 * @property {string} theme - Thème par défaut (legacy)
 * @property {string} description - Description par défaut (legacy)
 * @property {number} score_a_battre - Score par défaut (legacy)
 * @property {string} image_url - Image par défaut (legacy)
 * @property {number} order_num - Ordre d'affichage du vilain
 * @property {VillainMultiThemeData} theme_data - Données multi-thèmes du vilain
 */
export interface Villain {
  id: string;
  nom: string;
  theme: string;
  description: string;
  score_a_battre: number;
  image_url: string;
  order_num: number;
  theme_data: VillainMultiThemeData;
}

/**
 * 🔹 Contexte de thème fourni à l'application
 * 🔸 Interface du contexte React qui fournit le thème actuel et les méthodes de manipulation
 * 
 * @interface ThemeContextValue
 * @property {Theme | null} currentTheme - Thème actuellement actif pour l'utilisateur
 * @property {Theme[]} availableThemes - Liste de tous les thèmes disponibles
 * @property {boolean} loading - Indique si les thèmes sont en cours de chargement
 * @property {function} setUserTheme - Fonction pour changer le thème de l'utilisateur
 * @property {function} getVillainData - Fonction pour récupérer les données d'un vilain dans le thème actuel
 */
export interface ThemeContextValue {
  currentTheme: Theme | null;
  availableThemes: Theme[];
  loading: boolean;
  setUserTheme: (themeId: ThemeId) => Promise<void>;
  getVillainData: (villain: Villain) => VillainThemeData;
}
