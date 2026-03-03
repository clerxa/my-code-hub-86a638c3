import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useExpertBookingSettings() {
  return useQuery({
    queryKey: ["expert-booking-landing-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expert_booking_landing_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 10,
  });
}
