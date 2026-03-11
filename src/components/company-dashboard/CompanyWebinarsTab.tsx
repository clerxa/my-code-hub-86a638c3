import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Video, TrendingUp, Clock, BookOpen, Calendar, ArrowRight, Loader2, Star } from "lucide-react";
import { format, isPast } from "date-fns";
import { fr } from "date-fns/locale";
import { WebinarCatalogTab } from "./WebinarCatalogTab";

interface CompanyWebinarsTabProps {
  companyId: string;
}

interface WebinarSession {
  id: string;
  session_date: string;
  registration_url: string | null;
}

interface WebinarItem {
  module_id: number;
  module_title: string;
  module_duration: string | null;
  category: "parcours_fincare" | "a_la_demande";
  // If session selected
  selected_session_date: string | null;
  selected_session_url: string | null;
  // Available sessions (for obligatory not yet selected)
  available_sessions: WebinarSession[];
  is_session_locked: boolean;
  is_exclusive: boolean;
}

export function CompanyWebinarsTab({ companyId }: CompanyWebinarsTabProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [webinars, setWebinars] = useState<WebinarItem[]>([]);

  useEffect(() => {
    fetchWebinars();
  }, [companyId]);

  const [companyName, setCompanyName] = useState("");

  const fetchWebinars = async () => {
    setLoading(true);
    try {
      // Fetch in parallel: obligatory webinars, selections, company-specific assignments, company name, and total companies count
      const [obligatoryResult, selectionsResult, companyWebinarsResult, companyResult, { count: totalCompanies }] = await Promise.all([
        supabase
          .from("modules")
          .select("id, title, duration, webinar_category")
          .eq("type", "webinar")
          .eq("webinar_category", "parcours_fincare"),
        supabase
          .from("company_webinar_selections")
          .select(`
            module_id,
            created_at,
            modules(id, title, duration, webinar_category),
            webinar_sessions(id, session_date, registration_url)
          `)
          .eq("company_id", companyId),
        supabase
          .from("company_webinars")
          .select("module_id, company_id"),
        supabase
          .from("companies")
          .select("name")
          .eq("id", companyId)
          .single(),
        supabase
          .from("companies")
          .select("id", { count: "exact", head: true }),
      ]);

      if (obligatoryResult.error) throw obligatoryResult.error;
      if (selectionsResult.error) throw selectionsResult.error;
      if (companyWebinarsResult.error) throw companyWebinarsResult.error;

      if (companyResult.data) setCompanyName(companyResult.data.name);

      const obligatoryModules = obligatoryResult.data || [];
      const selections = selectionsResult.data || [];
      const allCompanyWebinars = companyWebinarsResult.data || [];

      // Count how many companies each module is assigned to
      const moduleCompanyCount: Record<number, number> = {};
      allCompanyWebinars.forEach(row => {
        moduleCompanyCount[row.module_id] = (moduleCompanyCount[row.module_id] || 0) + 1;
      });

      // Get module IDs assigned to THIS company
      const thisCompanyModuleIds = allCompanyWebinars
        .filter(row => row.company_id === companyId)
        .map(row => row.module_id);

      // Build a map of selected module_ids
      const selectedModuleIds = new Set(selections.map((s: any) => s.module_id));
      const obligatoryModuleIds = new Set(obligatoryModules.map(m => m.id));

      // Find "à la demande" modules assigned to this company that aren't already selected or obligatory
      const unselectedOnDemandIds = thisCompanyModuleIds.filter(
        id => !selectedModuleIds.has(id) && !obligatoryModuleIds.has(id)
      );

      // Fetch sessions for obligatory modules that are NOT yet selected
      const unselectedObligatoryIds = obligatoryModules
        .filter(m => !selectedModuleIds.has(m.id))
        .map(m => m.id);

      // Fetch unselected module details and sessions in parallel
      const allUnselectedIds = [...unselectedObligatoryIds, ...unselectedOnDemandIds];
      let sessionsByModule: Record<number, WebinarSession[]> = {};
      let onDemandModulesMap: Record<number, { title: string; duration: string | null }> = {};

      const fetchPromises: Promise<any>[] = [];
      if (allUnselectedIds.length > 0) {
        fetchPromises.push(
          supabase
            .from("webinar_sessions")
            .select("id, session_date, registration_url, module_id")
            .in("module_id", allUnselectedIds)
            .order("session_date", { ascending: true })
            .then(({ data }) => {
              (data || []).forEach(s => {
                if (!sessionsByModule[s.module_id]) sessionsByModule[s.module_id] = [];
                sessionsByModule[s.module_id].push({
                  id: s.id,
                  session_date: s.session_date,
                  registration_url: s.registration_url,
                });
              });
            })
        );
      }
      if (unselectedOnDemandIds.length > 0) {
        fetchPromises.push(
          supabase
            .from("modules")
            .select("id, title, duration, webinar_category")
            .in("id", unselectedOnDemandIds)
            .eq("type", "webinar")
            .eq("webinar_category", "a_la_demande")
            .then(({ data }) => {
              (data || []).forEach(m => {
                onDemandModulesMap[m.id] = { title: m.title, duration: m.duration };
              });
            })
        );
      }
      await Promise.all(fetchPromises);

      const items: WebinarItem[] = [];

      // Add obligatory webinars (pre-loaded)
      for (const mod of obligatoryModules) {
        const selection = selections.find((s: any) => s.module_id === mod.id);
        if (selection) {
          items.push({
            module_id: mod.id,
            module_title: mod.title,
            module_duration: mod.duration,
            category: "parcours_fincare",
            selected_session_date: (selection as any).webinar_sessions?.session_date || null,
            selected_session_url: (selection as any).webinar_sessions?.registration_url || null,
            available_sessions: [],
            is_session_locked: true,
            is_exclusive: false,
          });
        } else {
          items.push({
            module_id: mod.id,
            module_title: mod.title,
            module_duration: mod.duration,
            category: "parcours_fincare",
            selected_session_date: null,
            selected_session_url: null,
            available_sessions: sessionsByModule[mod.id] || [],
            is_session_locked: false,
            is_exclusive: false,
          });
        }
      }

      // Add on-demand selected webinars (from selections, not already in obligatory)
      for (const sel of selections) {
        const s = sel as any;
        if (!obligatoryModuleIds.has(s.module_id)) {
          const count = moduleCompanyCount[s.module_id] || 0;
          const isExclusive = count < (totalCompanies || 0);
          items.push({
            module_id: s.module_id,
            module_title: s.modules?.title || "Webinar",
            module_duration: s.modules?.duration || null,
            category: "a_la_demande",
            selected_session_date: s.webinar_sessions?.session_date || null,
            selected_session_url: s.webinar_sessions?.registration_url || null,
            available_sessions: [],
            is_session_locked: true,
            is_exclusive: isExclusive,
          });
        }
      }

      // Add on-demand modules assigned to this company but NOT yet selected
      for (const moduleId of unselectedOnDemandIds) {
        const modInfo = onDemandModulesMap[moduleId];
        if (!modInfo) continue; // Not a valid a_la_demande webinar
        const count = moduleCompanyCount[moduleId] || 0;
        const isExclusive = count < (totalCompanies || 0);
        items.push({
          module_id: moduleId,
          module_title: modInfo.title,
          module_duration: modInfo.duration,
          category: "a_la_demande",
          selected_session_date: null,
          selected_session_url: null,
          available_sessions: sessionsByModule[moduleId] || [],
          is_session_locked: false,
          is_exclusive: isExclusive,
        });
      }

      // Sort: obligatory first, then by date
      items.sort((a, b) => {
        if (a.category !== b.category) return a.category === "parcours_fincare" ? -1 : 1;
        const dateA = a.selected_session_date ? new Date(a.selected_session_date).getTime() : Infinity;
        const dateB = b.selected_session_date ? new Date(b.selected_session_date).getTime() : Infinity;
        return dateA - dateB;
      });

      setWebinars(items);
    } catch (error) {
      console.error("Error fetching webinars:", error);
      setWebinars([]);
    } finally {
      setLoading(false);
    }
  };

  const obligatoryWebinars = webinars.filter(w => w.category === "parcours_fincare");
  const onDemandWebinars = webinars.filter(w => w.category === "a_la_demande");
  const allWithDates = webinars.filter(w => w.selected_session_date);
  const upcomingCount = allWithDates.filter(w => !isPast(new Date(w.selected_session_date!))).length;
  const pastCount = allWithDates.filter(w => isPast(new Date(w.selected_session_date!))).length;
  const pendingCount = webinars.filter(w => !w.is_session_locked).length;

  const renderWebinarRow = (webinar: WebinarItem) => (
    <TableRow key={`${webinar.category}-${webinar.module_id}`}>
      <TableCell>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{webinar.module_title}</span>
            {webinar.category === "parcours_fincare" && (
              <Badge variant="default" className="text-[10px] px-1.5 py-0">
                <Star className="h-2.5 w-2.5 mr-0.5" />
                FinCare
              </Badge>
            )}
          </div>
          {webinar.is_exclusive && (
            <span className="text-xs text-primary font-medium">
              ✨ Webinar exclusif pour {companyName}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell>
        {webinar.selected_session_date ? (
          <span className={isPast(new Date(webinar.selected_session_date)) ? "text-muted-foreground" : ""}>
            {format(new Date(webinar.selected_session_date), "PPP 'à' HH:mm", { locale: fr })}
          </span>
        ) : (
          <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 bg-amber-50">
            Session à choisir
          </Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-3 w-3" />
          {webinar.module_duration || "45 min"}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant={webinar.is_session_locked ? "ghost" : "default"}
            size="sm"
            onClick={() => navigate(`/company/${companyId}/dashboard/webinar/${webinar.module_id}`)}
            className="gap-1 text-xs"
          >
            {webinar.is_session_locked ? "Voir" : "Choisir une date"} <ArrowRight className="h-3 w-3" />
          </Button>
          {webinar.is_session_locked && webinar.selected_session_date && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/company/${companyId}/dashboard/webinar/${webinar.module_id}?step=kit`)}
              className="gap-1 text-xs"
            >
              Générer le kit
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <Tabs defaultValue="my-webinars" className="space-y-6">
      <TabsList>
        <TabsTrigger value="my-webinars" className="gap-2">
          <Video className="h-4 w-4" />
          Mes webinars
        </TabsTrigger>
        <TabsTrigger value="catalog" className="gap-2">
          <BookOpen className="h-4 w-4" />
          Catalogue à la demande
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
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total webinars</CardTitle>
                  <Video className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{webinars.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">À venir</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{upcomingCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Terminés</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pastCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">En attente</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-500">{pendingCount}</div>
                </CardContent>
              </Card>
            </div>

            {/* Parcours FinCare (obligatory) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Webinars du parcours FinCare
                </CardTitle>
                <CardDescription>
                  Ces webinars sont inclus dans votre accompagnement. Choisissez une date de session pour chacun.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {obligatoryWebinars.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Aucun webinar obligatoire configuré pour le moment.
                  </p>
                ) : (
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
                        {obligatoryWebinars.map(renderWebinarRow)}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* On-demand webinars */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Webinars à la demande
                </CardTitle>
                <CardDescription>
                  Webinars supplémentaires que vous avez sélectionnés depuis le catalogue.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {onDemandWebinars.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground space-y-3">
                    <BookOpen className="h-10 w-10 mx-auto opacity-20" />
                    <p className="text-sm">Aucun webinar à la demande sélectionné</p>
                    <p className="text-xs">
                      Rendez-vous dans l'onglet <strong>Catalogue à la demande</strong> pour en ajouter.
                    </p>
                  </div>
                ) : (
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
                        {onDemandWebinars.map(renderWebinarRow)}
                      </TableBody>
                    </Table>
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
