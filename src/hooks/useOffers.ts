import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import type { Offer } from '@/components/offers/types';

export function useOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('end_date', { ascending: true });

      if (error) throw error;
      setOffers(data || []);
    } catch (err: any) {
      console.error('Error fetching offers:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('offers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'offers' },
        () => {
          fetchOffers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOffers]);

  return { offers, loading, error, refetch: fetchOffers };
}

export function useActiveOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveOffers = async () => {
      try {
        const { data, error } = await supabase
          .from('offers')
          .select('*')
          .order('end_date', { ascending: true });

        if (error) throw error;
        
        // Filter active offers on client side (RLS already filters, but double-check)
        const now = new Date();
        const activeOffers = (data || []).filter(offer => {
          const startDate = new Date(offer.start_date);
          const endDate = new Date(offer.end_date);
          return offer.is_active && !offer.is_archived && now >= startDate && now <= endDate;
        });
        
        setOffers(activeOffers);
      } catch (err) {
        console.error('Error fetching active offers:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveOffers();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('active-offers-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'offers' },
        () => {
          fetchActiveOffers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { offers, loading };
}

export function useOfferViewTracking() {
  const { user } = useAuth();
  const [lastViewedAt, setLastViewedAt] = useState<Date | null>(null);
  const [hasNewOffers, setHasNewOffers] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchLastViewed = async () => {
      const { data } = await supabase
        .from('user_offer_views')
        .select('last_viewed_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data) {
        setLastViewedAt(new Date(data.last_viewed_at));
      }
    };

    fetchLastViewed();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const checkNewOffers = async () => {
      // Get the latest offer creation date
      const { data: latestOffer } = await supabase
        .from('offers')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestOffer) {
        const latestOfferDate = new Date(latestOffer.created_at);
        const hasNew = !lastViewedAt || latestOfferDate > lastViewedAt;
        setHasNewOffers(hasNew);
      }
    };

    checkNewOffers();
  }, [user, lastViewedAt]);

  const markAsViewed = useCallback(async () => {
    if (!user) return;

    const now = new Date().toISOString();
    
    const { error } = await supabase
      .from('user_offer_views')
      .upsert(
        { user_id: user.id, last_viewed_at: now },
        { onConflict: 'user_id' }
      );

    if (!error) {
      setLastViewedAt(new Date(now));
      setHasNewOffers(false);
    }
  }, [user]);

  return { hasNewOffers, lastViewedAt, markAsViewed };
}
