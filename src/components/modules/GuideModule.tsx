import { useState, useEffect } from "react";
import { ModuleIntro } from "./formation/ModuleIntro";
import { ModuleContent } from "./formation/ModuleContent";
import { ModuleEnd } from "./formation/ModuleEnd";
import { SlideViewer } from "./slides/SlideViewer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SlidesData } from "@/types/slides";

interface GuideModuleProps {
  title: string;
  description: string;
  contentUrl: string | null;
  estimatedTime: number;
  points: number;
  contentType?: "video" | "slides" | "text" | "resources" | "mixed";
  embedCode?: string;
  contentData?: any;
  pedagogicalObjectives?: string[];
  difficultyLevel?: 1 | 2 | 3;
  keyTakeaways?: string[];
  autoValidate?: boolean;
  onValidate: () => void;
  moduleId: number;
  userId: string;
}

type ModuleStep = "intro" | "content" | "end";

export const GuideModule = ({
  title,
  description,
  contentUrl,
  estimatedTime,
  points,
  contentType = "mixed",
  embedCode,
  contentData,
  pedagogicalObjectives = [],
  difficultyLevel = 1,
  keyTakeaways = [],
  autoValidate = false,
  onValidate,
  moduleId,
  userId,
}: GuideModuleProps) => {
  const [step, setStep] = useState<ModuleStep>("intro");
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Check if we have slides data
  const slidesData: SlidesData | null = contentData?.slides_data?.slides?.length > 0 
    ? contentData.slides_data 
    : null;

  // Charger l'état sauvegardé au montage
  useEffect(() => {
    loadSavedState();
  }, [moduleId, userId]);

  // Sauvegarder l'état à chaque changement
  useEffect(() => {
    if (!isLoading) {
      saveState();
    }
  }, [step, progress, isLoading]);

  const loadSavedState = async () => {
    try {
      const storageKey = `module_${moduleId}_user_${userId}`;
      const savedState = localStorage.getItem(storageKey);
      
      if (savedState) {
        const { step: savedStep, progress: savedProgress } = JSON.parse(savedState);
        setStep(savedStep);
        setProgress(savedProgress);
      }
    } catch (error) {
      console.error("Error loading saved state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveState = () => {
    try {
      const storageKey = `module_${moduleId}_user_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify({ step, progress }));
    } catch (error) {
      console.error("Error saving state:", error);
    }
  };

  const clearSavedState = () => {
    try {
      const storageKey = `module_${moduleId}_user_${userId}`;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error("Error clearing state:", error);
    }
  };

  const getEstimatedTime = () => {
    return estimatedTime || 15;
  };

  const handleStart = () => {
    setStep("content");
    setProgress(10);
  };

  const handleProgressUpdate = (newProgress: number) => {
    setProgress(newProgress);
  };

  const handleSlidesComplete = () => {
    // Auto-validate when slides are complete
    if (autoValidate) {
      handleValidate();
    }
  };

  const handleValidate = async () => {
    setProgress(100);
    setStep("end");
    
    // Sauvegarder dans la base de données
    try {
      await supabase
        .from("module_validations")
        .insert({
          user_id: userId,
          module_id: moduleId,
          success: true,
        });
    } catch (error) {
      console.error("Error saving validation:", error);
    }
    
    onValidate();
  };

  const handleContinue = () => {
    clearSavedState();
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (step === "intro") {
    return (
      <ModuleIntro
        title={title}
        description={description}
        objectives={pedagogicalObjectives}
        estimatedTime={getEstimatedTime()}
        points={points}
        difficultyLevel={difficultyLevel}
        contentType={slidesData ? "slides" : contentType}
        onStart={handleStart}
      />
    );
  }

  if (step === "content") {
    // Use new SlideViewer if we have slides data
    if (slidesData) {
      return (
        <div className="min-h-screen p-4 pb-24">
          <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
              <p className="text-muted-foreground">{description}</p>
            </div>

            {/* Slide Viewer */}
            <SlideViewer
              slidesData={slidesData}
              onProgressUpdate={handleProgressUpdate}
              onComplete={handleSlidesComplete}
            />

            {/* Validation button */}
            {!autoValidate && (
              <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent backdrop-blur-sm border-t border-border/50">
                <div className="max-w-5xl mx-auto">
                  <button
                    onClick={handleValidate}
                    className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:opacity-90 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                  >
                    J'ai terminé ce module
                    <span className="text-2xl">✓</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Fallback to old ModuleContent for embed-based content
    return (
      <ModuleContent
        contentType={contentType}
        title={title}
        embedCode={embedCode || contentUrl || undefined}
        contentData={contentData}
        progress={progress}
        onValidate={handleValidate}
        onProgressUpdate={handleProgressUpdate}
        autoValidate={autoValidate}
        points={points}
      />
    );
  }

  if (step === "end") {
    return (
      <ModuleEnd
        title={title}
        pointsEarned={points}
        badgeLabel="Module complété"
        keyTakeaways={keyTakeaways}
        onContinue={handleContinue}
      />
    );
  }

  return null;
};
