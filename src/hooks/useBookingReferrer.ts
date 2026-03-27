import { useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

// Mapping of paths to human-readable labels
const PATH_LABELS: Record<string, string> = {
  "/parcours": "Page Parcours",
  "/employee": "Tableau de bord",
  "/simulators": "Page Simulateurs",
  "/risk-profile": "Profil de risque",
  "/modules": "Liste des modules",
  "/forum": "Forum",
  "/expert-booking": "Accès direct",
  "/rdv-expert": "Accès direct",
  "/simulateur-per": "Simulateur PER",
  "/simulateur-epargne-precaution": "Simulateur Épargne de précaution",
  "/simulateur-capacite-emprunt": "Simulateur Capacité d'emprunt",
  "/simulateur-pret-immobilier": "Simulateur Prêt immobilier",
  "/simulateur-impots": "Simulateur Impôts",
  "/simulateur-interets-composes": "Simulateur Intérêts composés",
  "/simulateur-lmnp": "Simulateur LMNP",
  "/simulateur-pvi": "Simulateur PVI",
  "/simulateur-gestion-pilotee": "Simulateur Gestion pilotée",
  "/mes-plans-espp": "Simulateur ESPP",
  "/optimisation-fiscale": "Optimisation fiscale",
};

// Mapping of paths to UTM campaign values (short, URL-safe)
const PATH_UTM_CAMPAIGNS: Record<string, string> = {
  "/parcours": "parcours",
  "/employee": "dashboard_employe",
  "/simulators": "simulateurs",
  "/risk-profile": "profil_risque",
  "/modules": "modules",
  "/forum": "forum",
  "/expert-booking": "acces_direct",
  "/rdv-expert": "acces_direct",
  "/simulateur-per": "simulateur_per",
  "/simulateur-epargne-precaution": "simulateur_epargne_precaution",
  "/simulateur-capacite-emprunt": "simulateur_capacite_emprunt",
  "/simulateur-pret-immobilier": "simulateur_pret_immobilier",
  "/simulateur-impots": "simulateur_impots",
  "/simulateur-interets-composes": "simulateur_interets_composes",
  "/simulateur-lmnp": "simulateur_lmnp",
  "/simulateur-pvi": "simulateur_pvi",
  "/simulateur-gestion-pilotee": "simulateur_gestion_pilotee",
  "/mes-plans-espp": "simulateur_espp",
  "/optimisation-fiscale": "optimisation_fiscale",
};

// Match module paths like /modules/123
const getModuleLabel = (path: string): string | null => {
  const moduleMatch = path.match(/^\/modules\/(\d+)/);
  if (moduleMatch) {
    return `Module #${moduleMatch[1]}`;
  }
  return null;
};

const getModuleUtm = (path: string): string | null => {
  const moduleMatch = path.match(/^\/modules\/(\d+)/);
  if (moduleMatch) {
    return `module_${moduleMatch[1]}`;
  }
  return null;
};

// Match simulator paths
const getSimulatorLabel = (path: string): string | null => {
  const simulatorPaths: Record<string, string> = {
    "/simulators/epargne-precaution": "Simulateur Épargne de précaution",
    "/simulators/capacite-emprunt": "Simulateur Capacité d'emprunt",
    "/simulators/per": "Simulateur PER",
    "/simulators/per-optimisation": "Simulateur Optimisation PER",
    "/simulators/espp": "Simulateur ESPP",
  };
  
  for (const [simPath, label] of Object.entries(simulatorPaths)) {
    if (path.startsWith(simPath)) {
      return label;
    }
  }
  return null;
};

const getSimulatorUtm = (path: string): string | null => {
  const simulatorPaths: Record<string, string> = {
    "/simulators/epargne-precaution": "simulateur_epargne_precaution",
    "/simulators/capacite-emprunt": "simulateur_capacite_emprunt",
    "/simulators/per": "simulateur_per",
    "/simulators/per-optimisation": "simulateur_optimisation_per",
    "/simulators/espp": "simulateur_espp",
  };
  
  for (const [simPath, utm] of Object.entries(simulatorPaths)) {
    if (path.startsWith(simPath)) {
      return utm;
    }
  }
  return null;
};

// Match parcours paths like /parcours/uuid
const getParcoursLabel = (path: string): string | null => {
  const parcoursMatch = path.match(/^\/parcours\/([a-f0-9-]+)/i);
  if (parcoursMatch) {
    return "Parcours en cours";
  }
  return null;
};

const getParcoursUtm = (path: string): string | null => {
  const parcoursMatch = path.match(/^\/parcours\/([a-f0-9-]+)/i);
  if (parcoursMatch) {
    return "parcours_en_cours";
  }
  return null;
};

export const getReferrerLabel = (path: string): string => {
  // Check exact matches first
  if (PATH_LABELS[path]) {
    return PATH_LABELS[path];
  }
  
  // Check pattern matches
  const moduleLabel = getModuleLabel(path);
  if (moduleLabel) return moduleLabel;
  
  const simulatorLabel = getSimulatorLabel(path);
  if (simulatorLabel) return simulatorLabel;
  
  const parcoursLabel = getParcoursLabel(path);
  if (parcoursLabel) return parcoursLabel;
  
  // Default fallback
  return path;
};

/**
 * Get the UTM campaign value for a given referrer path.
 * Returns a URL-safe, human-readable campaign identifier.
 */
export const getReferrerUtmCampaign = (path: string): string => {
  // Check exact matches first
  if (PATH_UTM_CAMPAIGNS[path]) {
    return PATH_UTM_CAMPAIGNS[path];
  }
  
  // Check pattern matches
  const moduleUtm = getModuleUtm(path);
  if (moduleUtm) return moduleUtm;
  
  const simulatorUtm = getSimulatorUtm(path);
  if (simulatorUtm) return simulatorUtm;
  
  const parcoursUtm = getParcoursUtm(path);
  if (parcoursUtm) return parcoursUtm;
  
  // Default: sanitize path into a URL-safe string
  return path.replace(/^\//, '').replace(/\//g, '_').replace(/[^a-zA-Z0-9_-]/g, '') || 'inconnu';
};

/**
 * Append UTM parameters to a URL.
 * Handles both URLs with existing query params and clean URLs.
 */
export const appendUtmParams = (url: string, utmCampaign: string): string => {
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('utm_source', 'fincare_app');
    urlObj.searchParams.set('utm_campaign', utmCampaign);
    urlObj.searchParams.set('origin', utmCampaign);
    return urlObj.toString();
  } catch {
    // If URL parsing fails, try simple concatenation
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}utm_source=fincare_app&utm_campaign=${encodeURIComponent(utmCampaign)}&origin=${encodeURIComponent(utmCampaign)}`;
  }
};

/**
 * Append UTM parameters to a HubSpot embed data-src URL within embed code.
 */
export const appendUtmToEmbed = (embedCode: string, utmCampaign: string): string => {
  // Match data-src="..." in HubSpot embed
  return embedCode.replace(
    /data-src="([^"]+)"/,
    (match, url) => `data-src="${appendUtmParams(url, utmCampaign)}"`
  );
};

/**
 * Get the current stored UTM campaign from sessionStorage
 */
export const getStoredUtmCampaign = (): string => {
  const referrerPath = sessionStorage.getItem("booking_referrer");
  if (!referrerPath) return "acces_direct";
  return getReferrerUtmCampaign(referrerPath);
};

/**
 * Hook to track referrer when user arrives on Expert Booking page
 * Stores the previous page path in the database for webhook matching
 */
export function useBookingReferrer() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.email) return;

    const trackReferrer = async () => {
      // Get referrer from sessionStorage (set by navigation)
      const referrerPath = sessionStorage.getItem("booking_referrer") || document.referrer || "direct";
      
      // Don't track if already on expert booking page or direct access
      if (referrerPath.includes("/expert-booking") || referrerPath.includes("/rdv-expert")) {
        return;
      }

      const referrerLabel = getReferrerLabel(referrerPath);

      try {
        // Insert the referrer tracking record
        const { error } = await supabase
          .from("booking_referrers")
          .insert({
            user_id: user.id,
            user_email: user.email.toLowerCase(),
            referrer_path: referrerPath,
            referrer_label: referrerLabel,
          });

        if (error) {
          console.error("Error tracking referrer:", error);
        } else {
          console.log("Booking referrer tracked:", referrerPath, "->", referrerLabel);
          // Clear the referrer after successful tracking
          sessionStorage.removeItem("booking_referrer");
        }
      } catch (err) {
        console.error("Error tracking referrer:", err);
      }
    };

    trackReferrer();
  }, [user]);
}

/**
 * Call this function before navigating to expert booking
 * to store the current path as the referrer
 */
export function setBookingReferrer(currentPath: string) {
  sessionStorage.setItem("booking_referrer", currentPath);
}

/**
 * Call this with a custom UTM campaign label (for non-path-based origins)
 * e.g. setBookingReferrerWithUtm("/employee", "offre_black_friday")
 */
export function setBookingReferrerWithUtm(currentPath: string, utmCampaign: string) {
  sessionStorage.setItem("booking_referrer", currentPath);
  sessionStorage.setItem("booking_utm_campaign", utmCampaign);
}

/**
 * Get stored UTM campaign (custom override or derived from path)
 */
export const getStoredUtmCampaignFull = (): string => {
  const customUtm = sessionStorage.getItem("booking_utm_campaign");
  if (customUtm) {
    // Clear after reading
    sessionStorage.removeItem("booking_utm_campaign");
    return customUtm;
  }
  return getStoredUtmCampaign();
};
