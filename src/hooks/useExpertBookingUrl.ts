import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ExpertBookingData {
  embedCode: string | null;
  fallbackUrl: string | null;
  bookingUrl: string | null; // Always the clickable URL (for buttons/links)
  isLoading: boolean;
}

/**
 * Hook to get expert booking URL with priority:
 * 1. URL based on company rank (if configured)
 * 2. Default embed code from settings
 * 3. Default URL from settings
 * 4. Company embed code (expert_booking_hubspot_embed)
 * 5. Company booking URL (expert_booking_url)
 * 
 * bookingUrl is always the direct URL (not embed HTML) for use in clickable links
 */
export const useExpertBookingUrl = (companyId: string | null): ExpertBookingData => {
  const [data, setData] = useState<ExpertBookingData>({
    embedCode: null,
    fallbackUrl: null,
    bookingUrl: null,
    isLoading: true,
  });

  useEffect(() => {
    const fetchBookingData = async () => {
      // Fetch default settings including rank-based URLs and embeds
      const { data: defaultSettings } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', [
          'default_expert_booking_url', 
          'default_expert_booking_embed',
          'expert_booking_url_rang_1',
          'expert_booking_embed_rang_1',
          'expert_booking_url_rang_2',
          'expert_booking_embed_rang_2',
          'expert_booking_url_rang_3',
          'expert_booking_embed_rang_3',
          'expert_booking_url_rang_4',
          'expert_booking_embed_rang_4'
        ]);

      // Try to parse as JSON, otherwise use the raw value
      const parseValue = (value: string | undefined): string | null => {
        if (!value) return null;
        try {
          const parsed = JSON.parse(value);
          return typeof parsed === 'string' ? parsed : value;
        } catch {
          return value;
        }
      };

      const defaultUrl = defaultSettings?.find(s => s.key === 'default_expert_booking_url')?.value;
      const defaultEmbed = defaultSettings?.find(s => s.key === 'default_expert_booking_embed')?.value;
      const urlRang1 = defaultSettings?.find(s => s.key === 'expert_booking_url_rang_1')?.value;
      const embedRang1 = defaultSettings?.find(s => s.key === 'expert_booking_embed_rang_1')?.value;
      const urlRang2 = defaultSettings?.find(s => s.key === 'expert_booking_url_rang_2')?.value;
      const embedRang2 = defaultSettings?.find(s => s.key === 'expert_booking_embed_rang_2')?.value;
      const urlRang3 = defaultSettings?.find(s => s.key === 'expert_booking_url_rang_3')?.value;
      const embedRang3 = defaultSettings?.find(s => s.key === 'expert_booking_embed_rang_3')?.value;
      const urlRang4 = defaultSettings?.find(s => s.key === 'expert_booking_url_rang_4')?.value;
      const embedRang4 = defaultSettings?.find(s => s.key === 'expert_booking_embed_rang_4')?.value;
      
      const parsedDefaultUrl = parseValue(defaultUrl);
      const parsedDefaultEmbed = parseValue(defaultEmbed);
      const parsedUrlRang1 = parseValue(urlRang1);
      const parsedEmbedRang1 = parseValue(embedRang1);
      const parsedUrlRang2 = parseValue(urlRang2);
      const parsedEmbedRang2 = parseValue(embedRang2);
      const parsedUrlRang3 = parseValue(urlRang3);
      const parsedEmbedRang3 = parseValue(embedRang3);
      const parsedUrlRang4 = parseValue(urlRang4);
      const parsedEmbedRang4 = parseValue(embedRang4);

      if (!companyId) {
        // If no company, use defaults: embed takes priority over URL
        setData({
          embedCode: parsedDefaultEmbed || null,
          fallbackUrl: !parsedDefaultEmbed ? parsedDefaultUrl : null,
          bookingUrl: parsedDefaultUrl, // Always provide the URL for clickable links
          isLoading: false,
        });
        return;
      }

      // Fetch company data including rang
      const { data: company } = await supabase
        .from('companies')
        .select('expert_booking_hubspot_embed, expert_booking_url, rang')
        .eq('id', companyId)
        .single();

      const companyEmbed = company?.expert_booking_hubspot_embed || null;
      const companyUrl = company?.expert_booking_url || null;
      const companyRang = (company as any)?.rang as number | null;

      let finalEmbed: string | null = null;
      let finalUrl: string | null = null;
      let clickableUrl: string | null = null;

      // Priority 1: Embed or URL based on company rank
      if (companyRang) {
        const rankEmbed = companyRang === 1 ? parsedEmbedRang1 : 
                          companyRang === 2 ? parsedEmbedRang2 : 
                          companyRang === 3 ? parsedEmbedRang3 : 
                          companyRang === 4 ? parsedEmbedRang4 : null;
        const rankUrl = companyRang === 1 ? parsedUrlRang1 : 
                        companyRang === 2 ? parsedUrlRang2 : 
                        companyRang === 3 ? parsedUrlRang3 : 
                        companyRang === 4 ? parsedUrlRang4 : null;
        
        // For clickable URL, prioritize rank URL
        clickableUrl = rankUrl || parsedDefaultUrl || companyUrl;
        
        // Embed is prioritary over URL for the rank (for embed widgets)
        if (rankEmbed) {
          setData({
            embedCode: rankEmbed,
            fallbackUrl: null,
            bookingUrl: clickableUrl,
            isLoading: false,
          });
          return;
        }
        if (rankUrl) {
          setData({
            embedCode: null,
            fallbackUrl: rankUrl,
            bookingUrl: rankUrl,
            isLoading: false,
          });
          return;
        }
      }

      // Priority 2-5: default embed > default URL > company embed > company URL
      if (parsedDefaultEmbed) {
        finalEmbed = parsedDefaultEmbed;
        clickableUrl = parsedDefaultUrl || companyUrl;
      } else if (parsedDefaultUrl) {
        finalUrl = parsedDefaultUrl;
        clickableUrl = parsedDefaultUrl;
      } else if (companyEmbed) {
        finalEmbed = companyEmbed;
        clickableUrl = companyUrl;
      } else {
        finalUrl = companyUrl;
        clickableUrl = companyUrl;
      }

      setData({
        embedCode: finalEmbed,
        fallbackUrl: finalUrl,
        bookingUrl: clickableUrl,
        isLoading: false,
      });
    };

    fetchBookingData();
  }, [companyId]);

  return data;
};

/**
 * Function to get expert booking data (for use in components that already have company data)
 */
export const getExpertBookingFallbackUrl = async (): Promise<string | null> => {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'default_expert_booking_url')
    .single();

  return data?.value ? JSON.parse(data.value) : null;
};
