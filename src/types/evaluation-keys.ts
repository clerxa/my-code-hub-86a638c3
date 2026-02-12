// Types pour le système de clés d'évaluation centralisé
// Utilisé par Recommandations, CTAs Simulateurs, et Notifications

export type ValueType = 'number' | 'boolean' | 'string' | 'percentage';

export type SourceType = 'database' | 'computed' | 'realtime';

export type EvaluationCategory = 
  | 'financial_profile' 
  | 'simulation_result' 
  | 'user_progress' 
  | 'profile_status';

export interface EvaluationKey {
  id: string;
  key_name: string;
  label: string;
  category: EvaluationCategory;
  source_type: SourceType;
  source_table: string | null;
  source_column: string | null;
  value_type: ValueType;
  unit: string | null;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export type ConditionOperator = '>' | '<' | '>=' | '<=' | '=' | '!=' | 'between' | 'exists' | 'not_exists';

export interface ConditionConfig {
  key: string;
  operator: ConditionOperator;
  value: number | string | boolean;
  value2?: number | string; // Pour l'opérateur 'between'
}

export interface UnifiedCondition {
  type: 'simple' | 'compound';
  conditions: ConditionConfig[];
  logic?: 'AND' | 'OR'; // Pour les conditions composées
}

// Export pour compatibilité avec ConditionEditor
export interface UnifiedConditionConfig {
  type: 'always' | 'simple' | 'compound';
  conditions: ConditionConfig[];
  logic?: 'AND' | 'OR';
}

// Labels pour les opérateurs
export const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  '>': 'supérieur à',
  '<': 'inférieur à',
  '>=': 'supérieur ou égal à',
  '<=': 'inférieur ou égal à',
  '=': 'égal à',
  '!=': 'différent de',
  'between': 'entre',
  'exists': 'existe',
  'not_exists': 'n\'existe pas',
};

// Labels pour les catégories
export const CATEGORY_LABELS: Record<EvaluationCategory, string> = {
  financial_profile: '💰 Profil Financier',
  simulation_result: '📊 Résultats Simulation',
  user_progress: '📈 Progression Utilisateur',
  profile_status: '👤 Statut Profil',
};

// Opérateurs disponibles par type de valeur
export const OPERATORS_BY_VALUE_TYPE: Record<ValueType, ConditionOperator[]> = {
  number: ['>', '<', '>=', '<=', '=', '!=', 'between'],
  percentage: ['>', '<', '>=', '<=', '=', '!=', 'between'],
  boolean: ['=', '!='],
  string: ['=', '!='],
};
