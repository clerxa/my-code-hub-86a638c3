import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DiagnosticConfig } from "@/data/diagnostic-config";
import { DiagnosticIntro } from "./DiagnosticIntro";
import { DiagnosticQuestion } from "./DiagnosticQuestion";
import { DiagnosticInterstitial } from "./DiagnosticInterstitial";
import { DiagnosticResults } from "./DiagnosticResults";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

type Phase = "intro" | "question" | "interstitial" | "results";

const CACHE_KEY = "myfincare_diagnostic_state";

interface CachedState {
  answers: Record<string, number>;
  currentQuestionIndex: number;
  currentSectionIndex: number;
}

interface Props {
  config: DiagnosticConfig;
}

export function DiagnosticRenderer({ config }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const allQuestions = useMemo(
    () => config.sections.flatMap((s) => s.questions),
    [config]
  );
  const totalQuestions = allQuestions.length;

  // Build a map: flat question index → section index
  const questionToSection = useMemo(() => {
    const map: number[] = [];
    config.sections.forEach((s, si) => {
      s.questions.forEach(() => map.push(si));
    });
    return map;
  }, [config]);

  // Restore from cache
  const cached = useMemo(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) return JSON.parse(raw) as CachedState;
    } catch {}
    return null;
  }, []);

  const [phase, setPhase] = useState<Phase>(cached ? "question" : "intro");
  const [answers, setAnswers] = useState<Record<string, number>>(cached?.answers || {});
  const [currentIndex, setCurrentIndex] = useState(cached?.currentQuestionIndex || 0);
  const [direction, setDirection] = useState(1);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [dbResultId, setDbResultId] = useState<string | null>(null);

  // Timer
  useEffect(() => {
    if (phase !== "question" && phase !== "interstitial") return;
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(interval);
  }, [phase, startTime]);

  // Save to cache
  useEffect(() => {
    if (phase === "question" || phase === "interstitial") {
      const state: CachedState = {
        answers,
        currentQuestionIndex: currentIndex,
        currentSectionIndex: questionToSection[currentIndex] || 0,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(state));
    }
  }, [answers, currentIndex, phase, questionToSection]);

  // Save completed status to DB when results phase is reached
  useEffect(() => {
    if (phase !== "results" || !user) return;
    const saveCompleted = async () => {
      const scores = config.sections.map((section) => {
        const maxPts = section.questions.reduce((sum, q) => sum + Math.max(...q.options.map((o) => o.points)), 0);
        const earned = section.questions.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
        return { id: section.id, title: section.title, score: maxPts > 0 ? Math.round((earned / maxPts) * 100) : 0, earned, maxPoints: maxPts };
      });
      const total = scores.reduce((s, sec) => s + sec.earned, 0);
      const max = scores.reduce((s, sec) => s + sec.maxPoints, 0);
      const pct = max > 0 ? Math.round((total / max) * 100) : 0;

      if (dbResultId) {
        await supabase.from("diagnostic_results").update({
          status: "completed",
          score_percent: pct,
          total_score: total,
          total_max: max,
          section_scores: scores,
          answers,
          elapsed_seconds: elapsed,
          completed_at: new Date().toISOString(),
        }).eq("id", dbResultId);
      } else {
        // No in-progress record (e.g. restored from cache), insert completed directly
        await supabase.from("diagnostic_results").insert({
          user_id: user.id,
          status: "completed",
          score_percent: pct,
          total_score: total,
          total_max: max,
          section_scores: scores,
          answers,
          elapsed_seconds: elapsed,
          completed_at: new Date().toISOString(),
        });
      }
    };
    saveCompleted();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const currentSectionIndex = questionToSection[currentIndex] || 0;
  const currentQuestion = allQuestions[currentIndex];
  const progressPercent = ((Object.keys(answers).length) / totalQuestions) * 100;

  const handleAnswer = useCallback(
    (questionId: string, points: number) => {
      setAnswers((prev) => ({ ...prev, [questionId]: points }));
      setDirection(1);

      const nextIndex = currentIndex + 1;
      if (nextIndex >= totalQuestions) {
        localStorage.removeItem(CACHE_KEY);
        setPhase("results");
        return;
      }

      // Check if we're changing section → show interstitial
      const currentSec = questionToSection[currentIndex];
      const nextSec = questionToSection[nextIndex];
      if (currentSec !== nextSec && config.sections[currentSec]?.interstitial) {
        setPhase("interstitial");
      }
      setCurrentIndex(nextIndex);
    },
    [currentIndex, totalQuestions, questionToSection, config.sections]
  );

  const handleBack = useCallback(() => {
    if (!config.config.allowBack || currentIndex <= 0) return;
    setDirection(-1);
    setCurrentIndex((i) => i - 1);
    setPhase("question");
  }, [currentIndex, config.config.allowBack]);

  const handleStart = async () => {
    setPhase("question");
    setAnswers({});
    setCurrentIndex(0);
    // Save in_progress status to DB
    if (user) {
      const { data } = await supabase
        .from("diagnostic_results")
        .insert({ user_id: user.id, status: "in_progress" })
        .select("id")
        .single();
      if (data) setDbResultId(data.id);
    }
  };

  const handleRestart = () => {
    localStorage.removeItem(CACHE_KEY);
    setAnswers({});
    setCurrentIndex(0);
    setPhase("intro");
  };

  const handleContinueFromInterstitial = () => setPhase("question");

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  // Compute section scores for radar
  const sectionScores = useMemo(() => {
    return config.sections.map((section) => {
      const maxPoints = section.questions.reduce(
        (sum, q) => sum + Math.max(...q.options.map((o) => o.points)),
        0
      );
      const earned = section.questions.reduce(
        (sum, q) => sum + (answers[q.id] ?? 0),
        0
      );
      return {
        id: section.id,
        title: section.title,
        score: maxPoints > 0 ? Math.round((earned / maxPoints) * 100) : 0,
        earned,
        maxPoints,
      };
    });
  }, [config.sections, answers]);

  const totalScore = sectionScores.reduce((s, sec) => s + sec.earned, 0);
  const totalMax = sectionScores.reduce((s, sec) => s + sec.maxPoints, 0);
  const scorePercent = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Back link - always visible */}
      {(phase === "intro" || phase === "results") && (
        <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b border-border px-4 py-3">
          <div className="max-w-2xl mx-auto">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => navigate("/employee")}>
              <ArrowLeft className="h-4 w-4" />
              Retour à l'espace employé
            </Button>
          </div>
        </div>
      )}

      {/* Header bar */}
      {phase !== "intro" && phase !== "results" && (
        <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b border-border px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            {config.config.allowBack && currentIndex > 0 && phase === "question" && (
              <Button variant="ghost" size="icon" onClick={handleBack} aria-label="Question précédente">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  {config.sections[currentSectionIndex]?.title}
                </span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {config.config.showTimer && (
                    <span>{formatTime(elapsed)}</span>
                  )}
                  <span>
                    {Math.min(currentIndex + 1, totalQuestions)}/{totalQuestions}
                  </span>
                </div>
              </div>
              <Progress value={progressPercent} className="h-1.5" />
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Quitter">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            {phase === "intro" && (
              <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <DiagnosticIntro config={config.config} onStart={handleStart} />
              </motion.div>
            )}

            {phase === "question" && currentQuestion && (
              <motion.div
                key={currentQuestion.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <DiagnosticQuestion
                  question={currentQuestion}
                  sectionTitle={config.sections[currentSectionIndex]?.title}
                  selectedPoints={answers[currentQuestion.id]}
                  onAnswer={(points) => handleAnswer(currentQuestion.id, points)}
                />
              </motion.div>
            )}

            {phase === "interstitial" && (
              <motion.div key="interstitial" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <DiagnosticInterstitial
                  message={config.sections[currentSectionIndex - 1]?.interstitial || config.sections[currentSectionIndex]?.interstitial || ""}
                  nextSectionTitle={config.sections[currentSectionIndex]?.title || ""}
                  onContinue={handleContinueFromInterstitial}
                />
              </motion.div>
            )}

            {phase === "results" && (
              <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <DiagnosticResults
                  config={config}
                  sectionScores={sectionScores}
                  scorePercent={scorePercent}
                  totalScore={totalScore}
                  totalMax={totalMax}
                  elapsed={elapsed}
                  onRestart={handleRestart}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
