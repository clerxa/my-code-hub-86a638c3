import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Sparkles, Star, PartyPopper, Rocket, Crown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface CelebrationSettings {
  video_url: string;
  video_enabled: boolean;
  title: string;
  subtitle: string;
  motivational_message: string;
  button_text: string;
  button_url: string;
  show_confetti: boolean;
  show_points: boolean;
  gradient_start: string;
  gradient_middle: string;
  gradient_end: string;
}

interface ParcoursCompletionCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  parcoursTitle: string;
  totalPoints: number;
  parcoursId?: string;
  enablePointsRanking?: boolean;
}

export const ParcoursCompletionCelebration = ({
  isOpen,
  onClose,
  parcoursTitle,
  totalPoints,
  parcoursId,
  enablePointsRanking = true,
}: ParcoursCompletionCelebrationProps) => {
  const navigate = useNavigate();
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);
  const [settings, setSettings] = useState<CelebrationSettings | null>(null);
  const [showContent, setShowContent] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);


  // Fetch settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('celebration_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (data) {
        setSettings(data as CelebrationSettings);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (isOpen && !hasTriggeredConfetti && settings?.show_confetti !== false) {
      setHasTriggeredConfetti(true);
      
      // Epic confetti celebration
      const duration = 6000;
      const end = Date.now() + duration;

      // Continuous confetti streams from sides
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors: ['#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#22c55e', '#06b6d4'],
          gravity: 0.8,
          scalar: 1.2,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors: ['#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#22c55e', '#06b6d4'],
          gravity: 0.8,
          scalar: 1.2,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();

      // Multiple center bursts with delays
      const bursts = [
        { delay: 200, particleCount: 80, spread: 100 },
        { delay: 600, particleCount: 60, spread: 80 },
        { delay: 1000, particleCount: 100, spread: 120 },
        { delay: 1800, particleCount: 50, spread: 70 },
      ];

      bursts.forEach(({ delay, particleCount, spread }) => {
        setTimeout(() => {
          confetti({
            particleCount,
            spread,
            origin: { x: 0.5, y: 0.5 },
            colors: ['#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#22c55e'],
            gravity: 0.6,
            scalar: 1.3,
          });
        }, delay);
      });

      // Stars burst
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 360,
          origin: { x: 0.5, y: 0.3 },
          shapes: ['star'],
          colors: ['#ffd700', '#ffb347', '#ff6961'],
          scalar: 1.5,
          gravity: 0.4,
        });
      }, 1400);
    }
  }, [isOpen, hasTriggeredConfetti, settings?.show_confetti]);

  useEffect(() => {
    if (isOpen) {
      // Delay content reveal for dramatic effect
      const timer = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
      setHasTriggeredConfetti(false);
    }
  }, [isOpen]);

  const handleContinue = () => {
    onClose();
    navigate(settings?.button_url || '/parcours');
  };

  const gradientValue = settings 
    ? `linear-gradient(135deg, hsl(${settings.gradient_start}) 0%, hsl(${settings.gradient_middle}) 50%, hsl(${settings.gradient_end}) 100%)`
    : 'linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(271 81% 56%) 50%, hsl(38 92% 50%) 100%)';

  const gradientStyle = { background: gradientValue };
  const textGradientStyle = { backgroundImage: gradientValue };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl p-0 border-none overflow-hidden bg-transparent shadow-none">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
              className="relative"
            >
              {/* Outer glow effect */}
              <div 
                className="absolute -inset-1 rounded-3xl blur-xl opacity-60"
                style={gradientStyle}
              />
              
              {/* Main card with gradient border */}
              <div 
                className="relative p-[3px] rounded-3xl"
                style={gradientStyle}
              >
                <div className="bg-background rounded-[21px] overflow-hidden">
                  {/* Video section */}
                  {settings?.video_enabled !== false && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: showContent ? 1 : 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="relative w-full aspect-video"
                      style={{ backgroundColor: '#0A161C' }}
                    >
                      <video 
                        ref={videoRef}
                        autoPlay 
                        loop 
                        muted 
                        playsInline
                        className="w-full h-full object-contain"
                      >
                        <source src={settings?.video_url || '/finbear_success.mp4'} type="video/mp4" />
                      </video>
                      
                      {/* Floating decorations around video */}
                      <motion.div
                        animate={{ 
                          y: [-5, 5, -5],
                          rotate: [-5, 5, -5],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-4 left-4"
                      >
                        <Star className="h-8 w-8 text-accent fill-accent" />
                      </motion.div>
                      <motion.div
                        animate={{ 
                          y: [5, -5, 5],
                          rotate: [5, -5, 5],
                        }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute top-4 right-4"
                      >
                        <Crown className="h-8 w-8 text-primary" />
                      </motion.div>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute bottom-4 left-4"
                      >
                        <Sparkles className="h-6 w-6 text-secondary" />
                      </motion.div>
                      <motion.div
                        animate={{ 
                          y: [-3, 3, -3],
                          x: [3, -3, 3],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className="absolute bottom-4 right-4"
                      >
                        <Zap className="h-7 w-7 text-accent fill-accent/30" />
                      </motion.div>
                    </motion.div>
                  )}

                  {/* Content section */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="p-6 sm:p-8 flex flex-col items-center text-center gap-5"
                  >
                    {/* Title with animated gradient */}
                    <div className="space-y-2">
                      <motion.h2 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: showContent ? 1 : 0, scale: showContent ? 1 : 0.5 }}
                        transition={{ delay: 0.5, duration: 0.5, type: "spring", bounce: 0.4 }}
                        className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent"
                        style={textGradientStyle}
                      >
                        {settings?.title || 'Félicitations ! 🎉'}
                      </motion.h2>
                      <p className="text-lg text-muted-foreground">
                        {settings?.subtitle || 'Tu as terminé le parcours'}
                      </p>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: showContent ? 1 : 0 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                        className="text-xl sm:text-2xl font-bold text-foreground"
                      >
                        "{parcoursTitle}"
                      </motion.p>
                    </div>

                    {/* Points earned - animated counter effect */}
                    {settings?.show_points !== false && enablePointsRanking && totalPoints > 0 && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: showContent ? 1 : 0 }}
                        transition={{ delay: 0.8, duration: 0.4, type: "spring", bounce: 0.5 }}
                        className="relative"
                      >
                        <div 
                          className="absolute -inset-1 rounded-2xl blur-md opacity-40"
                          style={gradientStyle}
                        />
                        <div 
                          className="relative p-[2px] rounded-2xl"
                          style={gradientStyle}
                        >
                          <div className="bg-background rounded-[14px] px-8 py-4">
                            <p className="text-sm text-muted-foreground mb-1">Points gagnés</p>
                            <motion.p 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-4xl font-bold bg-clip-text text-transparent"
                              style={textGradientStyle}
                            >
                              +{totalPoints} pts
                            </motion.p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Motivational message */}
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: showContent ? 1 : 0 }}
                      transition={{ delay: 1, duration: 0.5 }}
                      className="text-muted-foreground text-sm sm:text-base max-w-md"
                    >
                      {settings?.motivational_message || 'Continue sur ta lancée ! Chaque parcours complété te rapproche de la maîtrise de tes finances. 💪'}
                    </motion.p>

                    {/* CTA Button with gradient and hover effect */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 10 }}
                      transition={{ delay: 1.2, duration: 0.4 }}
                      className="w-full mt-2"
                    >
                      <Button 
                        onClick={handleContinue}
                        size="lg"
                        className="w-full group relative overflow-hidden text-lg py-6"
                        style={{
                          background: `linear-gradient(135deg, hsl(${settings?.gradient_start || '217 91% 60%'}) 0%, hsl(${settings?.gradient_middle || '271 81% 56%'}) 100%)`,
                        }}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          <Rocket className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                          {settings?.button_text || 'Découvrir d\'autres parcours'}
                        </span>
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </div>

              {/* Floating particles around the dialog */}
              <motion.div
                animate={{ 
                  y: [-20, 20, -20],
                  x: [-10, 10, -10],
                  rotate: [0, 360],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute -top-6 -left-6 text-primary opacity-60"
              >
                <PartyPopper className="h-10 w-10" />
              </motion.div>
              <motion.div
                animate={{ 
                  y: [20, -20, 20],
                  x: [10, -10, 10],
                  rotate: [360, 0],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className="absolute -top-4 -right-8 text-accent opacity-60"
              >
                <Trophy className="h-12 w-12" />
              </motion.div>
              <motion.div
                animate={{ 
                  scale: [1, 1.3, 1],
                  rotate: [0, 180, 360],
                }}
                transition={{ duration: 6, repeat: Infinity }}
                className="absolute -bottom-4 -left-4 text-secondary opacity-50"
              >
                <Sparkles className="h-8 w-8" />
              </motion.div>
              <motion.div
                animate={{ 
                  y: [-15, 15, -15],
                  rotate: [-10, 10, -10],
                }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -bottom-6 -right-6 text-primary opacity-50"
              >
                <Star className="h-10 w-10 fill-primary/30" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </DialogContent>

      {/* CSAT Panel - Outside dialog so it doesn't get cut off */}
      <CSATPanel
        open={showCSAT}
        onOpenChange={closeCSAT}
        contentType={contentType}
        contentId={contentId}
        contentName={contentName}
        parcoursId={parcoursId}
      />
    </Dialog>
  );
};
