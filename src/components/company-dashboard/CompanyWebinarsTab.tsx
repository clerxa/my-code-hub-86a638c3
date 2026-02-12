import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Users, TrendingUp, Video, Clock } from "lucide-react";
import { format, isPast } from "date-fns";
import { fr } from "date-fns/locale";

interface CompanyWebinarsTabProps {
  companyId: string;
}

interface CompanyWebinar {
  id: number;
  title: string;
  webinar_date: string | null;
  duration: string | null;
  total_registrations: number;
  internal_registrations: number;
  external_registrations: number;
  total_participants: number;
}

export function CompanyWebinarsTab({ companyId }: CompanyWebinarsTabProps) {
  const [loading, setLoading] = useState(true);
  const [webinars, setWebinars] = useState<CompanyWebinar[]>([]);

  useEffect(() => {
    fetchCompanyWebinars();
  }, [companyId]);

  const fetchCompanyWebinars = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("get-company-webinars", {
        body: { company_id: companyId },
      });

      if (error) {
        throw error;
      }

      const webinarsData = (data as any)?.webinars as CompanyWebinar[] | undefined;
      setWebinars(webinarsData || []);
    } catch (error) {
      console.error("Error fetching company webinars:", error);
      setWebinars([]);
    } finally {
      setLoading(false);
    }
  };

  const getParticipationRate = (registered: number, participated: number) => {
    if (registered === 0) return 0;
    return Math.round((participated / registered) * 100);
  };

  const totalStats = {
    totalWebinars: webinars.length,
    upcomingWebinars: webinars.filter(
      (w) => w.webinar_date && !isPast(new Date(w.webinar_date))
    ).length,
    totalRegistrations: webinars.reduce((sum, w) => sum + w.total_registrations, 0),
    totalParticipants: webinars.reduce((sum, w) => sum + w.total_participants, 0),
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Webinars</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalWebinars}</div>
            <p className="text-xs text-muted-foreground">
              {totalStats.upcomingWebinars} à venir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inscrits</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">Sur tous les webinars</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalParticipants}</div>
            <p className="text-xs text-muted-foreground">Ont participé</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de participation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getParticipationRate(totalStats.totalRegistrations, totalStats.totalParticipants)}%
            </div>
            <p className="text-xs text-muted-foreground">Moyenne</p>
          </CardContent>
        </Card>
      </div>

      {/* Webinars Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-primary" />
            Webinars de l'entreprise
          </CardTitle>
          <CardDescription>
            {webinars.length} webinar(s) associé(s) à votre entreprise
          </CardDescription>
        </CardHeader>
        <CardContent>
          {webinars.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Aucun webinar associé à cette entreprise</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Webinar</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Inscrits</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Taux</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {webinars.map((webinar) => {
                    const isUpcoming = webinar.webinar_date && !isPast(new Date(webinar.webinar_date));
                    const rate = getParticipationRate(
                      webinar.total_registrations,
                      webinar.total_participants
                    );

                    return (
                      <TableRow key={webinar.id}>
                        <TableCell className="font-medium">{webinar.title}</TableCell>
                        <TableCell>
                          {webinar.webinar_date
                            ? format(new Date(webinar.webinar_date), "PPp", { locale: fr })
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {webinar.duration ? (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {webinar.duration}
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-0.5">
                            <Badge variant="secondary">{webinar.total_registrations}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {webinar.internal_registrations} membres, {webinar.external_registrations} externes
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">{webinar.total_participants}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={rate >= 50 ? "default" : "outline"}>{rate}%</Badge>
                        </TableCell>
                        <TableCell>
                          {isUpcoming ? (
                            <Badge className="bg-blue-500">À venir</Badge>
                          ) : (
                            <Badge variant="outline">Passé</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
