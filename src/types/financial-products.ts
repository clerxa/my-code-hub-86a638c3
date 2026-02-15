export interface FinancialProductBenefit {
  id: string;
  text: string;
  icon?: string;
}

export interface FinancialProduct {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  
  // Tags & Categories
  tags: string[];
  category?: string;
  
  // Snapshot Section (Bento Grid)
  availability?: string;
  availability_icon: string;
  risk_level: number;
  risk_label?: string;
  max_amount?: string;
  max_amount_label: string;
  target_return?: string;
  target_return_label: string;
  
  // Benefits Section
  benefits: FinancialProductBenefit[];
  
  // Fiscal Match Section
  fiscal_comparison_enabled: boolean;
  fiscal_explanation?: string;
  fiscal_before_label: string;
  fiscal_before_value?: string;
  fiscal_after_label: string;
  fiscal_after_value?: string;
  fiscal_savings_label: string;
  fiscal_savings_value?: string;
  
  // Expert Tip
  expert_tip_title: string;
  expert_tip_content?: string;
  expert_tip_icon: string;
  
  // CTAs
  cta_text: string;
  cta_url?: string;
  cta_secondary_text?: string;
  cta_secondary_url?: string;
  
  // Visuals
  hero_image_url?: string;
  icon: string;
  gradient_start: string;
  gradient_end: string;
  
  // Metadata
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const PRODUCT_CATEGORIES = [
  { value: 'epargne', label: 'Épargne' },
  { value: 'investissement', label: 'Investissement' },
  { value: 'retraite', label: 'Retraite' },
  { value: 'immobilier', label: 'Immobilier' },
  { value: 'fiscalite', label: 'Fiscalité' },
  { value: 'protection', label: 'Protection' },
] as const;

export const DEFAULT_PRODUCT: Partial<FinancialProduct> = {
  tags: [],
  availability_icon: 'Clock',
  risk_level: 1,
  max_amount_label: 'Plafond',
  target_return_label: 'Rendement cible',
  benefits: [],
  fiscal_comparison_enabled: true,
  fiscal_before_label: 'Sans ce produit',
  fiscal_after_label: 'Avec ce produit',
  fiscal_savings_label: 'Économie',
  expert_tip_title: "Conseil d'Expert",
  expert_tip_icon: 'Lightbulb',
  cta_text: 'En savoir plus',
  icon: 'Wallet',
  gradient_start: '217 91% 60%',
  gradient_end: '262 83% 58%',
  is_active: true,
  display_order: 0,
};
