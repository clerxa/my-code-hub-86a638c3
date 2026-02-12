/**
 * ===========================================================
 * 📄 File: useSessionTracking.ts
 * 📌 Rôle du fichier : Hook pour tracker les sessions utilisateur
 * 🧩 Dépendances importantes : supabase client
 * 🔁 Logiques principales :
 *   - Enregistre l'heure de début de session
 *   - Nettoie les données de session au démontage
 *   - Permet de tracker le temps passé sur l'application
 * ===========================================================
 */

import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * 🔹 Hook pour tracker les sessions utilisateur
 * 🔸 Enregistre automatiquement le début et la fin de session dans la DB
 * 
 * @hook
 * @param {string | undefined} userId - ID de l'utilisateur à tracker
 * 
 * @example
 * // Dans AuthProvider
 * useSessionTracking(user?.id);
 */
export const useSessionTracking = (userId: string | undefined) => {
  useEffect(() => {
    // Ne rien faire si pas d'utilisateur
    if (!userId) return;

    /**
     * 🔹 Enregistre le début de la session
     * 🔸 Met à jour current_session_start dans la table profiles
     */
    const startSession = async () => {
      try {
        await supabase
          .from("profiles")
          .update({
            current_session_start: new Date().toISOString()
          })
          .eq("id", userId);
      } catch (error) {
        console.error("Erreur lors du démarrage de session:", error);
      }
    };

    // Démarrage de la session au montage
    startSession();

    // Nettoyage : efface la session au démontage du composant
    return () => {
      supabase
        .from("profiles")
        .update({ current_session_start: null })
        .eq("id", userId);
    };
  }, [userId]);
};
