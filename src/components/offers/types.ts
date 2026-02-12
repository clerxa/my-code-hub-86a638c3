export interface Offer {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  cta_text: string | null;
  cta_url: string | null;
  category: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_archived: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export type OfferStatus = 'active' | 'scheduled' | 'expired' | 'archived';

export const OFFER_CATEGORIES = [
  { value: 'webinar', label: 'Webinar', color: 'bg-blue-500' },
  { value: 'avantage', label: 'Avantage', color: 'bg-green-500' },
  { value: 'parrainage', label: 'Parrainage', color: 'bg-purple-500' },
  { value: 'operation_speciale', label: 'Opération Spéciale', color: 'bg-orange-500' },
  { value: 'general', label: 'Général', color: 'bg-gray-500' },
] as const;

export const getCategoryLabel = (category: string) => {
  return OFFER_CATEGORIES.find(c => c.value === category)?.label || category;
};

export const getCategoryColor = (category: string) => {
  return OFFER_CATEGORIES.find(c => c.value === category)?.color || 'bg-gray-500';
};

export const getOfferStatus = (offer: Offer): OfferStatus => {
  const now = new Date();
  const startDate = new Date(offer.start_date);
  const endDate = new Date(offer.end_date);
  
  if (offer.is_archived) return 'archived';
  if (now < startDate) return 'scheduled';
  if (now > endDate) return 'expired';
  if (offer.is_active) return 'active';
  return 'expired';
};
