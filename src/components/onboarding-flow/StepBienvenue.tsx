import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Mail, Phone, Sparkles, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { OnboardingNavButtons } from "./OnboardingNavButtons";

interface StepBienvenueProps {
  onNext: () => void;
  onSkip: () => void;
}

export function StepBienvenue({ onNext, onSkip }: StepBienvenueProps) {
  const { user } = useAuth();
  const [personalEmail, setPersonalEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const updates: Record<string, any> = {};
      if (personalEmail.trim()) updates.personal_email = personalEmail.trim();
      if (phoneNumber.trim()) updates.phone_number = phoneNumber.trim();

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", user!.id);
        if (error) throw error;
      }
      onNext();
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const features = [
    { icon: "📊", text: "Panorama complet de votre patrimoine" },
    { icon: "🧮", text: "Simulateurs fiscaux personnalisés" },
    { icon: "📋", text: "Analyse de votre avis d'imposition" },
    { icon: "🎯", text: "Recommandations sur mesure" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome hero */}
      <div className="text-center space-y-4 py-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="text-6xl mb-2"
        >
          👋
        </motion.div>
        <h2 className="text-3xl font-bold text-white">
          Bienvenue sur MyFinCare
        </h2>
        <p className="text-white/50 max-w-md mx-auto text-sm leading-relaxed">
          Configurez votre espace en quelques minutes pour accéder à des analyses personnalisées de votre situation financière.
        </p>
      </div>

      {/* What you'll unlock */}
      <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
        {features.map((feat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm"
          >
            <span className="text-lg">{feat.icon}</span>
            <span className="text-xs text-white/60 leading-tight">{feat.text}</span>
          </motion.div>
        ))}
      </div>

      {/* Contact form */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-md p-6 space-y-5"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-lg" style={{ background: "var(--gradient-hero)" }}>
            <Mail className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Vos coordonnées personnelles</h3>
            <p className="text-xs text-white/40">Facultatif — recommandé pour sécuriser votre compte</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Email personnel</Label>
            <Input
              type="email"
              value={personalEmail}
              onChange={(e) => setPersonalEmail(e.target.value)}
              placeholder="prenom.nom@gmail.com"
              className="bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/50"
            />
            <p className="text-[11px] text-white/30 flex items-start gap-1.5">
              <Shield className="h-3 w-3 mt-0.5 flex-shrink-0 text-primary/40" />
              Conservez l'accès à vos données même en cas de changement d'entreprise.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-white/60 text-xs">Numéro de téléphone</Label>
            <Input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="06 12 34 56 78"
              className="bg-white/[0.06] border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/50"
            />
          </div>
        </div>
      </motion.div>

      <OnboardingNavButtons
        onNext={handleSubmit}
        onSkip={onSkip}
        isLoading={saving}
        nextLabel="C'est parti !"
        skipLabel="Je compléterai plus tard"
      />
    </div>
  );
}
