import { useUserSynthesis, UserSynthesisData } from "@/hooks/useUserSynthesis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  User, Wallet, Shield, Brain, BarChart3, Target, TrendingUp,
  CheckCircle2, XCircle, AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface UserSynthesisTableProps {
  userId: string;
}

function formatCurrency(val: number | null | undefined) {
  if (val == null) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(val);
}

function formatDate(val: string | null | undefined) {
  if (!val) return "—";
  try {
    return format(new Date(val), "dd MMM yyyy", { locale: fr });
  } catch {
    return val;
  }
}

function StatusBadge({ complete }: { complete: boolean | null }) {
  if (complete) return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Complet</Badge>;
  return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Incomplet</Badge>;
}

function SectionCard({ icon: Icon, title, children, badge }: { icon: any; title: string; children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            {title}
          </CardTitle>
          {badge}
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value ?? "—"}</span>
    </div>
  );
}

function RiskBadge({ type }: { type: string | null }) {
  if (!type) return <Badge variant="outline">Non défini</Badge>;
  const colors: Record<string, string> = {
    conservateur: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    modéré: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    dynamique: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    agressif: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    équilibré: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  };
  return <Badge className={colors[type.toLowerCase()] || ""}>{type}</Badge>;
}

export function UserSynthesisTable({ userId }: UserSynthesisTableProps) {
  const { data, loading, error } = useUserSynthesis(userId);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-destructive">
          Erreur lors du chargement : {error}
        </CardContent>
      </Card>
    );
  }

  if (!data || !data.profile) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Aucune donnée trouvée pour cet utilisateur.
        </CardContent>
      </Card>
    );
  }

  const { profile, financialProfile, riskProfile, diagnostic, simulations, horizon } = data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-full bg-primary/10">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">
            {profile.first_name} {profile.last_name}
          </h3>
          <p className="text-sm text-muted-foreground">{profile.email}</p>
        </div>
        {profile.company_name && (
          <Badge variant="outline" className="ml-auto">{profile.company_name}</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Profil de base */}
        <SectionCard icon={User} title="Profil">
          <DataRow label="Inscription" value={formatDate(profile.created_at)} />
          <DataRow label="Dernière connexion" value={formatDate(profile.last_login)} />
          <DataRow label="Points" value={profile.total_points} />
          <DataRow label="Modules validés" value={profile.completed_modules.length} />
        </SectionCard>

        {/* Profil financier */}
        <SectionCard
          icon={Wallet}
          title="Profil financier"
          badge={<StatusBadge complete={financialProfile?.is_complete ?? false} />}
        >
          {financialProfile ? (
            <>
              <DataRow label="Revenu mensuel net" value={formatCurrency(financialProfile.revenu_mensuel_net)} />
              <DataRow label="Revenu fiscal annuel" value={formatCurrency(financialProfile.revenu_fiscal_annuel)} />
              <DataRow label="Situation" value={financialProfile.situation_familiale} />
              <DataRow label="Enfants" value={financialProfile.nb_enfants} />
              <DataRow label="TMI" value={financialProfile.tmi ? `${financialProfile.tmi}%` : "—"} />
              <DataRow label="Épargne mensuelle" value={formatCurrency(financialProfile.capacite_epargne_mensuelle)} />
              <DataRow label="Patrimoine total" value={formatCurrency(financialProfile.patrimoine_total)} />
            </>
          ) : (
            <p className="text-xs text-muted-foreground py-2">Non renseigné</p>
          )}
        </SectionCard>

        {/* Profil de risque + Diagnostic */}
        <SectionCard icon={Shield} title="Profil de risque & Connaissances">
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Profil de risque</p>
              {riskProfile ? (
                <div className="flex items-center gap-2">
                  <RiskBadge type={riskProfile.profile_type} />
                  <span className="text-xs text-muted-foreground">
                    (score: {riskProfile.total_weighted_score})
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Non complété</p>
              )}
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Diagnostic financier</p>
              {diagnostic ? (
                <div className="flex items-center gap-2">
                  <Badge variant={diagnostic.score_percent && diagnostic.score_percent >= 50 ? "default" : "secondary"}>
                    <Brain className="h-3 w-3 mr-1" />
                    {diagnostic.score_percent != null ? `${Math.round(diagnostic.score_percent)}%` : "—"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(diagnostic.completed_at)}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Non complété</p>
              )}
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Simulations */}
      <SectionCard icon={BarChart3} title={`Simulations (${simulations.length} type${simulations.length > 1 ? "s" : ""})`}>
        {simulations.length > 0 ? (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Simulateur</TableHead>
                  <TableHead className="text-xs">Nom</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs">Données clés</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {simulations.map((sim) => (
                  <TableRow key={sim.id}>
                    <TableCell>
                      <Badge variant="outline" className="text-xs whitespace-nowrap">{sim.label}</Badge>
                    </TableCell>
                    <TableCell className="text-xs font-medium">{sim.nom_simulation}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(sim.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(sim.key_values)
                          .filter(([, v]) => v != null)
                          .map(([k, v]) => (
                            <span key={k} className="inline-flex items-center text-[10px] bg-muted px-1.5 py-0.5 rounded">
                              <span className="text-muted-foreground mr-1">{k}:</span>
                              <span className="font-medium">
                                {typeof v === "number" ? formatCurrency(v) : v}
                              </span>
                            </span>
                          ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-2">Aucune simulation réalisée</p>
        )}
      </SectionCard>

      {/* Horizon */}
      {horizon && (
        <SectionCard icon={Target} title={`Horizon (${horizon.projects_count} projet${horizon.projects_count > 1 ? "s" : ""})`}>
          <div className="space-y-3">
            <div className="flex gap-4">
              <DataRow label="Capital initial" value={formatCurrency(horizon.total_initial_capital)} />
              <DataRow label="Épargne mensuelle" value={formatCurrency(horizon.total_monthly_savings)} />
            </div>
            {horizon.projects.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Projet</TableHead>
                    <TableHead className="text-xs">Objectif</TableHead>
                    <TableHead className="text-xs">Apport</TableHead>
                    <TableHead className="text-xs">Mensuel</TableHead>
                    <TableHead className="text-xs">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {horizon.projects.map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-medium">{p.name}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(p.target_amount)}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(p.apport)}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(p.monthly_allocation)}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === "active" ? "default" : "secondary"} className="text-[10px]">
                          {p.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
