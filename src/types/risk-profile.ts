export interface RiskQuestion {
  id: string;
  category: string;
  question_text: string;
  question_type: string;
  choices?: any;
  active: boolean;
  order_num: number;
  amf_weight: number;
  created_at?: string;
}

export interface RiskAnswer {
  id: string;
  question_id: string;
  answer_text: string;
  score_value: number;
  order_num: number;
  created_at?: string;
}

export interface UserRiskResponse {
  id?: string;
  user_id: string;
  question_id: string;
  answer_id: string;
  score_value: number;
  created_at?: string;
}

export interface RiskProfile {
  id?: string;
  user_id: string;
  total_weighted_score: number;
  profile_type: string;
  last_updated?: string;
}

export interface RiskProfileSettings {
  id?: string;
  module_active: boolean;
  mandatory_for_new_users: boolean;
  threshold_prudent: number;
  threshold_equilibre: number;
  threshold_dynamique: number;
  updated_at?: string;
}

export interface QuestionWithAnswers extends RiskQuestion {
  answers: RiskAnswer[];
}
