import { useEffect, useState } from "react";
import { Trophy, Sparkles, Zap } from "lucide-react";
import confetti from "canvas-confetti";

interface VictoryAnimationProps {
  isVisible: boolean;
  villainName: string; // Kept for backward compatibility, represents formation name
  onComplete?: () => void;
}

export const VictoryAnimation = ({ isVisible, villainName, onComplete }: VictoryAnimationProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      
      // Trigger confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#3b82f6', '#8b5cf6', '#ec4899']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#3b82f6', '#8b5cf6', '#ec4899']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // Hide after animation
      const timer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="relative flex flex-col items-center gap-6 animate-scale-in">
        {/* Trophy icon with pulse */}
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <Trophy className="h-24 w-24 text-primary drop-shadow-2xl relative z-10 animate-bounce" />
          <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-primary animate-spin" />
          <Zap className="absolute -bottom-2 -left-2 h-8 w-8 text-primary animate-pulse" />
        </div>

        {/* Victory text */}
        <div className="text-center space-y-2 animate-fade-in">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-400 to-primary bg-clip-text text-transparent">
            Formation Complétée !
          </h2>
          <p className="text-xl text-muted-foreground">
            Vous avez terminé <span className="font-bold text-primary">{villainName}</span>
          </p>
          <p className="text-sm text-muted-foreground">
            Continuez votre parcours de formation !
          </p>
        </div>
      </div>
    </div>
  );
};
