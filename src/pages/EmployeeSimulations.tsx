import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calculator, FolderOpen, Gift, Building2, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { CategorySection } from "@/components/simulators/CategorySection";
import { UnifiedSimulationsTable } from "@/components/UnifiedSimulationsTable";
import { useAuth } from "@/components/AuthProvider";
import { useNonPartnerSettings } from "@/hooks/useNonPartnerSettings";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  order_num: number;
}

interface Simulator {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  route: string;
  feature_key: string | null;
  duration_minutes: number;
  order_num: number;
  visibility_status?: 'visible' | 'disabled' | 'hidden';
}

export default function EmployeeSimulations() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { data: nonPartnerSettings } = useNonPartnerSettings();
  
  // Lire l'onglet depuis l'URL (par défaut: simulateurs)
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(tabFromUrl === 'historique' ? 'historique' : 'simulateurs');
  
  // Sync URL avec l'onglet actif
  useEffect(() => {
    if (tabFromUrl === 'historique' && activeTab !== 'historique') {
      setActiveTab('historique');
    }
  }, [tabFromUrl]);
  
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'historique') {
      setSearchParams({ tab: 'historique' });
    } else {
      setSearchParams({});
    }
  };

  // Fetch categories
  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['simulator-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulator_categories')
        .select('*')
        .eq('is_active', true)
        .order('order_num');
      if (error) throw error;
      return data as Category[];
    },
  });

  // Fetch simulators
  const { data: simulators, isLoading: isLoadingSimulators } = useQuery({
    queryKey: ['simulators'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulators')
        .select('*')
        .eq('is_active', true)
        .eq('vega_eligible', false)
        .order('order_num');
      if (error) throw error;
      return data as Simulator[];
    },
  });

  // Check partnership status
  const { data: hasPartnership } = useQuery({
    queryKey: ['user_partnership_status'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (!profile?.company_id) return false;
      
      const { data: company } = await supabase
        .from('companies')
        .select('partnership_type')
        .eq('id', profile.company_id)
        .maybeSingle();
      
      // "Aucun", null, empty string = no partnership
      const partnershipType = company?.partnership_type?.toLowerCase()?.trim();
      return !!partnershipType && partnershipType !== 'aucun';
    }
  });

  // Fetch total simulations count from unified table
  const { data: simulationsCount = 0 } = useQuery({
    queryKey: ['simulations-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('simulations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  // Fetch simulations count per type
  const { data: simulationCountsByType = {} } = useQuery({
    queryKey: ['simulations-count-by-type', user?.id],
    queryFn: async () => {
      if (!user) return {};
      const { data, error } = await supabase
        .from('simulations')
        .select('type')
        .eq('user_id', user.id);
      if (error) throw error;
      
      // Count by type
      const counts: Record<string, number> = {};
      data?.forEach((sim) => {
        counts[sim.type] = (counts[sim.type] || 0) + 1;
      });
      return counts;
    },
    enabled: !!user,
  });

  // Group simulators by category
  const getSimulatorsForCategory = (categoryId: string) => {
    return simulators?.filter(s => s.category_id === categoryId) || [];
  };

  return (
    <EmployeeLayout activeSection="simulations">
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            <span className="hero-gradient">Simulateurs Financiers</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Optimisez votre situation financière avec nos outils de simulation personnalisés
          </p>
        </div>

        {/* Non-Partner Banner */}
        {hasPartnership === false && (
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/20 rounded-xl p-5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">
                    {nonPartnerSettings?.max_simulations || 10} simulations offertes
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Vous bénéficiez de simulations gratuites pour découvrir nos outils. Pour un accès illimité, 
                    votre entreprise peut devenir partenaire officielle de MyFinCare.
                  </p>
                  <p className="text-xs text-primary font-medium flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Le partenariat est entièrement gratuit
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => navigate('/proposer-partenariat')}
                className="shrink-0 gap-2"
              >
                Proposer le partenariat
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="flex justify-center mb-8">
            <TabsList className="inline-flex h-11 bg-muted/50 backdrop-blur-sm p-1 rounded-xl">
              <TabsTrigger 
                value="simulateurs" 
                className="gap-2 px-6 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">Simulateurs</span>
              </TabsTrigger>
              <TabsTrigger 
                value="historique" 
                className="gap-2 px-6 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <FolderOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Historique</span>
                {simulationsCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5 text-xs">
                    {simulationsCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ONGLET 1: Simulateurs disponibles par catégorie */}
          <TabsContent value="simulateurs" className="space-y-8">
            {isLoadingCategories || isLoadingSimulators ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Chargement des simulateurs...</p>
                </CardContent>
              </Card>
            ) : categories && categories.length > 0 ? (
              categories.map((category) => (
                <CategorySection
                  key={category.id}
                  name={category.name}
                  description={category.description}
                  icon={category.icon}
                  simulators={getSimulatorsForCategory(category.id)}
                  simulationCounts={simulationCountsByType}
                />
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Aucun simulateur disponible</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ONGLET 2: Historique des simulations - Table unifiée */}
          <TabsContent value="historique" className="space-y-4">
            {!user ? (
              <Card>
                <CardContent className="py-12 text-center space-y-4">
                  <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Connectez-vous pour voir vos simulations</p>
                  </div>
                </CardContent>
              </Card>
            ) : simulationsCount === 0 ? (
              <Card>
                <CardContent className="py-12 text-center space-y-4">
                  <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">Aucune simulation enregistrée</p>
                    <p className="text-muted-foreground">
                      Commencez par créer votre première simulation
                    </p>
                  </div>
                  {hasPartnership && (
                    <Button onClick={() => setActiveTab("simulateurs")}>
                      Réaliser ma première simulation
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Historique des simulations ({simulationsCount})</CardTitle>
                  <CardDescription>
                    Retrouvez toutes vos simulations enregistrées
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <UnifiedSimulationsTable userId={user.id} />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </EmployeeLayout>
  );
}
