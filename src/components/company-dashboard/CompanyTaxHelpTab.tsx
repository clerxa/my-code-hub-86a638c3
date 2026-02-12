import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Calendar, Clock, CheckCircle2 } from "lucide-react";

interface CompanyTaxHelpTabProps {
  companyId: string;
}

interface TaxHelpStats {
  totalRequests: number;
  requestsWithAppointment: number;
  confirmedAppointments: number;
  remainingQuota: number;
  maxDeclarations: number;
}

export function CompanyTaxHelpTab({ companyId }: CompanyTaxHelpTabProps) {
  const [stats, setStats] = useState<TaxHelpStats>({
    totalRequests: 0,
    requestsWithAppointment: 0,
    confirmedAppointments: 0,
    remainingQuota: 0,
    maxDeclarations: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get company max declarations quota
        const { data: company } = await supabase
          .from("companies")
          .select("max_tax_declarations")
          .eq("id", companyId)
          .single();

        const maxDeclarations = company?.max_tax_declarations || 0;

        // Get all requests for this company
        const { data: requests } = await supabase
          .from("tax_declaration_requests")
          .select(`
            id,
            type_rdv,
            company_id
          `)
          .eq("company_id", companyId);

        const totalRequests = requests?.length || 0;
        const requestsWithAppointment = requests?.filter(
          (r) => r.type_rdv && r.type_rdv !== ""
        ).length || 0;

        // Get confirmed appointments from HubSpot
        const { data: confirmedApts } = await supabase
          .from("hubspot_appointments")
          .select("id")
          .eq("company_id", companyId)
          .eq("booking_source", "tax_declaration_help");

        const confirmedAppointments = confirmedApts?.length || 0;

        setStats({
          totalRequests,
          requestsWithAppointment,
          confirmedAppointments,
          remainingQuota: Math.max(0, maxDeclarations - totalRequests),
          maxDeclarations,
        });
      } catch (error) {
        console.error("Error fetching tax help stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [companyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  const statCards = [
    {
      title: "Demandes réalisées",
      value: stats.totalRequests,
      subtitle: `sur ${stats.maxDeclarations} autorisées`,
      icon: FileText,
      gradient: "from-blue-500/20 to-blue-600/20",
      iconColor: "text-blue-600",
    },
    {
      title: "Avec rendez-vous pris",
      value: stats.requestsWithAppointment,
      subtitle: `${stats.totalRequests > 0 ? Math.round((stats.requestsWithAppointment / stats.totalRequests) * 100) : 0}% des demandes`,
      icon: Calendar,
      gradient: "from-amber-500/20 to-amber-600/20",
      iconColor: "text-amber-600",
    },
    {
      title: "RDV confirmés (HubSpot)",
      value: stats.confirmedAppointments,
      subtitle: "retour HubSpot reçu",
      icon: CheckCircle2,
      gradient: "from-green-500/20 to-green-600/20",
      iconColor: "text-green-600",
    },
    {
      title: "Places restantes",
      value: stats.remainingQuota,
      subtitle: stats.remainingQuota === 0 ? "Quota atteint" : "disponibles",
      icon: Clock,
      gradient: stats.remainingQuota === 0 
        ? "from-red-500/20 to-red-600/20" 
        : "from-purple-500/20 to-purple-600/20",
      iconColor: stats.remainingQuota === 0 ? "text-red-600" : "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Aide à la Déclaration des Revenus</h2>
        <p className="text-muted-foreground">
          Suivi des demandes d'aide fiscale de vos collaborateurs
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title} className="relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-50`} />
            <CardHeader className="relative flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className={`h-5 w-5 ${card.iconColor}`} />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-3xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Utilisation du quota</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{stats.totalRequests} demandes</span>
              <span>{stats.maxDeclarations} maximum</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  stats.maxDeclarations > 0 && stats.totalRequests >= stats.maxDeclarations
                    ? "bg-red-500"
                    : stats.maxDeclarations > 0 && stats.totalRequests >= stats.maxDeclarations * 0.8
                    ? "bg-amber-500"
                    : "bg-primary"
                }`}
                style={{
                  width: `${stats.maxDeclarations > 0 ? Math.min(100, (stats.totalRequests / stats.maxDeclarations) * 100) : 0}%`,
                }}
              />
            </div>
            {stats.maxDeclarations > 0 && stats.totalRequests >= stats.maxDeclarations * 0.8 && (
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ Le quota est presque atteint
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
