import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Award, CheckCircle2, XCircle, Zap, TrendingUp, Target, Trophy } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { RichText } from "@/components/ui/rich-text";
import { useQuizValidationSettings } from "@/hooks/useQuizValidationSettings";

interface QuizAnswer {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  id: string;
  title: string;
  description?: string;
  explanation?: string;
  points: number;
  type: "single" | "multiple";
  answers: QuizAnswer[];
}

// Old format support (for backward compatibility)
interface OldQuizQuestion {
  question: string;
  answers: string[];
  correctAnswers: number[];
  multipleChoice: boolean;
}

interface QuizModuleProps {
  title: string;
  description: string;
  questions: (QuizQuestion | OldQuizQuestion)[];
  points: number;
  onValidate: () => void;
}

// Helper function to normalize questions
const normalizeQuestion = (q: QuizQuestion | OldQuizQuestion, index: number): QuizQuestion => {
  // Check if it's already in new format
  if ('title' in q && 'type' in q && q.answers && typeof q.answers[0] === 'object') {
    return q as QuizQuestion;
  }
  
  // Convert old format to new format
  const oldQ = q as OldQuizQuestion;
  return {
    id: crypto.randomUUID(),
    title: oldQ.question || `Question ${index + 1}`,
    description: "",
    points: 10,
    type: oldQ.multipleChoice ? "multiple" : "single",
    answers: (oldQ.answers || []).map((text: string, i: number) => ({
      id: crypto.randomUUID(),
      text,
      isCorrect: (oldQ.correctAnswers || []).includes(i)
    }))
  };
};

export const QuizModule = ({
  title,
  description,
  questions: rawQuestions,
  points,
  onValidate,
}: QuizModuleProps) => {
  // Normalize all questions to new format
  const questions = rawQuestions?.map((q, i) => normalizeQuestion(q, i)) || [];
  
  // Get quiz validation settings from database
  const { settings: validationSettings, calculatePoints, canRetry } = useQuizValidationSettings();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [completedQuestions, setCompletedQuestions] = useState<number[]>([]);
  const [showFinalResult, setShowFinalResult] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [questionAnimation, setQuestionAnimation] = useState(true);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [questionsWithErrors, setQuestionsWithErrors] = useState<number[]>([]);
  const [retryAttempts, setRetryAttempts] = useState(0);

  // Safety check for empty questions
  if (!questions || questions.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <RichText content={description} className="text-sm text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Aucune question disponible pour ce quiz.</p>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const allQuestionsCompleted = completedQuestions.length === questions.length;
  const progressPercentage = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Animation when changing question
  useEffect(() => {
    setQuestionAnimation(false);
    const timer = setTimeout(() => setQuestionAnimation(true), 50);
    return () => clearTimeout(timer);
  }, [currentQuestionIndex]);

  // Confetti effect on success
  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['hsl(200, 65%, 55%)', 'hsl(20, 85%, 72%)', 'hsl(145, 60%, 45%)']
    });
  };

  const handleSingleChoice = (answerId: string) => {
    setSelectedAnswers([answerId]);
  };

  const handleMultipleChoice = (answerId: string, checked: boolean) => {
    if (checked) {
      setSelectedAnswers([...selectedAnswers, answerId]);
    } else {
      setSelectedAnswers(selectedAnswers.filter((id) => id !== answerId));
    }
  };

  const checkAnswer = () => {
    const correctAnswerIds = currentQuestion.answers
      .filter(a => a.isCorrect)
      .map(a => a.id);
    
    const correct =
      selectedAnswers.length === correctAnswerIds.length &&
      selectedAnswers.every((id) => correctAnswerIds.includes(id));

    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      // Utiliser les paramètres de validation pour calculer les points
      const hasHadError = questionsWithErrors.includes(currentQuestionIndex);
      const pointsForQuestion = calculatePoints(currentQuestion.points, !hasHadError);
      setEarnedPoints(prev => prev + pointsForQuestion);
      
      const newCompletedQuestions = [...completedQuestions, currentQuestionIndex];
      setCompletedQuestions(newCompletedQuestions);
      
      // Mini confetti pour bonne réponse
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['hsl(145, 60%, 45%)']
      });
      
      // Si c'est la dernière question, calculer le score final
      if (isLastQuestion) {
        const score = (newCompletedQuestions.length / questions.length) * 100;
        setFinalScore(score);
        setShowFinalResult(true);
        
        // Grand confetti si réussite
        if (score >= 80) {
          setTimeout(triggerConfetti, 300);
        }
      }
    }
  };

  const nextQuestion = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswers([]);
      setShowResult(false);
    }
  };

  const retry = () => {
    // Check if retry is allowed based on settings
    if (!canRetry(retryAttempts)) {
      toast.error("Nombre maximum de tentatives atteint");
      return;
    }
    
    // Marquer cette question comme ayant eu une erreur
    if (!questionsWithErrors.includes(currentQuestionIndex)) {
      setQuestionsWithErrors([...questionsWithErrors, currentQuestionIndex]);
    }
    setRetryAttempts(prev => prev + 1);
    setSelectedAnswers([]);
    setShowResult(false);
  };

  const restartQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setShowResult(false);
    setIsCorrect(false);
    setCompletedQuestions([]);
    setShowFinalResult(false);
    setFinalScore(0);
    setEarnedPoints(0);
    setQuestionsWithErrors([]);
    setRetryAttempts(0);
  };

  return (
    <Card className="overflow-hidden border-primary/20">
      <CardHeader className="space-y-4 bg-gradient-to-br from-card to-card/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              {title}
            </CardTitle>
            <RichText content={description} className="text-sm text-muted-foreground mt-2" />
          </div>
          <div className="flex flex-col gap-2">
            <Badge variant="secondary" className="whitespace-nowrap">
              <Award className="mr-1 h-4 w-4" />
              {points} pts max
            </Badge>
            {earnedPoints > 0 && (
              <Badge className="whitespace-nowrap bg-success text-success-foreground">
                <Zap className="mr-1 h-4 w-4" />
                +{earnedPoints} pts
              </Badge>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Question {currentQuestionIndex + 1} / {questions.length}
            </span>
            <span className="text-primary font-semibold">
              {completedQuestions.length} / {questions.length} réussies
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div 
          className={`space-y-4 transition-all duration-300 ${
            questionAnimation ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {currentQuestionIndex + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{currentQuestion.title}</h3>
                {currentQuestion.description && (
                  <div 
                    className="text-sm text-muted-foreground prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: currentQuestion.description }}
                  />
                )}
              </div>
              <Badge variant="outline" className="flex-shrink-0">
                {currentQuestion.points} pts
              </Badge>
            </div>
          </div>
          
          <div className="space-y-3">
            {currentQuestion.type === "multiple" && (
              <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 rounded-lg p-3">
                <CheckCircle2 className="h-4 w-4" />
                <span className="font-medium">Plusieurs réponses possibles</span>
              </div>
            )}
            
            {currentQuestion.type === "multiple" ? (
              <div className="space-y-2">
                {currentQuestion.answers.map((answer, index) => {
                  const isSelected = selectedAnswers.includes(answer.id);
                  const showCorrect = showResult && answer.isCorrect;
                  const showIncorrect = showResult && isSelected && !answer.isCorrect;
                  
                  return (
                    <label
                      key={answer.id}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer
                        ${isSelected && !showResult ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-card/50'}
                        ${showCorrect ? 'border-success bg-success/10' : ''}
                        ${showIncorrect ? 'border-destructive bg-destructive/10' : ''}
                        ${showResult ? 'cursor-not-allowed' : ''}
                      `}
                    >
                      <Checkbox
                        id={`answer-${answer.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => handleMultipleChoice(answer.id, checked as boolean)}
                        disabled={showResult}
                        className="flex-shrink-0"
                      />
                      <span className="flex-1 text-base">
                        {answer.text}
                      </span>
                      {showCorrect && <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />}
                      {showIncorrect && <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />}
                    </label>
                  );
                })}
              </div>
            ) : (
              <RadioGroup
                value={selectedAnswers[0] || ""}
                onValueChange={(value) => handleSingleChoice(value)}
                disabled={showResult}
                className="space-y-2"
              >
                {currentQuestion.answers.map((answer, index) => {
                  const isSelected = selectedAnswers.includes(answer.id);
                  const showCorrect = showResult && answer.isCorrect;
                  const showIncorrect = showResult && isSelected && !answer.isCorrect;
                  
                  return (
                    <label
                      key={answer.id}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer
                        ${isSelected && !showResult ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-card/50'}
                        ${showCorrect ? 'border-success bg-success/10' : ''}
                        ${showIncorrect ? 'border-destructive bg-destructive/10' : ''}
                        ${showResult ? 'cursor-not-allowed' : ''}
                      `}
                    >
                      <RadioGroupItem 
                        value={answer.id} 
                        id={`answer-${answer.id}`}
                        className="flex-shrink-0"
                      />
                      <span className="flex-1 text-base">
                        {answer.text}
                      </span>
                      {showCorrect && <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />}
                      {showIncorrect && <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />}
                    </label>
                  );
                })}
              </RadioGroup>
            )}
          </div>
        </div>

        {showFinalResult ? (
          <div className="space-y-6 animate-slide-up">
            <div
              className={`relative overflow-hidden rounded-xl p-8 flex flex-col items-center gap-6 border-2 ${
                finalScore >= 80
                  ? "border-success bg-gradient-to-br from-success/20 to-success/5"
                  : "border-destructive bg-gradient-to-br from-destructive/20 to-destructive/5"
              }`}
            >
              {finalScore >= 80 ? (
                <>
                  <div className="relative">
                    <Trophy className="h-20 w-20 text-success animate-bounce" />
                    <div className="absolute inset-0 bg-success/20 blur-xl rounded-full" />
                  </div>
                  <div className="text-center space-y-3">
                    <h3 className="text-3xl font-bold text-success">Félicitations ! 🎉</h3>
                    <div className="text-2xl font-bold">
                      Score : {Math.round(finalScore)}%
                    </div>
                    <p className="text-lg text-muted-foreground">
                      {completedQuestions.length}/{questions.length} bonnes réponses
                    </p>
                    <div className="flex items-center justify-center gap-2 text-success font-semibold text-lg pt-2">
                      <Zap className="h-5 w-5" />
                      <span>+{earnedPoints} points gagnés</span>
                    </div>
                    <p className="text-foreground/80 pt-2">
                      Vous avez maîtrisé ce module avec brio !
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="h-20 w-20 text-destructive" />
                  <div className="text-center space-y-3">
                    <h3 className="text-2xl font-bold text-destructive">Pas encore validé</h3>
                    <div className="text-2xl font-bold">
                      Score : {Math.round(finalScore)}%
                    </div>
                    <p className="text-lg text-muted-foreground">
                      {completedQuestions.length}/{questions.length} bonnes réponses
                    </p>
                    <p className="text-foreground/80 pt-2 max-w-md">
                      Il vous faut au moins <span className="font-bold text-primary">80%</span> de bonnes réponses pour valider ce module.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Réessayez pour mieux comprendre les concepts !
                    </p>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex gap-3">
              {finalScore >= 80 ? (
                <Button onClick={onValidate} size="lg" className="flex-1 bg-success hover:bg-success/90">
                  <Trophy className="mr-2 h-5 w-5" />
                  Valider le module
                </Button>
              ) : (
                <Button onClick={restartQuiz} size="lg" className="flex-1" variant="outline">
                  <Target className="mr-2 h-5 w-5" />
                  Recommencer le quiz
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {showResult && (
              <div
                className={`p-5 rounded-xl border-2 flex items-start gap-4 animate-slide-up ${
                  isCorrect
                    ? "border-success bg-success/10"
                    : "border-destructive bg-destructive/10"
                }`}
              >
                {isCorrect ? (
                  <>
                    <CheckCircle2 className="h-6 w-6 text-success flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-success text-lg mb-1">Excellente réponse ! ✓</p>
                      <p className="text-sm text-muted-foreground">
                        {questionsWithErrors.includes(currentQuestionIndex) ? (
                          <>Vous avez gagné <span className="font-bold text-success">+{calculatePoints(currentQuestion.points, false)} points</span> ({validationSettings.retryPercentage}% pour une tentative après erreur).</>
                        ) : (
                          <>Vous avez gagné <span className="font-bold text-success">+{calculatePoints(currentQuestion.points, true)} points</span>. Continuez comme ça !</>
                        )}
                      </p>
                      {currentQuestion.explanation && (
                        <div className="mt-3 pt-3 border-t border-success/30">
                          <p className="text-sm font-medium text-success mb-1">💡 Explication :</p>
                          <p className="text-sm text-foreground/80">{currentQuestion.explanation}</p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-destructive text-lg mb-1">Réponse incorrecte</p>
                      <p className="text-sm text-muted-foreground">
                        {canRetry(retryAttempts) 
                          ? "Prenez le temps de relire les options. Vous pouvez réessayer !"
                          : "Nombre maximum de tentatives atteint."
                        }
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {!showResult ? (
                <Button
                  onClick={checkAnswer}
                  disabled={selectedAnswers.length === 0}
                  size="lg"
                  className="flex-1"
                >
                  <CheckCircle2 className="mr-2 h-5 w-5" />
                  Valider ma réponse
                </Button>
              ) : isCorrect ? (
                <Button onClick={nextQuestion} size="lg" className="flex-1">
                  {isLastQuestion ? 'Voir les résultats' : 'Question suivante'}
                  <TrendingUp className="ml-2 h-5 w-5" />
                </Button>
              ) : canRetry(retryAttempts) ? (
                <Button onClick={retry} size="lg" variant="outline" className="flex-1">
                  <Target className="mr-2 h-5 w-5" />
                  Réessayer cette question
                </Button>
              ) : (
                <Button onClick={nextQuestion} size="lg" variant="secondary" className="flex-1">
                  {isLastQuestion ? 'Voir les résultats' : 'Question suivante'}
                  <TrendingUp className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
