import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { FileText, Clock, CheckCircle, XCircle, ArrowRight, Edit, Gift, Sparkles, Users, Calendar, Video } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface TaxRequest {
  id: string;
  status: string;
  submitted_at: string;
  type_rdv: string;
  modified_at?: string;
  modification_count?: number;
}

interface TaxAppointment {
  id: string;
  meeting_start_time: string | null;
  meeting_end_time: string | null;
  host_name: string | null;
}

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
  in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: FileText },
  completed: { label: 'Terminé', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
  cancelled: { label: 'Annulé', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
};

export function MyTaxDeclarationsBlock() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<TaxRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState<{ current: number; max: number } | null>(null);
  const [taxAppointment, setTaxAppointment] = useState<TaxAppointment | null>(null);

  useEffect(() => {
    if (user) {
      checkAccessAndFetch();
    }
  }, [user]);

  const checkAccessAndFetch = async () => {
    if (!user) return;

    // Get user's company
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.company_id) {
      setLoading(false);
      return;
    }

    // Check if company has feature enabled and get quota
    const { data: company } = await supabase
      .from("companies")
      .select("tax_declaration_help_enabled, max_tax_declarations")
      .eq("id", profile.company_id)
      .maybeSingle();

    const taxEnabled = (company as any)?.tax_declaration_help_enabled || false;
    setHasAccess(taxEnabled);

    if (taxEnabled) {
      // Get quota info
      const maxDeclarations = (company as any)?.max_tax_declarations || 100;
      const { count } = await supabase
        .from("tax_declaration_requests")
        .select("id", { count: 'exact', head: true })
        .eq("company_id", profile.company_id);
      
      setQuotaInfo({ current: count || 0, max: maxDeclarations });

      // Fetch user's requests
      const { data } = await supabase
        .from("tax_declaration_requests")
        .select("id, status, submitted_at, type_rdv, modified_at, modification_count")
        .eq("user_id", user.id)
        .order("submitted_at", { ascending: false })
        .limit(1);

      setRequests((data || []) as unknown as TaxRequest[]);

      // Fetch tax declaration appointment from HubSpot
      // Look for appointments with booking_source containing 'tax' OR the generic expert booking sources
      const { data: aptData } = await supabase
        .from("hubspot_appointments")
        .select("id, meeting_start_time, meeting_end_time, host_name, booking_source")
        .eq("user_id", user.id)
        .order("meeting_start_time", { ascending: false });

      // Filter for tax-related appointments (tax_declaration_help or fallback to any appointment if user has tax request)
      let taxApt: TaxAppointment | null = null;
      if (aptData && aptData.length > 0) {
        // Priority 1: Look for explicit tax_declaration_help source
        const taxSpecific = aptData.find((a: any) => a.booking_source === 'tax_declaration_help');
        if (taxSpecific) {
          taxApt = taxSpecific as TaxAppointment;
        } else {
          // Priority 2: If user has a tax request, show their most recent upcoming appointment
          const upcoming = aptData.find((a: any) => a.meeting_start_time && new Date(a.meeting_start_time) > new Date());
          if (upcoming) {
            taxApt = upcoming as TaxAppointment;
          }
        }
      }
      setTaxAppointment(taxApt);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess) {
    return null;
  }

  const userHasRequest = requests.length > 0;
  const userRequest = requests[0];
  const quotaReached = quotaInfo ? quotaInfo.current >= quotaInfo.max : false;

  const quotaPercentage = quotaInfo ? Math.round((quotaInfo.current / quotaInfo.max) * 100) : 0;

  return (
    <Card className="overflow-hidden">
      {/* Exclusive Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-1.5 border-b flex items-center gap-2">
        <Gift className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium text-primary">
          Service exclusif & gratuit
        </span>
        <Badge variant="outline" className="ml-auto text-[10px] border-primary/30 text-primary py-0">
          <Sparkles className="h-2.5 w-2.5 mr-1" />
          Limité
        </Badge>
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Aide à la déclaration fiscale</h3>
          </div>
          {userHasRequest && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigate("/tax-declaration-help")}>
              <Edit className="h-3 w-3 mr-1" />
              Modifier
            </Button>
          )}
        </div>

        {/* Quota Progress Bar */}
        {quotaInfo && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{quotaInfo.current} / {quotaInfo.max} places utilisées</span>
              <span>{quotaPercentage}%</span>
            </div>
            <Progress value={quotaPercentage} className="h-2" />
          </div>
        )}

        {userHasRequest && userRequest ? (
          <div className="space-y-2">
            {(() => {
              const statusConfig = STATUS_CONFIG[userRequest.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              
              return (
                <div className="flex items-center justify-between p-2.5 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <StatusIcon className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-xs">
                        Demande du {format(new Date(userRequest.submitted_at), "dd MMM yyyy", { locale: fr })}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {userRequest.type_rdv === 'visio' ? 'Visio' : 
                         userRequest.type_rdv === 'bureaux_perlib' ? 'Bureaux Perlib' : 
                         userRequest.type_rdv === 'bureaux_entreprise' ? 'Bureaux entreprise' : '-'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`${statusConfig.color} text-[10px]`}>
                    {statusConfig.label}
                  </Badge>
                </div>
              );
            })()}

            {/* Appointment info */}
            {taxAppointment && taxAppointment.meeting_start_time && (
              <div className="p-2.5 border rounded-lg bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <div className="flex-1">
                    <p className="font-medium text-xs text-green-800 dark:text-green-200">
                      RDV le {format(new Date(taxAppointment.meeting_start_time), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                    {taxAppointment.host_name && (
                      <p className="text-[11px] text-green-600 dark:text-green-400">
                        Avec {taxAppointment.host_name}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : quotaReached ? (
          <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20 rounded-lg p-2.5">
            Quota atteint. Contactez votre service RH pour plus d'informations.
          </p>
        ) : (
          <div className="flex items-center justify-between py-1">
            <p className="text-xs text-muted-foreground">Aucune demande pour le moment</p>
            <Button 
              size="sm"
              variant="outline" 
              className="h-7 text-xs"
              onClick={() => navigate("/tax-declaration-help")}
            >
              Faire ma demande
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
