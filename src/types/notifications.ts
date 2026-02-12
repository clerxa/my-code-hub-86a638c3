import { UnifiedConditionConfig } from './evaluation-keys';

export type DisplayType = 'dropdown' | 'popup' | 'toast_left' | 'toast_right' | 'banner' | 'silent';
export type TriggerType = 'manual' | 'auto' | 'company';
export type FrequencyLimit = 'immediate' | '1_per_day' | '1_per_week' | '1_per_month' | '1_per_milestone' | '1_per_quiz' | '1_per_webinar' | '1_per_journey';

export interface Notification {
  id: string;
  title: string;
  message: string;
  image_url?: string;
  url_action?: string;
  button_text?: string;
  display_type: DisplayType;
  trigger_type: TriggerType;
  created_at: string;
  created_by?: string;
}

export interface UserNotification {
  id: string;
  user_id: string;
  notification_id: string;
  is_read: boolean;
  delivered_at: string;
  notification?: Notification;
}

export interface NotificationRule {
  id: string;
  rule_name: string;
  rule_key: string;
  trigger_condition: string;
  threshold_value?: any;
  display_type: DisplayType;
  title_template: string;
  message_template: string;
  cta_text?: string;
  cta_url?: string;
  segmentation?: any;
  frequency_limit?: FrequencyLimit;
  active: boolean;
  created_at: string;
  updated_at: string;
  // New unified condition system
  condition_config?: UnifiedConditionConfig;
  use_advanced_conditions?: boolean;
}

export interface NotificationLog {
  id: string;
  user_id: string;
  rule_id?: string;
  notification_id?: string;
  triggered_at: string;
}