import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QuestionWithAnswers, RiskProfile, RiskProfileSettings } from "@/types/risk-profile";
import { RiskProfileResults } from "./RiskProfileResults";

interface RiskProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  existingProfile?: RiskProfile | null;
  onProfileUpdated: () => void;
}

export const RiskProfileDialog = ({ open, onOpenChange, userId, existingProfile, onProfileUpdated }: RiskProfileDialogProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<RiskProfileSettings | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [calculatedProfile, setCalculatedProfile] = useState<RiskProfile | null>(null);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open, userId]);

  const fetchData = async () => {
    setLoading(true);
    // Don't reset showResults here - we'll set it based on existing profile
    setCurrentStep(0);
    
    try {
      // Fetch settings
      const { data: settingsData } = await supabase
        .from('risk_profile_settings')
        .select('*')
        .single();
      setSettings(settingsData as any);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('risk_questions')
        .select('*')
        .eq('active', true)
        .order('order_num');

      if (questionsError) throw questionsError;

      // Fetch answers for each question
      const questionsWithAnswers = await Promise.all(
        (questionsData || []).map(async (question) => {
          const { data: answersData } = await supabase
            .from('risk_answers')
            .select('*')
            .eq('question_id', question.id)
            .order('order_num');

          return {
            ...question,
            answers: answersData || []
          };
        })
      );

      setQuestions(questionsWithAnswers as any);

      // Fetch existing responses if profile exists
      if (existingProfile) {
        const { data: responsesData } = await supabase
          .from('user_risk_responses')
          .select('*')
          .eq('user_id', userId);

        if (responsesData) {
          const responsesMap: Record<string, string> = {};
          responsesData.forEach(r => {
            responsesMap[r.question_id] = r.answer_id;
          });
          setResponses(responsesMap);
        }

        // If profile exists, show results directly
        setCalculatedProfile(existingProfile);
        setShowResults(true);
      } else {
        // No profile, start questionnaire
        setShowResults(false);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answerId: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: answerId
    }));
  };

  const calculateProfile = async () => {
    setSaving(true);
    try {
      // Calculate weighted score on a scale of 0-100
      let totalWeightedScore = 0;

      for (const question of questions) {
        const answerId = responses[question.id];
        if (!answerId) continue;

        const answer = question.answers.find(a => a.id === answerId);
        if (!answer) continue;

        // Normalize score: (score - min) / (max - min) * weight * 100
        // Assuming scores range from 1 to 4
        const normalizedScore = ((answer.score_value - 1) / 3) * question.amf_weight * 100;
        totalWeightedScore += normalizedScore;

        // Save response
        await supabase
          .from('user_risk_responses')
          .upsert({
            user_id: userId,
            question_id: question.id,
            answer_id: answerId,
            score_value: answer.score_value
          }, {
            onConflict: 'user_id,question_id'
          });
      }

      // Determine profile type based on thresholds
      let profileType = 'Prudent';
      
      if (settings) {
        if (totalWeightedScore > settings.threshold_dynamique) {
          profileType = 'Audacieux';
        } else if (totalWeightedScore > settings.threshold_equilibre) {
          profileType = 'Dynamique';
        } else if (totalWeightedScore > settings.threshold_prudent) {
          profileType = 'Équilibré';
        }
      }

      // Save profile
      await supabase
        .from('risk_profile')
        .upsert({
          user_id: userId,
          total_weighted_score: totalWeightedScore,
          profile_type: profileType,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      // Set calculated profile for display
      setCalculatedProfile({
        user_id: userId,
        total_weighted_score: totalWeightedScore,
        profile_type: profileType,
        last_updated: new Date().toISOString()
      });

      setShowResults(true);
      onProfileUpdated();
      toast.success("Profil de risque enregistré avec succès !");

    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleRetake = () => {
    setShowResults(false);
    setCurrentStep(0);
    setResponses({});
  };

  const currentQuestion = questions[currentStep];
  const progress = ((currentStep + 1) / questions.length) * 100;
  const canGoNext = currentQuestion && responses[currentQuestion.id];
  const isLastQuestion = currentStep === questions.length - 1;

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chargement...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {showResults ? "Votre Profil de Risque" : "Évaluation de votre Profil de Risque"}
          </DialogTitle>
        </DialogHeader>

        {showResults && calculatedProfile ? (
          <RiskProfileResults profile={calculatedProfile} onRetake={handleRetake} />
        ) : (
          <div className="space-y-6 py-4">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Question {currentStep + 1} sur {questions.length}
                </span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Question */}
            {currentQuestion && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Badge variant="outline" className="mb-2">
                    {currentQuestion.category}
                  </Badge>
                  <h3 className="text-xl font-semibold">
                    {currentQuestion.question_text}
                  </h3>
                </div>

                <RadioGroup
                  value={responses[currentQuestion.id] || ''}
                  onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                >
                  <div className="space-y-3">
                    {currentQuestion.answers.map((answer) => (
                      <div
                        key={answer.id}
                        className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handleAnswer(currentQuestion.id, answer.id)}
                      >
                        <RadioGroupItem value={answer.id} id={answer.id} />
                        <Label
                          htmlFor={answer.id}
                          className="flex-1 cursor-pointer font-normal"
                        >
                          {answer.answer_text}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>

              {isLastQuestion ? (
                <Button
                  onClick={calculateProfile}
                  disabled={!canGoNext || saving}
                >
                  {saving ? "Calcul en cours..." : "Voir mes résultats"}
                  <CheckCircle2 className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentStep(prev => Math.min(questions.length - 1, prev + 1))}
                  disabled={!canGoNext}
                >
                  Suivant
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
