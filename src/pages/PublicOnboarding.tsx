import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { DynamicOnboardingRenderer } from "@/components/onboarding/DynamicOnboardingRenderer";

const ONBOARDING_SESSION_KEY = 'fincare_onboarding_session_id';
const INVITATION_TOKEN_KEY = 'fincare_invitation_token';
const INVITATION_COMPANY_KEY = 'fincare_invitation_company';

/**
 * Page d'onboarding publique (avant connexion)
 * Utilise le même flow que l'onboarding employé configuré dans le CMS
 * À la fin du parcours, redirige vers la page de login/signup
 * 
 * Le session_id est stocké en localStorage pour être récupéré lors de la création du compte
 * Les paramètres d'invitation sont également stockés pour être passés à la page signup
 */
export default function PublicOnboarding() {
  const [searchParams] = useSearchParams();

  // Generate and store session ID on mount, and save invitation params
  useEffect(() => {
    const existingSession = localStorage.getItem(ONBOARDING_SESSION_KEY);
    if (!existingSession) {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(ONBOARDING_SESSION_KEY, sessionId);
    }

    // Store invitation params if present (for colleague invitation flow)
    const invitationToken = searchParams.get("invitation");
    const companyId = searchParams.get("company");
    
    if (invitationToken) {
      localStorage.setItem(INVITATION_TOKEN_KEY, invitationToken);
    }
    if (companyId) {
      localStorage.setItem(INVITATION_COMPANY_KEY, companyId);
    }
  }, [searchParams]);

  return <DynamicOnboardingRenderer flowId="employee-onboarding" />;
}
