import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ResponsiveBanners {
  desktop: string | null;
  tablet: string | null;
  mobile: string | null;
}

type DeviceType = "mobile" | "tablet" | "desktop";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useResponsiveBanner() {
  const [banners, setBanners] = useState<ResponsiveBanners>({
    desktop: null,
    tablet: null,
    mobile: null,
  });
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop");
  const [loading, setLoading] = useState(true);

  // Detect device type based on screen width
  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      if (width < MOBILE_BREAKPOINT) {
        setDeviceType("mobile");
      } else if (width < TABLET_BREAKPOINT) {
        setDeviceType("tablet");
      } else {
        setDeviceType("desktop");
      }
    };

    updateDeviceType();
    window.addEventListener("resize", updateDeviceType);
    return () => window.removeEventListener("resize", updateDeviceType);
  }, []);

  // Fetch all banner URLs
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from("global_settings")
          .select("key, value")
          .eq("category", "branding")
          .in("key", ["default_banner_url", "default_banner_tablet_url", "default_banner_mobile_url"]);

        if (error) throw error;

        const newBanners: ResponsiveBanners = {
          desktop: null,
          tablet: null,
          mobile: null,
        };

        data?.forEach((item) => {
          if (item.key === "default_banner_url" && item.value) {
            newBanners.desktop = item.value as string;
          } else if (item.key === "default_banner_tablet_url" && item.value) {
            newBanners.tablet = item.value as string;
          } else if (item.key === "default_banner_mobile_url" && item.value) {
            newBanners.mobile = item.value as string;
          }
        });

        setBanners(newBanners);
      } catch (error) {
        console.error("Error fetching responsive banners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Get the appropriate banner URL based on device type
  // Falls back to desktop if specific size is not available
  const getCurrentBanner = (): string | null => {
    if (deviceType === "mobile" && banners.mobile) {
      return banners.mobile;
    }
    if (deviceType === "tablet" && banners.tablet) {
      return banners.tablet;
    }
    // Fallback to desktop for all cases
    return banners.desktop;
  };

  return {
    banners,
    deviceType,
    currentBanner: getCurrentBanner(),
    loading,
  };
}
