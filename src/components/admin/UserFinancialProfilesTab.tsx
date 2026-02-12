import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Search, CheckCircle2, XCircle, Download, Eye } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ProfileWithUser {
  id: string;
  user_id: string;
  date_naissance: string | null;
  age: number | null;
  situation_familiale: string;
  nb_enfants: number;
  nb_personnes_foyer: number;
  revenu_mensuel_net: number;
  revenu_fiscal_annuel: number;
  revenu_fiscal_foyer: number;
  autres_revenus_mensuels: number;
  revenus_locatifs: number;
  charges_fixes_mensuelles: number;
  loyer_actuel: number;
  credits_immobilier: number;
  credits_consommation: number;
  credits_auto: number;
  pensions_alimentaires: number;
  statut_residence: string | null;
  epargne_actuelle: number;
  epargne_livrets: number;
  capacite_epargne_mensuelle: number;
  patrimoine_per: number;
  patrimoine_assurance_vie: number;
  patrimoine_scpi: number;
  patrimoine_pea: number;
  patrimoine_autres: number;
  patrimoine_immo_valeur: number;
  patrimoine_immo_credit_restant: number;
  apport_disponible: number;
  objectif_achat_immo: boolean;
  projet_residence_principale: boolean;
  projet_residence_secondaire: boolean;
  projet_investissement_locatif: boolean;
  budget_achat_immo: number | null;
  budget_residence_principale: number | null;
  budget_residence_secondaire: number | null;
  budget_investissement_locatif: number | null;
  duree_emprunt_souhaitee: number;
  tmi: number;
  parts_fiscales: number;
  plafond_per_reportable: number;
  type_contrat: string;
  anciennete_annees: number;
  secteur_activite: string | null;
  has_rsu_aga: boolean;
  has_espp: boolean;
  has_stock_options: boolean;
  has_bspce: boolean;
  has_pee: boolean;
  has_perco: boolean;
  is_complete: boolean;
  financial_summary: string | null;
  financial_summary_generated_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: {
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined || value === 0) return "-";
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
};

const formatBoolean = (value: boolean | null | undefined) => {
  if (value === null || value === undefined) return "-";
  return value ? "Oui" : "Non";
};

const formatNumber = (value: number | null | undefined) => {
  if (value === null || value === undefined) return "-";
  return value.toString();
};

export function UserFinancialProfilesTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProfile, setSelectedProfile] = useState<ProfileWithUser | null>(null);
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);

  const { data: profiles, isLoading } = useQuery({
    queryKey: ['admin-financial-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_financial_profiles')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            email
          )
        `)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as ProfileWithUser[];
    },
  });

  const filteredProfiles = profiles?.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const fullName = `${p.profiles?.first_name || ''} ${p.profiles?.last_name || ''}`.toLowerCase();
    const email = (p.profiles?.email || '').toLowerCase();
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  const exportToCsv = () => {
    if (!profiles?.length) return;
    
    const headers = [
      'Nom', 'Prénom', 'Email', 'Âge', 'Situation familiale', 'Nb enfants', 'Nb personnes foyer',
      'Revenu mensuel net', 'Revenu fiscal annuel', 'Revenu fiscal foyer', 'Autres revenus mensuels', 'Revenus locatifs',
      'Charges fixes mensuelles', 'Loyer actuel', 'Crédits immobilier', 'Crédits conso', 'Crédits auto', 'Pensions alimentaires',
      'Statut résidence', 'Épargne actuelle', 'Épargne livrets', 'Capacité épargne mensuelle',
      'Patrimoine PER', 'Patrimoine AV', 'Patrimoine SCPI', 'Patrimoine PEA', 'Patrimoine autres',
      'Patrimoine immo valeur', 'Patrimoine immo crédit restant',
      'Apport disponible', 'Objectif achat immo', 'Projet RP', 'Projet RS', 'Projet locatif',
      'Budget achat immo', 'Budget RP', 'Budget RS', 'Budget locatif', 'Durée emprunt souhaitée',
      'TMI', 'Parts fiscales', 'Plafond PER reportable',
      'Type contrat', 'Ancienneté', 'Secteur activité',
      'RSU/AGA', 'ESPP', 'Stock options', 'BSPCE', 'PEE', 'PERCO',
      'Complet', 'Créé le', 'Mis à jour le'
    ];
    
    const rows = profiles.map(p => [
      p.profiles?.last_name || '',
      p.profiles?.first_name || '',
      p.profiles?.email || '',
      p.age || '',
      p.situation_familiale,
      p.nb_enfants,
      p.nb_personnes_foyer,
      p.revenu_mensuel_net,
      p.revenu_fiscal_annuel,
      p.revenu_fiscal_foyer,
      p.autres_revenus_mensuels,
      p.revenus_locatifs,
      p.charges_fixes_mensuelles,
      p.loyer_actuel,
      p.credits_immobilier,
      p.credits_consommation,
      p.credits_auto,
      p.pensions_alimentaires,
      p.statut_residence || '',
      p.epargne_actuelle,
      p.epargne_livrets,
      p.capacite_epargne_mensuelle,
      p.patrimoine_per,
      p.patrimoine_assurance_vie,
      p.patrimoine_scpi,
      p.patrimoine_pea,
      p.patrimoine_autres,
      p.patrimoine_immo_valeur,
      p.patrimoine_immo_credit_restant,
      p.apport_disponible,
      p.objectif_achat_immo ? 'Oui' : 'Non',
      p.projet_residence_principale ? 'Oui' : 'Non',
      p.projet_residence_secondaire ? 'Oui' : 'Non',
      p.projet_investissement_locatif ? 'Oui' : 'Non',
      p.budget_achat_immo || '',
      p.budget_residence_principale || '',
      p.budget_residence_secondaire || '',
      p.budget_investissement_locatif || '',
      p.duree_emprunt_souhaitee,
      p.tmi,
      p.parts_fiscales,
      p.plafond_per_reportable,
      p.type_contrat,
      p.anciennete_annees,
      p.secteur_activite || '',
      p.has_rsu_aga ? 'Oui' : 'Non',
      p.has_espp ? 'Oui' : 'Non',
      p.has_stock_options ? 'Oui' : 'Non',
      p.has_bspce ? 'Oui' : 'Non',
      p.has_pee ? 'Oui' : 'Non',
      p.has_perco ? 'Oui' : 'Non',
      p.is_complete ? 'Oui' : 'Non',
      new Date(p.created_at).toLocaleDateString('fr-FR'),
      new Date(p.updated_at).toLocaleDateString('fr-FR')
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `profils-financiers-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg sm:text-xl">Profils Financiers Utilisateurs</CardTitle>
              <CardDescription className="text-sm">
                Vue complète des données financières de tous les utilisateurs
              </CardDescription>
            </div>
            <Button variant="outline" onClick={exportToCsv} className="gap-2 w-full sm:w-auto">
              <Download className="h-4 w-4" />
              <span className="sm:inline">Exporter CSV</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="relative flex-1 sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Badge variant="secondary" className="w-fit">
              {filteredProfiles?.length || 0} profil(s)
            </Badge>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : (
            <div className="overflow-x-auto max-w-full">
              <Table className="min-w-max">
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-[180px]">Utilisateur</TableHead>
                    <TableHead className="min-w-[80px]">Statut</TableHead>
                    <TableHead className="min-w-[60px]">Âge</TableHead>
                    <TableHead className="min-w-[100px]">Situation</TableHead>
                    <TableHead className="min-w-[80px]">Enfants</TableHead>
                    <TableHead className="min-w-[80px]">Foyer</TableHead>
                    <TableHead className="min-w-[120px]">Rev. mens. net</TableHead>
                    <TableHead className="min-w-[120px]">Rev. fiscal an.</TableHead>
                    <TableHead className="min-w-[120px]">Rev. fiscal foyer</TableHead>
                    <TableHead className="min-w-[120px]">Autres rev.</TableHead>
                    <TableHead className="min-w-[120px]">Rev. locatifs</TableHead>
                    <TableHead className="min-w-[120px]">Charges fixes</TableHead>
                    <TableHead className="min-w-[100px]">Loyer</TableHead>
                    <TableHead className="min-w-[100px]">Crédit immo</TableHead>
                    <TableHead className="min-w-[100px]">Crédit conso</TableHead>
                    <TableHead className="min-w-[100px]">Crédit auto</TableHead>
                    <TableHead className="min-w-[100px]">Pensions</TableHead>
                    <TableHead className="min-w-[100px]">Résidence</TableHead>
                    <TableHead className="min-w-[120px]">Épargne act.</TableHead>
                    <TableHead className="min-w-[120px]">Ép. livrets</TableHead>
                    <TableHead className="min-w-[120px]">Cap. épargne</TableHead>
                    <TableHead className="min-w-[100px]">Patrim. PER</TableHead>
                    <TableHead className="min-w-[100px]">Patrim. AV</TableHead>
                    <TableHead className="min-w-[100px]">Patrim. SCPI</TableHead>
                    <TableHead className="min-w-[100px]">Patrim. PEA</TableHead>
                    <TableHead className="min-w-[100px]">Patrim. autres</TableHead>
                    <TableHead className="min-w-[120px]">Immo valeur</TableHead>
                    <TableHead className="min-w-[120px]">Immo crédit</TableHead>
                    <TableHead className="min-w-[120px]">Apport dispo</TableHead>
                    <TableHead className="min-w-[80px]">Obj. immo</TableHead>
                    <TableHead className="min-w-[80px]">Proj. RP</TableHead>
                    <TableHead className="min-w-[80px]">Proj. RS</TableHead>
                    <TableHead className="min-w-[80px]">Proj. loc.</TableHead>
                    <TableHead className="min-w-[120px]">Budget immo</TableHead>
                    <TableHead className="min-w-[120px]">Budget RP</TableHead>
                    <TableHead className="min-w-[120px]">Budget RS</TableHead>
                    <TableHead className="min-w-[120px]">Budget loc.</TableHead>
                    <TableHead className="min-w-[80px]">Durée empr.</TableHead>
                    <TableHead className="min-w-[60px]">TMI</TableHead>
                    <TableHead className="min-w-[60px]">Parts</TableHead>
                    <TableHead className="min-w-[120px]">Plaf. PER</TableHead>
                    <TableHead className="min-w-[80px]">Contrat</TableHead>
                    <TableHead className="min-w-[80px]">Ancien.</TableHead>
                    <TableHead className="min-w-[100px]">Secteur</TableHead>
                    <TableHead className="min-w-[70px]">RSU</TableHead>
                    <TableHead className="min-w-[70px]">ESPP</TableHead>
                    <TableHead className="min-w-[70px]">Stock opt.</TableHead>
                    <TableHead className="min-w-[70px]">BSPCE</TableHead>
                    <TableHead className="min-w-[70px]">PEE</TableHead>
                    <TableHead className="min-w-[70px]">PERCO</TableHead>
                    <TableHead className="min-w-[100px]">Mis à jour</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProfiles?.map((profile) => (
                    <TableRow key={profile.id}>
                      <TableCell className="sticky left-0 bg-background z-10 font-medium">
                        <div>
                          <div className="font-medium">
                            {profile.profiles?.first_name} {profile.profiles?.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[160px]">
                            {profile.profiles?.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {profile.is_complete ? (
                            <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20 gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="h-3 w-3" />
                            </Badge>
                          )}
                          {profile.financial_summary && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setSelectedProfile(profile);
                                setShowSummaryDialog(true);
                              }}
                              title="Voir la synthèse"
                            >
                              <Eye className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatNumber(profile.age)}</TableCell>
                      <TableCell>{profile.situation_familiale || "-"}</TableCell>
                      <TableCell>{formatNumber(profile.nb_enfants)}</TableCell>
                      <TableCell>{formatNumber(profile.nb_personnes_foyer)}</TableCell>
                      <TableCell>{formatCurrency(profile.revenu_mensuel_net)}</TableCell>
                      <TableCell>{formatCurrency(profile.revenu_fiscal_annuel)}</TableCell>
                      <TableCell>{formatCurrency(profile.revenu_fiscal_foyer)}</TableCell>
                      <TableCell>{formatCurrency(profile.autres_revenus_mensuels)}</TableCell>
                      <TableCell>{formatCurrency(profile.revenus_locatifs)}</TableCell>
                      <TableCell>{formatCurrency(profile.charges_fixes_mensuelles)}</TableCell>
                      <TableCell>{formatCurrency(profile.loyer_actuel)}</TableCell>
                      <TableCell>{formatCurrency(profile.credits_immobilier)}</TableCell>
                      <TableCell>{formatCurrency(profile.credits_consommation)}</TableCell>
                      <TableCell>{formatCurrency(profile.credits_auto)}</TableCell>
                      <TableCell>{formatCurrency(profile.pensions_alimentaires)}</TableCell>
                      <TableCell>{profile.statut_residence || "-"}</TableCell>
                      <TableCell>{formatCurrency(profile.epargne_actuelle)}</TableCell>
                      <TableCell>{formatCurrency(profile.epargne_livrets)}</TableCell>
                      <TableCell>{formatCurrency(profile.capacite_epargne_mensuelle)}</TableCell>
                      <TableCell>{formatCurrency(profile.patrimoine_per)}</TableCell>
                      <TableCell>{formatCurrency(profile.patrimoine_assurance_vie)}</TableCell>
                      <TableCell>{formatCurrency(profile.patrimoine_scpi)}</TableCell>
                      <TableCell>{formatCurrency(profile.patrimoine_pea)}</TableCell>
                      <TableCell>{formatCurrency(profile.patrimoine_autres)}</TableCell>
                      <TableCell>{formatCurrency(profile.patrimoine_immo_valeur)}</TableCell>
                      <TableCell>{formatCurrency(profile.patrimoine_immo_credit_restant)}</TableCell>
                      <TableCell>{formatCurrency(profile.apport_disponible)}</TableCell>
                      <TableCell>{formatBoolean(profile.objectif_achat_immo)}</TableCell>
                      <TableCell>{formatBoolean(profile.projet_residence_principale)}</TableCell>
                      <TableCell>{formatBoolean(profile.projet_residence_secondaire)}</TableCell>
                      <TableCell>{formatBoolean(profile.projet_investissement_locatif)}</TableCell>
                      <TableCell>{formatCurrency(profile.budget_achat_immo)}</TableCell>
                      <TableCell>{formatCurrency(profile.budget_residence_principale)}</TableCell>
                      <TableCell>{formatCurrency(profile.budget_residence_secondaire)}</TableCell>
                      <TableCell>{formatCurrency(profile.budget_investissement_locatif)}</TableCell>
                      <TableCell>{formatNumber(profile.duree_emprunt_souhaitee)} ans</TableCell>
                      <TableCell>{profile.tmi}%</TableCell>
                      <TableCell>{formatNumber(profile.parts_fiscales)}</TableCell>
                      <TableCell>{formatCurrency(profile.plafond_per_reportable)}</TableCell>
                      <TableCell className="uppercase">{profile.type_contrat || "-"}</TableCell>
                      <TableCell>{formatNumber(profile.anciennete_annees)} ans</TableCell>
                      <TableCell>{profile.secteur_activite || "-"}</TableCell>
                      <TableCell>{formatBoolean(profile.has_rsu_aga)}</TableCell>
                      <TableCell>{formatBoolean(profile.has_espp)}</TableCell>
                      <TableCell>{formatBoolean(profile.has_stock_options)}</TableCell>
                      <TableCell>{formatBoolean(profile.has_bspce)}</TableCell>
                      <TableCell>{formatBoolean(profile.has_pee)}</TableCell>
                      <TableCell>{formatBoolean(profile.has_perco)}</TableCell>
                      <TableCell className="text-xs">{new Date(profile.updated_at).toLocaleDateString('fr-FR')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Dialog */}
      <Dialog open={showSummaryDialog} onOpenChange={setShowSummaryDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Synthèse financière - {selectedProfile?.profiles?.first_name} {selectedProfile?.profiles?.last_name}
            </DialogTitle>
            <DialogDescription>
              Générée le {selectedProfile?.financial_summary_generated_at 
                ? new Date(selectedProfile.financial_summary_generated_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : 'N/A'}
            </DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none dark:prose-invert mt-4">
            {selectedProfile?.financial_summary && (
              <ReactMarkdown>{selectedProfile.financial_summary}</ReactMarkdown>
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => {
                if (selectedProfile?.financial_summary) {
                  // Create a printable HTML for PDF
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    const userName = `${selectedProfile.profiles?.first_name || ''} ${selectedProfile.profiles?.last_name || ''}`.trim();
                    const date = selectedProfile.financial_summary_generated_at 
                      ? new Date(selectedProfile.financial_summary_generated_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })
                      : new Date().toLocaleDateString('fr-FR');
                    
                    // Convert markdown to simple HTML
                    const htmlContent = selectedProfile.financial_summary
                      .replace(/## (.+)/g, '<h2 style="font-size: 18px; font-weight: bold; margin-top: 20px; margin-bottom: 10px;">$1</h2>')
                      .replace(/### (.+)/g, '<h3 style="font-size: 16px; font-weight: 600; margin-top: 16px; margin-bottom: 8px;">$1</h3>')
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.+?)\*/g, '<em>$1</em>')
                      .replace(/^- (.+)$/gm, '<li style="margin-left: 20px;">$1</li>')
                      .replace(/\n/g, '<br/>');

                    printWindow.document.write(`
                      <!DOCTYPE html>
                      <html>
                      <head>
                        <title>Synthèse financière - ${userName}</title>
                        <style>
                          body {
                            font-family: Arial, sans-serif;
                            max-width: 800px;
                            margin: 40px auto;
                            padding: 20px;
                            line-height: 1.6;
                            color: #333;
                          }
                          h1 {
                            color: #1a1a1a;
                            border-bottom: 2px solid #3b82f6;
                            padding-bottom: 10px;
                          }
                          .date {
                            color: #666;
                            font-size: 14px;
                            margin-bottom: 20px;
                          }
                          @media print {
                            body { margin: 20px; }
                          }
                        </style>
                      </head>
                      <body>
                        <h1>Synthèse financière - ${userName}</h1>
                        <p class="date">Générée le ${date}</p>
                        <div>${htmlContent}</div>
                      </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                  }
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
