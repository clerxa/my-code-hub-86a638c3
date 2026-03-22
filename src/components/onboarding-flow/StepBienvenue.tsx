import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Mail, Phone, Sparkles } from "lucide-react";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Welcome hero */}
      <div className="text-center space-y-3 py-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[image:var(--gradient-hero)] shadow-lg"
        >
          <Sparkles className="h-8 w-8 text-white" />
        </motion.div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Bienvenue sur MyFinCare 🎉
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Nous allons personnaliser votre expérience en quelques minutes.
          Vos données sont <strong>confidentielles</strong> et <strong>sécurisées</strong>.
        </p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[image:var(--gradient-hero)] shadow-md">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">Vos coordonnées personnelles</CardTitle>
              <CardDescription>
                Facultatif mais recommandé pour sécuriser votre compte
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="personal-email">Email personnel</Label>
            <Input
              id="personal-email"
              type="email"
              value={personalEmail}
              onChange={(e) => setPersonalEmail(e.target.value)}
              placeholder="prenom.nom@gmail.com"
            />
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <Shield className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary/60" />
              En cas de changement d'entreprise, vous pourrez retrouver vos données même si votre email professionnel n'est plus actif.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Numéro de téléphone</Label>
            <Input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="06 12 34 56 78"
            />
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <Phone className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary/60" />
              Pour l'activation de l'identification à 2 facteurs (en développement).
            </p>
          </div>
        </CardContent>
      </Card>

      <OnboardingNavButtons
        onNext={handleSubmit}
        onSkip={onSkip}
        isLoading={saving}
        nextLabel="C'est parti !"
        skipLabel="Je compléterai plus tard"
      />
    </motion.div>
  );
}
