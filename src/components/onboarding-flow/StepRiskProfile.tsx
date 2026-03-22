import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowRight, ArrowLeft, Shield, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { QuestionWithAnswers, RiskProfileSettings } from "@/types/risk-profile";

interface StepRiskProfileProps {
  onNext: () => void;
  onSkip: () => void;
}

export function StepRiskProfile({ onNext, onSkip }: StepRiskProfileProps) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [settings, setSettings] = useState<RiskProfileSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: settingsData } = await supabase
          .from("risk_profile_settings")
          .select("*")
          .single();
        setSettings(settingsData);

        const { data: questionsData } = await supabase
          .from("risk_questions")
          .select("*")
          .eq("active", true)
          .order("order_num");

        const withAnswers = await Promise.all(
          (questionsData || []).map(async (q) => {
            const { data: answers } = await supabase
              .from("risk_answers")
              .select("*")
              .eq("question_id", q.id)
              .order("order_num");
            return { ...q, answers: answers || [] } as QuestionWithAnswers;
          })
        );
        setQuestions(withAnswers);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      let totalWeightedScore = 0;
      for (const question of questions) {
        const answerId = responses[question.id];
        if (!answerId) continue;
        const answer = question.answers.find((a) => a.id === answerId);
        if (!answer) continue;
        const normalizedScore =
          ((answer.score_value - 1) / 3) * question.amf_weight * 100;
        totalWeightedScore += normalizedScore;

        await supabase.from("user_risk_responses").upsert(
          {
            user_id: user.id,
            question_id: question.id,
            answer_id: answerId,
            score_value: answer.score_value,
          },
          { onConflict: "user_id,question_id" }
        );
      }

      let profileType = "Prudent";
      if (settings) {
        if (totalWeightedScore > settings.threshold_dynamique)
          profileType = "Audacieux";
        else if (totalWeightedScore > settings.threshold_equilibre)
          profileType = "Dynamique";
        else if (totalWeightedScore > settings.threshold_prudent)
          profileType = "Équilibré";
      }

      await supabase.from("risk_profile").upsert(
        {
          user_id: user.id,
          total_weighted_score: totalWeightedScore,
          profile_type: profileType,
          last_updated: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      onNext();
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors du calcul du profil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Questionnaire non disponible pour le moment.
          </CardContent>
        </Card>
        <div className="flex justify-center">
          <Button onClick={onSkip}>Passer cette étape</Button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-xl">Évaluez votre profil investisseur</CardTitle>
              <CardDescription>
                Ce questionnaire réglementaire (AMF/MiFID II) permet de déterminer votre tolérance au risque. Vos réponses orientent les recommandations de placement adaptées à votre profil — question {currentQ + 1} sur {questions.length}.
              </CardDescription>
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge variant="outline" className="text-xs">
            {q.category}
          </Badge>
          <p className="text-base font-medium">{q.question_text}</p>

          <RadioGroup
            value={responses[q.id] || ""}
            onValueChange={(v) =>
              setResponses((prev) => ({ ...prev, [q.id]: v }))
            }
          >
            <div className="space-y-2">
              {q.answers.map((answer) => (
                <div
                  key={answer.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all",
                    responses[q.id] === answer.id
                      ? "bg-primary/5 border-primary"
                      : "bg-background hover:bg-muted border-border"
                  )}
                  onClick={() =>
                    setResponses((prev) => ({ ...prev, [q.id]: answer.id }))
                  }
                >
                  <RadioGroupItem value={answer.id} id={answer.id} />
                  <Label htmlFor={answer.id} className="cursor-pointer flex-1">
                    {answer.answer_text}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
          disabled={currentQ === 0}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Précédent
        </Button>

        {currentQ < questions.length - 1 ? (
          <Button
            onClick={() => setCurrentQ((p) => p + 1)}
            disabled={!responses[q.id]}
            className="gap-2"
          >
            Suivant <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleFinish}
            disabled={!responses[q.id] || saving}
            className="gap-2"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Terminer et accéder à mon tableau de bord <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex justify-center">
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
        >
          Enregistrer et compléter plus tard
        </button>
      </div>
    </div>
  );
}
