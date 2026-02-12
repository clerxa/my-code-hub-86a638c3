/**
 * Dashboard financier synthétique pour l'onglet profil
 * Affiche les métriques financières calculées à partir du profil
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  TrendingUp, Home, PiggyBank, Percent, 
  Wallet, Target, Building2, Info, Calculator, ArrowRight, Minus, Plus, Equal, ChevronRight,
  Download, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { setBookingReferrer } from "@/hooks/useBookingReferrer";
import { useState } from "react";
import type { FinancialProfileInput } from "@/hooks/useUserFinancialProfile";
import { useUserRealEstateProperties } from "@/hooks/useUserRealEstateProperties";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EpargnePrecautionData {
  nb_mois_securite: number;
  indice_resilience: number;
  epargne_recommandee: number;
  epargne_actuelle: number;
  epargne_manquante: number;
}

interface FinancialDashboardProps {
  formData: FinancialProfileInput;
  completeness: number;
  missingFields: string[];
  onNavigateToTab: (tab: string) => void;
  epargnePrecautionData?: EpargnePrecautionData | null;
}

const formatCurrency = (value: number | null | undefined) => {
  if (!value) return "0 €";
  return value.toLocaleString("fr-FR") + " €";
};

export function FinancialDashboard({ 
  formData, 
  completeness, 
  missingFields,
  onNavigateToTab,
  epargnePrecautionData = null
}: FinancialDashboardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const hasSimulation = epargnePrecautionData !== null;
  const { totals: realEstateTotals } = useUserRealEstateProperties();

  const handleDownloadReport = async () => {
    try {
      setIsGeneratingPdf(true);
      
      // Fetch objectives data
      let objectives: string[] = [];
      let intentionNote = "";
      if (user) {
        const { data } = await supabase
          .from('appointment_preparation')
          .select('objectives, intention_note')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) {
          objectives = data.objectives || [];
          intentionNote = data.intention_note || "";
        }
      }

      // Get user name
      let userName = "";
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .maybeSingle();
        if (profile) {
          userName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
        }
      }

      const { generateFinancialReportPdf } = await import("@/utils/generateFinancialReportPdf");
      generateFinancialReportPdf({
        formData,
        objectives,
        intentionNote,
        userName,
        realEstateTotals: {
          mensualitesTotal: realEstateTotals.mensualitesTotal || 0,
          chargesTotal: realEstateTotals.chargesTotal || 0,
        },
      });
      
      toast.success("Rapport PDF téléchargé avec succès !");
      
      // Redirect to expert booking page after download
      setTimeout(() => {
        setBookingReferrer('/employee/profile/bilan_financier');
        navigate("/expert-booking");
      }, 800);
    } catch (err) {
      console.error("PDF generation error:", err);
      toast.error("Erreur lors de la génération du rapport");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // === REVENUS ===
  const revenuAnnuel = formData.revenu_mensuel_net || 0;
  const revenuMensuel = revenuAnnuel / 12;
  const revenuAnnuelConjoint = formData.revenu_annuel_conjoint || 0;
  const revenuMensuelConjoint = revenuAnnuelConjoint / 12;
  const isCouple = revenuAnnuelConjoint > 0;

  // Revenus du capital (annuels)
  const revenusDividendes = formData.revenus_dividendes || 0;
  const revenusVentesActions = formData.revenus_ventes_actions || 0;
  const revenusCapitalAutres = formData.revenus_capital_autres || 0;
  const totalRevenusCapitalAnnuel = revenusDividendes + revenusVentesActions + revenusCapitalAutres;
  const totalRevenusCapitalMensuel = Math.round(totalRevenusCapitalAnnuel / 12);

  // Revenus immobiliers (annuels en base → mensualisés)
  const revenusLocatifs = formData.revenus_locatifs || 0;
  const revenusLocatifsMensuel = Math.round(revenusLocatifs / 12);
  const autresRevenus = formData.autres_revenus_mensuels || 0;

  const revenuFoyerMensuel = revenuMensuel + revenuMensuelConjoint + totalRevenusCapitalMensuel + revenusLocatifsMensuel + autresRevenus;

  const detailRevenusPro = [
    { label: "Net individuel", value: Math.round(revenuMensuel) },
    ...(isCouple ? [{ label: "Net conjoint(e)", value: Math.round(revenuMensuelConjoint) }] : []),
    ...(autresRevenus > 0 ? [{ label: "Autres revenus", value: autresRevenus }] : []),
  ].filter(d => d.value > 0);

  const detailRevenusCapital = [
    { label: "Dividendes", value: Math.round(revenusDividendes / 12) },
    { label: "Ventes d'actions", value: Math.round(revenusVentesActions / 12) },
    { label: "Autres capital", value: Math.round(revenusCapitalAutres / 12) },
  ].filter(d => d.value > 0);

  const detailRevenusImmo = [
    { label: "Revenus locatifs", value: revenusLocatifsMensuel },
  ].filter(d => d.value > 0);

  // === TMI ===
  const calculateTMI = (revenuImposable: number, partsFiscales: number): number => {
    if (!revenuImposable || !partsFiscales || partsFiscales === 0) return 0;
    const quotientFamilial = revenuImposable / partsFiscales;
    if (quotientFamilial <= 11294) return 0;
    if (quotientFamilial <= 28797) return 11;
    if (quotientFamilial <= 82341) return 30;
    if (quotientFamilial <= 177106) return 41;
    return 45;
  };
  // Revenu fiscal : on utilise le revenu imposable annuel renseigné par l'utilisateur
  const revenuFiscalFoyer = formData.revenu_fiscal_annuel || 0;
  const tmiEstimee = calculateTMI(revenuFiscalFoyer, formData.parts_fiscales || 1);

  // === PAS (Prélèvement à la source) ===
  const calculateImpotAnnuel = (revenuImposable: number, partsFiscales: number): number => {
    if (!revenuImposable || !partsFiscales || partsFiscales === 0) return 0;
    const quotient = revenuImposable / partsFiscales;
    const tranches = [
      { seuil: 11294, taux: 0 },
      { seuil: 28797, taux: 0.11 },
      { seuil: 82341, taux: 0.30 },
      { seuil: 177106, taux: 0.41 },
      { seuil: Infinity, taux: 0.45 },
    ];
    let impot = 0;
    let prev = 0;
    for (const t of tranches) {
      if (quotient <= prev) break;
      const taxable = Math.min(quotient, t.seuil) - prev;
      if (taxable > 0) impot += taxable * t.taux;
      prev = t.seuil;
    }
    return Math.round(impot * partsFiscales);
  };
  const impotAnnuelEstime = calculateImpotAnnuel(revenuFiscalFoyer, formData.parts_fiscales || 1);
  const pasMensuel = Math.round(impotAnnuelEstime / 12);

  // === CHARGES ===
  const chargesFoncieresMensualites = realEstateTotals.mensualitesTotal || 0;
  const chargesFoncieresCharges = realEstateTotals.chargesTotal || 0;

  const chargesMensuelles = 
    (formData.loyer_actuel || 0) + 
    (formData.credits_immobilier || 0) + 
    (formData.charges_copropriete_taxes || 0) +
    (formData.charges_energie || 0) +
    (formData.charges_assurance_habitation || 0) +
    (formData.charges_transport_commun || 0) +
    (formData.charges_assurance_auto || 0) +
    (formData.charges_lld_loa_auto || formData.credits_auto || 0) +
    (formData.charges_internet || 0) +
    (formData.charges_mobile || 0) +
    (formData.charges_abonnements || 0) +
    (formData.charges_frais_scolarite || 0) +
    (formData.pensions_alimentaires || 0) +
    (formData.credits_consommation || 0) +
    (formData.charges_autres || 0) +
    chargesFoncieresMensualites +
    chargesFoncieresCharges;
  
  const mensualitesCredits = (formData.credits_immobilier || 0) + 
    (formData.credits_consommation || 0) + 
    (formData.charges_lld_loa_auto || formData.credits_auto || 0) +
    chargesFoncieresMensualites;
  
  // Base revenus pour taux d'endettement : revenus nets foyer + 70% revenus immobiliers
  const revenusImmoMensuels70 = Math.round(revenusLocatifsMensuel * 0.7);
  const baseRevenuEndettement = revenuMensuel + revenuMensuelConjoint + revenusImmoMensuels70;
  
  const capaciteEpargne = formData.capacite_epargne_mensuelle || 0;

  // Détail charges par catégorie avec sous-items
  const chargesLogement = (formData.loyer_actuel || 0) + (formData.credits_immobilier || 0) +
    (formData.charges_copropriete_taxes || 0) + (formData.charges_energie || 0) +
    (formData.charges_assurance_habitation || 0) +
    chargesFoncieresMensualites + chargesFoncieresCharges;
  const detailLogement = [
    { label: "Loyer", value: formData.loyer_actuel || 0 },
    { label: "Crédit immobilier (RP)", value: formData.credits_immobilier || 0 },
    { label: "Copropriété & taxes", value: formData.charges_copropriete_taxes || 0 },
    { label: "Énergie", value: formData.charges_energie || 0 },
    { label: "Assurance habitation", value: formData.charges_assurance_habitation || 0 },
    { label: "Mensualités crédits fonciers", value: chargesFoncieresMensualites },
    { label: "Charges biens fonciers", value: chargesFoncieresCharges },
  ].filter(d => d.value > 0);

  const chargesTransport = (formData.charges_transport_commun || 0) +
    (formData.charges_assurance_auto || 0) + (formData.charges_lld_loa_auto || formData.credits_auto || 0);
  const detailTransport = [
    { label: "Transport en commun", value: formData.charges_transport_commun || 0 },
    { label: "Assurance auto", value: formData.charges_assurance_auto || 0 },
    { label: "LLD / LOA / Crédit auto", value: formData.charges_lld_loa_auto || formData.credits_auto || 0 },
  ].filter(d => d.value > 0);

  const chargesCommunication = (formData.charges_internet || 0) +
    (formData.charges_mobile || 0) + (formData.charges_abonnements || 0);
  const detailCommunication = [
    { label: "Internet", value: formData.charges_internet || 0 },
    { label: "Mobile", value: formData.charges_mobile || 0 },
    { label: "Abonnements", value: formData.charges_abonnements || 0 },
  ].filter(d => d.value > 0);

  const chargesFamille = (formData.charges_frais_scolarite || 0) + (formData.pensions_alimentaires || 0);
  const detailFamille = [
    { label: "Frais de scolarité", value: formData.charges_frais_scolarite || 0 },
    { label: "Pension alimentaire", value: formData.pensions_alimentaires || 0 },
  ].filter(d => d.value > 0);

  const chargesCredits = formData.credits_consommation || 0;
  const chargesAutresTotal = formData.charges_autres || 0;

  const detailCharges = [
    { label: "🏠 Logement & Énergie", value: chargesLogement, details: detailLogement },
    { label: "🚗 Transport & Mobilité", value: chargesTransport, details: detailTransport },
    { label: "📱 Communication & Services", value: chargesCommunication, details: detailCommunication },
    { label: "👨‍👩‍👧 Famille", value: chargesFamille, details: detailFamille },
    { label: "💰 Crédit conso", value: chargesCredits, details: [] },
    { label: "💳 Autres", value: chargesAutresTotal, details: [] },
  ].filter(d => d.value > 0);
  const tauxEndettement = baseRevenuEndettement > 0 ? Math.round((mensualitesCredits / baseRevenuEndettement) * 100) : 0;

  // === RESTE À VIVRE ===
  const resteAVivre = revenuFoyerMensuel - chargesMensuelles - pasMensuel - capaciteEpargne;

  // === PATRIMOINE FINANCIER (détail) ===
  const valeurDispositifsPro = (formData.valeur_rsu_aga || 0) +
    (formData.valeur_espp || 0) +
    (formData.valeur_stock_options || 0) +
    (formData.valeur_bspce || 0) +
    (formData.valeur_pee || 0) +
    (formData.valeur_perco || 0);

  const detailPatrimoine = [
    { label: "Livrets", value: formData.epargne_livrets || 0 },
    { label: "Assurance vie", value: formData.patrimoine_assurance_vie || 0 },
    { label: "PER", value: formData.patrimoine_per || 0 },
    { label: "PEA", value: formData.patrimoine_pea || 0 },
    { label: "SCPI", value: formData.patrimoine_scpi || 0 },
    { label: "Crypto", value: formData.patrimoine_crypto || 0 },
    { label: "Private Equity", value: formData.patrimoine_private_equity || 0 },
    { label: "Autres placements", value: formData.patrimoine_autres || 0 },
    { label: "Dispositifs pro", value: valeurDispositifsPro },
  ].filter(d => d.value > 0);

  const patrimoineFinancier = detailPatrimoine.reduce((sum, d) => sum + d.value, 0);

  // === PATRIMOINE IMMOBILIER ===
  const patrimoineImmoBrut = formData.patrimoine_immo_valeur || 0;
  const creditsImmoRestant = formData.patrimoine_immo_credit_restant || 0;
  const patrimoineImmoNet = patrimoineImmoBrut - creditsImmoRestant;
  const patrimoineTotal = patrimoineFinancier + Math.max(0, patrimoineImmoNet);

  const projetsActifs = [
    formData.projet_residence_principale && "Résidence principale",
    formData.projet_residence_secondaire && "Résidence secondaire",
    formData.projet_investissement_locatif && "Investissement locatif",
  ].filter(Boolean);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Key metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Revenus */}
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-green-500/5 opacity-50" />
          <CardHeader className="relative pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-green-500/20">
                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-1">
                Revenus
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">Pour une bonne représentation de votre situation, tous les montants ont été mensualisés.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-3">
            {detailRevenusPro.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex justify-between items-baseline text-sm text-left w-full hover:bg-muted/50 rounded px-1 py-0.5 transition-colors cursor-pointer">
                    <span className="text-muted-foreground flex items-center gap-1 text-left">💼 Revenus professionnels <ChevronRight className="h-3 w-3 shrink-0" /></span>
                    <span className="font-medium whitespace-nowrap ml-2">{formatCurrency(detailRevenusPro.reduce((s, d) => s + d.value, 0))}/mois</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" side="top">
                  <p className="text-xs font-semibold mb-2">💼 Revenus professionnels</p>
                  <div className="space-y-1">
                    {detailRevenusPro.map((item) => (
                      <div key={item.label} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{formatCurrency(item.value)}/mois</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {detailRevenusCapital.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex justify-between items-baseline text-sm text-left w-full hover:bg-muted/50 rounded px-1 py-0.5 transition-colors cursor-pointer pt-1 border-t border-border/50">
                    <span className="text-muted-foreground flex items-center gap-1 text-left">📈 Revenus du capital <ChevronRight className="h-3 w-3 shrink-0" /></span>
                    <span className="font-medium whitespace-nowrap ml-2">{formatCurrency(totalRevenusCapitalMensuel)}/mois</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" side="top">
                  <p className="text-xs font-semibold mb-2">📈 Revenus du capital</p>
                  <div className="space-y-1">
                    {detailRevenusCapital.map((item) => (
                      <div key={item.label} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{formatCurrency(item.value)}/mois</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            {detailRevenusImmo.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex justify-between items-baseline text-sm text-left w-full hover:bg-muted/50 rounded px-1 py-0.5 transition-colors cursor-pointer pt-1 border-t border-border/50">
                    <span className="text-muted-foreground flex items-center gap-1 text-left">🏠 Revenus immobiliers <ChevronRight className="h-3 w-3 shrink-0" /></span>
                    <span className="font-medium whitespace-nowrap ml-2">{formatCurrency(revenusLocatifsMensuel)}/mois</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3" side="top">
                  <p className="text-xs font-semibold mb-2">🏠 Revenus immobiliers</p>
                  <div className="space-y-1">
                    {detailRevenusImmo.map((item) => (
                      <div key={item.label} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="font-medium">{formatCurrency(item.value)}/mois</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            <div className="space-y-1">
              <div className="flex justify-between items-baseline text-sm font-semibold pt-1 border-t border-border/50">
                <span className="text-foreground text-left">Revenus du foyer avant impôts</span>
                <span className="text-green-600 dark:text-green-400 whitespace-nowrap ml-2">{formatCurrency(Math.round(revenuFoyerMensuel))}/mois</span>
              </div>
            </div>
            {tmiEstimee > 0 && (
              <div className="pt-2 border-t border-border/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1">
                    TMI estimée du foyer
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">
                            Calculée à partir du revenu imposable du foyer ({formatCurrency(revenuFiscalFoyer)}) divisé par {formData.parts_fiscales || 1} part(s) fiscale(s), selon le barème de l'impôt sur le revenu.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                  <Badge variant="secondary" className="text-xs">{tmiEstimee}%</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Charges & Endettement */}
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-red-500/5 opacity-50" />
          <CardHeader className="relative pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-red-500/20">
                <Home className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-sm font-medium text-foreground">Charges & Endettement</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-3">
            <div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(chargesMensuelles)}
              </p>
              <p className="text-xs text-muted-foreground">charges totales / mois</p>
            </div>
            <div className="pt-2 border-t border-border/50 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  Taux d'endettement
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Crédits (immobilier + consommation + auto) / Revenus nets du foyer avant impôts (incluant 70 % des revenus immobiliers).
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
                <span className={cn(
                  "font-medium",
                  tauxEndettement > 35 ? "text-red-600 dark:text-red-400" : tauxEndettement > 25 ? "text-amber-600 dark:text-amber-400" : "text-green-600 dark:text-green-400"
                )}>
                  {tauxEndettement}%
                </span>
              </div>
              <Progress 
                value={Math.min(tauxEndettement, 100)} 
                className={cn(
                  "h-2",
                  tauxEndettement > 35 ? "[&>div]:bg-red-500 dark:[&>div]:bg-red-400" : tauxEndettement > 25 ? "[&>div]:bg-amber-500 dark:[&>div]:bg-amber-400" : "[&>div]:bg-green-500 dark:[&>div]:bg-green-400"
                )}
              />
            </div>
            {detailCharges.length > 0 && (
              <div className="pt-2 border-t border-border/50 space-y-1">
                {detailCharges.map((item) => (
                  item.details.length > 0 ? (
                    <Popover key={item.label}>
                      <PopoverTrigger asChild>
                        <button className="flex justify-between items-baseline text-xs text-left w-full hover:bg-muted/50 rounded px-1 py-0.5 transition-colors cursor-pointer">
                          <span className="text-muted-foreground flex items-center gap-1 min-w-0 text-left">{item.label} <ChevronRight className="h-3 w-3 shrink-0" /></span>
                          <span className="font-medium whitespace-nowrap ml-2 text-right min-w-[5rem]">{formatCurrency(item.value)}</span>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" side="top">
                        <p className="text-xs font-semibold mb-2">{item.label}</p>
                        <div className="space-y-1">
                          {item.details.map((d) => (
                            <div key={d.label} className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{d.label}</span>
                              <span className="font-medium">{formatCurrency(d.value)}</span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div key={item.label} className="flex justify-between items-baseline text-xs text-left px-1 py-0.5">
                      <span className="text-muted-foreground text-left">{item.label}</span>
                      <span className="font-medium whitespace-nowrap ml-2 text-right min-w-[5rem]">{formatCurrency(item.value)}</span>
                    </div>
                  )
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reste à vivre */}
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-blue-500/5 opacity-50" />
          <CardHeader className="relative pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-blue-500/20">
                <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-1.5">
                Reste à vivre
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Revenus nets du foyer − Charges mensuelles − Estimation du prélèvement à la source − Capacité d'épargne mensuelle
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-3">
            <div>
              <p className={cn(
                "text-2xl font-bold",
                resteAVivre >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"
              )}>
                {formatCurrency(Math.round(resteAVivre))}
              </p>
              <p className="text-xs text-muted-foreground">par mois</p>
            </div>
            <div className="pt-2 border-t border-border/50 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1"><Plus className="h-3 w-3" /> Revenus nets foyer</span>
                <span className="font-medium text-green-600 dark:text-green-400">{formatCurrency(Math.round(revenuFoyerMensuel))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1"><Minus className="h-3 w-3" /> Charges</span>
                <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(chargesMensuelles)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Minus className="h-3 w-3" /> PAS estimé
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-xs">
                          Estimation du prélèvement à la source basée sur le revenu imposable du foyer ({formatCurrency(revenuFiscalFoyer)}) et {formData.parts_fiscales || 1} part(s) fiscale(s).
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </span>
                <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(pasMensuel)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground flex items-center gap-1"><Minus className="h-3 w-3" /> Épargne mensuelle</span>
                <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(capaciteEpargne)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-border/30 font-semibold">
                <span className="flex items-center gap-1"><Equal className="h-3 w-3" /> Reste à vivre</span>
                <span className={cn(resteAVivre >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400")}>
                  {formatCurrency(Math.round(resteAVivre))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patrimoine financier */}
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-purple-500/5 opacity-50" />
          <CardHeader className="relative pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-purple-500/20">
                <PiggyBank className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle className="text-sm font-medium text-foreground">Patrimoine financier</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-3">
            <div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(patrimoineFinancier)}
              </p>
              <p className="text-xs text-muted-foreground">épargne totale</p>
            </div>
            {detailPatrimoine.length > 0 && (
              <div className="pt-2 border-t border-border/50 space-y-1">
                {detailPatrimoine.map((item) => (
                  <div key={item.label} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium">{formatCurrency(item.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Patrimoine immobilier */}
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-amber-500/5 opacity-50" />
          <CardHeader className="relative pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-amber-500/20">
                <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <CardTitle className="text-sm font-medium text-foreground">Patrimoine immobilier</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-3">
            <div>
              <p className={cn(
                "text-2xl font-bold",
                patrimoineImmoNet >= 0 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
              )}>
                {formatCurrency(patrimoineImmoNet)}
              </p>
              <p className="text-xs text-muted-foreground">valeur nette</p>
            </div>
            {(patrimoineImmoBrut > 0 || creditsImmoRestant > 0) && (
              <div className="pt-2 border-t border-border/50 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Valeur brute des biens</span>
                  <span className="font-medium">{formatCurrency(patrimoineImmoBrut)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Crédits à rembourser</span>
                  <span className="font-medium text-red-600 dark:text-red-400">-{formatCurrency(creditsImmoRestant)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sécurité financière */}
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-50",
            hasSimulation
              ? epargnePrecautionData.nb_mois_securite >= 5 ? "from-blue-500/10 to-blue-500/5" : epargnePrecautionData.nb_mois_securite >= 3 ? "from-green-500/10 to-green-500/5" : epargnePrecautionData.nb_mois_securite > 1 ? "from-amber-500/10 to-amber-500/5" : "from-red-500/10 to-red-500/5"
              : "from-muted/50 to-muted/30"
          )} />
          <CardHeader className="relative pb-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                "p-2.5 rounded-xl",
                hasSimulation
                  ? epargnePrecautionData.nb_mois_securite >= 5 ? "bg-blue-500/20" : epargnePrecautionData.nb_mois_securite >= 3 ? "bg-green-500/20" : epargnePrecautionData.nb_mois_securite > 1 ? "bg-amber-500/20" : "bg-red-500/20"
                  : "bg-muted"
              )}>
                <Percent className={cn(
                  "h-4 w-4",
                  hasSimulation
                    ? epargnePrecautionData.nb_mois_securite >= 5 ? "text-blue-600 dark:text-blue-400" : epargnePrecautionData.nb_mois_securite >= 3 ? "text-green-600 dark:text-green-400" : epargnePrecautionData.nb_mois_securite > 1 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                    : "text-muted-foreground"
                )} />
              </div>
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-1.5">
                Sécurité financière
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        <strong>Calcul :</strong> Résultat de votre simulation d'épargne de précaution.
                        <br /><br />
                        <span className="text-red-500">🔴 ≤1 mois</span> • <span className="text-amber-500">🟠 2 mois</span> • <span className="text-green-500">🟢 3-4 mois</span> • <span className="text-blue-500">🔵 ≥5 mois</span>
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative space-y-3">
            {hasSimulation ? (
              <div className="space-y-2">
                <div>
                  <p className={cn(
                    "text-2xl font-bold",
                    epargnePrecautionData.nb_mois_securite >= 5 ? "text-blue-600 dark:text-blue-400" : epargnePrecautionData.nb_mois_securite >= 3 ? "text-green-600 dark:text-green-400" : epargnePrecautionData.nb_mois_securite > 1 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {epargnePrecautionData.nb_mois_securite} mois
                  </p>
                  <p className="text-xs text-muted-foreground">d'épargne de précaution</p>
                </div>
                <div className="pt-2 border-t border-border/50 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Épargne actuelle</span>
                    <span className="font-medium">{formatCurrency(epargnePrecautionData.epargne_actuelle)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Recommandée</span>
                    <span className="font-medium">{formatCurrency(epargnePrecautionData.epargne_recommandee)}</span>
                  </div>
                  {epargnePrecautionData.epargne_manquante > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Manquante</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">-{formatCurrency(epargnePrecautionData.epargne_manquante)}</span>
                    </div>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full gap-2 text-xs h-8"
                  onClick={() => navigate('/simulateur-epargne-precaution')}
                >
                  Refaire la simulation
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Réalisez le simulateur pour connaître votre niveau de sécurité financière.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-2"
                  onClick={() => navigate('/simulateur-epargne-precaution')}
                >
                  <Calculator className="h-4 w-4" />
                  Réaliser le simulateur
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Patrimoine total */}
      <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 to-primary/5 opacity-60" />
        <CardContent className="relative p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Patrimoine net total</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary break-all">
                {formatCurrency(patrimoineTotal)}
              </p>
            </div>
            <div className="flex flex-wrap gap-4 sm:gap-6 text-sm">
              <div className="text-left sm:text-center">
                <p className="text-muted-foreground text-xs">Financier</p>
                <p className="font-semibold text-purple-600 dark:text-purple-400 text-sm sm:text-base">{formatCurrency(patrimoineFinancier)}</p>
              </div>
              <div className="text-left sm:text-center">
                <p className="text-muted-foreground text-xs">Immobilier net</p>
                <p className="font-semibold text-amber-600 dark:text-amber-400 text-sm sm:text-base">{formatCurrency(Math.max(0, patrimoineImmoNet))}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projets immobiliers */}
      {projetsActifs.length > 0 && (
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 opacity-50" />
          <CardHeader className="relative pb-2">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-primary/20">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-medium">Projets immobiliers</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex flex-wrap gap-2">
              {projetsActifs.map((projet, idx) => (
                <Badge key={idx} variant="secondary">
                  {projet}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA Télécharger le rapport */}
      {completeness >= 50 && (
        <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">Télécharger mon rapport financier</p>
                <p className="text-sm text-muted-foreground">
                  Partagez votre synthèse avec un conseiller pour préparer votre rendez-vous
                </p>
              </div>
              <Button
                onClick={handleDownloadReport}
                disabled={isGeneratingPdf}
                className="gap-2 shrink-0"
              >
                {isGeneratingPdf ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isGeneratingPdf ? "Génération..." : "Télécharger le PDF"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
