/**
 * Advisor Lookup Page
 * Allows advisors and admins to search for a user and view their Panorama/financial data.
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, User, Briefcase, TrendingUp, PiggyBank, Home, Shield, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface LookedUpUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company_name: string | null;
  created_at: string;
  last_login: string | null;
  total_points: number;
}

interface FinancialData {
  // Personal
  date_naissance: string | null;
  age: number | null;
  situation_familiale: string;
  nb_enfants: number;
  nb_personnes_foyer: number;
  // Income
  revenu_mensuel_net: number;
  revenu_annuel_brut: number;
  revenu_fiscal_annuel: number;
  revenu_fiscal_foyer: number;
  revenu_annuel_conjoint: number;
  autres_revenus_mensuels: number;
  revenus_locatifs: number;
  revenus_dividendes: number;
  revenus_ventes_actions: number;
  // Expenses
  charges_fixes_mensuelles: number;
  loyer_actuel: number;
  credits_immobilier: number;
  credits_consommation: number;
  charges_copropriete_taxes: number;
  charges_energie: number;
  charges_transport_commun: number;
  charges_assurance_auto: number;
  charges_internet: number;
  charges_mobile: number;
  charges_abonnements: number;
  charges_impot_mensuel: number;
  charges_courses_alimentaires: number;
  charges_loisirs: number;
  charges_shopping: number;
  // Savings & Patrimony
  epargne_actuelle: number;
  epargne_livrets: number;
  capacite_epargne_mensuelle: number;
  patrimoine_per: number;
  patrimoine_assurance_vie: number;
  patrimoine_scpi: number;
  patrimoine_pea: number;
  patrimoine_crypto: number;
  patrimoine_private_equity: number;
  patrimoine_immo_valeur: number;
  patrimoine_immo_credit_restant: number;
  // Employee savings
  has_pee: boolean;
  has_perco: boolean;
  valeur_pee: number;
  valeur_perco: number;
  // Equity
  has_rsu_aga: boolean;
  has_espp: boolean;
  has_stock_options: boolean;
  has_bspce: boolean;
  valeur_rsu_aga: number;
  valeur_espp: number;
  valeur_stock_options: number;
  valeur_bspce: number;
  // Tax
  tmi: number;
  parts_fiscales: number;
  plafond_per_reportable: number;
  // Employment
  type_contrat: string;
  anciennete_annees: number;
  secteur_activite: string | null;
  statut_residence: string | null;
  // Real estate projects
  objectif_achat_immo: boolean;
  projet_residence_principale: boolean;
  projet_investissement_locatif: boolean;
  apport_disponible: number;
  // Meta
  is_complete: boolean;
  updated_at: string;
}

interface RiskProfile {
  profile_type: string | null;
  total_weighted_score: number | null;
}

interface DiagnosticResult {
  score_percent: number | null;
  completed_at: string | null;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val);

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR") : "—";

const DataRow = ({ label, value, highlight }: { label: string; value: string | number | null; highlight?: boolean }) => (
  <div className="flex justify-between items-center py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className={`text-sm font-medium ${highlight ? "text-primary" : ""}`}>
      {value ?? "—"}
    </span>
  </div>
);

const AdvisorLookup = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [lookedUpUser, setLookedUpUser] = useState<LookedUpUser | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [noResults, setNoResults] = useState(false);

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setLoading(true);
    setNoResults(false);
    setLookedUpUser(null);
    setFinancialData(null);
    setRiskProfile(null);
    setDiagnostic(null);

    try {
      // Search user by email or name
      let query = supabase
        .from("profiles")
        .select("id, email, first_name, last_name, company_id, created_at, last_login, total_points")
        .limit(1);

      if (q.includes("@")) {
        query = query.ilike("email", `%${q}%`);
      } else {
        query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`);
      }

      const { data: users, error } = await query;
      if (error) throw error;

      if (!users || users.length === 0) {
        setNoResults(true);
        setLoading(false);
        return;
      }

      const foundUser = users[0];

      // Load company name
      let companyName: string | null = null;
      if (foundUser.company_id) {
        const { data: co } = await supabase
          .from("companies")
          .select("name")
          .eq("id", foundUser.company_id)
          .maybeSingle();
        companyName = co?.name ?? null;
      }

      setLookedUpUser({
        ...foundUser,
        company_name: companyName,
      });

      // Load financial profile, risk profile, diagnostic in parallel
      const [fpRes, rpRes, diagRes] = await Promise.all([
        supabase
          .from("user_financial_profiles")
          .select("*")
          .eq("user_id", foundUser.id)
          .maybeSingle(),
        supabase
          .from("risk_profiles")
          .select("profile_type, total_weighted_score")
          .eq("user_id", foundUser.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("diagnostic_results")
          .select("score_percent, completed_at")
          .eq("user_id", foundUser.id)
          .eq("status", "completed")
          .order("completed_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (fpRes.data) setFinancialData(fpRes.data as unknown as FinancialData);
      if (rpRes.data) setRiskProfile(rpRes.data as RiskProfile);
      if (diagRes.data) setDiagnostic(diagRes.data as DiagnosticResult);
    } catch (err) {
      console.error("Search error:", err);
      toast.error("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  const patrimoine_financier = financialData
    ? (financialData.epargne_livrets || 0) +
      (financialData.patrimoine_per || 0) +
      (financialData.patrimoine_assurance_vie || 0) +
      (financialData.patrimoine_scpi || 0) +
      (financialData.patrimoine_pea || 0) +
      (financialData.patrimoine_crypto || 0) +
      (financialData.patrimoine_private_equity || 0) +
      (financialData.valeur_pee || 0) +
      (financialData.valeur_perco || 0)
    : 0;

  const patrimoine_immo_net = financialData
    ? (financialData.patrimoine_immo_valeur || 0) - (financialData.patrimoine_immo_credit_restant || 0)
    : 0;

  const patrimoine_equity = financialData
    ? (financialData.valeur_rsu_aga || 0) +
      (financialData.valeur_espp || 0) +
      (financialData.valeur_stock_options || 0) +
      (financialData.valeur_bspce || 0)
    : 0;

  const patrimoine_total = patrimoine_financier + Math.max(0, patrimoine_immo_net) + patrimoine_equity;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-6 px-4 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/employee")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Espace Conseiller</h1>
            <p className="text-sm text-muted-foreground">Recherchez un utilisateur pour consulter sa situation patrimoniale</p>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par email ou nom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
                {loading ? "Recherche..." : "Rechercher"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {noResults && (
          <Card className="border-destructive/50">
            <CardContent className="pt-6 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-muted-foreground">Aucun utilisateur trouvé pour "{searchQuery}"</p>
            </CardContent>
          </Card>
        )}

        {lookedUpUser && (
          <div className="space-y-6">
            {/* User Identity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Profil utilisateur
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                <DataRow label="Nom" value={`${lookedUpUser.first_name || ""} ${lookedUpUser.last_name || ""}`.trim() || "—"} />
                <DataRow label="Email" value={lookedUpUser.email} />
                <DataRow label="Entreprise" value={lookedUpUser.company_name} />
                <DataRow label="Points" value={lookedUpUser.total_points} />
                <DataRow label="Inscription" value={formatDate(lookedUpUser.created_at)} />
                <DataRow label="Dernière connexion" value={formatDate(lookedUpUser.last_login)} />
              </CardContent>
            </Card>

            {/* Panorama Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Synthèse Panorama
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!financialData ? (
                  <p className="text-sm text-muted-foreground italic">Aucun profil financier renseigné</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Patrimoine total estimé</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(patrimoine_total)}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 border text-center">
                        <p className="text-xs text-muted-foreground mb-1">Patrimoine financier</p>
                        <p className="text-lg font-semibold">{formatCurrency(patrimoine_financier)}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 border text-center">
                        <p className="text-xs text-muted-foreground mb-1">Immobilier net</p>
                        <p className="text-lg font-semibold">{formatCurrency(patrimoine_immo_net)}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 border text-center">
                        <p className="text-xs text-muted-foreground mb-1">Equity</p>
                        <p className="text-lg font-semibold">{formatCurrency(patrimoine_equity)}</p>
                      </div>
                    </div>

                    {/* Completeness & Risk */}
                    <div className="flex flex-wrap gap-3">
                      <Badge variant={financialData.is_complete ? "default" : "secondary"} className="gap-1">
                        {financialData.is_complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                        Profil {financialData.is_complete ? "complet" : "incomplet"}
                      </Badge>
                      {riskProfile && (
                        <Badge variant="outline" className="gap-1">
                          <Shield className="h-3.5 w-3.5" />
                          Risque : {riskProfile.profile_type || "—"} ({Math.round(riskProfile.total_weighted_score || 0)}/100)
                        </Badge>
                      )}
                      {diagnostic && (
                        <Badge variant="outline" className="gap-1">
                          Diagnostic : {diagnostic.score_percent}%
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {financialData && (
              <>
                {/* Income Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Revenus & Emploi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <DataRow label="Revenu mensuel net" value={formatCurrency(financialData.revenu_mensuel_net)} highlight />
                    <DataRow label="Revenu annuel brut" value={formatCurrency(financialData.revenu_annuel_brut)} />
                    <DataRow label="Revenu fiscal annuel" value={formatCurrency(financialData.revenu_fiscal_annuel)} highlight />
                    <DataRow label="Revenu fiscal foyer" value={formatCurrency(financialData.revenu_fiscal_foyer)} />
                    <DataRow label="Revenus conjoint" value={formatCurrency(financialData.revenu_annuel_conjoint)} />
                    <DataRow label="Autres revenus mensuels" value={formatCurrency(financialData.autres_revenus_mensuels)} />
                    <DataRow label="Revenus locatifs" value={formatCurrency(financialData.revenus_locatifs)} />
                    <DataRow label="Dividendes" value={formatCurrency(financialData.revenus_dividendes)} />
                    <Separator className="col-span-full my-2" />
                    <DataRow label="Type de contrat" value={financialData.type_contrat} />
                    <DataRow label="Ancienneté" value={`${financialData.anciennete_annees} ans`} />
                    <DataRow label="Secteur" value={financialData.secteur_activite} />
                    <DataRow label="Résidence" value={financialData.statut_residence} />
                  </CardContent>
                </Card>

                {/* Personal */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-primary" />
                      Situation personnelle
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <DataRow label="Date de naissance" value={formatDate(financialData.date_naissance)} />
                    <DataRow label="Âge" value={financialData.age ? `${financialData.age} ans` : null} />
                    <DataRow label="Situation familiale" value={financialData.situation_familiale} />
                    <DataRow label="Enfants" value={financialData.nb_enfants} />
                    <DataRow label="Personnes au foyer" value={financialData.nb_personnes_foyer} />
                  </CardContent>
                </Card>

                {/* Charges */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Charges mensuelles</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <DataRow label="Charges fixes totales" value={formatCurrency(financialData.charges_fixes_mensuelles)} highlight />
                    <DataRow label="Loyer / Crédit logement" value={formatCurrency(financialData.loyer_actuel)} />
                    <DataRow label="Crédits immobilier" value={formatCurrency(financialData.credits_immobilier)} />
                    <DataRow label="Crédits consommation" value={formatCurrency(financialData.credits_consommation)} />
                    <DataRow label="Copropriété / Taxes" value={formatCurrency(financialData.charges_copropriete_taxes)} />
                    <DataRow label="Énergie" value={formatCurrency(financialData.charges_energie)} />
                    <DataRow label="Transport" value={formatCurrency(financialData.charges_transport_commun)} />
                    <DataRow label="Assurance auto" value={formatCurrency(financialData.charges_assurance_auto)} />
                    <DataRow label="Internet" value={formatCurrency(financialData.charges_internet)} />
                    <DataRow label="Mobile" value={formatCurrency(financialData.charges_mobile)} />
                    <DataRow label="Abonnements" value={formatCurrency(financialData.charges_abonnements)} />
                    <DataRow label="Impôts mensuels" value={formatCurrency(financialData.charges_impot_mensuel)} highlight />
                    <Separator className="col-span-full my-2" />
                    <DataRow label="Courses alimentaires" value={formatCurrency(financialData.charges_courses_alimentaires)} />
                    <DataRow label="Loisirs" value={formatCurrency(financialData.charges_loisirs)} />
                    <DataRow label="Shopping" value={formatCurrency(financialData.charges_shopping)} />
                  </CardContent>
                </Card>

                {/* Savings & Patrimony */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <PiggyBank className="h-5 w-5 text-primary" />
                      Épargne & Patrimoine
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <DataRow label="Épargne actuelle" value={formatCurrency(financialData.epargne_actuelle)} />
                    <DataRow label="Livrets" value={formatCurrency(financialData.epargne_livrets)} />
                    <DataRow label="Capacité d'épargne / mois" value={formatCurrency(financialData.capacite_epargne_mensuelle)} highlight />
                    <Separator className="col-span-full my-2" />
                    <DataRow label="PER" value={formatCurrency(financialData.patrimoine_per)} />
                    <DataRow label="Assurance Vie" value={formatCurrency(financialData.patrimoine_assurance_vie)} />
                    <DataRow label="SCPI" value={formatCurrency(financialData.patrimoine_scpi)} />
                    <DataRow label="PEA" value={formatCurrency(financialData.patrimoine_pea)} />
                    <DataRow label="Crypto" value={formatCurrency(financialData.patrimoine_crypto)} />
                    <DataRow label="Private Equity" value={formatCurrency(financialData.patrimoine_private_equity)} />
                    <Separator className="col-span-full my-2" />
                    <DataRow label="PEE" value={financialData.has_pee ? formatCurrency(financialData.valeur_pee) : "Non"} />
                    <DataRow label="PERCO" value={financialData.has_perco ? formatCurrency(financialData.valeur_perco) : "Non"} />
                  </CardContent>
                </Card>

                {/* Real Estate */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Home className="h-5 w-5 text-primary" />
                      Immobilier
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <DataRow label="Valeur immobilière" value={formatCurrency(financialData.patrimoine_immo_valeur)} />
                    <DataRow label="Crédit restant" value={formatCurrency(financialData.patrimoine_immo_credit_restant)} />
                    <DataRow label="Valeur nette" value={formatCurrency(patrimoine_immo_net)} highlight />
                    <DataRow label="Apport disponible" value={formatCurrency(financialData.apport_disponible)} />
                    <Separator className="col-span-full my-2" />
                    <DataRow label="Projet RP" value={financialData.projet_residence_principale ? "Oui" : "Non"} />
                    <DataRow label="Projet investissement locatif" value={financialData.projet_investissement_locatif ? "Oui" : "Non"} />
                  </CardContent>
                </Card>

                {/* Equity Compensation */}
                {(financialData.has_rsu_aga || financialData.has_espp || financialData.has_stock_options || financialData.has_bspce) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Actionnariat salarié</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                      {financialData.has_rsu_aga && <DataRow label="RSU / AGA" value={formatCurrency(financialData.valeur_rsu_aga)} />}
                      {financialData.has_espp && <DataRow label="ESPP" value={formatCurrency(financialData.valeur_espp)} />}
                      {financialData.has_stock_options && <DataRow label="Stock Options" value={formatCurrency(financialData.valeur_stock_options)} />}
                      {financialData.has_bspce && <DataRow label="BSPCE" value={formatCurrency(financialData.valeur_bspce)} />}
                    </CardContent>
                  </Card>
                )}

                {/* Fiscal */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Fiscalité</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <DataRow label="TMI" value={`${financialData.tmi}%`} highlight />
                    <DataRow label="Parts fiscales" value={financialData.parts_fiscales} />
                    <DataRow label="Plafond PER reportable" value={formatCurrency(financialData.plafond_per_reportable)} />
                  </CardContent>
                </Card>

                <p className="text-xs text-muted-foreground text-right">
                  Données mises à jour le {formatDate(financialData.updated_at)}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvisorLookup;
