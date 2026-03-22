import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowRight, Loader2, Wallet, PiggyBank, Home, Info, Building2 } from "lucide-react";
import { useUserFinancialProfile, type FinancialProfileInput } from "@/hooks/useUserFinancialProfile";
import { motion } from "framer-motion";

interface StepChargesEpargneProps {
  onNext: () => void;
  onSkip: () => void;
}

export function StepChargesEpargne({ onNext, onSkip }: StepChargesEpargneProps) {
  const { saveProfile, isSaving, profile } = useUserFinancialProfile();
  const [formData, setFormData] = useState<FinancialProfileInput>({
    // Legacy charges
    charges_fixes_mensuelles: profile?.charges_fixes_mensuelles || 0,
    loyer_actuel: profile?.loyer_actuel || 0,
    credits_immobilier: profile?.credits_immobilier || 0,
    credits_consommation: profile?.credits_consommation || 0,
    credits_auto: profile?.credits_auto || 0,
    pensions_alimentaires: profile?.pensions_alimentaires || 0,
    // Detailed charges
    charges_copropriete_taxes: profile?.charges_copropriete_taxes || 0,
    charges_energie: profile?.charges_energie || 0,
    charges_assurance_habitation: profile?.charges_assurance_habitation || 0,
    charges_transport_commun: profile?.charges_transport_commun || 0,
    charges_assurance_auto: profile?.charges_assurance_auto || 0,
    charges_lld_loa_auto: profile?.charges_lld_loa_auto || 0,
    charges_internet: profile?.charges_internet || 0,
    charges_mobile: profile?.charges_mobile || 0,
    charges_abonnements: profile?.charges_abonnements || 0,
    charges_frais_scolarite: profile?.charges_frais_scolarite || 0,
    charges_autres: profile?.charges_autres || 0,
    // Épargne
    capacite_epargne_mensuelle: profile?.capacite_epargne_mensuelle || 0,
    epargne_actuelle: profile?.epargne_actuelle || 0,
    epargne_livrets: profile?.epargne_livrets || 0,
    apport_disponible: profile?.apport_disponible || 0,
    // Patrimoine financier
    patrimoine_assurance_vie: profile?.patrimoine_assurance_vie || 0,
    patrimoine_per: profile?.patrimoine_per || 0,
    patrimoine_pea: profile?.patrimoine_pea || 0,
    patrimoine_scpi: profile?.patrimoine_scpi || 0,
    patrimoine_crypto: profile?.patrimoine_crypto || 0,
    patrimoine_private_equity: profile?.patrimoine_private_equity || 0,
    patrimoine_autres: profile?.patrimoine_autres || 0,
    // Patrimoine immobilier
    patrimoine_immo_valeur: profile?.patrimoine_immo_valeur || 0,
    patrimoine_immo_credit_restant: profile?.patrimoine_immo_credit_restant || 0,
    // Fiscal
    tmi: profile?.tmi || 0,
    parts_fiscales: profile?.parts_fiscales || 1,
    plafond_per_reportable: profile?.plafond_per_reportable || 0,
    // Projets immobiliers
    objectif_achat_immo: profile?.objectif_achat_immo || false,
    projet_residence_principale: profile?.projet_residence_principale || false,
    projet_residence_secondaire: profile?.projet_residence_secondaire || false,
    projet_investissement_locatif: profile?.projet_investissement_locatif || false,
    budget_achat_immo: profile?.budget_achat_immo || null,
    budget_residence_principale: profile?.budget_residence_principale || null,
    budget_residence_secondaire: profile?.budget_residence_secondaire || null,
    budget_investissement_locatif: profile?.budget_investissement_locatif || null,
    duree_emprunt_souhaitee: profile?.duree_emprunt_souhaitee || 20,
  });

  const updateField = <K extends keyof FinancialProfileInput>(field: K, value: FinancialProfileInput[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    saveProfile(formData, { onSuccess: () => onNext() });
  };

  const NumField = ({ fieldKey, label, placeholder, desc }: { fieldKey: keyof FinancialProfileInput; label: string; placeholder?: string; desc?: string }) => (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <Input
        type="number" min={0}
        value={(formData[fieldKey] as number) || ""}
        onChange={(e) => updateField(fieldKey, parseFloat(e.target.value) || 0)}
        placeholder={placeholder || "0"}
        className="h-9 text-sm"
      />
      {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Charges logement */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">🏠 Logement & Énergie</CardTitle>
              <CardDescription>Charges liées à votre résidence principale.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <NumField fieldKey="loyer_actuel" label="Loyer (€/mois)" placeholder="Ex: 900" />
            <NumField fieldKey="credits_immobilier" label="Crédit immobilier (€/mois)" placeholder="Ex: 1 200" />
            <NumField fieldKey="charges_copropriete_taxes" label="Copropriété & taxes (€/mois)" placeholder="Ex: 150" />
            <NumField fieldKey="charges_energie" label="Énergie (€/mois)" placeholder="Ex: 120" />
            <NumField fieldKey="charges_assurance_habitation" label="Assurance habitation (€/mois)" placeholder="Ex: 30" />
          </div>
        </CardContent>
      </Card>

      {/* Charges transport */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">🚗 Transports & Mobilité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <NumField fieldKey="charges_transport_commun" label="Transport en commun (€/mois)" placeholder="Ex: 75" />
            <NumField fieldKey="charges_assurance_auto" label="Assurance auto (€/mois)" placeholder="Ex: 50" />
            <NumField fieldKey="charges_lld_loa_auto" label="LLD / LOA auto (€/mois)" placeholder="Ex: 300" />
            <NumField fieldKey="credits_auto" label="Crédit auto (€/mois)" placeholder="Ex: 200" />
          </div>
        </CardContent>
      </Card>

      {/* Autres charges */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">📱 Autres charges récurrentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <NumField fieldKey="charges_internet" label="Internet (€/mois)" placeholder="Ex: 35" />
            <NumField fieldKey="charges_mobile" label="Mobile (€/mois)" placeholder="Ex: 20" />
            <NumField fieldKey="charges_abonnements" label="Abonnements (€/mois)" placeholder="Ex: 40" desc="Netflix, Spotify, salle de sport..." />
            <NumField fieldKey="charges_frais_scolarite" label="Frais de scolarité (€/mois)" placeholder="0" />
            <NumField fieldKey="credits_consommation" label="Crédit conso (€/mois)" placeholder="0" />
            <NumField fieldKey="pensions_alimentaires" label="Pension alimentaire (€/mois)" placeholder="0" />
            <NumField fieldKey="charges_autres" label="Autres charges (€/mois)" placeholder="0" />
          </div>
        </CardContent>
      </Card>

      {/* Épargne & Patrimoine */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <PiggyBank className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Épargne & Patrimoine</CardTitle>
              <CardDescription>
                Indiquez vos montants — même approximatifs, c'est utile pour vos projections.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <NumField fieldKey="capacite_epargne_mensuelle" label="Capacité d'épargne (€/mois)" placeholder="Ex: 500" desc="Ce que vous pouvez mettre de côté" />
            <NumField fieldKey="epargne_actuelle" label="Épargne totale actuelle (€)" placeholder="Ex: 15 000" />
            <NumField fieldKey="epargne_livrets" label="Épargne livrets (€)" placeholder="Ex: 10 000" desc="Livret A, LDDS, LEP..." />
            <NumField fieldKey="apport_disponible" label="Apport disponible (€)" placeholder="0" desc="Pour un futur achat immobilier" />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Patrimoine financier</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <NumField fieldKey="patrimoine_assurance_vie" label="Assurance-vie (€)" />
              <NumField fieldKey="patrimoine_per" label="PER (€)" />
              <NumField fieldKey="patrimoine_pea" label="PEA / CTO (€)" />
              <NumField fieldKey="patrimoine_scpi" label="SCPI (€)" />
              <NumField fieldKey="patrimoine_crypto" label="Crypto (€)" />
              <NumField fieldKey="patrimoine_private_equity" label="Private Equity (€)" />
              <NumField fieldKey="patrimoine_autres" label="Autres placements (€)" />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Patrimoine immobilier</Label>
            <div className="grid grid-cols-2 gap-3">
              <NumField fieldKey="patrimoine_immo_valeur" label="Valeur du bien (€)" placeholder="0" />
              <NumField fieldKey="patrimoine_immo_credit_restant" label="Capital restant dû (€)" placeholder="0" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fiscalité */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">💶 Fiscalité</CardTitle>
          <CardDescription>Si vous ne connaissez pas votre TMI, passez — il sera calculé automatiquement à l'étape suivante.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-sm flex items-center gap-1.5">
                TMI (%)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent><p className="text-xs max-w-xs">Tranche Marginale d'Imposition : 0%, 11%, 30%, 41% ou 45%.</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select
                value={String(formData.tmi || "")}
                onValueChange={(v) => updateField("tmi", parseFloat(v))}
              >
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Sélectionnez" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0 %</SelectItem>
                  <SelectItem value="11">11 %</SelectItem>
                  <SelectItem value="30">30 %</SelectItem>
                  <SelectItem value="41">41 %</SelectItem>
                  <SelectItem value="45">45 %</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <NumField fieldKey="parts_fiscales" label="Parts fiscales" placeholder="Ex: 2.5" />
            <NumField fieldKey="plafond_per_reportable" label="Plafond PER reportable (€)" placeholder="0" />
          </div>
        </CardContent>
      </Card>

      {/* Projets immobiliers */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Projets immobiliers</CardTitle>
              <CardDescription>Avez-vous un projet d'achat à moyen ou long terme ?</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <Label className="text-sm">Avez-vous un projet d'achat immobilier ?</Label>
            <Switch
              checked={formData.objectif_achat_immo as boolean || false}
              onCheckedChange={(v) => updateField("objectif_achat_immo", v)}
            />
          </div>

          {formData.objectif_achat_immo && (
            <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
              <div className="space-y-3">
                {[
                  { key: "projet_residence_principale" as const, budgetKey: "budget_residence_principale" as const, label: "Résidence principale" },
                  { key: "projet_residence_secondaire" as const, budgetKey: "budget_residence_secondaire" as const, label: "Résidence secondaire" },
                  { key: "projet_investissement_locatif" as const, budgetKey: "budget_investissement_locatif" as const, label: "Investissement locatif" },
                ].map(item => (
                  <div key={item.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{item.label}</Label>
                      <Switch
                        checked={formData[item.key] as boolean || false}
                        onCheckedChange={(v) => updateField(item.key, v)}
                      />
                    </div>
                    {formData[item.key] && (
                      <Input
                        type="number" min={0}
                        value={(formData[item.budgetKey] as number) || ""}
                        onChange={(e) => updateField(item.budgetKey, parseFloat(e.target.value) || 0)}
                        placeholder="Budget estimé (€)"
                        className="h-9 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumField fieldKey="budget_achat_immo" label="Budget global (€)" placeholder="Ex: 300 000" />
                <div className="space-y-1">
                  <Label className="text-sm">Durée d'emprunt souhaitée</Label>
                  <Select
                    value={String(formData.duree_emprunt_souhaitee || 20)}
                    onValueChange={(v) => updateField("duree_emprunt_souhaitee", parseInt(v))}
                  >
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[10, 15, 20, 25, 30].map(n => (
                        <SelectItem key={n} value={String(n)}>{n} ans</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col items-center gap-3 pt-2">
        <Button onClick={handleSubmit} disabled={isSaving} size="lg" className="gap-2 px-8 shadow-md">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Continuer <ArrowRight className="h-4 w-4" />
        </Button>
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
        >
          Enregistrer et compléter plus tard
        </button>
      </div>
    </motion.div>
  );
}
