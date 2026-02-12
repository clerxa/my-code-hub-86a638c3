/**
 * ===========================================================
 * 📄 File: ThemeContext.tsx
 * 📌 Rôle du fichier : Contexte React pour la gestion du thème Perlib
 * 🧩 Dépendances importantes :
 *   - React (createContext, useState, useEffect, useCallback)
 *   - Supabase client pour les requêtes DB
 *   - AuthProvider pour récupérer l'utilisateur connecté
 * 🔁 Logiques principales :
 *   - Chargement du thème Perlib depuis la DB
 *   - Application des tokens de design au DOM
 *   - Données des vilains par thème
 * ===========================================================
 */

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { 
  Theme, 
  ThemeContextValue, 
  Villain, 
  VillainThemeData 
} from "@/types/theme";
import { logger } from "@/lib/logger";

const log = logger.scoped("ThemeContext");

// Thème par défaut : Perlib
const DEFAULT_THEME_ID = "perlib";

/**
 * 🔹 Contexte React pour le système de thèmes
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * 🔹 Provider de contexte pour le thème Perlib
 */
export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [currentTheme, setCurrentTheme] = useState<Theme | null>(null);
  const [availableThemes, setAvailableThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  /**
   * 🔹 Charge le thème Perlib depuis la base de données
   */
  const loadPerlibTheme = useCallback(async () => {
    try {
      const { data: themeData, error } = await supabase
        .from("themes")
        .select("*")
        .eq("id", DEFAULT_THEME_ID)
        .eq("is_active", true)
        .single();

      if (error) {
        log.warn(`Theme "${DEFAULT_THEME_ID}" not found, trying fallback`, { error });
        
        // Fallback vers villains si perlib n'existe pas
        const { data: fallbackTheme } = await supabase
          .from("themes")
          .select("*")
          .eq("id", "villains")
          .single();
        
        if (fallbackTheme) {
          setCurrentTheme(fallbackTheme as unknown as Theme);
          setAvailableThemes([fallbackTheme as unknown as Theme]);
        }
        return;
      }

      if (themeData) {
        setCurrentTheme(themeData as unknown as Theme);
        setAvailableThemes([themeData as unknown as Theme]);
        log.debug(`Theme "${DEFAULT_THEME_ID}" loaded successfully`);
      }
    } catch (error) {
      log.error("Failed to load Perlib theme", error);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 🔹 Fonction vide pour compatibilité - le thème est fixe
   */
  const setUserTheme = useCallback(async () => {
    // Thème fixe, pas de changement possible
  }, []);

  /**
   * 🔹 Récupère les données d'un vilain dans le thème actuel
   */
  const getVillainData = useCallback((villain: Villain): VillainThemeData => {
    if (!currentTheme) {
      return {
        nom: villain.nom,
        theme: villain.theme,
        description: villain.description,
        score_a_battre: villain.score_a_battre,
        image_url: villain.image_url,
        origine: "",
        pouvoirs: [],
        faiblesses: []
      };
    }

    const themeData = villain.theme_data?.[currentTheme.id];
    
    if (themeData) {
      return themeData;
    }

    // Fallback vers villains
    const fallbackData = villain.theme_data?.villains;
    
    if (fallbackData) {
      return fallbackData;
    }

    return {
      nom: villain.nom,
      theme: villain.theme,
      description: villain.description,
      score_a_battre: villain.score_a_battre,
      image_url: villain.image_url,
      origine: "",
      pouvoirs: [],
      faiblesses: []
    };
  }, [currentTheme]);

  /**
   * 🔹 Applique uniquement les couleurs de marque (primaire/secondaire) au DOM
   * 🔸 Les autres tokens (background, card, etc.) sont gérés par le dark mode CSS
   */
  const applyThemeToDOM = useCallback((theme: Theme) => {
    const root = document.documentElement;
    
    // Liste des tokens de couleur de marque à appliquer (primaire, secondaire, accent)
    const brandTokens = [
      'primary', 'primary-foreground',
      'secondary', 'secondary-foreground', 
      'accent', 'accent-foreground',
      'ring'
    ];
    
    // Appliquer uniquement les couleurs de marque, pas les fonds/cartes
    brandTokens.forEach((key) => {
      if (theme.design_tokens[key]) {
        root.style.setProperty(`--${key}`, theme.design_tokens[key]);
      }
    });
  }, []);

  /**
   * 🔹 Charge le thème au montage ou quand l'utilisateur change
   */
  useEffect(() => {
    loadPerlibTheme();
  }, [loadPerlibTheme, user]);

  /**
   * 🔹 Applique les couleurs du thème au DOM
   */
  useEffect(() => {
    if (currentTheme) {
      applyThemeToDOM(currentTheme);
    }
  }, [currentTheme, applyThemeToDOM]);

  const value: ThemeContextValue = {
    currentTheme,
    availableThemes,
    loading,
    setUserTheme,
    getVillainData
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * 🔹 Hook personnalisé pour accéder au contexte de thème
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
};
