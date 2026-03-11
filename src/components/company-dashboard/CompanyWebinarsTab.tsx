import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, Video, Clock, BookOpen, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { format, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { WebinarCatalogTab } from "./WebinarCatalogTab";

interface CompanyWebinarsTabProps {
  companyId: string;
}

interface SelectedWebinar {
  module_id: number;
  module_title: string;
  module_duration: string | null;
  session_date: string;
  session_registration_url: string | null;
  selected_at: string;
}

export function CompanyWebinarsTab({ companyId }: CompanyWebinarsTabProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedWebinars, setSelectedWebinars] = useState<SelectedWebinar[]>([]);

  useEffect(() => {
    fetchSelectedWebinars();
  }, [companyId]);

  const fetchSelectedWebinars = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("company_webinar_selections")
        .select(`
          module_id,
          created_at,
          modules(id, title, duration),
          webinar_sessions(id, session_date, registration_url)
        `)
        .eq("company_id", companyId);

      if (error) throw error;

      const webinars: SelectedWebinar[] = (data || []).map((row: any) => ({
        module_id: row.module_id,
        module_title: row.modules?.title || "Webinar",
        module_duration: row.modules?.duration || null,
        session_date: row.webinar_sessions?.session_date || "",
        session_registration_url: row.webinar_sessions?.registration_url || null,
        selected_at: row.created_at,
      }));

      // Sort: upcoming first, then past
      webinars.sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime());

      setSelectedWebinars(webinars);
    } catch (error) {
      console.error("Error fetching selected webinars:", error);
      setSelectedWebinars([]);
    } finally {
      setLoading(false);
    }
  };

  const upcomingWebinars = selectedWebinars.filter(w => w.session_date && !isPast(new Date(w.session_date)));
  const pastWebinars = selectedWebinars.filter(w => !w.session_date || isPast(new Date(w.session_date)));

  return (
    <Tabs defaultValue="my-webinars" className="space-y-6">
      <TabsList>
        <TabsTrigger value="my-webinars" className="gap-2">
          <Video className="h-4 w-4" />
          Mes webinars
        </TabsTrigger>
        <TabsTrigger value="catalog" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Catalogue
        </TabsTrigger>
      </TabsList>

      <TabsContent value="my-webinars" className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Webinars sélectionnés</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{selectedWebinars.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">À venir</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{upcomingWebinars.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Terminés</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pastWebinars.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Webinars List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Mes webinars sélectionnés
                </CardTitle>
                <CardDescription>
                  Sessions choisies pour votre entreprise
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedWebinars.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground space-y-4">
                    <Video className="h-12 w-12 mx-auto opacity-20" />
                    <p>Vous n'avez pas encore sélectionné de webinar</p>
                    <p className="text-xs">
                      Rendez-vous dans le <strong>Catalogue</strong> pour découvrir les webinars disponibles et choisir une date.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Upcoming webinars */}
                    {upcomingWebinars.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                            Prochains webinars
                          </h3>
                          <Badge variant="secondary" className="text-xs">
                            {upcomingWebinars.length}
                          </Badge>
                        </div>
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Webinar</TableHead>
                                <TableHead>Date de session</TableHead>
                                <TableHead>Durée</TableHead>
                                <TableHead></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {upcomingWebinars.map((webinar) => (
                                <TableRow key={webinar.module_id}>
                                  <TableCell className="font-medium">{webinar.module_title}</TableCell>
                                  <TableCell>
                                    {format(new Date(webinar.session_date), "PPP 'à' HH:mm", { locale: fr })}
                                  </TableCell>
                                  <TableCell>
                                    {webinar.module_duration ? (
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {webinar.module_duration}
                                      </div>
                                    ) : "-"}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => navigate(`/company/${companyId}/dashboard/webinar/${webinar.module_id}`)}
                                      className="gap-1 text-xs"
                                    >
                                      Voir <ArrowRight className="h-3 w-3" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Separator */}
                    {upcomingWebinars.length > 0 && pastWebinars.length > 0 && (
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-card px-2 text-muted-foreground">Terminés</span>
                        </div>
                      </div>
                    )}

                    {/* Past webinars */}
                    {pastWebinars.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                            Webinars passés
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {pastWebinars.length}
                          </Badge>
                        </div>
                        <div className="rounded-md border opacity-80">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Webinar</TableHead>
                                <TableHead>Date de session</TableHead>
                                <TableHead>Durée</TableHead>
                                <TableHead></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pastWebinars.map((webinar) => (
                                <TableRow key={webinar.module_id}>
                                  <TableCell className="font-medium">{webinar.module_title}</TableCell>
                                  <TableCell>
                                    {webinar.session_date
                                      ? format(new Date(webinar.session_date), "PPP 'à' HH:mm", { locale: fr })
                                      : "-"}
                                  </TableCell>
                                  <TableCell>
                                    {webinar.module_duration ? (
                                      <div className="flex items-center gap-1 text-muted-foreground">
                                        <Clock className="h-3 w-3" />
                                        {webinar.module_duration}
                                      </div>
                                    ) : "-"}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => navigate(`/company/${companyId}/dashboard/webinar/${webinar.module_id}`)}
                                      className="gap-1 text-xs"
                                    >
                                      Voir <ArrowRight className="h-3 w-3" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </TabsContent>

      <TabsContent value="catalog">
        <WebinarCatalogTab companyId={companyId} />
      </TabsContent>
    </Tabs>
  );
}
