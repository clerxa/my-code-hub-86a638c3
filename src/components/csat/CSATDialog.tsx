import React, { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, ChevronRight, ChevronLeft, FlaskConical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCSATSettings } from '@/hooks/useCSATSettings';
import { CSATDialogProps, CSATResponse, CSATBetaResponse, InformationLevel, ExpertIntent } from '@/types/csat';
import { CSATScreen1 } from './CSATScreen1';
import { CSATScreen2 } from './CSATScreen2';
import { CSATScreen3 } from './CSATScreen3';
import { CSATScreen4 } from './CSATScreen4';

export const CSATDialog: React.FC<CSATDialogProps> = ({
  open,
  onOpenChange,
  contentType,
  contentId,
  contentName,
  parcoursId,
  onComplete,
}) => {
  const { settings, betaQuestions } = useCSATSettings();
  const [currentScreen, setCurrentScreen] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Screen 1 state
  const [contentQualityScore, setContentQualityScore] = useState<number>(0);
  const [experienceScore, setExperienceScore] = useState<number>(0);
  const [visualScore, setVisualScore] = useState<number>(0);
  const [relevanceScore, setRelevanceScore] = useState<number>(0);
  const [informationLevel, setInformationLevel] = useState<InformationLevel | null>(null);

  // Screen 2 state
  const [betaResponses, setBetaResponses] = useState<CSATBetaResponse[]>([]);

  // Screen 3 state
  const [improvementFeedback, setImprovementFeedback] = useState('');
  const [positiveFeedback, setPositiveFeedback] = useState('');

  // Screen 4 state
  const [expertIntent, setExpertIntent] = useState<ExpertIntent | null>(null);

  // Get random beta questions based on settings
  const selectedBetaQuestions = useMemo(() => {
    if (!betaQuestions.length || !settings) return [];
    const count = Math.min(settings.beta_questions_count || 2, betaQuestions.length);
    const shuffled = [...betaQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }, [betaQuestions, settings]);

  // Calculate total screens
  const totalScreens = settings?.expert_intent_enabled ? 4 : 3;
  const progressPercent = (currentScreen / totalScreens) * 100;

  // Check if screen 1 is valid
  const isScreen1Valid = contentQualityScore > 0 && experienceScore > 0 && 
                         visualScore > 0 && relevanceScore > 0 && informationLevel !== null;

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentScreen(1);
      setContentQualityScore(0);
      setExperienceScore(0);
      setVisualScore(0);
      setRelevanceScore(0);
      setInformationLevel(null);
      setBetaResponses([]);
      setImprovementFeedback('');
      setPositiveFeedback('');
      setExpertIntent(null);
    }
  }, [open]);

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response: Partial<CSATResponse> = {
        user_id: user.id,
        content_id: contentId,
        content_type: contentType,
        content_name: contentName,
        parcours_id: parcoursId || null,
        completion_status: 'skipped',
      };

      const { error } = await supabase
        .from('csat_responses')
        .insert(response as any);

      if (error) throw error;
    } catch (error) {
      console.error('Error saving skipped CSAT:', error);
    } finally {
      setIsSubmitting(false);
      onOpenChange(false);
      onComplete?.();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const response: Partial<CSATResponse> = {
        user_id: user.id,
        content_id: contentId,
        content_type: contentType,
        content_name: contentName,
        parcours_id: parcoursId || null,
        user_level: null,
        content_quality_score: contentQualityScore,
        experience_score: experienceScore,
        visual_score: visualScore,
        relevance_score: relevanceScore,
        information_level: informationLevel || undefined,
        beta_responses: betaResponses,
        improvement_feedback: improvementFeedback || null,
        positive_feedback: positiveFeedback || null,
        expert_intent: expertIntent || undefined,
        completion_status: 'completed',
      };

      const { error } = await supabase
        .from('csat_responses')
        .insert(response as any);

      if (error) throw error;

      toast.success('Merci pour votre retour !');
    } catch (error) {
      console.error('Error saving CSAT response:', error);
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
      onOpenChange(false);
      onComplete?.();
    }
  };

  const handleNext = () => {
    if (currentScreen < totalScreens) {
      setCurrentScreen(currentScreen + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentScreen > 1) {
      setCurrentScreen(currentScreen - 1);
    }
  };

  const canProceed = () => {
    switch (currentScreen) {
      case 1:
        return isScreen1Valid;
      case 2:
        return true; // Beta questions are optional
      case 3:
        return true; // Feedback is optional
      case 4:
        return true; // Expert intent is optional
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 bg-background z-10 border-b px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-amber-500" />
              <h2 className="text-lg font-semibold">Votre avis compte</h2>
              <span className="text-xs text-amber-500 font-medium">(version bêta)</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              disabled={isSubmitting}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-2">
            Étape {currentScreen} sur {totalScreens}
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {currentScreen === 1 && (
            <CSATScreen1
              contentQualityScore={contentQualityScore}
              setContentQualityScore={setContentQualityScore}
              experienceScore={experienceScore}
              setExperienceScore={setExperienceScore}
              visualScore={visualScore}
              setVisualScore={setVisualScore}
              relevanceScore={relevanceScore}
              setRelevanceScore={setRelevanceScore}
              informationLevel={informationLevel}
              setInformationLevel={setInformationLevel}
            />
          )}

          {currentScreen === 2 && (
            <CSATScreen2
              questions={selectedBetaQuestions}
              responses={betaResponses}
              setResponses={setBetaResponses}
            />
          )}

          {currentScreen === 3 && (
            <CSATScreen3
              improvementFeedback={improvementFeedback}
              setImprovementFeedback={setImprovementFeedback}
              positiveFeedback={positiveFeedback}
              setPositiveFeedback={setPositiveFeedback}
            />
          )}

          {currentScreen === 4 && settings?.expert_intent_enabled && (
            <CSATScreen4
              expertIntent={expertIntent}
              setExpertIntent={setExpertIntent}
            />
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentScreen === 1 || isSubmitting}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Retour
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSkip}
              disabled={isSubmitting}
              size="sm"
            >
              Passer
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isSubmitting}
              className="gap-1"
            >
              {currentScreen === totalScreens ? 'Envoyer' : 'Suivant'}
              {currentScreen < totalScreens && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
