import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Building2, 
  MapPin, 
  Users, 
  Hash, 
  Calendar, 
  Globe,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const API_BASE_URL = "https://recherche-entreprises.api.gouv.fr";

// Types for API response
interface Etablissement {
  siret: string;
  nom_commercial: string | null;
  adresse: string;
  commune: string;
  code_postal: string;
  activite_principale: string;
  libelle_activite_principale: string;
  est_siege: boolean;
  etat_administratif: string;
  latitude: number | null;
  longitude: number | null;
  tranche_effectif_salarie: string;
}

interface Dirigeant {
  nom: string;
  prenoms: string;
  fonction: string;
  date_naissance: string;
}

interface Finances {
  annee: number;
  ca: number | null;
  resultat_net: number | null;
}

interface Entreprise {
  siren: string;
  nom_complet: string;
  nom_raison_sociale: string;
  sigle: string | null;
  nature_juridique: string;
  libelle_nature_juridique: string;
  activite_principale: string;
  libelle_activite_principale: string;
  section_activite_principale: string;
  date_creation: string;
  date_mise_a_jour: string;
  date_fermeture: string | null;
  etat_administratif: string;
  categorie_entreprise: string;
  tranche_effectif_salarie: string;
  annee_tranche_effectif_salarie: number;
  nombre_etablissements: number;
  nombre_etablissements_ouverts: number;
  siege: Etablissement;
  dirigeants: Dirigeant[];
  finances: Finances[];
  matching_etablissements: Etablissement[];
  complements: {
    est_association: boolean;
    est_entrepreneur_individuel: boolean;
    est_ess: boolean;
    est_service_public: boolean;
    est_societe_mission: boolean;
    identifiant_association: string | null;
    convention_collective_renseignee: boolean;
    liste_id_convention_collective: string[];
  };
}

interface SearchResponse {
  results: Entreprise[];
  total_results: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Filter options from API documentation
const SECTIONS_ACTIVITE = [
  { value: "A", label: "A - Agriculture, sylviculture et pêche" },
  { value: "B", label: "B - Industries extractives" },
  { value: "C", label: "C - Industrie manufacturière" },
  { value: "D", label: "D - Production et distribution d'électricité, gaz" },
  { value: "E", label: "E - Production et distribution d'eau" },
  { value: "F", label: "F - Construction" },
  { value: "G", label: "G - Commerce ; réparation automobiles" },
  { value: "H", label: "H - Transports et entreposage" },
  { value: "I", label: "I - Hébergement et restauration" },
  { value: "J", label: "J - Information et communication" },
  { value: "K", label: "K - Activités financières et d'assurance" },
  { value: "L", label: "L - Activités immobilières" },
  { value: "M", label: "M - Activités spécialisées, scientifiques" },
  { value: "N", label: "N - Activités de services administratifs" },
  { value: "O", label: "O - Administration publique" },
  { value: "P", label: "P - Enseignement" },
  { value: "Q", label: "Q - Santé humaine et action sociale" },
  { value: "R", label: "R - Arts, spectacles et activités récréatives" },
  { value: "S", label: "S - Autres activités de services" },
  { value: "T", label: "T - Activités des ménages" },
  { value: "U", label: "U - Activités extra-territoriales" },
];

const CATEGORIES_ENTREPRISE = [
  { value: "PME", label: "PME" },
  { value: "ETI", label: "ETI" },
  { value: "GE", label: "Grande Entreprise" },
];

const TRANCHES_EFFECTIF = [
  { value: "NN", label: "NN - Non employeur" },
  { value: "00", label: "00 - 0 salarié" },
  { value: "01", label: "01 - 1 à 2 salariés" },
  { value: "02", label: "02 - 3 à 5 salariés" },
  { value: "03", label: "03 - 6 à 9 salariés" },
  { value: "11", label: "11 - 10 à 19 salariés" },
  { value: "12", label: "12 - 20 à 49 salariés" },
  { value: "21", label: "21 - 50 à 99 salariés" },
  { value: "22", label: "22 - 100 à 199 salariés" },
  { value: "31", label: "31 - 200 à 249 salariés" },
  { value: "32", label: "32 - 250 à 499 salariés" },
  { value: "41", label: "41 - 500 à 999 salariés" },
  { value: "42", label: "42 - 1000 à 1999 salariés" },
  { value: "51", label: "51 - 2000 à 4999 salariés" },
  { value: "52", label: "52 - 5000 à 9999 salariés" },
  { value: "53", label: "53 - 10000+ salariés" },
];

const ETATS_ADMINISTRATIFS = [
  { value: "", label: "Tous" },
  { value: "A", label: "Active" },
  { value: "C", label: "Cessée" },
];

const TYPE_PERSONNE = [
  { value: "", label: "Tous" },
  { value: "dirigeant", label: "Dirigeant" },
  { value: "elu", label: "Élu" },
];

interface Filters {
  // Localisation
  code_postal: string;
  code_commune: string;
  departement: string;
  region: string;
  epci: string;
  code_collectivite_territoriale: string;
  
  // Activité
  activite_principale: string;
  section_activite_principale: string;
  nature_juridique: string;
  
  // Taille
  categorie_entreprise: string;
  tranche_effectif_salarie: string;
  
  // État
  etat_administratif: string;
  
  // Personnes
  nom_personne: string;
  prenoms_personne: string;
  date_naissance_personne_min: string;
  date_naissance_personne_max: string;
  type_personne: string;
  
  // Finances
  ca_min: string;
  ca_max: string;
  resultat_net_min: string;
  resultat_net_max: string;
  
  // Labels et certifications (booleans)
  est_association: string;
  est_entrepreneur_individuel: string;
  est_ess: string;
  est_service_public: string;
  est_l100_3: string;
  est_societe_mission: string;
  est_collectivite_territoriale: string;
  est_rge: string;
  est_bio: string;
  est_qualiopi: string;
  est_organisme_formation: string;
  est_entrepreneur_spectacle: string;
  est_patrimoine_vivant: string;
  est_finess: string;
  est_uai: string;
  est_siae: string;
  est_alim_confiance: string;
  est_achats_responsables: string;
  egapro_renseignee: string;
  convention_collective_renseignee: string;
  
  // Identifiants spécifiques
  id_convention_collective: string;
  id_finess: string;
  id_rge: string;
  id_uai: string;
  
  // Pagination
  page: number;
  per_page: number;
  limite_matching_etablissements: number;
  sort_by_size: string;
}

const defaultFilters: Filters = {
  code_postal: "",
  code_commune: "",
  departement: "",
  region: "",
  epci: "",
  code_collectivite_territoriale: "",
  activite_principale: "",
  section_activite_principale: "",
  nature_juridique: "",
  categorie_entreprise: "",
  tranche_effectif_salarie: "",
  etat_administratif: "",
  nom_personne: "",
  prenoms_personne: "",
  date_naissance_personne_min: "",
  date_naissance_personne_max: "",
  type_personne: "",
  ca_min: "",
  ca_max: "",
  resultat_net_min: "",
  resultat_net_max: "",
  est_association: "",
  est_entrepreneur_individuel: "",
  est_ess: "",
  est_service_public: "",
  est_l100_3: "",
  est_societe_mission: "",
  est_collectivite_territoriale: "",
  est_rge: "",
  est_bio: "",
  est_qualiopi: "",
  est_organisme_formation: "",
  est_entrepreneur_spectacle: "",
  est_patrimoine_vivant: "",
  est_finess: "",
  est_uai: "",
  est_siae: "",
  est_alim_confiance: "",
  est_achats_responsables: "",
  egapro_renseignee: "",
  convention_collective_renseignee: "",
  id_convention_collective: "",
  id_finess: "",
  id_rge: "",
  id_uai: "",
  page: 1,
  per_page: 10,
  limite_matching_etablissements: 10,
  sort_by_size: "",
};

export function CompanySearchApiTab() {
  const [searchType, setSearchType] = useState<"name" | "siret">("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Entreprise[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedCompany, setSelectedCompany] = useState<Entreprise | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);

  const updateFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    Object.entries(filters).forEach(([key, value]) => {
      if (key === "page" || key === "per_page" || key === "limite_matching_etablissements") return;
      if (value !== "" && value !== defaultFilters[key as keyof Filters]) count++;
    });
    return count;
  };

  const buildSearchUrl = () => {
    let url = `${API_BASE_URL}/search?`;
    const params: string[] = [];
    
    // Main query
    if (searchQuery.trim()) {
      const cleanedQuery = searchType === "siret" ? searchQuery.replace(/\s/g, "") : searchQuery;
      params.push(`q=${encodeURIComponent(cleanedQuery)}`);
    }
    
    // Localisation filters
    if (filters.code_postal) params.push(`code_postal=${encodeURIComponent(filters.code_postal)}`);
    if (filters.code_commune) params.push(`code_commune=${encodeURIComponent(filters.code_commune)}`);
    if (filters.departement) params.push(`departement=${encodeURIComponent(filters.departement)}`);
    if (filters.region) params.push(`region=${encodeURIComponent(filters.region)}`);
    if (filters.epci) params.push(`epci=${encodeURIComponent(filters.epci)}`);
    if (filters.code_collectivite_territoriale) params.push(`code_collectivite_territoriale=${encodeURIComponent(filters.code_collectivite_territoriale)}`);
    
    // Activity filters
    if (filters.activite_principale) params.push(`activite_principale=${encodeURIComponent(filters.activite_principale)}`);
    if (filters.section_activite_principale) params.push(`section_activite_principale=${encodeURIComponent(filters.section_activite_principale)}`);
    if (filters.nature_juridique) params.push(`nature_juridique=${encodeURIComponent(filters.nature_juridique)}`);
    
    // Size filters
    if (filters.categorie_entreprise) params.push(`categorie_entreprise=${encodeURIComponent(filters.categorie_entreprise)}`);
    if (filters.tranche_effectif_salarie) params.push(`tranche_effectif_salarie=${encodeURIComponent(filters.tranche_effectif_salarie)}`);
    
    // State
    if (filters.etat_administratif) params.push(`etat_administratif=${encodeURIComponent(filters.etat_administratif)}`);
    
    // Person filters
    if (filters.nom_personne) params.push(`nom_personne=${encodeURIComponent(filters.nom_personne)}`);
    if (filters.prenoms_personne) params.push(`prenoms_personne=${encodeURIComponent(filters.prenoms_personne)}`);
    if (filters.date_naissance_personne_min) params.push(`date_naissance_personne_min=${encodeURIComponent(filters.date_naissance_personne_min)}`);
    if (filters.date_naissance_personne_max) params.push(`date_naissance_personne_max=${encodeURIComponent(filters.date_naissance_personne_max)}`);
    if (filters.type_personne) params.push(`type_personne=${encodeURIComponent(filters.type_personne)}`);
    
    // Financial filters
    if (filters.ca_min) params.push(`ca_min=${encodeURIComponent(filters.ca_min)}`);
    if (filters.ca_max) params.push(`ca_max=${encodeURIComponent(filters.ca_max)}`);
    if (filters.resultat_net_min) params.push(`resultat_net_min=${encodeURIComponent(filters.resultat_net_min)}`);
    if (filters.resultat_net_max) params.push(`resultat_net_max=${encodeURIComponent(filters.resultat_net_max)}`);
    
    // Boolean filters (labels & certifications)
    if (filters.est_association) params.push(`est_association=${filters.est_association}`);
    if (filters.est_entrepreneur_individuel) params.push(`est_entrepreneur_individuel=${filters.est_entrepreneur_individuel}`);
    if (filters.est_ess) params.push(`est_ess=${filters.est_ess}`);
    if (filters.est_service_public) params.push(`est_service_public=${filters.est_service_public}`);
    if (filters.est_l100_3) params.push(`est_l100_3=${filters.est_l100_3}`);
    if (filters.est_societe_mission) params.push(`est_societe_mission=${filters.est_societe_mission}`);
    if (filters.est_collectivite_territoriale) params.push(`est_collectivite_territoriale=${filters.est_collectivite_territoriale}`);
    if (filters.est_rge) params.push(`est_rge=${filters.est_rge}`);
    if (filters.est_bio) params.push(`est_bio=${filters.est_bio}`);
    if (filters.est_qualiopi) params.push(`est_qualiopi=${filters.est_qualiopi}`);
    if (filters.est_organisme_formation) params.push(`est_organisme_formation=${filters.est_organisme_formation}`);
    if (filters.est_entrepreneur_spectacle) params.push(`est_entrepreneur_spectacle=${filters.est_entrepreneur_spectacle}`);
    if (filters.est_patrimoine_vivant) params.push(`est_patrimoine_vivant=${filters.est_patrimoine_vivant}`);
    if (filters.est_finess) params.push(`est_finess=${filters.est_finess}`);
    if (filters.est_uai) params.push(`est_uai=${filters.est_uai}`);
    if (filters.est_siae) params.push(`est_siae=${filters.est_siae}`);
    if (filters.est_alim_confiance) params.push(`est_alim_confiance=${filters.est_alim_confiance}`);
    if (filters.est_achats_responsables) params.push(`est_achats_responsables=${filters.est_achats_responsables}`);
    if (filters.egapro_renseignee) params.push(`egapro_renseignee=${filters.egapro_renseignee}`);
    if (filters.convention_collective_renseignee) params.push(`convention_collective_renseignee=${filters.convention_collective_renseignee}`);
    
    // Specific IDs
    if (filters.id_convention_collective) params.push(`id_convention_collective=${encodeURIComponent(filters.id_convention_collective)}`);
    if (filters.id_finess) params.push(`id_finess=${encodeURIComponent(filters.id_finess)}`);
    if (filters.id_rge) params.push(`id_rge=${encodeURIComponent(filters.id_rge)}`);
    if (filters.id_uai) params.push(`id_uai=${encodeURIComponent(filters.id_uai)}`);
    
    // Pagination & options
    params.push(`page=${filters.page}`);
    params.push(`per_page=${filters.per_page}`);
    if (filters.limite_matching_etablissements !== 10) {
      params.push(`limite_matching_etablissements=${filters.limite_matching_etablissements}`);
    }
    if (filters.sort_by_size === "true") params.push(`sort_by_size=true`);
    
    return url + params.join("&");
  };

  const searchCompanies = async (page = 1) => {
    if (!searchQuery.trim() && getActiveFiltersCount() === 0) {
      toast.error("Veuillez entrer un terme de recherche ou appliquer des filtres");
      return;
    }

    setLoading(true);
    if (page === 1) {
      setResults([]);
      setSelectedCompany(null);
    }
    updateFilter("page", page);

    try {
      const url = buildSearchUrl();
      console.log("API URL:", url);

      const response = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "FinCare-Admin-Test"
        }
      });

      if (response.status === 429) {
        toast.error("Limite de requêtes atteinte. Veuillez réessayer dans quelques secondes.");
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
      setTotalResults(data.total_results);
      setTotalPages(data.total_pages);

      if (data.results.length === 0) {
        toast.info("Aucune entreprise trouvée");
      } else {
        toast.success(`${data.total_results} résultat(s) trouvé(s)`);
      }
    } catch (error) {
      console.error("Error searching companies:", error);
      toast.error("Erreur lors de la recherche");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return "N/A";
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("fr-FR");
    } catch {
      return dateString;
    }
  };

  const getEtatBadge = (etat: string) => {
    if (etat === "A") {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>;
    }
    return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Cessée</Badge>;
  };

  const BooleanFilterToggle = ({ label, filterKey }: { label: string; filterKey: keyof Filters }) => (
    <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
      <Label className="text-sm cursor-pointer">{label}</Label>
      <Select 
        value={filters[filterKey] as string} 
        onValueChange={(v) => updateFilter(filterKey, v)}
      >
        <SelectTrigger className="w-24 h-8">
          <SelectValue placeholder="--" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">--</SelectItem>
          <SelectItem value="true">Oui</SelectItem>
          <SelectItem value="false">Non</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Test API Recherche d'Entreprises</h2>
        <p className="text-muted-foreground">
          Testez l'API gouvernementale de recherche d'entreprises françaises (API ouverte, sans effet sur l'application)
        </p>
        <a 
          href="https://recherche-entreprises.api.gouv.fr" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
        >
          <ExternalLink className="h-3 w-3" />
          Documentation officielle
        </a>
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Rechercher une entreprise
          </CardTitle>
          <CardDescription>
            Recherchez par nom, adresse, SIREN ou SIRET avec des filtres avancés
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={searchType} onValueChange={(v) => setSearchType(v as "name" | "siret")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="name">Par nom / adresse</TabsTrigger>
              <TabsTrigger value="siret">Par SIREN / SIRET</TabsTrigger>
            </TabsList>
            <TabsContent value="name" className="space-y-4">
              <div>
                <Label>Nom ou adresse de l'entreprise</Label>
                <Input
                  placeholder="Ex: La Poste, Google France, 75001..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchCompanies()}
                />
              </div>
            </TabsContent>
            <TabsContent value="siret" className="space-y-4">
              <div>
                <Label>SIREN (9 chiffres) ou SIRET (14 chiffres)</Label>
                <Input
                  placeholder="Ex: 356000000 ou 35600000000048"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchCompanies()}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Filters Toggle */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtres avancés
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="ml-1">{getActiveFiltersCount()}</Badge>
              )}
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {getActiveFiltersCount() > 0 && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
                <RotateCcw className="h-3 w-3" />
                Réinitialiser
              </Button>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <Tabs defaultValue="localisation" className="w-full">
                  <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
                    <TabsTrigger value="localisation" className="text-xs">📍 Localisation</TabsTrigger>
                    <TabsTrigger value="activite" className="text-xs">🏭 Activité</TabsTrigger>
                    <TabsTrigger value="taille" className="text-xs">📊 Taille</TabsTrigger>
                    <TabsTrigger value="personne" className="text-xs">👤 Personnes</TabsTrigger>
                    <TabsTrigger value="finances" className="text-xs">💰 Finances</TabsTrigger>
                    <TabsTrigger value="labels" className="text-xs">🏷️ Labels</TabsTrigger>
                    <TabsTrigger value="identifiants" className="text-xs">🔑 Identifiants</TabsTrigger>
                    <TabsTrigger value="options" className="text-xs">⚙️ Options</TabsTrigger>
                  </TabsList>

                  {/* Localisation */}
                  <TabsContent value="localisation" className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Code postal</Label>
                        <Input 
                          placeholder="38540,38189" 
                          value={filters.code_postal}
                          onChange={(e) => updateFilter("code_postal", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Code commune (INSEE)</Label>
                        <Input 
                          placeholder="01247,01111" 
                          value={filters.code_commune}
                          onChange={(e) => updateFilter("code_commune", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Département</Label>
                        <Input 
                          placeholder="75,92,93" 
                          value={filters.departement}
                          onChange={(e) => updateFilter("departement", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Région (code INSEE)</Label>
                        <Input 
                          placeholder="11,76" 
                          value={filters.region}
                          onChange={(e) => updateFilter("region", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">EPCI</Label>
                        <Input 
                          placeholder="200058519" 
                          value={filters.epci}
                          onChange={(e) => updateFilter("epci", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Code collectivité territoriale</Label>
                        <Input 
                          placeholder="75C" 
                          value={filters.code_collectivite_territoriale}
                          onChange={(e) => updateFilter("code_collectivite_territoriale", e.target.value)}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Activité */}
                  <TabsContent value="activite" className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label className="text-xs">Code NAF / APE</Label>
                        <Input 
                          placeholder="01.12Z,28.15Z" 
                          value={filters.activite_principale}
                          onChange={(e) => updateFilter("activite_principale", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Section d'activité</Label>
                        <Select 
                          value={filters.section_activite_principale} 
                          onValueChange={(v) => updateFilter("section_activite_principale", v)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Toutes sections" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Toutes sections</SelectItem>
                            {SECTIONS_ACTIVITE.map(s => (
                              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Nature juridique (codes)</Label>
                        <Input 
                          placeholder="7344,6544" 
                          value={filters.nature_juridique}
                          onChange={(e) => updateFilter("nature_juridique", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">État administratif</Label>
                        <Select 
                          value={filters.etat_administratif} 
                          onValueChange={(v) => updateFilter("etat_administratif", v)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Tous états" />
                          </SelectTrigger>
                          <SelectContent>
                            {ETATS_ADMINISTRATIFS.map(e => (
                              <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Taille */}
                  <TabsContent value="taille" className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label className="text-xs">Catégorie d'entreprise</Label>
                        <Select 
                          value={filters.categorie_entreprise} 
                          onValueChange={(v) => updateFilter("categorie_entreprise", v)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Toutes catégories" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Toutes catégories</SelectItem>
                            {CATEGORIES_ENTREPRISE.map(c => (
                              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Tranche d'effectif salarié</Label>
                        <Select 
                          value={filters.tranche_effectif_salarie} 
                          onValueChange={(v) => updateFilter("tranche_effectif_salarie", v)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Toutes tranches" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Toutes tranches</SelectItem>
                            {TRANCHES_EFFECTIF.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Personnes */}
                  <TabsContent value="personne" className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Nom</Label>
                        <Input 
                          placeholder="Dupont" 
                          value={filters.nom_personne}
                          onChange={(e) => updateFilter("nom_personne", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Prénom(s)</Label>
                        <Input 
                          placeholder="Jean" 
                          value={filters.prenoms_personne}
                          onChange={(e) => updateFilter("prenoms_personne", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Date naissance min</Label>
                        <Input 
                          type="date"
                          value={filters.date_naissance_personne_min}
                          onChange={(e) => updateFilter("date_naissance_personne_min", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Date naissance max</Label>
                        <Input 
                          type="date"
                          value={filters.date_naissance_personne_max}
                          onChange={(e) => updateFilter("date_naissance_personne_max", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Type de personne</Label>
                        <Select 
                          value={filters.type_personne} 
                          onValueChange={(v) => updateFilter("type_personne", v)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Tous types" />
                          </SelectTrigger>
                          <SelectContent>
                            {TYPE_PERSONNE.map(t => (
                              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Finances */}
                  <TabsContent value="finances" className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">CA minimum (€)</Label>
                        <Input 
                          type="number"
                          placeholder="100000" 
                          value={filters.ca_min}
                          onChange={(e) => updateFilter("ca_min", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">CA maximum (€)</Label>
                        <Input 
                          type="number"
                          placeholder="10000000" 
                          value={filters.ca_max}
                          onChange={(e) => updateFilter("ca_max", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Résultat net min (€)</Label>
                        <Input 
                          type="number"
                          placeholder="10000" 
                          value={filters.resultat_net_min}
                          onChange={(e) => updateFilter("resultat_net_min", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Résultat net max (€)</Label>
                        <Input 
                          type="number"
                          placeholder="1000000" 
                          value={filters.resultat_net_max}
                          onChange={(e) => updateFilter("resultat_net_max", e.target.value)}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Labels & Certifications */}
                  <TabsContent value="labels" className="space-y-1">
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-1 pr-4">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Type d'organisation</p>
                        <BooleanFilterToggle label="Association" filterKey="est_association" />
                        <BooleanFilterToggle label="Entrepreneur individuel" filterKey="est_entrepreneur_individuel" />
                        <BooleanFilterToggle label="Économie sociale et solidaire (ESS)" filterKey="est_ess" />
                        <BooleanFilterToggle label="Service public" filterKey="est_service_public" />
                        <BooleanFilterToggle label="Administration (L. 100-3 CRPA)" filterKey="est_l100_3" />
                        <BooleanFilterToggle label="Société à mission" filterKey="est_societe_mission" />
                        <BooleanFilterToggle label="Collectivité territoriale" filterKey="est_collectivite_territoriale" />
                        <BooleanFilterToggle label="Structure d'insertion (SIAE)" filterKey="est_siae" />
                        
                        <Separator className="my-2" />
                        <p className="text-xs font-medium text-muted-foreground mb-2">Labels & certifications</p>
                        <BooleanFilterToggle label="RGE (Reconnu Garant Environnement)" filterKey="est_rge" />
                        <BooleanFilterToggle label="Certifié Bio (Agence Bio)" filterKey="est_bio" />
                        <BooleanFilterToggle label="Qualiopi" filterKey="est_qualiopi" />
                        <BooleanFilterToggle label="Organisme de formation" filterKey="est_organisme_formation" />
                        <BooleanFilterToggle label="Entrepreneur du spectacle" filterKey="est_entrepreneur_spectacle" />
                        <BooleanFilterToggle label="Entreprise du Patrimoine Vivant (EPV)" filterKey="est_patrimoine_vivant" />
                        <BooleanFilterToggle label="Achats responsables (RFAR)" filterKey="est_achats_responsables" />
                        <BooleanFilterToggle label="Alim'Confiance" filterKey="est_alim_confiance" />
                        
                        <Separator className="my-2" />
                        <p className="text-xs font-medium text-muted-foreground mb-2">Registres spécifiques</p>
                        <BooleanFilterToggle label="FINESS (sanitaire et social)" filterKey="est_finess" />
                        <BooleanFilterToggle label="UAI (éducation)" filterKey="est_uai" />
                        <BooleanFilterToggle label="Index Égapro renseigné" filterKey="egapro_renseignee" />
                        <BooleanFilterToggle label="Convention collective renseignée" filterKey="convention_collective_renseignee" />
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  {/* Identifiants spécifiques */}
                  <TabsContent value="identifiants" className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">ID Convention collective</Label>
                        <Input 
                          placeholder="1090" 
                          value={filters.id_convention_collective}
                          onChange={(e) => updateFilter("id_convention_collective", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">ID FINESS</Label>
                        <Input 
                          placeholder="010003853" 
                          value={filters.id_finess}
                          onChange={(e) => updateFilter("id_finess", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">ID RGE</Label>
                        <Input 
                          placeholder="8611M10D109" 
                          value={filters.id_rge}
                          onChange={(e) => updateFilter("id_rge", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">ID UAI</Label>
                        <Input 
                          placeholder="0022004T" 
                          value={filters.id_uai}
                          onChange={(e) => updateFilter("id_uai", e.target.value)}
                          className="h-8"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  {/* Options */}
                  <TabsContent value="options" className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Résultats par page</Label>
                        <Select 
                          value={String(filters.per_page)} 
                          onValueChange={(v) => updateFilter("per_page", parseInt(v))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="15">15</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Établissements connexes (max)</Label>
                        <Select 
                          value={String(filters.limite_matching_etablissements)} 
                          onValueChange={(v) => updateFilter("limite_matching_etablissements", parseInt(v))}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                          <Label className="text-sm cursor-pointer">Trier par taille d'entreprise</Label>
                          <Switch 
                            checked={filters.sort_by_size === "true"}
                            onCheckedChange={(v) => updateFilter("sort_by_size", v ? "true" : "")}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          <Button onClick={() => searchCompanies(1)} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Recherche en cours...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Results List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Résultats ({totalResults})
            </CardTitle>
            {totalPages > 1 && (
              <CardDescription>
                Page {filters.page} / {Math.min(totalPages, 1000)}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {results.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Aucun résultat</p>
                  <p className="text-sm">Effectuez une recherche pour voir les entreprises</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {results.map((company) => (
                    <Card
                      key={company.siren}
                      className={`cursor-pointer transition-colors hover:bg-accent ${
                        selectedCompany?.siren === company.siren ? "border-primary bg-accent" : ""
                      }`}
                      onClick={() => setSelectedCompany(company)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{company.nom_complet}</p>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              SIREN: {company.siren}
                            </p>
                            {company.siege && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                {company.siege.commune} ({company.siege.code_postal})
                              </p>
                            )}
                          </div>
                          {getEtatBadge(company.etat_administratif)}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={filters.page <= 1 || loading}
                        onClick={() => searchCompanies(filters.page - 1)}
                      >
                        Précédent
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {filters.page} / {Math.min(totalPages, 1000)}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={filters.page >= Math.min(totalPages, 1000) || loading}
                        onClick={() => searchCompanies(filters.page + 1)}
                      >
                        Suivant
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Company Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Détails de l'entreprise
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              {!selectedCompany ? (
                <div className="text-center text-muted-foreground py-8">
                  <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Sélectionnez une entreprise</p>
                  <p className="text-sm">pour voir ses détails</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Identity */}
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Identité
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Nom complet</div>
                      <div className="font-medium">{selectedCompany.nom_complet}</div>
                      
                      <div className="text-muted-foreground">Raison sociale</div>
                      <div>{selectedCompany.nom_raison_sociale || "N/A"}</div>
                      
                      {selectedCompany.sigle && (
                        <>
                          <div className="text-muted-foreground">Sigle</div>
                          <div>{selectedCompany.sigle}</div>
                        </>
                      )}
                      
                      <div className="text-muted-foreground">SIREN</div>
                      <div className="font-mono">{selectedCompany.siren}</div>
                      
                      <div className="text-muted-foreground">État</div>
                      <div>{getEtatBadge(selectedCompany.etat_administratif)}</div>
                      
                      <div className="text-muted-foreground">Nature juridique</div>
                      <div>{selectedCompany.libelle_nature_juridique || selectedCompany.nature_juridique}</div>
                      
                      <div className="text-muted-foreground">Catégorie</div>
                      <div>{selectedCompany.categorie_entreprise || "N/A"}</div>
                    </div>
                  </div>

                  <Separator />

                  {/* Activity */}
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Activité
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Code NAF</div>
                      <div className="font-mono">{selectedCompany.activite_principale}</div>
                      
                      <div className="text-muted-foreground">Libellé</div>
                      <div>{selectedCompany.libelle_activite_principale}</div>
                      
                      <div className="text-muted-foreground">Section</div>
                      <div>{selectedCompany.section_activite_principale}</div>
                    </div>
                  </div>

                  <Separator />

                  {/* Dates */}
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Dates
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Date de création</div>
                      <div>{formatDate(selectedCompany.date_creation)}</div>
                      
                      <div className="text-muted-foreground">Dernière mise à jour</div>
                      <div>{formatDate(selectedCompany.date_mise_a_jour)}</div>
                      
                      {selectedCompany.date_fermeture && (
                        <>
                          <div className="text-muted-foreground">Date de fermeture</div>
                          <div>{formatDate(selectedCompany.date_fermeture)}</div>
                        </>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Effectifs */}
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Effectifs & Établissements
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-muted-foreground">Tranche effectif</div>
                      <div>{selectedCompany.tranche_effectif_salarie || "N/A"}</div>
                      
                      <div className="text-muted-foreground">Année effectif</div>
                      <div>{selectedCompany.annee_tranche_effectif_salarie || "N/A"}</div>
                      
                      <div className="text-muted-foreground">Établissements</div>
                      <div>{selectedCompany.nombre_etablissements_ouverts} / {selectedCompany.nombre_etablissements}</div>
                    </div>
                  </div>

                  <Separator />

                  {/* Siège */}
                  {selectedCompany.siege && (
                    <Collapsible 
                      open={expandedSections["siege"]} 
                      onOpenChange={() => toggleSection("siege")}
                    >
                      <CollapsibleTrigger className="flex items-center gap-2 font-semibold w-full">
                        <MapPin className="h-4 w-4" />
                        Siège social
                        {expandedSections["siege"] ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-muted-foreground">SIRET</div>
                          <div className="font-mono">{selectedCompany.siege.siret}</div>
                          
                          <div className="text-muted-foreground">Adresse</div>
                          <div>{selectedCompany.siege.adresse}</div>
                          
                          <div className="text-muted-foreground">Commune</div>
                          <div>{selectedCompany.siege.commune}</div>
                          
                          <div className="text-muted-foreground">Code postal</div>
                          <div>{selectedCompany.siege.code_postal}</div>
                          
                          <div className="text-muted-foreground">Activité</div>
                          <div>{selectedCompany.siege.libelle_activite_principale}</div>
                          
                          {selectedCompany.siege.latitude && selectedCompany.siege.longitude && (
                            <>
                              <div className="text-muted-foreground">Coordonnées</div>
                              <div className="font-mono text-xs">
                                {selectedCompany.siege.latitude}, {selectedCompany.siege.longitude}
                              </div>
                            </>
                          )}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  <Separator />

                  {/* Dirigeants */}
                  {selectedCompany.dirigeants && selectedCompany.dirigeants.length > 0 && (
                    <Collapsible 
                      open={expandedSections["dirigeants"]} 
                      onOpenChange={() => toggleSection("dirigeants")}
                    >
                      <CollapsibleTrigger className="flex items-center gap-2 font-semibold w-full">
                        <Users className="h-4 w-4" />
                        Dirigeants ({selectedCompany.dirigeants.length})
                        {expandedSections["dirigeants"] ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-2 space-y-2">
                        {selectedCompany.dirigeants.map((dirigeant, idx) => (
                          <div key={idx} className="p-2 rounded bg-muted/50 text-sm">
                            <p className="font-medium">{dirigeant.prenoms} {dirigeant.nom}</p>
                            <p className="text-muted-foreground">{dirigeant.fonction}</p>
                            {dirigeant.date_naissance && (
                              <p className="text-xs text-muted-foreground">
                                Né(e) le {formatDate(dirigeant.date_naissance)}
                              </p>
                            )}
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Finances */}
                  {selectedCompany.finances && selectedCompany.finances.length > 0 && (
                    <>
                      <Separator />
                      <Collapsible 
                        open={expandedSections["finances"]} 
                        onOpenChange={() => toggleSection("finances")}
                      >
                        <CollapsibleTrigger className="flex items-center gap-2 font-semibold w-full">
                          <FileText className="h-4 w-4" />
                          Finances ({selectedCompany.finances.length} année(s))
                          {expandedSections["finances"] ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2 space-y-2">
                          {selectedCompany.finances.map((finance, idx) => (
                            <div key={idx} className="p-2 rounded bg-muted/50 text-sm">
                              <p className="font-medium">Année {finance.annee}</p>
                              <div className="grid grid-cols-2 gap-2 mt-1">
                                <div className="text-muted-foreground">Chiffre d'affaires</div>
                                <div>{formatCurrency(finance.ca)}</div>
                                <div className="text-muted-foreground">Résultat net</div>
                                <div>{formatCurrency(finance.resultat_net)}</div>
                              </div>
                            </div>
                          ))}
                        </CollapsibleContent>
                      </Collapsible>
                    </>
                  )}

                  {/* Compléments */}
                  {selectedCompany.complements && (
                    <>
                      <Separator />
                      <Collapsible 
                        open={expandedSections["complements"]} 
                        onOpenChange={() => toggleSection("complements")}
                      >
                        <CollapsibleTrigger className="flex items-center gap-2 font-semibold w-full">
                          <FileText className="h-4 w-4" />
                          Compléments
                          {expandedSections["complements"] ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-2">
                          <div className="flex flex-wrap gap-2">
                            {selectedCompany.complements.est_association && (
                              <Badge variant="outline">Association</Badge>
                            )}
                            {selectedCompany.complements.est_entrepreneur_individuel && (
                              <Badge variant="outline">Entrepreneur individuel</Badge>
                            )}
                            {selectedCompany.complements.est_ess && (
                              <Badge variant="outline">ESS</Badge>
                            )}
                            {selectedCompany.complements.est_service_public && (
                              <Badge variant="outline">Service public</Badge>
                            )}
                            {selectedCompany.complements.est_societe_mission && (
                              <Badge variant="outline">Société à mission</Badge>
                            )}
                            {selectedCompany.complements.convention_collective_renseignee && (
                              <Badge variant="outline">Convention collective</Badge>
                            )}
                            {selectedCompany.complements.identifiant_association && (
                              <Badge variant="secondary">
                                RNA: {selectedCompany.complements.identifiant_association}
                              </Badge>
                            )}
                          </div>
                          {selectedCompany.complements.liste_id_convention_collective?.length > 0 && (
                            <div className="mt-2 text-sm">
                              <span className="text-muted-foreground">Conventions collectives: </span>
                              {selectedCompany.complements.liste_id_convention_collective.join(", ")}
                            </div>
                          )}
                        </CollapsibleContent>
                      </Collapsible>
                    </>
                  )}

                  {/* Raw JSON */}
                  <Separator />
                  <Collapsible 
                    open={expandedSections["json"]} 
                    onOpenChange={() => toggleSection("json")}
                  >
                    <CollapsibleTrigger className="flex items-center gap-2 font-semibold w-full">
                      <FileText className="h-4 w-4" />
                      Données brutes (JSON)
                      {expandedSections["json"] ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <pre className="p-4 bg-muted rounded text-xs overflow-auto max-h-96">
                        {JSON.stringify(selectedCompany, null, 2)}
                      </pre>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
