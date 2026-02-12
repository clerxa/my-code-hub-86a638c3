/**
 * ===========================================================
 * 📄 File: AuthProvider.tsx
 * 📌 Rôle du fichier : Provider React pour la gestion de l'authentification
 * 🧩 Dépendances importantes : 
 *   - @supabase/supabase-js (User, Session)
 *   - supabase client pour les appels API
 *   - useSessionTracking pour le suivi des sessions
 * 🔁 Logiques principales :
 *   - Gestion de l'état d'authentification global
 *   - Écoute des changements d'état d'authentification
 *   - Tracking des sessions utilisateur
 *   - Déconnexion sécurisée avec nettoyage
 * ===========================================================
 */

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useSessionTracking } from "@/hooks/useSessionTracking";
import { logger } from "@/lib/logger";
import { awardDailyLoginPoints } from "@/lib/pointsService";

/**
 * 🔹 Type du contexte d'authentification
 * 🔸 Définit la structure des données accessibles via useAuth()
 * 
 * @interface AuthContextType
 * @property {User | null} user - Utilisateur actuellement connecté
 * @property {Session | null} session - Session Supabase active
 * @property {() => Promise<void>} signOut - Fonction de déconnexion
 */
interface AuthContextType {
  user: User | null;
  session: Session | null;
  signOut: () => Promise<void>;
}

/**
 * 🔹 Contexte React pour l'authentification
 * 🔸 Permet de partager l'état d'authentification dans toute l'application
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * 🔹 Provider d'authentification React
 * 🔸 Englobe l'application pour fournir l'état d'authentification à tous les composants enfants
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {React.ReactNode} props.children - Composants enfants à englober
 * @returns {JSX.Element} Provider avec état d'authentification
 * 
 * @example
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 */
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // État local pour l'utilisateur et la session
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Track if daily login points have been awarded this session
  const dailyLoginAwardedRef = useRef(false);

  // Hook personnalisé pour tracker la durée des sessions
  useSessionTracking(user?.id);
  
  // Award daily login points and update last_login when user logs in
  useEffect(() => {
    const handleDailyLogin = async () => {
      if (user?.id && !dailyLoginAwardedRef.current) {
        dailyLoginAwardedRef.current = true;
        
        // Update last_login timestamp
        const now = new Date().toISOString();
        await supabase
          .from("profiles")
          .update({ last_login: now })
          .eq("id", user.id);
        
        // Award daily login points
        const result = await awardDailyLoginPoints(user.id);
        if (result.success && result.pointsAwarded > 0) {
          console.log(`Daily login points awarded: ${result.pointsAwarded}`);
        }
      }
    };
    
    handleDailyLogin();
  }, [user?.id]);

  useEffect(() => {
    let isMounted = true;

    // Listener for ONGOING auth changes (set up BEFORE getSession)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        console.log("[Auth] onAuthStateChange event:", event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Reset daily login ref on sign out
        if (event === 'SIGNED_OUT') {
          dailyLoginAwardedRef.current = false;
        }
      }
    );

    // INITIAL load - controls loading state
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!isMounted) return;
        
        if (error) {
          console.error("[Auth] getSession error, clearing state:", error.message);
          setSession(null);
          setUser(null);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (e) {
        console.error("[Auth] Unexpected error during init:", e);
        if (isMounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * 🔹 Fonction de déconnexion
   * 🔸 Nettoie les données de session et déconnecte l'utilisateur de Supabase
   * 
   * @async
   * @returns {Promise<void>}
   */
  const signOut = async () => {
    // Nettoyage du tracking de session dans la base de données
    // On fait ça en premier mais on ne bloque pas si ça échoue
    if (user?.id) {
      try {
        await supabase
          .from("profiles")
          .update({
            current_session_start: null
          })
          .eq("id", user.id);
      } catch (error) {
        // Ignore les erreurs - la session peut déjà être expirée
        logger.authError("session_cleanup", error);
      }
    }

    // Nettoyage du localStorage AVANT la déconnexion
    localStorage.removeItem("userId");
    
    // Reset du ref pour les points de connexion quotidiens
    dailyLoginAwardedRef.current = false;
    
    // Reset de l'état local immédiatement
    setUser(null);
    setSession(null);

    // Déconnexion Supabase avec scope 'local' pour garantir le nettoyage
    // même si la session serveur est déjà invalidée
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      // En dernier recours, on continue quand même
      console.log("SignOut completed (session may have been expired)");
    }
  };

  // Affichage d'un loader pendant la vérification initiale de la session
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
        </div>
      </div>
    );
  }

  // Rendu du provider avec les valeurs d'authentification
  return (
    <AuthContext.Provider value={{ user, session, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * 🔹 Hook personnalisé pour accéder au contexte d'authentification
 * 🔸 Simplifie l'accès aux données d'authentification dans les composants
 * 
 * @hook
 * @returns {AuthContextType} Contexte d'authentification avec user, session et signOut
 * @throws {Error} Si utilisé en dehors d'un AuthProvider
 * 
 * @example
 * const { user, signOut } = useAuth();
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
