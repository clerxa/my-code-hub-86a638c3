import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CircularProgress } from "@/components/CircularProgress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Progress } from "@/components/ui/progress";
import { useExpertBookingUrl } from "@/hooks/useExpertBookingUrl";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import {
  ShieldCheck, Clock, ArrowRight, Info, AlertTriangle,
  CheckCircle2, HelpCircle, XCircle, ChevronRight, RotateCcw,
  Calendar, BookOpen, TrendingUp, Scale, FileSearch
} from "lucide-react";
import { cn } from "@/lib/utils";

type AnswerLevel = "known" | "partial" | "unknown";

interface QuizAnswer {
  questionId: number;
  level: AnswerLevel;
  customValue?: string;
}

interface QuizResult {
  id: string;
  score: number;
  answers: QuizAnswer[];
  created_at: string;
}

const QUESTIONS = [
  {
    id: 1,
    title: "Connaissez-vous vos frais de gestion annuels ?",
    explanation: "Les frais de gestion sont prélevés chaque année sur l'encours de votre contrat, indépendamment de sa performance. C'est le frais le plus impactant sur le long terme.",
    pedagogical: "Les frais de gestion d'un PER varient généralement entre 0,5% et 3% par an selon les contrats. Sur un encours de 50 000€ avec 2% de frais annuels, cela représente 1 000€ prélevés chaque année — soit plus de 20 000€ sur 20 ans, sans compter l'effet des intérêts composés perdus.",
  },
  {
    id: 2,
    title: "Savez-vous si vous payez des frais à chaque versement sur votre PER ?",
    explanation: "Les frais de versement sont prélevés sur chaque somme que vous déposez sur votre PER, avant même qu'elle soit investie.",
    pedagogical: "Certains contrats prélèvent jusqu'à 5% de frais sur chaque versement. Concrètement : si vous versez 200€ par mois avec 3% de frais, 6€ sont prélevés avant investissement — soit 72€ par an qui ne travaillent jamais pour vous.",
  },
  {
    id: 3,
    title: "Connaissez-vous le coût d'un arbitrage sur votre contrat ?",
    explanation: "Les frais d'arbitrage sont prélevés lorsque vous modifiez la répartition de votre épargne entre les différents supports d'investissement de votre PER.",
    pedagogical: "Un arbitrage consiste par exemple à passer d'un fonds en euros vers des unités de compte, ou à modifier votre allocation selon votre horizon de retraite. Certains contrats facturent ces opérations entre 0,5% et 1% du montant arbitré — ce qui peut décourager les rééquilibrages pourtant nécessaires.",
  },
  {
    id: 4,
    title: "Avez-vous déjà entendu parler des frais de contrat sur votre PER ?",
    explanation: "Les frais de contrat, aussi appelés frais d'administration, sont des frais fixes prélevés périodiquement pour couvrir les frais de gestion administrative de votre contrat.",
    pedagogical: "Ces frais sont souvent peu visibles car ils apparaissent sous des libellés variés selon les assureurs. Ils peuvent prendre la forme d'un montant fixe annuel ou d'un pourcentage. Ils s'ajoutent aux frais de gestion et viennent réduire d'autant le rendement net de votre épargne.",
  },
  {
    id: 5,
    title: "Savez-vous ce que sont les frais d'arrérages et s'ils s'appliquent à votre contrat ?",
    explanation: "Les frais d'arrérages sont prélevés au moment où vous commencez à percevoir votre retraite sous forme de rente viagère — c'est-à-dire à la sortie du contrat.",
    pedagogical: "Ces frais sont parmi les moins connus car ils n'interviennent qu'à la retraite — parfois dans 20 ou 30 ans. Pourtant, ils peuvent représenter entre 1% et 3% de chaque rente versée, ce qui réduit mécaniquement le revenu que vous percevrez chaque mois à la retraite. Peu de titulaires de PER savent qu'ils existent.",
  },
];

const ANSWER_OPTIONS: { level: AnswerLevel; label: string; icon: typeof CheckCircle2; points: number }[] = [
  { level: "known", label: "Je connais ce chiffre", icon: CheckCircle2, points: 2 },
  { level: "partial", label: "Je sais que ça existe mais je ne connais pas le montant", icon: HelpCircle, points: 1 },
  { level: "unknown", label: "Je ne savais pas que ça existait", icon: XCircle, points: 0 },
];

const getScoreMessage = (score: number) => {
  if (score <= 3) return {
    title: "Vous connaissez peu les frais de votre contrat.",
    text: "C'est le cas de la grande majorité des titulaires de PER. Ces informations sont légalement accessibles mais rarement mises en avant par les gestionnaires. Un expert Perlib peut décrypter votre contrat avec vous en 30 minutes — et vous expliquer exactement ce que vous payez et pourquoi.",
  };
  if (score <= 6) return {
    title: "Vous avez une connaissance partielle des frais de votre contrat.",
    text: "Vous êtes déjà mieux informé que la moyenne. Mais les frais que vous ne connaissez pas encore peuvent avoir un impact significatif sur votre épargne à long terme. Un expert Perlib peut compléter cette analyse avec vous.",
  };
  return {
    title: "Vous avez une bonne connaissance des frais de votre contrat.",
    text: "C'est rare — et c'est un vrai avantage pour piloter votre épargne retraite. Un expert Perlib peut vérifier avec vous si ces frais sont compétitifs par rapport au marché actuel et si votre allocation est adaptée à votre horizon de retraite.",
  };
};

export default function DecryptezPER() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<"intro" | "quiz" | "results">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [showPedagogical, setShowPedagogical] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const [previousResult, setPreviousResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const { bookingUrl } = useExpertBookingUrl(companyId);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => setCompanyId(data?.company_id || null));
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchPreviousResult();
    else setLoading(false);
  }, [user]);

  const fetchPreviousResult = async () => {
    const { data } = await supabase
      .from("per_quiz_results")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setPreviousResult({
        id: data.id,
        score: data.score,
        answers: (data.answers as unknown as QuizAnswer[]) || [],
        created_at: data.created_at,
      });
    }
    setLoading(false);
  };

  const totalScore = answers.reduce((sum, a) => {
    const opt = ANSWER_OPTIONS.find(o => o.level === a.level);
    return sum + (opt?.points || 0);
  }, 0);

  const handleAnswer = (level: AnswerLevel) => {
    const newAnswer: QuizAnswer = {
      questionId: QUESTIONS[currentQ].id,
      level,
      customValue: level === "known" ? customValue : undefined,
    };
    setAnswers(prev => [...prev, newAnswer]);
    setShowPedagogical(true);
    setCustomValue("");
  };

  const handleNext = () => {
    setShowPedagogical(false);
    if (currentQ < QUESTIONS.length - 1) {
      setCurrentQ(prev => prev + 1);
    } else {
      saveResults();
      setPhase("results");
    }
  };

  const saveResults = async () => {
    if (!user) return;
    const finalScore = [...answers].reduce((sum, a) => {
      const opt = ANSWER_OPTIONS.find(o => o.level === a.level);
      return sum + (opt?.points || 0);
    }, 0);

    await supabase.from("per_quiz_results").insert([{
      user_id: user.id,
      score: finalScore,
      answers: JSON.parse(JSON.stringify(answers)),
    }]);
  };

  const resetQuiz = () => {
    setPhase("intro");
    setCurrentQ(0);
    setAnswers([]);
    setShowPedagogical(false);
    setCustomValue("");
    setPreviousResult(null);
  };

  const startQuiz = () => {
    setPhase("quiz");
    setCurrentQ(0);
    setAnswers([]);
    setShowPedagogical(false);
  };

  const renderContent = () => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // ──── INTRO SCREEN ────
  if (phase === "intro") {
    return (
      <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center gap-3 mb-2">
            <FileSearch className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Décryptez votre PER</h1>
            <Badge className="bg-accent text-accent-foreground">Nouveau</Badge>
          </div>
          <p className="text-lg text-muted-foreground">
            Savez-vous vraiment ce que vous payez sur votre Plan Épargne Retraite ?
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.5 }}>
          <p className="text-foreground leading-relaxed">
            Un PER comporte jusqu'à 5 types de frais différents. La loi oblige votre gestionnaire à vous les communiquer — mais il ne les met jamais en avant spontanément. Ce quiz de 5 questions vous permet de mesurer en 2 minutes ce que vous savez vraiment de votre contrat.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }}>
          <Card className="border-l-4 border-l-primary bg-primary/5">
            <CardContent className="p-5 flex gap-3">
              <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                Ce module ne vous dira pas si votre contrat est bon ou mauvais. Il vous aide à identifier ce que vous ne savez pas — ce qui est souvent la première étape pour prendre de bonnes décisions.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {previousResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
            <Card className="border border-accent/30 bg-accent/5">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-foreground">Votre dernier score</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(previousResult.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-3xl font-bold text-primary">{previousResult.score}/10</div>
                </div>
                <div className="flex gap-3 mt-4">
                  <Button onClick={startQuiz} variant="outline" className="gap-2">
                    <RotateCcw className="h-4 w-4" /> Refaire le quiz
                  </Button>
                  <Button
                    className="gap-2 bg-gradient-to-r from-accent to-yellow-500 text-accent-foreground hover:opacity-90"
                    onClick={() => bookingUrl && window.open(bookingUrl, "_blank")}
                  >
                    <Calendar className="h-4 w-4" /> Prendre rendez-vous directement
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.5 }} className="flex items-center gap-4">
          <Button size="lg" onClick={startQuiz} className="gap-2 text-base">
            Commencer le quiz <ArrowRight className="h-5 w-5" />
          </Button>
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" /> 2 minutes
          </span>
        </motion.div>
      </div>
    );
  }

  // ──── QUIZ SCREEN ────
  if (phase === "quiz") {
    const question = QUESTIONS[currentQ];
    const hasAnswered = answers.length > currentQ;

    return (
      <div className="max-w-3xl mx-auto space-y-6 py-8 px-4">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {currentQ + 1} sur {QUESTIONS.length}</span>
            <span>{Math.round(((currentQ + (hasAnswered ? 1 : 0)) / QUESTIONS.length) * 100)}%</span>
          </div>
          <Progress value={((currentQ + (hasAnswered ? 1 : 0)) / QUESTIONS.length) * 100} className="h-2" />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">{question.title}</h2>
              <p className="text-muted-foreground">{question.explanation}</p>
            </div>

            {!hasAnswered ? (
              <div className="space-y-3">
                {ANSWER_OPTIONS.map(opt => (
                  <Card
                    key={opt.level}
                    className={cn(
                      "cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
                      "border-2 border-transparent"
                    )}
                    onClick={() => handleAnswer(opt.level)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <opt.icon className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-foreground font-medium">{opt.label}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Show selected answer */}
                <Card className="border-2 border-primary/30 bg-primary/5">
                  <CardContent className="p-4 flex items-center gap-4">
                    {(() => {
                      const ans = answers[currentQ];
                      const opt = ANSWER_OPTIONS.find(o => o.level === ans.level)!;
                      return (
                        <>
                          <opt.icon className="h-5 w-5 text-primary shrink-0" />
                          <span className="text-foreground font-medium">{opt.label}</span>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Custom value input for "known" */}
                {answers[currentQ].level === "known" && (
                  <div className="flex items-center gap-3">
                    <Input
                      type="text"
                      placeholder="Indiquez le taux si vous souhaitez (en %) — non obligatoire"
                      value={customValue}
                      onChange={e => setCustomValue(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                )}

                {/* Pedagogical box */}
                <Card className="border-l-4 border-l-primary bg-primary/5">
                  <CardContent className="p-5 flex gap-3">
                    <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-primary mb-1">Le saviez-vous ?</p>
                      <p className="text-sm text-foreground">{question.pedagogical}</p>
                    </div>
                  </CardContent>
                </Card>

                <Button onClick={handleNext} className="gap-2">
                  {currentQ < QUESTIONS.length - 1 ? (
                    <>Question suivante <ChevronRight className="h-4 w-4" /></>
                  ) : (
                    <>Voir mes résultats <ArrowRight className="h-4 w-4" /></>
                  )}
                </Button>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // ──── RESULTS SCREEN ────
  const scoreMessage = getScoreMessage(totalScore);

  return (

  return (
    <div className="max-w-3xl mx-auto space-y-10 py-8 px-4">
      {/* Score */}
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="text-center space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Votre score de transparence sur votre PER</h2>
        <div className="flex justify-center">
          <CircularProgress progress={(totalScore / 10) * 100} size={160} strokeWidth={10}>
            <div className="text-center">
              <span className="text-4xl font-bold text-primary">{totalScore}</span>
              <span className="text-lg text-muted-foreground">/10</span>
            </div>
          </CircularProgress>
        </div>
        <div className="max-w-lg mx-auto">
          <h3 className="text-lg font-semibold text-foreground mb-2">{scoreMessage.title}</h3>
          <p className="text-muted-foreground">{scoreMessage.text}</p>
        </div>
      </motion.div>

      {/* Pedagogical Section */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}>
        <h3 className="text-xl font-bold text-foreground mb-6">Pourquoi c'est si opaque ?</h3>
        <div className="grid gap-4">
          {[
            {
              icon: Scale,
              title: "C'est légal mais peu lisible",
              text: "Les gestionnaires de PER sont tenus de communiquer les frais dans les documents contractuels. Mais ces informations sont souvent noyées dans des documents de plusieurs dizaines de pages, exprimées en pourcentages cumulés difficiles à interpréter.",
            },
            {
              icon: TrendingUp,
              title: "L'impact est exponentiel",
              text: "Un écart de 1% de frais annuels sur 30 ans sur un encours de 50 000€ représente plus de 17 000€ d'écart de capital final, en raison de l'effet des intérêts composés. Ce n'est pas anodin.",
            },
            {
              icon: ShieldCheck,
              title: "Vous avez le droit de demander",
              text: "Tout titulaire de PER peut demander à son gestionnaire un relevé détaillé de l'ensemble des frais prélevés sur son contrat. C'est un droit. Et depuis la loi PACTE de 2019, tout PER est transférable vers un autre opérateur sans pénalité après 5 ans.",
            },
          ].map((item, i) => (
            <Card key={i} className="border border-border">
              <CardContent className="p-5 flex gap-4">
                <item.icon className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground mb-1">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.text}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.5 }}>
        <Card className="bg-gradient-to-r from-primary/90 via-secondary/80 to-accent/90 border-0 overflow-hidden">
          <CardContent className="p-8 text-center space-y-4">
            <h3 className="text-2xl font-bold text-primary-foreground">
              Vous voulez savoir exactement ce que vaut votre PER ?
            </h3>
            <p className="text-primary-foreground/90 max-w-lg mx-auto">
              Un expert Perlib peut analyser votre contrat en 30 minutes : décryptage de l'ensemble des frais, comparaison avec les références du marché, et recommandations adaptées à votre situation. Gratuit, sans engagement, sans obligation de transfert.
            </p>
            <Button
              size="lg"
              className="bg-accent text-accent-foreground hover:opacity-90 gap-2 text-base shadow-lg"
              onClick={() => bookingUrl && window.open(bookingUrl, "_blank")}
            >
              <Calendar className="h-5 w-5" />
              Prendre rendez-vous pour décrypter mon PER
              <ArrowRight className="h-5 w-5" />
            </Button>
            <p className="text-xs text-primary-foreground/70">
              Perlib est rémunéré uniquement si vous choisissez de souscrire un produit via notre plateforme. L'analyse de votre contrat existant est entièrement gratuite.
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Restart */}
      <div className="text-center">
        <Button variant="outline" onClick={resetQuiz} className="gap-2">
          <RotateCcw className="h-4 w-4" /> Refaire le quiz
        </Button>
      </div>
    </div>
  );
  };

  return (
    <EmployeeLayout activeSection="decryptez-per">
      {renderContent()}
    </EmployeeLayout>
  );
}
