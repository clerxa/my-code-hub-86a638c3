import { useState, useEffect } from "react";
import { WebinarIntro } from "./webinar/WebinarIntro";
import { WebinarRegistration } from "./webinar/WebinarRegistration";
import { WebinarEnd } from "./webinar/WebinarEnd";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface WebinarModuleProps {
  title: string;
  description: string;
  webinarDate: string | null;
  webinarImageUrl: string | null;
  webinarRegistrationUrl: string | null;
  embedCode?: string | null;
  estimatedTime: number;
  points: number;
  pedagogicalObjectives?: string[];
  keyTakeaways?: string[];
  speakers?: Array<{ name: string; role: string; photo?: string }>;
  resources?: Array<{ name: string; url: string; type: "pdf" | "link" }>;
  onValidate: () => void;
  moduleId: number;
  userId: string;
}

type WebinarStep = "intro" | "registered" | "end";

export const WebinarModule = ({
  title,
  description,
  webinarDate,
  webinarImageUrl,
  webinarRegistrationUrl,
  embedCode,
  estimatedTime,
  points,
  pedagogicalObjectives = [],
  keyTakeaways = [],
  speakers = [],
  resources = [],
  onValidate,
  moduleId,
  userId,
}: WebinarModuleProps) => {
  const [step, setStep] = useState<WebinarStep>("intro");
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Charger l'état sauvegardé au montage
  useEffect(() => {
    loadSavedState();
    checkRegistrationStatus();
  }, [moduleId, userId]);

  // Sauvegarder l'état à chaque changement
  useEffect(() => {
    if (!isLoading) {
      saveState();
    }
  }, [step, isLoading]);

  const checkRegistrationStatus = async () => {
    try {
      // Check if user is registered
      const { data: registration } = await supabase
        .from('webinar_registrations')
        .select('*')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .maybeSingle();

      if (registration) {
        setIsRegistered(true);
        
        // Update step based on registration status
        if (registration.registration_status === 'completed') {
          setIsCompleted(true);
          setStep('end');
        } else if (registration.registration_status === 'joined') {
          setStep('registered');
        } else if (registration.registration_status === 'registration_confirmed') {
          setStep('registered');
        }
      }

      // Check if module is validated
      const { data: validation } = await supabase
        .from('module_validations')
        .select('*')
        .eq('user_id', userId)
        .eq('module_id', moduleId)
        .eq('success', true)
        .maybeSingle();

      if (validation) {
        setIsCompleted(true);
        setStep('end');
      }
    } catch (error) {
      console.error("Error checking registration status:", error);
    }
  };

  const loadSavedState = async () => {
    try {
      const storageKey = `webinar_${moduleId}_user_${userId}`;
      const savedState = localStorage.getItem(storageKey);
      
      if (savedState) {
        const { step: savedStep } = JSON.parse(savedState);
        setStep(savedStep);
      }
    } catch (error) {
      console.error("Error loading saved state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveState = () => {
    try {
      const storageKey = `webinar_${moduleId}_user_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify({ step }));
    } catch (error) {
      console.error("Error saving state:", error);
    }
  };

  const clearSavedState = () => {
    try {
      const storageKey = `webinar_${moduleId}_user_${userId}`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Error clearing state:", error);
    }
  };

  const handleRegister = async () => {
    try {
      // Create pending registration
      const { error } = await supabase
        .from('webinar_registrations')
        .insert({
          user_id: userId,
          module_id: moduleId,
          registration_status: 'registration_pending',
        });

      if (error && !error.message.includes('duplicate')) {
        console.error("Error creating registration:", error);
        toast({
          title: "Erreur",
          description: "Impossible de créer l'inscription",
          variant: "destructive",
        });
        return;
      }

      setIsRegistered(true);
      setStep("registered");
      
      toast({
        title: "Inscription en cours",
        description: "Inscrivez-vous sur Livestorm pour confirmer votre participation !",
      });

      // Open Livestorm registration if URL provided
      if (webinarRegistrationUrl) {
        window.open(webinarRegistrationUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      console.error("Error in registration:", error);
    }
  };

  const handleJoinLive = () => {
    if (webinarRegistrationUrl) {
      window.open(webinarRegistrationUrl, "_blank", "noopener,noreferrer");
    }
  };

  const handleContinue = () => {
    clearSavedState();
    onValidate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent"></div>
      </div>
    );
  }

  // Valeurs par défaut si null
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
    }
    return `${mins} min`;
  };

  const safeDuration = formatDuration(estimatedTime || 60);
  const safeWebinarDate = webinarDate || new Date().toISOString();
  const safeRegistrationUrl = webinarRegistrationUrl || "#";

  // If completed, show end screen directly
  if (isCompleted) {
    return (
      <WebinarEnd
        title={title}
        pointsEarned={points}
        badgeLabel="Webinar Expert"
        keyTakeaways={keyTakeaways}
        resources={resources}
        onContinue={handleContinue}
      />
    );
  }

  if (step === "intro") {
    return (
      <>
        {embedCode && (
          <div className="mb-6 rounded-lg overflow-hidden" dangerouslySetInnerHTML={{ __html: embedCode }} />
        )}
        <WebinarIntro
          title={title}
          description={description}
          webinarDate={safeWebinarDate}
          duration={safeDuration}
          points={points}
          objectives={pedagogicalObjectives}
          speakers={speakers}
          imageUrl={webinarImageUrl || undefined}
          registrationUrl={safeRegistrationUrl}
          embedCode={embedCode || undefined}
          onRegister={handleRegister}
          isRegistered={isRegistered}
        />
      </>
    );
  }

  if (step === "registered") {
    return (
      <WebinarRegistration
        title={title}
        webinarDate={safeWebinarDate}
        duration={safeDuration}
        registrationUrl={safeRegistrationUrl}
        embedCode={embedCode || undefined}
        onJoinLive={handleJoinLive}
        isRegistered={isRegistered}
      />
    );
  }

  if (step === "end") {
    return (
      <WebinarEnd
        title={title}
        pointsEarned={points}
        badgeLabel="Webinar Expert"
        keyTakeaways={keyTakeaways}
        resources={resources}
        onContinue={handleContinue}
      />
    );
  }

  return null;
};
