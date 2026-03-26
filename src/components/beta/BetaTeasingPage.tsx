import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Sparkles, Lock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";

interface ModuleTeasing {
  key: string;
  name: string;
  tagline: string;
  description: string;
  benefits: string[];
  icon: string;
  accentColor: string;
  sidebarKey: string;
}

const MODULE_TEASINGS: Record<string, ModuleTeasing> = {
  vega: {
    key: "vega",
    name: "VEGA",
    sidebarKey: "vega",
    tagline: "Vos actions valent plus que vous ne le pensez.",
    description:
      "RSU, ESPP, stock-options, BSPCE — la fiscalité de l'actionnariat salarié est l'une des plus complexes et des plus mal maîtrisées en France. VEGA vous donne enfin une vision claire de ce que vous possédez réellement, ce que vous devez payer, et comment optimiser chaque cession.",
    benefits: [
      "Simulez votre gain net après impôts sur chaque plan",
      "Comprenez la différence entre plan qualifié et non qualifié",
      "Anticipez l'impact fiscal sur votre bulletin de salaire",
      "Choisissez le meilleur moment pour vendre",
    ],
    icon: "📈",
    accentColor: "violet",
  },
  atlas: {
    key: "atlas",
    name: "ATLAS",
    sidebarKey: "atlas",
    tagline: "Votre avis d'imposition ne devrait plus avoir de secrets.",
    description:
      "Importez votre avis d'imposition et ATLAS extrait automatiquement votre TMI, revenu fiscal de référence et optimisations possibles. En quelques secondes, comprenez exactement votre situation fiscale et ce que vous pourriez économiser.",
    benefits: [
      "Extraction automatique par OCR en quelques secondes",
      "Calcul de votre TMI réelle et de votre taux moyen",
      "Identification des optimisations fiscales disponibles",
      "Pré-remplissage automatique de vos simulateurs",
    ],
    icon: "🔍",
    accentColor: "green",
  },
  horizon: {
    key: "horizon",
    name: "HORIZON",
    sidebarKey: "horizon",
    tagline: "Vos projets méritent mieux qu'une feuille Excel.",
    description:
      "Achat immobilier, retraite, épargne pour vos enfants — HORIZON transforme vos projets de vie en plan d'action financier concret. Visualisez mois par mois comment atteindre vos objectifs et ajustez en temps réel.",
    benefits: [
      "Planifiez jusqu'à 5 projets simultanément",
      "Simulez l'impact de chaque projet sur votre épargne",
      "Recevez des alertes si votre trajectoire dévie",
      "Intégrez automatiquement vos données patrimoniales",
    ],
    icon: "🎯",
    accentColor: "amber",
  },
  zenith: {
    key: "zenith",
    name: "ZÉNITH",
    sidebarKey: "budget",
    tagline: "Votre budget, enfin sous contrôle.",
    description:
      "Dépenses, revenus, épargne — ZÉNITH vous donne une vision complète et en temps réel de votre situation budgétaire. Identifiez les postes qui plombent votre capacité d'épargne et prenez les bonnes décisions.",
    benefits: [
      "Analysez vos ratios revenus / charges / épargne",
      "Comparez votre situation aux benchmarks de votre profil",
      "Identifiez les leviers d'optimisation budgétaire",
      "Simulez l'impact d'une augmentation ou d'un crédit",
    ],
    icon: "⚡",
    accentColor: "blue",
  },
};

const accentMap: Record<string, { gradient: string; badge: string; button: string; check: string }> = {
  violet: {
    gradient: "from-violet-500/20 via-violet-500/10 to-transparent border-violet-500/20",
    badge: "bg-violet-500/10 text-violet-600 border-violet-500/20",
    button: "border-violet-500/30 text-violet-600 hover:bg-violet-500/10",
    check: "text-violet-500",
  },
  green: {
    gradient: "from-green-500/20 via-green-500/10 to-transparent border-green-500/20",
    badge: "bg-green-500/10 text-green-600 border-green-500/20",
    button: "border-green-500/30 text-green-600 hover:bg-green-500/10",
    check: "text-green-500",
  },
  amber: {
    gradient: "from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/20",
    badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    button: "border-amber-500/30 text-amber-600 hover:bg-amber-500/10",
    check: "text-amber-500",
  },
  blue: {
    gradient: "from-blue-500/20 via-blue-500/10 to-transparent border-blue-500/20",
    badge: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    button: "border-blue-500/30 text-blue-600 hover:bg-blue-500/10",
    check: "text-blue-500",
  },
};

export function BetaTeasingPage({ moduleKey }: { moduleKey: string }) {
  const { user } = useAuth();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const module = MODULE_TEASINGS[moduleKey.toLowerCase()];
  if (!module) return null;

  const accent = accentMap[module.accentColor];

  const handleNotify = async () => {
    setLoading(true);
    try {
      await supabase.from("beta_module_interests" as any).insert({
        user_id: user?.id || null,
        email: user?.email || null,
        module_key: module.key,
        created_at: new Date().toISOString(),
      });
      setSubmitted(true);
      toast.success("Parfait ! Vous serez notifié(e) dès la sortie.");
    } catch {
      toast.error("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <EmployeeLayout activeSection={module.sidebarKey}>
      <div className="max-w-2xl mx-auto py-8 px-4 space-y-8">
        {/* Badge BETA */}
        <Badge variant="outline" className={cn("text-xs px-3 py-1", accent.badge)}>
          <Lock className="h-3 w-3 mr-1.5" />
          Version BETA — Module à venir
        </Badge>

        {/* Hero */}
        <div className={cn("rounded-2xl border bg-gradient-to-br p-8 space-y-4", accent.gradient)}>
          <div className="text-5xl">{module.icon}</div>
          <h1 className="text-3xl font-bold tracking-tight">{module.name}</h1>
          <p className="text-lg font-medium text-foreground/90">{module.tagline}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{module.description}</p>
        </div>

        {/* Bénéfices */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Ce que vous pourrez faire
          </h2>
          <div className="grid gap-3">
            {module.benefits.map((benefit, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <CheckCircle className={cn("h-4 w-4 mt-0.5 shrink-0", accent.check)} />
                {benefit}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-xl border bg-card p-6 text-center space-y-4">
          {submitted ? (
            <div className="space-y-2">
              <CheckCircle className="h-8 w-8 text-emerald-500 mx-auto" />
              <p className="font-semibold">Vous êtes sur la liste !</p>
              <p className="text-sm text-muted-foreground">
                Nous vous préviendrons dès que {module.name} sera disponible.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <p className="font-semibold">
                  Être notifié(e) dès la sortie de {module.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Disponible très prochainement — soyez parmi les premiers à y accéder.
                </p>
              </div>
              <Button
                onClick={handleNotify}
                disabled={loading}
                variant="outline"
                className={cn("gap-2", accent.button)}
              >
                <Bell className="h-4 w-4" />
                {loading ? "Enregistrement..." : `Me notifier pour ${module.name}`}
              </Button>
            </>
          )}
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Les autres modules MyFinCare sont déjà disponibles dans votre espace.
        </p>
      </div>
    </EmployeeLayout>
  );
}
