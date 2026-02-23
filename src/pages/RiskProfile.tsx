import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, Shield, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QuestionWithAnswers, RiskProfile, RiskProfileSettings } from "@/types/risk-profile";
import { RiskProfileResults } from "@/components/risk-profile/RiskProfileResults";

export default function RiskProfilePage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<RiskProfileSettings | null>(null);
  const [existingProfile, setExistingProfile] = useState<RiskProfile | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [calculatedProfile, setCalculatedProfile] = useState<RiskProfile | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Fetch settings
      const { data: settingsData } = await supabase
        .from('risk_profile_settings')
        .select('*')
        .single();
      setSettings(settingsData);

      if (!settingsData?.module_active) {
        toast.error("Le module de profil de risque n'est pas activé");
        navigate('/employee');
        return;
      }

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

      setQuestions(questionsWithAnswers);

      // Fetch existing responses
      const { data: responsesData } = await supabase
        .from('user_risk_responses')
        .select('*')
        .eq('user_id', user.id);

      if (responsesData) {
        const responsesMap: Record<string, string> = {};
        responsesData.forEach(r => {
          responsesMap[r.question_id] = r.answer_id;
        });
        setResponses(responsesMap);
      }

      // Fetch existing profile
      const { data: profileData } = await supabase
        .from('risk_profile')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData) {
        setExistingProfile(profileData);
        setCalculatedProfile(profileData);
        setShowResults(true);
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      // Calculate weighted score
      let totalWeightedScore = 0;

      for (const question of questions) {
        const answerId = responses[question.id];
        if (!answerId) continue;

        const answer = question.answers.find(a => a.id === answerId);
        if (!answer) continue;

        const normalizedScore = ((answer.score_value - 1) / 3) * question.amf_weight * 100;
        totalWeightedScore += normalizedScore;

        // Save response
        await supabase
          .from('user_risk_responses')
          .upsert({
            user_id: user.id,
            question_id: question.id,
            answer_id: answerId,
            score_value: answer.score_value
          }, {
            onConflict: 'user_id,question_id'
          });
      }

      // Determine profile type based on thresholds
      let profileType: string = 'Prudent';
      
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
          user_id: user.id,
          total_weighted_score: totalWeightedScore,
          profile_type: profileType,
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      const newProfile: RiskProfile = {
        user_id: user.id,
        total_weighted_score: totalWeightedScore,
        profile_type: profileType,
        last_updated: new Date().toISOString()
      };

      setCalculatedProfile(newProfile);
      setExistingProfile(newProfile);
      setShowResults(true);
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
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <p>Chargement...</p>
        </main>
      </div>
    );
  }

  if (questions.length === 0 && !showResults) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Aucune question disponible</CardTitle>
              <CardDescription>
                Le questionnaire n'est pas encore configuré.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/employee')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        {showResults && calculatedProfile ? (
          <div className="space-y-6">
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-2xl">Votre Profil de Risque</CardTitle>
                    <CardDescription>
                      Résultats de votre évaluation AMF / MiFID II
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <RiskProfileResults profile={calculatedProfile} onRetake={handleRetake} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <Card className="border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-2xl">Profil de Risque Investisseur</CardTitle>
                    <CardDescription>
                      Questionnaire conforme AMF / MiFID II - {questions.length} questions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

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

            {/* Question Card */}
            <Card>
              <CardHeader>
                <Badge variant="outline" className="w-fit mb-2">
                  {currentQuestion?.category}
                </Badge>
                <CardTitle className="text-xl">
                  {currentQuestion?.question_text}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={responses[currentQuestion?.id] || ''}
                  onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                >
                  <div className="space-y-3">
                    {currentQuestion?.answers.map((answer) => (
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
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
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
      </main>
    </div>
  );
}