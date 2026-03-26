/**
 * Advisor Lookup Page
 * Allows advisors and admins to search for a user and view their Panorama/financial data.
 */
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useIntentionScore } from "@/hooks/useIntentionScore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Search, User, Briefcase, TrendingUp, PiggyBank, Home, Shield, AlertCircle, CheckCircle2, ArrowLeft, Building2, Flame, Thermometer, Snowflake, Target } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface SearchSuggestion {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

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
  revenu_annuel_brut_conjoint: number;
  autres_revenus_mensuels: number;
  revenus_locatifs: number;
  revenus_dividendes: number;
  revenus_ventes_actions: number;
  revenus_capital_autres: number;
  has_equity_income_this_year: boolean;
  equity_income_amount: number;
  // Expenses
  charges_fixes_mensuelles: number;
  loyer_actuel: number;
  credits_immobilier: number;
  credits_consommation: number;
  credits_auto: number;
  pensions_alimentaires: number;
  charges_copropriete_taxes: number;
  charges_energie: number;
  charges_assurance_habitation: number;
  charges_transport_commun: number;
  charges_assurance_auto: number;
  charges_lld_loa_auto: number;
  charges_internet: number;
  charges_mobile: number;
  charges_abonnements: number;
  charges_frais_scolarite: number;
  charges_autres: number;
  charges_impot_mensuel: number;
  charges_courses_alimentaires: number;
  charges_loisirs: number;
  charges_shopping: number;
  charges_variables_autres: number;
  buffer_depenses_imprevues_pct: number;
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
  patrimoine_autres: number;
  patrimoine_immo_valeur: number;
  patrimoine_immo_credit_restant: number;
  // Employee savings
  has_pee: boolean;
  has_perco: boolean;
  has_pero: boolean;
  has_epargne_autres: boolean;
  valeur_pee: number;
  valeur_perco: number;
  // Equity
  has_rsu_aga: boolean;
  has_espp: boolean;
  has_stock_options: boolean;
  has_bspce: boolean;
  has_equity_autres: boolean;
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
  projet_residence_secondaire: boolean;
  projet_investissement_locatif: boolean;
  apport_disponible: number;
  budget_residence_principale: number;
  budget_residence_secondaire: number;
  budget_investissement_locatif: number;
  budget_achat_immo: number;
  duree_emprunt_souhaitee: number;
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

interface RealEstateProperty {
  id: string;
  nom_bien: string | null;
  valeur_estimee: number;
  capital_restant_du: number;
  mensualite_credit: number;
  charges_mensuelles: number;
  revenus_locatifs_mensuels: number;
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val);

const formatDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("fr-FR") : "—";

const DataRow = ({ label, value, highlight, tag }: { label: string; value: string | number | null; highlight?: boolean; tag?: string }) => (
  <div className="flex justify-between items-center py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
    <span className="text-sm text-muted-foreground flex items-center gap-2">
      {label}
      {tag && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground/70 font-medium">{tag}</span>}
    </span>
    <span className={`text-sm font-medium ${highlight ? "text-primary" : ""}`}>
      {value ?? "—"}
    </span>
  </div>
);

const SectionTotal = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center py-2 px-2 rounded-md bg-primary/5 border border-primary/10 mt-1">
    <span className="text-sm font-semibold text-foreground">{label}</span>
    <span className="text-sm font-bold text-primary">{value}</span>
  </div>
);

const AdvisorLookup = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lookedUpUser, setLookedUpUser] = useState<LookedUpUser | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [riskProfile, setRiskProfile] = useState<RiskProfile | null>(null);
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [realEstateProperties, setRealEstateProperties] = useState<RealEstateProperty[]>([]);
  const [noResults, setNoResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      let query = supabase
        .from("profiles")
        .select("id, email, first_name, last_name")
        .limit(8);

      if (q.includes("@")) {
        query = query.ilike("email", `%${q}%`);
      } else {
        query = query.or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%`);
      }

      const { data } = await query;
      if (data && data.length > 0) {
        setSuggestions(data);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  const loadUserData = async (userId: string) => {
    setLoading(true);
    setNoResults(false);
    setShowSuggestions(false);

    try {
      // Load profile + company
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, first_name, last_name, company_id, created_at, last_login, total_points")
        .eq("id", userId)
        .single();

      if (!profile) {
        setNoResults(true);
        setLoading(false);
        return;
      }

      let companyName: string | null = null;
      if (profile.company_id) {
        const { data: co } = await supabase
          .from("companies")
          .select("name")
          .eq("id", profile.company_id)
          .maybeSingle();
        companyName = co?.name ?? null;
      }

      setLookedUpUser({ ...profile, company_name: companyName });

      // Load all data in parallel
      const [fpRes, diagRes, reRes] = await Promise.all([
        supabase.from("user_financial_profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("diagnostic_results").select("score_percent, completed_at").eq("user_id", userId).eq("status", "completed").order("completed_at", { ascending: false }).limit(1).maybeSingle(),
        (supabase as any).from("user_real_estate_properties").select("*").eq("user_id", userId),
      ]);

      const rpRes = await (supabase as any)
        .from("risk_profile")
        .select("profile_type, total_weighted_score")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fpRes.data) setFinancialData(fpRes.data as unknown as FinancialData);
      else setFinancialData(null);
      if (rpRes.data) setRiskProfile(rpRes.data as RiskProfile);
      else setRiskProfile(null);
      if (diagRes.data) setDiagnostic(diagRes.data as DiagnosticResult);
      else setDiagnostic(null);
      if (reRes.data) setRealEstateProperties(reRes.data as RealEstateProperty[]);
      else setRealEstateProperties([]);
    } catch (err) {
      console.error("Search error:", err);
      toast.error("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (s: SearchSuggestion) => {
    setSearchQuery(`${s.first_name || ""} ${s.last_name || ""} (${s.email})`.trim());
    setShowSuggestions(false);
    loadUserData(s.id);
  };

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setLoading(true);
    setNoResults(false);
    setShowSuggestions(false);

    try {
      let query = supabase
        .from("profiles")
        .select("id")
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
        setLookedUpUser(null);
        setFinancialData(null);
        setLoading(false);
        return;
      }

      await loadUserData(users[0].id);
    } catch (err) {
      console.error("Search error:", err);
      toast.error("Erreur lors de la recherche");
      setLoading(false);
    }
  };

  // Computed totals
  const fd = financialData;

  const totalRevenusIndividuels = fd
    ? (fd.revenu_mensuel_net || 0) + (fd.autres_revenus_mensuels || 0) + (fd.revenus_locatifs || 0)
    : 0;

  const totalRevenusFoyer = fd
    ? totalRevenusIndividuels + (fd.revenu_annuel_conjoint || 0) / 12
    : 0;

  const chargesFixes = fd
    ? (fd.loyer_actuel || 0) + (fd.credits_immobilier || 0) + (fd.credits_consommation || 0) +
      (fd.credits_auto || 0) + (fd.pensions_alimentaires || 0) +
      (fd.charges_copropriete_taxes || 0) + (fd.charges_energie || 0) +
      (fd.charges_assurance_habitation || 0) + (fd.charges_transport_commun || 0) +
      (fd.charges_assurance_auto || 0) + (fd.charges_lld_loa_auto || 0) +
      (fd.charges_internet || 0) + (fd.charges_mobile || 0) +
      (fd.charges_abonnements || 0) + (fd.charges_frais_scolarite || 0) +
      (fd.charges_autres || 0) + (fd.charges_impot_mensuel || 0)
    : 0;

  const chargesVariables = fd
    ? (fd.charges_courses_alimentaires || 0) + (fd.charges_loisirs || 0) +
      (fd.charges_shopping || 0) + (fd.charges_variables_autres || 0)
    : 0;

  const totalCharges = chargesFixes + chargesVariables;

  const patrimoine_financier = fd
    ? (fd.epargne_livrets || 0) + (fd.patrimoine_per || 0) + (fd.patrimoine_assurance_vie || 0) +
      (fd.patrimoine_scpi || 0) + (fd.patrimoine_pea || 0) + (fd.patrimoine_crypto || 0) +
      (fd.patrimoine_private_equity || 0) + (fd.patrimoine_autres || 0)
    : 0;

  const epargne_salariale = fd
    ? (fd.valeur_pee || 0) + (fd.valeur_perco || 0)
    : 0;

  // Real estate from dedicated table
  const immo_valeur_total = realEstateProperties.reduce((sum, p) => sum + (p.valeur_estimee || 0), 0);
  const immo_credit_total = realEstateProperties.reduce((sum, p) => sum + (p.capital_restant_du || 0), 0);
  const immo_net = immo_valeur_total - immo_credit_total;
  // Fallback to profile data if no properties in dedicated table
  const patrimoine_immo_valeur = realEstateProperties.length > 0 ? immo_valeur_total : (fd?.patrimoine_immo_valeur || 0);
  const patrimoine_immo_credit = realEstateProperties.length > 0 ? immo_credit_total : (fd?.patrimoine_immo_credit_restant || 0);
  const patrimoine_immo_net = patrimoine_immo_valeur - patrimoine_immo_credit;

  const patrimoine_equity = fd
    ? (fd.valeur_rsu_aga || 0) + (fd.valeur_espp || 0) + (fd.valeur_stock_options || 0) + (fd.valeur_bspce || 0)
    : 0;

  const patrimoine_total = patrimoine_financier + epargne_salariale + Math.max(0, patrimoine_immo_net) + patrimoine_equity;

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

        {/* Search with autocomplete */}
        <Card className="overflow-visible">
          <CardContent className="pt-6 overflow-visible">
            <div className="flex gap-3">
              <div className="relative flex-1" ref={searchRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par email ou nom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="pl-10"
                />
                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden">
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        className="w-full px-4 py-2.5 text-left hover:bg-muted/80 transition-colors flex items-center gap-3 border-b border-border/50 last:border-0"
                        onClick={() => handleSelectSuggestion(s)}
                      >
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {s.first_name || ""} {s.last_name || ""}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
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
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-center">
                        <p className="text-xs text-muted-foreground mb-1">Patrimoine total estimé</p>
                        <p className="text-lg font-bold text-primary">{formatCurrency(patrimoine_total)}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 border text-center">
                        <p className="text-xs text-muted-foreground mb-1">Patrimoine financier</p>
                        <p className="text-lg font-semibold">{formatCurrency(patrimoine_financier)}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 border text-center">
                        <p className="text-xs text-muted-foreground mb-1">Épargne salariale</p>
                        <p className="text-lg font-semibold">{formatCurrency(epargne_salariale)}</p>
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
                    <DataRow label="Personnes au foyer" value={financialData.nb_personnes_foyer} tag="Foyer" />
                  </CardContent>
                </Card>

                {/* Income Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Revenus & Emploi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <DataRow label="Revenu mensuel net" value={formatCurrency(financialData.revenu_mensuel_net)} highlight tag="Individuel" />
                    <DataRow label="Revenu annuel brut" value={formatCurrency(financialData.revenu_annuel_brut)} tag="Individuel" />
                    <DataRow label="Revenu fiscal annuel" value={formatCurrency(financialData.revenu_fiscal_annuel)} highlight tag="Individuel" />
                    <DataRow label="Revenu fiscal foyer" value={formatCurrency(financialData.revenu_fiscal_foyer)} highlight tag="Foyer" />
                    <DataRow label="Revenus annuels conjoint" value={formatCurrency(financialData.revenu_annuel_conjoint)} tag="Conjoint" />
                    <DataRow label="Revenu annuel brut conjoint" value={formatCurrency(financialData.revenu_annuel_brut_conjoint)} tag="Conjoint" />
                    <DataRow label="Autres revenus mensuels" value={formatCurrency(financialData.autres_revenus_mensuels)} tag="Individuel" />
                    <DataRow label="Revenus locatifs" value={formatCurrency(financialData.revenus_locatifs)} tag="Foyer" />
                    <DataRow label="Dividendes" value={formatCurrency(financialData.revenus_dividendes)} />
                    <DataRow label="Ventes d'actions" value={formatCurrency(financialData.revenus_ventes_actions)} />
                    <DataRow label="Autres revenus du capital" value={formatCurrency(financialData.revenus_capital_autres)} />
                    {financialData.has_equity_income_this_year && (
                      <DataRow label="Revenus equity cette année" value={formatCurrency(financialData.equity_income_amount)} />
                    )}
                    <Separator className="col-span-full my-2" />
                    <DataRow label="Type de contrat" value={financialData.type_contrat} />
                    <DataRow label="Ancienneté" value={`${financialData.anciennete_annees} ans`} />
                    <DataRow label="Secteur" value={financialData.secteur_activite} />
                    <DataRow label="Résidence fiscale" value={financialData.statut_residence} />
                    <Separator className="col-span-full my-2" />
                    <div className="col-span-full">
                      <SectionTotal label="Total revenus mensuels (individuel)" value={formatCurrency(totalRevenusIndividuels)} />
                    </div>
                  </CardContent>
                </Card>

                {/* Charges */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Charges mensuelles</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <DataRow label="Loyer / Crédit logement" value={formatCurrency(financialData.loyer_actuel)} />
                    <DataRow label="Crédits immobilier" value={formatCurrency(financialData.credits_immobilier)} />
                    <DataRow label="Crédits consommation" value={formatCurrency(financialData.credits_consommation)} />
                    <DataRow label="Crédit auto" value={formatCurrency(financialData.credits_auto)} />
                    <DataRow label="Pensions alimentaires" value={formatCurrency(financialData.pensions_alimentaires)} />
                    <DataRow label="Copropriété / Taxes" value={formatCurrency(financialData.charges_copropriete_taxes)} />
                    <DataRow label="Énergie" value={formatCurrency(financialData.charges_energie)} />
                    <DataRow label="Assurance habitation" value={formatCurrency(financialData.charges_assurance_habitation)} />
                    <DataRow label="Transport en commun" value={formatCurrency(financialData.charges_transport_commun)} />
                    <DataRow label="Assurance auto" value={formatCurrency(financialData.charges_assurance_auto)} />
                    <DataRow label="LLD / LOA auto" value={formatCurrency(financialData.charges_lld_loa_auto)} />
                    <DataRow label="Internet" value={formatCurrency(financialData.charges_internet)} />
                    <DataRow label="Mobile" value={formatCurrency(financialData.charges_mobile)} />
                    <DataRow label="Abonnements" value={formatCurrency(financialData.charges_abonnements)} />
                    <DataRow label="Frais de scolarité" value={formatCurrency(financialData.charges_frais_scolarite)} />
                    <DataRow label="Autres charges fixes" value={formatCurrency(financialData.charges_autres)} />
                    <DataRow label="Impôts mensuels" value={formatCurrency(financialData.charges_impot_mensuel)} highlight tag="Foyer" />
                    <div className="col-span-full">
                      <SectionTotal label="Total charges fixes" value={formatCurrency(chargesFixes)} />
                    </div>
                    <Separator className="col-span-full my-2" />
                    <DataRow label="Courses alimentaires" value={formatCurrency(financialData.charges_courses_alimentaires)} />
                    <DataRow label="Loisirs" value={formatCurrency(financialData.charges_loisirs)} />
                    <DataRow label="Shopping" value={formatCurrency(financialData.charges_shopping)} />
                    <DataRow label="Autres dépenses variables" value={formatCurrency(financialData.charges_variables_autres)} />
                    {(financialData.buffer_depenses_imprevues_pct || 0) > 0 && (
                      <DataRow label="Buffer imprévus" value={`${financialData.buffer_depenses_imprevues_pct}%`} />
                    )}
                    <div className="col-span-full">
                      <SectionTotal label="Total dépenses variables" value={formatCurrency(chargesVariables)} />
                    </div>
                    <Separator className="col-span-full my-2" />
                    <div className="col-span-full">
                      <SectionTotal label="Total charges + dépenses" value={formatCurrency(totalCharges)} />
                    </div>
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
                    <DataRow label="Livrets" value={formatCurrency(financialData.epargne_livrets)} />
                    <DataRow label="Capacité d'épargne / mois" value={formatCurrency(financialData.capacite_epargne_mensuelle)} highlight />
                    <Separator className="col-span-full my-2" />
                    <DataRow label="PER" value={formatCurrency(financialData.patrimoine_per)} />
                    <DataRow label="Assurance Vie" value={formatCurrency(financialData.patrimoine_assurance_vie)} />
                    <DataRow label="SCPI" value={formatCurrency(financialData.patrimoine_scpi)} />
                    <DataRow label="PEA" value={formatCurrency(financialData.patrimoine_pea)} />
                    <DataRow label="Crypto" value={formatCurrency(financialData.patrimoine_crypto)} />
                    <DataRow label="Private Equity" value={formatCurrency(financialData.patrimoine_private_equity)} />
                    <DataRow label="Autres placements" value={formatCurrency(financialData.patrimoine_autres)} />
                    <div className="col-span-full">
                      <SectionTotal label="Total patrimoine financier" value={formatCurrency(patrimoine_financier)} />
                    </div>
                    <Separator className="col-span-full my-2" />
                    <DataRow label="PEE" value={financialData.has_pee ? formatCurrency(financialData.valeur_pee) : "Non"} />
                    <DataRow label="PERCO" value={financialData.has_perco ? formatCurrency(financialData.valeur_perco) : "Non"} />
                    <DataRow label="PERO" value={financialData.has_pero ? "Oui" : "Non"} />
                    <div className="col-span-full">
                      <SectionTotal label="Total épargne salariale" value={formatCurrency(epargne_salariale)} />
                    </div>
                  </CardContent>
                </Card>

                {/* Real Estate */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Home className="h-5 w-5 text-primary" />
                      Immobilier
                      <Badge variant="outline" className="ml-2">
                        <Building2 className="h-3 w-3 mr-1" />
                        {realEstateProperties.length} bien{realEstateProperties.length !== 1 ? "s" : ""}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {realEstateProperties.length > 0 ? (
                      <>
                        {realEstateProperties.map((prop, idx) => (
                          <div key={prop.id} className="rounded-lg border p-3 space-y-1">
                            <p className="text-sm font-semibold text-foreground mb-2">{prop.nom_bien || `Bien ${idx + 1}`}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                              <DataRow label="Valeur estimée" value={formatCurrency(prop.valeur_estimee)} />
                              <DataRow label="Capital restant dû" value={formatCurrency(prop.capital_restant_du)} />
                              <DataRow label="Mensualité crédit" value={formatCurrency(prop.mensualite_credit)} />
                              <DataRow label="Charges mensuelles" value={formatCurrency(prop.charges_mensuelles)} />
                              <DataRow label="Revenus locatifs / mois" value={formatCurrency(prop.revenus_locatifs_mensuels)} />
                            </div>
                          </div>
                        ))}
                        <SectionTotal label="Total valeur nette immobilière" value={formatCurrency(patrimoine_immo_net)} />
                      </>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                        <DataRow label="Valeur immobilière (déclaratif)" value={formatCurrency(fd?.patrimoine_immo_valeur || 0)} />
                        <DataRow label="Crédit restant (déclaratif)" value={formatCurrency(fd?.patrimoine_immo_credit_restant || 0)} />
                        <DataRow label="Valeur nette" value={formatCurrency(patrimoine_immo_net)} highlight />
                      </div>
                    )}
                    <Separator />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                      <DataRow label="Apport disponible" value={formatCurrency(financialData.apport_disponible)} />
                      <DataRow label="Projet RP" value={financialData.projet_residence_principale ? `Oui — budget ${formatCurrency(financialData.budget_residence_principale)}` : "Non"} />
                      <DataRow label="Projet résidence secondaire" value={financialData.projet_residence_secondaire ? `Oui — budget ${formatCurrency(financialData.budget_residence_secondaire)}` : "Non"} />
                      <DataRow label="Projet investissement locatif" value={financialData.projet_investissement_locatif ? `Oui — budget ${formatCurrency(financialData.budget_investissement_locatif)}` : "Non"} />
                      {financialData.duree_emprunt_souhaitee > 0 && (
                        <DataRow label="Durée emprunt souhaitée" value={`${financialData.duree_emprunt_souhaitee} ans`} />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Equity Compensation */}
                {(financialData.has_rsu_aga || financialData.has_espp || financialData.has_stock_options || financialData.has_bspce || financialData.has_equity_autres) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Actionnariat salarié</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                      {financialData.has_rsu_aga && <DataRow label="RSU / AGA" value={formatCurrency(financialData.valeur_rsu_aga)} />}
                      {financialData.has_espp && <DataRow label="ESPP" value={formatCurrency(financialData.valeur_espp)} />}
                      {financialData.has_stock_options && <DataRow label="Stock Options" value={formatCurrency(financialData.valeur_stock_options)} />}
                      {financialData.has_bspce && <DataRow label="BSPCE" value={formatCurrency(financialData.valeur_bspce)} />}
                      {financialData.has_equity_autres && <DataRow label="Autres equity" value="Oui" />}
                      <div className="col-span-full">
                        <SectionTotal label="Total equity" value={formatCurrency(patrimoine_equity)} />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Fiscal */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Fiscalité</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    <DataRow label="TMI" value={`${financialData.tmi}%`} highlight tag="Foyer" />
                    <DataRow label="Parts fiscales" value={financialData.parts_fiscales} tag="Foyer" />
                    <DataRow label="Plafond PER reportable" value={formatCurrency(financialData.plafond_per_reportable)} tag="Individuel" />
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
