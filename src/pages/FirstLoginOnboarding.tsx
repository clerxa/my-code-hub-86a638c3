import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useUserFinancialProfile, type FinancialProfileInput } from "@/hooks/useUserFinancialProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight, ArrowLeft, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import OcrAvisImposition from "@/components/OcrAvisImposition";
import { QuestionWithAnswers, RiskProfileSettings } from "@/types/risk-profile";

export default function FirstLoginOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { saveProfile } = useUserFinancialProfile();
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FinancialProfileInput>({});

  // Risk profile state
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [riskStep, setRiskStep] = useState(0);
  const [settings, setSettings] = useState<RiskProfileSettings | null>(null);
  const [savingRisk, setSavingRisk] = useState(false);
  const [riskLoading, setRiskLoading] = useState(false);

  // Protection: if already completed → redirect
  useEffect(() => {
    const check = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("first_login_onboarding_completed")
        .eq("id", user.id)
        .single();
      if ((data as any)?.first_login_onboarding_completed) {
        navigate("/employee", { replace: true });
      }
    };
    check();
  }, [user, navigate]);

  // Load risk questions when arriving at step 3
  useEffect(() => {
    if (step === 3 && questions.length === 0) {
      fetchRiskQuestions();
    }
  }, [step]);

  const fetchRiskQuestions = async () => {
    setRiskLoading(true);
    try {
      const { data: settingsData } = await supabase
        .from("risk_profile_settings" as any)
        .select("*")
        .single();
      setSettings(settingsData as any);

      const { data: questionsData } = await supabase
        .from("risk_questions" as any)
        .select("*")
        .eq("active", true)
        .order("order_num");

      const questionsWithAnswers: QuestionWithAnswers[] = await Promise.all(
        ((questionsData as any[]) || []).map(async (question: any) => {
          const { data: answersData } = await supabase
            .from("risk_answers" as any)
            .select("*")
            .eq("question_id", question.id)
            .order("order_num");
          return { ...question, answers: (answersData as any[]) || [] };
        })
      );
      setQuestions(questionsWithAnswers);
    } catch (e) {
      console.error(e);
    } finally {
      setRiskLoading(false);
    }
  };

  const updateField = <K extends keyof FinancialProfileInput>(
    field: K,
    value: FinancialProfileInput[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStep1Next = async () => {
    if (!formData.revenu_mensuel_net || !formData.situation_familiale) {
      toast.error("Veuillez renseigner vos revenus et votre situation familiale");
      return;
    }
    setIsSaving(true);
    try {
      await new Promise<void>((resolve) => {
        saveProfile(formData, { onSuccess: () => resolve(), onError: () => resolve() });
        setTimeout(resolve, 2000);
      });
    } finally {
      setIsSaving(false);
    }
    setStep(2);
  };

  const handleComplete = async () => {
    await supabase
      .from("profiles")
      .update({ first_login_onboarding_completed: true } as any)
      .eq("id", user!.id);
    navigate("/panorama?welcome=true");
  };

  const handleRiskCalculate = async () => {
    setSavingRisk(true);
    try {
      let totalWeightedScore = 0;
      for (const question of questions) {
        const answerId = responses[question.id];
        if (!answerId) continue;
        const answer = question.answers.find((a: any) => a.id === answerId);
        if (!answer) continue;
        const normalizedScore = ((answer.score_value - 1) / 3) * question.amf_weight * 100;
        totalWeightedScore += normalizedScore;
        await supabase.from("user_risk_responses" as any).upsert({
          user_id: user!.id,
          question_id: question.id,
          answer_id: answerId,
          score_value: answer.score_value,
        } as any, { onConflict: "user_id,question_id" });
      }

      let profileType = "Prudent";
      if (settings) {
        if (totalWeightedScore > settings.threshold_dynamique) profileType = "Audacieux";
        else if (totalWeightedScore > settings.threshold_equilibre) profileType = "Dynamique";
        else if (totalWeightedScore > settings.threshold_prudent) profileType = "Équilibré";
      }

      await supabase.from("risk_profile" as any).upsert({
        user_id: user!.id,
        total_weighted_score: totalWeightedScore,
        profile_type: profileType,
        last_updated: new Date().toISOString(),
      } as any, { onConflict: "user_id" });

      toast.success(`Profil de risque : ${profileType}`);
      await handleComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingRisk(false);
    }
  };

  const STEPS = [
    { n: 1, label: "Profil financier" },
    { n: 2, label: "Situation fiscale" },
    { n: 3, label: "Profil de risque" },
  ];

  const progressValue = ((step - 1) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-8 px-4">
      {/* Logo */}
      <div className="mb-8">
        <span className="text-2xl font-bold text-primary">MyFinCare</span>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6 w-full max-w-xl justify-center">
        {STEPS.map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors",
                  n < step
                    ? "bg-primary border-primary text-primary-foreground"
                    : n === step
                    ? "border-primary text-primary bg-primary/10"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {n < step ? <CheckCircle className="h-4 w-4" /> : n}
              </div>
              <span
                className={cn(
                  "text-xs font-medium hidden sm:block",
                  n <= step ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </div>
            {i < 2 && (
              <div
                className={cn(
                  "w-8 h-0.5 rounded",
                  n < step ? "bg-primary" : "bg-muted-foreground/20"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xl mb-8">
        <Progress value={progressValue} className="h-1.5" />
      </div>

      {/* STEP 1 — Financial profile */}
      {step === 1 && (
        <div className="w-full max-w-xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Votre profil financier</CardTitle>
              <CardDescription>
                Ces informations personnalisent votre tableau de bord PANORAMA.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Situation familiale *</Label>
                <Select
                  value={formData.situation_familiale || ""}
                  onValueChange={(v) => updateField("situation_familiale", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="celibataire">Célibataire</SelectItem>
                    <SelectItem value="marie">Marié(e)</SelectItem>
                    <SelectItem value="pacse">Pacsé(e)</SelectItem>
                    <SelectItem value="divorce">Divorcé(e)</SelectItem>
                    <SelectItem value="veuf">Veuf(ve)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nombre d'enfants à charge</Label>
                <Input
                  type="number"
                  min={0}
                  value={formData.nb_enfants ?? ""}
                  onChange={(e) => updateField("nb_enfants", parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>

              <div className="space-y-2">
                <Label>Revenus nets mensuels du foyer (€) *</Label>
                <Input
                  type="number"
                  value={formData.revenu_mensuel_net ?? ""}
                  onChange={(e) => updateField("revenu_mensuel_net", parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 3 500"
                />
              </div>

              <div className="space-y-2">
                <Label>Charges fixes mensuelles (€)</Label>
                <Input
                  type="number"
                  value={formData.charges_fixes_mensuelles ?? ""}
                  onChange={(e) => updateField("charges_fixes_mensuelles", parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 1 200"
                />
              </div>

              <div className="space-y-2">
                <Label>Capacité d'épargne mensuelle (€)</Label>
                <Input
                  type="number"
                  value={formData.capacite_epargne_mensuelle ?? ""}
                  onChange={(e) => updateField("capacite_epargne_mensuelle", parseFloat(e.target.value) || 0)}
                  placeholder="Ex: 500"
                />
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleStep1Next} disabled={isSaving} className="w-full gap-2">
            {isSaving ? "Enregistrement..." : "Continuer"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* STEP 2 — Tax notice */}
      {step === 2 && (
        <div className="w-full max-w-xl space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Importez votre avis d'imposition</CardTitle>
              <CardDescription>
                Nous extrayons automatiquement votre TMI et revenu fiscal de référence.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OcrAvisImposition />
            </CardContent>
          </Card>

          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1 gap-2">
                Continuer
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <button
              onClick={() => setStep(3)}
              className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              Passer cette étape — je le ferai plus tard →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3 — Risk profile */}
      {step === 3 && (
        <div className="w-full max-w-xl space-y-6">
          {riskLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : questions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Questionnaire non disponible.</p>
                <Button onClick={handleComplete} className="mt-4 gap-2">
                  Accéder à mon tableau de bord
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-primary" />
                    <div>
                      <CardTitle>Profil de risque investisseur</CardTitle>
                      <CardDescription>
                        Question {riskStep + 1} sur {questions.length}
                      </CardDescription>
                    </div>
                  </div>
                  <Progress value={((riskStep + 1) / questions.length) * 100} className="h-1.5 mt-3" />
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Badge variant="outline" className="w-fit">
                    {questions[riskStep]?.category}
                  </Badge>
                  <CardTitle className="text-lg mt-2">
                    {questions[riskStep]?.question_text}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={responses[questions[riskStep]?.id] || ""}
                    onValueChange={(v) =>
                      setResponses((prev) => ({
                        ...prev,
                        [questions[riskStep].id]: v,
                      }))
                    }
                  >
                    <div className="space-y-2">
                      {questions[riskStep]?.answers.map((answer: any) => (
                        <div
                          key={answer.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/50",
                            responses[questions[riskStep]?.id] === answer.id
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          )}
                          onClick={() =>
                            setResponses((prev) => ({
                              ...prev,
                              [questions[riskStep].id]: answer.id,
                            }))
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

              {/* Risk navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setRiskStep((prev) => Math.max(0, prev - 1))}
                  disabled={riskStep === 0}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Précédent
                </Button>

                {riskStep < questions.length - 1 ? (
                  <Button
                    onClick={() => setRiskStep((prev) => prev + 1)}
                    disabled={!responses[questions[riskStep]?.id]}
                    className="gap-2"
                  >
                    Suivant
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleRiskCalculate}
                    disabled={savingRisk || !responses[questions[riskStep]?.id]}
                    className="gap-2"
                  >
                    {savingRisk ? "Calcul..." : "Terminer"}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="text-center">
                <button
                  onClick={handleComplete}
                  className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                >
                  Passer cette étape →
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
