import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Loader2, Shield, Mail, Phone, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { motion } from "framer-motion";

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
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10"
        >
          <Sparkles className="h-8 w-8 text-primary" />
        </motion.div>
        <h2 className="text-2xl font-bold">Bienvenue sur MyFinCare 🎉</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Nous allons personnaliser votre expérience en quelques minutes.
          Vos données sont <strong>confidentielles</strong> et <strong>sécurisées</strong>.
        </p>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Vos coordonnées personnelles
          </CardTitle>
          <CardDescription>
            Facultatif mais recommandé pour sécuriser votre compte
          </CardDescription>
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

      <div className="flex flex-col items-center gap-3 pt-2">
        <Button onClick={handleSubmit} disabled={saving} size="lg" className="gap-2 px-8 shadow-md">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          C'est parti ! <ArrowRight className="h-4 w-4" />
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
        >
          Je compléterai plus tard
        </button>
      </div>
    </motion.div>
  );
}
