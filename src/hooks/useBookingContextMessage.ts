import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getReferrerUtmCampaign } from "@/hooks/useBookingReferrer";

interface BookingContextMessage {
  dialog_title: string;
  dialog_description: string | null;
  origin_key: string;
}

const DEFAULT_MESSAGE: BookingContextMessage = {
  dialog_title: "Réserver un rendez-vous",
  dialog_description: null,
  origin_key: "acces_direct",
};

/**
 * Hook that returns the contextual dialog message based on the stored booking referrer.
 * Reads from sessionStorage and matches against the booking_context_messages table.
 */
export function useBookingContextMessage() {
  const [contextMessage, setContextMessage] = useState<BookingContextMessage>(DEFAULT_MESSAGE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMessage = async () => {
      // Get the UTM campaign key from the referrer path
      const referrerPath = sessionStorage.getItem("booking_referrer");
      const originKey = referrerPath ? getReferrerUtmCampaign(referrerPath) : "acces_direct";

      const { data, error } = await supabase
        .from("booking_context_messages")
        .select("dialog_title, dialog_description, origin_key")
        .eq("origin_key", originKey)
        .eq("is_active", true)
        .maybeSingle();

      if (data && !error) {
        setContextMessage(data);
      } else {
        // Fallback to default
        setContextMessage({ ...DEFAULT_MESSAGE, origin_key: originKey });
      }
      setIsLoading(false);
    };

    fetchMessage();
  }, []);

  return { contextMessage, isLoading };
}
