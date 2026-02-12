export type CSATContentType = 'module' | 'simulator' | 'parcours' | 'onboarding' | 'financial_profile';
export type InformationLevel = 'too_simple' | 'adapted' | 'too_complex';
export type ExpertIntent = 'yes' | 'not_now' | 'no';
export type CompletionStatus = 'completed' | 'skipped' | 'partial';
export type BetaQuestionType = 'rating_1_5' | 'single_choice' | 'yes_no';

export interface CSATBetaQuestion {
  id: string;
  question_text: string;
  question_type: BetaQuestionType;
  options: string[] | null;
  is_active: boolean;
  priority_order: number;
}

export interface CSATSettings {
  id: string;
  csat_enabled: boolean;
  enabled_for_modules: boolean;
  enabled_for_simulators: boolean;
  enabled_for_parcours: boolean;
  enabled_for_onboarding: boolean;
  enabled_for_financial_profile: boolean;
  beta_questions_count: number;
  expert_intent_enabled: boolean;
  disabled_module_ids: number[];
  alert_low_score_threshold: number;
  alert_complex_percentage: number;
  alert_unclear_next_step_percentage: number;
}

export interface CSATBetaResponse {
  question_id: string;
  question_text: string;
  answer: string | number;
}

export interface CSATResponse {
  id?: string;
  user_id: string;
  content_id: string;
  content_type: CSATContentType;
  content_name: string;
  parcours_id?: string | null;
  user_level?: string | null;
  
  // Screen 1
  content_quality_score?: number;
  experience_score?: number;
  visual_score?: number;
  relevance_score?: number;
  information_level?: InformationLevel;
  
  // Screen 2
  beta_responses?: CSATBetaResponse[];
  
  // Screen 3
  improvement_feedback?: string;
  positive_feedback?: string;
  
  // Screen 4
  expert_intent?: ExpertIntent;
  
  // Metadata
  completion_status: CompletionStatus;
}

export interface CSATDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: CSATContentType;
  contentId: string;
  contentName: string;
  parcoursId?: string;
  onComplete?: () => void;
}
