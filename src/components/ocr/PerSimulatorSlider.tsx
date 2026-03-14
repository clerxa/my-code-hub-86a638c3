import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { TrendingDown, PiggyBank, ArrowRight } from "lucide-react";

// Barème IR 2024 (par part)
const TRANCHES = [
  { seuil: 0, taux: 0 },
  { seuil: 11294, taux: 11 },
  { seuil: 28797, taux: 30 },
  { seuil: 82341, taux: 41 },
  { seuil: 177106, taux: 45 },
];

function calculerImpotBrut(revenuImposable: number, nombreParts: number): number {
  const quotient = revenuImposable / nombreParts;
  let impotParPart = 0;
  for (let i = TRANCHES.length - 1; i >= 0; i--) {
    if (quotient > TRANCHES[i].seuil) {
      impotParPart += (quotient - TRANCHES[i].seuil) * (TRANCHES[i].taux / 100);
      // Continue for lower tranches handled by previous iterations
      break;
    }
  }
  // Full progressive calculation
  impotParPart = 0;
  for (let i = 0; i < TRANCHES.length; i++) {
    const seuil = TRANCHES[i].seuil;
    const taux = TRANCHES[i].taux;
    const nextSeuil = TRANCHES[i + 1]?.seuil ?? Infinity;
    if (quotient <= seuil) break;
    const trancheAmount = Math.min(quotient, nextSeuil) - seuil;
    impotParPart += trancheAmount * (taux / 100);
  }
  return Math.round(impotParPart * nombreParts);
}

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

interface PerSimulatorSliderProps {
  revenuImposable: number;
  nombreParts: number;
  impotNetActuel: number;
  plafondRestant: number;
  tmi: number;
  reductionsCredits: number; // total reductions + credits already applied
}

export const PerSimulatorSlider = ({
  revenuImposable,
  nombreParts,
  impotNetActuel,
  plafondRestant,
  tmi,
  reductionsCredits,
}: PerSimulatorSliderProps) => {
  const [versement, setVersement] = useState(0);
  const maxSlider = Math.max(plafondRestant, 500);

  const simulation = useMemo(() => {
    if (versement === 0) return { nouvelImpot: impotNetActuel, economie: 0 };
    // The PER deduction reduces taxable income
    const nouveauRevenu = Math.max(0, revenuImposable - versement);
    const nouvelImpotBrut = calculerImpotBrut(nouveauRevenu, nombreParts);
    // Apply existing reductions/credits
    const nouvelImpot = Math.max(0, nouvelImpotBrut - reductionsCredits);
    const economie = impotNetActuel - nouvelImpot;
    return { nouvelImpot, economie: Math.max(0, economie) };
  }, [versement, revenuImposable, nombreParts, impotNetActuel, reductionsCredits]);

  const percentage = impotNetActuel > 0 ? ((simulation.economie / impotNetActuel) * 100) : 0;
  // Steps for slider: 100€ increments for small amounts, 500€ for large
  const step = maxSlider > 10000 ? 500 : maxSlider > 3000 ? 250 : 100;

  return (
    <Card className="border-l-4 border-l-success bg-gradient-to-r from-success/5 to-transparent overflow-hidden">
      <CardContent className="p-5 space-y-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-success/15 flex items-center justify-center shrink-0">
            <PiggyBank className="h-5 w-5 text-success" />
          </div>
          <div>
            <h4 className="font-bold text-foreground text-sm">
              Simulez un versement PER
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Le PER est une <strong>enveloppe fiscale et financière</strong> : en plus de réduire votre impôt, 
              les sommes versées sont investies sur les marchés et peuvent générer de la performance financière jusqu'à votre retraite.
            </p>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-medium text-muted-foreground">Versement simulé</span>
            <span className="text-lg font-bold text-foreground tabular-nums">{fmt(versement)}</span>
          </div>
          <Slider
            value={[versement]}
            onValueChange={([v]) => setVersement(v)}
            min={0}
            max={maxSlider}
            step={step}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
            <span>0 €</span>
            <span>{fmt(maxSlider)} (plafond restant)</span>
          </div>
        </div>

        {/* Results */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-background border p-3 text-center">
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Nouvel impôt estimé</p>
            <p className="text-xl font-bold tabular-nums text-foreground">
              {fmt(simulation.nouvelImpot)}
            </p>
            {versement > 0 && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                contre {fmt(impotNetActuel)} actuellement
              </p>
            )}
          </div>
          <div className="rounded-xl bg-success/10 border border-success/20 p-3 text-center">
            <p className="text-[10px] font-medium text-success uppercase tracking-wider mb-1">Économie d'impôt</p>
            <p className="text-xl font-bold tabular-nums text-success">
              {versement > 0 ? `− ${fmt(simulation.economie)}` : "—"}
            </p>
            {versement > 0 && percentage > 0 && (
              <p className="text-[10px] text-success/80 mt-0.5">
                soit {percentage.toFixed(1)} % de réduction
              </p>
            )}
          </div>
        </div>

        {/* Explainer note */}
        {versement > 0 && (
          <div className="flex items-start gap-2 bg-muted/30 rounded-lg p-3 border border-border/50">
            <TrendingDown className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              En versant <strong className="text-foreground">{fmt(versement)}</strong> sur un PER, 
              votre revenu imposable passerait de {fmt(revenuImposable)} à {fmt(Math.max(0, revenuImposable - versement))}, 
              ce qui réduirait votre impôt d'environ <strong className="text-success">{fmt(simulation.economie)}</strong> (TMI à {tmi} %).
              <span className="block mt-1 text-muted-foreground/80">
                De plus, ce capital est investi et peut générer des rendements financiers jusqu'à votre départ en retraite.
              </span>
            </p>
          </div>
        )}

        {/* CTA */}
        <a
          href="/expert-booking"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          Mettre en place un PER avec un conseiller <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </CardContent>
    </Card>
  );
};
