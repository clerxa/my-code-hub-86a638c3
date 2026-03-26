import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Sparkles, X, TrendingUp, Shield, Target, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { useRdvLink } from "@/hooks/useRdvLink";
import { useNavigate } from "react-router-dom";

interface PostSaveExpertPromptProps {
  open: boolean;
  onClose: () => void;
  simulationType?: string;
}

const MESSAGES = [
  {
    icon: TrendingUp,
    title: "Envie d'aller plus loin ?",
    subtitle: "Un expert peut vous aider à optimiser cette stratégie en fonction de votre situation réelle.",
    cta: "Échanger avec un expert",
  },
  {
    icon: Target,
    title: "Besoin de décrypter vos résultats ?",
    subtitle: "Nos conseillers certifiés analysent vos projections et vous proposent un plan d'action concret.",
    cta: "Prendre rendez-vous",
  },
  {
    icon: Shield,
    title: "Et si on sécurisait votre projet ?",
    subtitle: "Un accompagnement personnalisé pour transformer cette simulation en stratégie patrimoniale.",
    cta: "Consulter un expert",
  },
  {
    icon: Lightbulb,
    title: "Une question sur ces résultats ?",
    subtitle: "Échangez gratuitement avec un expert pour valider vos hypothèses et affiner votre stratégie.",
    cta: "Réserver un créneau",
  },
  {
    icon: Sparkles,
    title: "Passez à l'action !",
    subtitle: "Un conseiller dédié peut vous accompagner pour concrétiser les résultats de votre simulation.",
    cta: "Parler à un expert",
  },
];

export function PostSaveExpertPrompt({ open, onClose, simulationType }: PostSaveExpertPromptProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { rdvUrl: bookingUrl } = useRdvLink();

  // Pick a random message on each open, seeded by timestamp to rotate
  const message = useMemo(() => {
    const index = Math.floor(Math.random() * MESSAGES.length);
    return MESSAGES[index];
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const CurrentIcon = message.icon;

  const handleBooking = () => {
    if (bookingUrl) {
      window.open(bookingUrl, "_blank");
    } else {
      navigate("/expert-booking");
    }
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-card border border-border rounded-2xl p-8 shadow-2xl max-w-md mx-4 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col items-center text-center space-y-5">
            {/* Success check */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
              className="p-4 rounded-full bg-primary/10"
            >
              <CurrentIcon className="h-8 w-8 text-primary" />
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <h3 className="text-xl font-semibold text-foreground">{message.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{message.subtitle}</p>
            </motion.div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex flex-col gap-3 w-full pt-2"
            >
              <Button onClick={handleBooking} className="w-full gap-2">
                <Calendar className="h-4 w-4" />
                {message.cta}
              </Button>
              <button
                onClick={onClose}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Peut-être plus tard
              </button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
