export type OnboardingScreenType = 
  | 'WELCOME' 
  | 'SINGLE_CHOICE' 
  | 'MULTI_CHOICE' 
  | 'SLIDER' 
  | 'TOGGLE' 
  | 'CALCULATION_RESULT' 
  | 'TEXT_INPUT';

export type OnboardingStatus = 'draft' | 'active' | 'archived';

export interface OnboardingOption {
  label: string;
  value: string | boolean | number;
  icon?: string;
  iconBgColor?: string; // Couleur de fond du bloc d'icône (HSL format)
  iconColor?: string; // Couleur de l'icône elle-même (HSL format)
  description?: string;
  leadRankImpact?: number; // 1 = Hot (🔴), 2 = Warm (🟠), 3 = Cold (🟢)
  nextStepId?: string; // ID de l'écran suivant (branchement conditionnel)
  redirectInternalUrl?: string; // Redirection vers une page de l'app (ex: /employee/dashboard)
  redirectExternalUrl?: string; // Redirection vers une URL externe (ex: https://calendly.com/...)
  parcoursId?: string; // ID du parcours à assigner si cette option est sélectionnée
}

export type CalculationMode = 'formula' | 'thresholds' | 'weighted' | 'fixed' | 'mapping';
export type ResultType = 'number' | 'text';

export interface ThresholdRange {
  min?: number;
  max?: number;
  result: number | string;
}

export interface ThresholdConfig {
  sourceField: string; // ID de l'écran source
  ranges: ThresholdRange[];
}

export interface WeightedCondition {
  screenId: string;
  value: string | number | boolean;
  points: number;
}

export interface MappingRule {
  conditions: { screenId: string; value: string | number | boolean }[];
  result: number | string;
}

export interface CalculationConfig {
  mode: CalculationMode;
  resultType: ResultType; // 'number' ou 'text'
  // Mode: fixed
  fixedValue?: number | string;
  // Mode: formula (ex: "{screen_id_1} * 0.08 + 500") - only for numbers
  formula?: string;
  // Mode: thresholds
  thresholds?: ThresholdConfig;
  // Mode: weighted (somme de points) - only for numbers
  weightedConditions?: WeightedCondition[];
  baseValue?: number;
  // Mode: mapping (combinaison de réponses → résultat)
  mappingRules?: MappingRule[];
  defaultResult?: number | string;
}

export interface OnboardingScreenMetadata {
  // Welcome screen
  icon?: string;
  buttonText?: string;
  
  // Slider
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  defaultValue?: number;
  
  // Calculation result
  calculationConfig?: CalculationConfig;
  loadingText?: string;
  loadingSubtext?: string;
  resultLabel?: string;
  resultUnit?: string;
  redirectUrl?: string;
  summaryItems?: Array<{ label: string; key?: string }>;
  
  // Text input
  placeholder?: string;
  inputType?: 'text' | 'email' | 'tel' | 'number';
  
  // Transition conditions - for ALL screen types
  // Allows defining conditions on the current screen's response value
  transitionConditions?: TransitionCondition[];
  
  // Global screen destination (alternative to next_step_id)
  redirectInternalUrl?: string; // Internal app route (e.g., /employee/dashboard)
  redirectExternalUrl?: string; // External URL (e.g., https://calendly.com/...)
}

// Transition conditions - simplified approach for ALL screen types
// Each screen can have conditions that determine which screen to go to based on the response value

export interface TransitionCondition {
  id: string;
  label: string; // User-friendly label (e.g., "20-30 ans", "Montant > 1000€")
  targetScreenId: string; // Where to go if condition matches
  // For numeric values (SLIDER, TEXT_INPUT with number type)
  minValue?: number;
  maxValue?: number;
  // For text/choice values
  exactValue?: string | number | boolean;
  // For text contains
  containsValue?: string;
  priority: number; // Order of evaluation (lower = first)
}

export const CONDITION_TYPE_LABELS = {
  range: 'Plage de valeurs (min-max)',
  exact: 'Valeur exacte',
  contains: 'Contient',
} as const;

export interface WorkflowPosition {
  x: number;
  y: number;
}

export interface OnboardingScreen {
  id: string;
  flow_id: string;
  order_num: number;
  type: OnboardingScreenType;
  title: string;
  subtitle: string | null;
  options: OnboardingOption[];
  metadata: OnboardingScreenMetadata;
  is_active: boolean;
  status: OnboardingStatus;
  next_step_id: string | null;
  workflow_position?: WorkflowPosition | null;
  created_at: string;
  updated_at: string;
}

// Helper to parse workflow_position from JSON
export function parseWorkflowPosition(data: unknown): WorkflowPosition | null {
  if (!data || typeof data !== 'object') return null;
  const pos = data as Record<string, unknown>;
  if (typeof pos.x === 'number' && typeof pos.y === 'number') {
    return { x: pos.x, y: pos.y };
  }
  return null;
}

export interface OnboardingResponse {
  id: string;
  user_id: string | null;
  session_id: string;
  flow_id: string;
  screen_id: string | null;
  response_value: any;
  lead_rank: number | null;
  created_at: string;
}

export const SCREEN_TYPE_LABELS: Record<OnboardingScreenType, string> = {
  WELCOME: 'Écran d\'accueil',
  SINGLE_CHOICE: 'Choix unique',
  MULTI_CHOICE: 'Choix multiples',
  SLIDER: 'Curseur',
  TOGGLE: 'Oui/Non',
  CALCULATION_RESULT: 'Résultat calculé',
  TEXT_INPUT: 'Saisie texte',
};

export const LEAD_RANK_CONFIG = {
  1: { label: 'Rang 1 - Hot', emoji: '🔴', color: 'text-red-500' },
  2: { label: 'Rang 2 - Warm', emoji: '🟠', color: 'text-orange-500' },
  3: { label: 'Rang 3 - Cold', emoji: '🟢', color: 'text-green-500' },
} as const;
