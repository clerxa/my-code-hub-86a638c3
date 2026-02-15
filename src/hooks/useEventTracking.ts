import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

type EventType = "page_view" | "cta_click";

interface TrackEventOptions {
  event_type: EventType;
  event_name: string;
  event_data?: Record<string, any>;
  page_path?: string;
}

/**
 * Hook centralisé pour tracker les événements utilisateur
 * (visites de pages, clics CTA, etc.)
 */
export function useEventTracking() {
  const { user } = useAuth();

  const trackEvent = useCallback(
    async ({ event_type, event_name, event_data = {}, page_path }: TrackEventOptions) => {
      if (!user?.id) return;

      try {
        await supabase.from("user_events").insert({
          user_id: user.id,
          event_type,
          event_name,
          event_data,
          page_path: page_path || window.location.pathname,
        });
      } catch (err) {
        console.error("Event tracking error:", err);
      }
    },
    [user?.id]
  );

  const trackPageView = useCallback(
    (pageName: string, data?: Record<string, any>) =>
      trackEvent({ event_type: "page_view", event_name: pageName, event_data: data }),
    [trackEvent]
  );

  const trackCTAClick = useCallback(
    (ctaName: string, data?: Record<string, any>) =>
      trackEvent({ event_type: "cta_click", event_name: ctaName, event_data: data }),
    [trackEvent]
  );

  return { trackEvent, trackPageView, trackCTAClick };
}
