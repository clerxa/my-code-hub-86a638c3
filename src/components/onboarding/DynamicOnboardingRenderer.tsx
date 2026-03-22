import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sparkles, TrendingDown, Briefcase, PiggyBank, Target,
  Wallet, CreditCard, Building, Users, Star, Heart,
  Shield, Award, Zap, CheckCircle, ArrowRight, Loader2,
  icons,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OnboardingScreen } from "@/types/onboarding-cms";
import { useAuth } from "@/components/AuthProvider";
interface DynamicOnboardingRendererProps {
  flowId?: string;
}

const ICONS_BY_LOWER: Record<string, any> = Object.fromEntries(
  Object.entries(icons as any).map(([name, Comp]) => [String(name).toLowerCase(), Comp])
);

const ONBOARDING_SESSION_KEY = 'fincare_onboarding_session_id';
const INVITATION_TOKEN_KEY = 'fincare_invitation_token';
const INVITATION_COMPANY_KEY = 'fincare_invitation_company';

export function DynamicOnboardingRenderer({ flowId = 'tax-onboarding' }: DynamicOnboardingRendererProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreviewMode = searchParams.get('preview') === 'true';
  const { user } = useAuth();
  const [screens, setScreens] = useState<OnboardingScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(null);
  const [screenHistory, setScreenHistory] = useState<string[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [estimatedSavings, setEstimatedSavings] = useState(0);
  
  // Use stored session ID from sessionStorage, or generate one
  const [sessionId] = useState(() => {
    const stored = sessionStorage.getItem(ONBOARDING_SESSION_KEY);
    if (stored) return stored;
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(ONBOARDING_SESSION_KEY, newSessionId);
    return newSessionId;
  });

  // Check if user has already completed onboarding (skip in preview mode and invitation links)
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      // Skip check in preview mode
      if (isPreviewMode) return;
      // Skip check if this is an invitation link (public onboarding for a new user)
      if (searchParams.get('invitation')) return;
      if (!user) return;
      
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('employee_onboarding_completed')
          .eq('id', user.id)
          .single();
        
        // If onboarding is already completed, redirect to /employee
        if (profile?.employee_onboarding_completed) {
          navigate('/employee');
          return;
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      }
    };
    
    if (flowId === 'employee-onboarding') {
      checkOnboardingStatus();
    }
  }, [user, flowId, navigate, isPreviewMode, searchParams]);

  useEffect(() => {
    fetchScreens();
  }, [flowId]);

  const fetchScreens = async () => {
    try {
      // Load ALL active screens (not just status: active) to support workflow connections
      const { data, error } = await supabase
        .from('onboarding_screens')
        .select('*')
        .eq('flow_id', flowId)
        .eq('is_active', true)
        .order('order_num');

      if (error) throw error;
      
      const parsedData = (data || []).map(screen => ({
        ...screen,
        options: typeof screen.options === 'string' 
          ? JSON.parse(screen.options) 
          : screen.options || [],
        metadata: typeof screen.metadata === 'string'
          ? JSON.parse(screen.metadata)
          : screen.metadata || {},
        workflow_position: null, // Not needed for rendering
      } as OnboardingScreen));
      
      setScreens(parsedData);
      
      // Set the first screen as current
      if (parsedData.length > 0 && !currentScreenId) {
        setCurrentScreenId(parsedData[0].id);
      }
    } catch (error) {
      console.error('Error fetching screens:', error);
    } finally {
      setLoading(false);
    }
  };

  // Find current screen by ID
  const currentScreen = screens.find(s => s.id === currentScreenId);
  const currentIndex = screens.findIndex(s => s.id === currentScreenId);
  
  // Calculate progress based on actual steps taken in the workflow (history + current)
  // We estimate total steps by counting screens that are reachable from the current path
  const stepsCompleted = screenHistory.length;
  // Estimate remaining steps by counting forward connections from current screen
  const estimateTotalSteps = useMemo(() => {
    if (!currentScreen) return 1;
    
    let count = stepsCompleted + 1; // Current step
    let nextId = currentScreen.next_step_id;
    const visited = new Set<string>([currentScreenId || '']);
    
    // Follow the default path to estimate total
    while (nextId && !visited.has(nextId)) {
      visited.add(nextId);
      count++;
      const nextScreen = screens.find(s => s.id === nextId);
      nextId = nextScreen?.next_step_id || null;
    }
    
    return Math.max(count, stepsCompleted + 1);
  }, [currentScreen, screens, stepsCompleted, currentScreenId]);
  
  const progress = ((stepsCompleted + 1) / estimateTotalSteps) * 100;

  // Navigate to a specific screen by ID
  const goToScreen = (screenId: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentScreenId(screenId);
      setIsTransitioning(false);
    }, 200);
  };

  // Get the next screen ID based on workflow connections
  const getNextScreenId = (selectedValue?: any): string | null => {
    if (!currentScreen) return null;

    // 1) Option-level branching (visible links on options)
    if (selectedValue !== undefined && currentScreen.options) {
      const selectedOption = currentScreen.options.find((o) => o.value === selectedValue);
      if (selectedOption?.nextStepId) {
        return selectedOption.nextStepId;
      }
    }

    // 2) Rule-based transitions (metadata.transitionConditions) — same logic as the admin simulator
    const transitionConditions = currentScreen.metadata?.transitionConditions;
    if (transitionConditions && Array.isArray(transitionConditions) && transitionConditions.length > 0) {
      const currentValue = selectedValue;
      const sortedConditions = [...transitionConditions].sort(
        (a: any, b: any) => (a.priority || 0) - (b.priority || 0)
      );

      for (const condition of sortedConditions) {
        let matches = false;

        // Numeric range
        if (condition.minValue !== undefined || condition.maxValue !== undefined) {
          const numValue = typeof currentValue === "number" ? currentValue : parseFloat(currentValue);
          if (!Number.isNaN(numValue)) {
            const minOk = condition.minValue === undefined || numValue >= condition.minValue;
            const maxOk = condition.maxValue === undefined || numValue <= condition.maxValue;
            matches = minOk && maxOk;
          }
        }

        // Exact match
        if (condition.exactValue !== undefined) {
          matches = currentValue === condition.exactValue;
        }

        // Contains (string)
        if (condition.containsValue !== undefined && typeof currentValue === "string") {
          matches = currentValue.toLowerCase().includes(String(condition.containsValue).toLowerCase());
        }

        if (matches && condition.targetScreenId) {
          return condition.targetScreenId;
        }
      }
    }

    // 3) Screen-level default connection (visible link from the screen)
    if (currentScreen.next_step_id) {
      return currentScreen.next_step_id;
    }

    // IMPORTANT: no implicit fallback by order — if there's no visual link, we don't route.
    return null;
  };

  const saveResponse = async (screenId: string, value: any, leadRank?: number) => {
    try {
      await supabase.from('onboarding_responses').insert({
        user_id: user?.id || null,
        session_id: sessionId,
        flow_id: flowId,
        screen_id: screenId,
        response_value: value,
        lead_rank: leadRank,
      });
    } catch (error) {
      console.error('Error saving response:', error);
    }
  };

  const handleNext = () => {
    if (!currentScreen) return;

    // Save current response
    const currentResponse = responses[currentScreen.id];
    if (currentResponse !== undefined) {
      const selectedOption = currentScreen.options?.find(o => o.value === currentResponse);
      saveResponse(currentScreen.id, currentResponse, selectedOption?.leadRankImpact);
    }

    // Get the next screen based on workflow connections
    const nextScreenId = getNextScreenId(currentResponse);
    
    if (!nextScreenId) {
      // No next screen - this is the end
      handleComplete();
      return;
    }

    const nextScreen = screens.find(s => s.id === nextScreenId);
    if (!nextScreen) {
      console.error('Next screen not found:', nextScreenId);
      return;
    }

    // Save current screen to history for back navigation
    setScreenHistory(prev => [...prev, currentScreen.id]);
    
    if (nextScreen.type === 'CALCULATION_RESULT') {
      goToScreen(nextScreenId);
      setIsCalculating(true);
      setTimeout(() => {
        // Dummy calculation based on responses
        const income = responses.income || 80000;
        const hasShares = responses.company_shares || false;
        const objective = responses.objective;
        const baseSavings = income * 0.08;
        const equityBonus = hasShares ? income * 0.03 : 0;
        const objectiveMultiplier = objective === 'reduce_taxes' ? 1.2 : 1;
        setEstimatedSavings(Math.round((baseSavings + equityBonus) * objectiveMultiplier));
        setIsCalculating(false);
      }, 2000);
    } else {
      goToScreen(nextScreenId);
    }
  };

  const handleBack = () => {
    if (screenHistory.length > 0) {
      const previousScreenId = screenHistory[screenHistory.length - 1];
      setScreenHistory(prev => prev.slice(0, -1));
      goToScreen(previousScreenId);
    }
  };

  const handleComplete = async () => {
    // Check if this is an invitation flow (public onboarding for a new user who happens to be viewing while logged in)
    const isInvitationFlow = !!searchParams.get('invitation') || !!sessionStorage.getItem(INVITATION_TOKEN_KEY);

    // Mark onboarding as completed for employee-onboarding flow (only if user is logged in, NOT in preview mode, and NOT an invitation flow)
    if (flowId === 'employee-onboarding' && user && !isPreviewMode && !isInvitationFlow) {
      try {
        await supabase
          .from('profiles')
          .update({ employee_onboarding_completed: true })
          .eq('id', user.id);
      } catch (error) {
        console.error('Error updating onboarding status:', error);
      }
    }
    
    // Check for external URL first
    const externalUrl = currentScreen?.metadata?.redirectExternalUrl;
    if (externalUrl) {
      // Only trigger CSAT if user is logged in and not invitation flow
      if (user && !isInvitationFlow) {
        triggerCSAT();
      }
      window.open(externalUrl, '_blank');
      return;
    }
    
    // If user is NOT logged in OR this is an invitation flow, navigate directly without CSAT
    if (!user || isInvitationFlow) {
      navigateToDestination();
      return;
    }
    
    navigateToDestination();
  };

  // Helper function to navigate to the final destination
  const navigateToDestination = async () => {
    let internalUrl = currentScreen?.metadata?.redirectInternalUrl || '/login';
    
    // If there are invitation params stored, append them to the signup URL
    const invitationToken = sessionStorage.getItem(INVITATION_TOKEN_KEY);
    const companyId = sessionStorage.getItem(INVITATION_COMPANY_KEY);
    
    if (invitationToken) {
      const params = new URLSearchParams();
      params.set('invitation', invitationToken);
      if (companyId) {
        params.set('company', companyId);
      }
      // Override default URL to signup with invitation params
      internalUrl = `/signup?${params.toString()}`;
    }
    
    // For invitation flows, use hard navigation to avoid auth state conflicts
    // (the current user session would cause /signup to redirect back)
    if (invitationToken && user) {
      // Sign out first, then redirect to signup
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Error signing out before invitation redirect:', e);
      }
      window.location.href = internalUrl;
      return;
    }
    
    // For invitation flows without a user session, also use hard navigation
    if (invitationToken) {
      window.location.href = internalUrl;
      return;
    }
    
    navigate(internalUrl);
  };


  // Format value with unit from metadata
  const formatValue = (value: number, unit?: string) => {
    if (unit === 'EUR' || unit === '€' || !unit) {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(value);
    }
    if (unit === '%') {
      return `${value}%`;
    }
    if (unit === 'ans' || unit === 'années') {
      return `${value} ${unit}`;
    }
    // Default: number with unit suffix
    return `${new Intl.NumberFormat("fr-FR").format(value)} ${unit}`;
  };

  const handleResponse = (screenId: string, value: any, extraKey?: string) => {
    setResponses(prev => {
      const newResponses = { ...prev, [screenId]: value };
      if (extraKey) {
        newResponses[extraKey] = value;
      }
      return newResponses;
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const canProceed = () => {
    if (!currentScreen) return false;
    
    switch (currentScreen.type) {
      case 'WELCOME':
        return true;
      case 'SINGLE_CHOICE':
        return responses[currentScreen.id] !== undefined;
      case 'MULTI_CHOICE':
        return Array.isArray(responses[currentScreen.id]) && responses[currentScreen.id].length > 0;
      case 'SLIDER':
      case 'TOGGLE':
        return true;
      case 'TEXT_INPUT':
        return !!responses[currentScreen.id];
      default:
        return true;
    }
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return Sparkles;
    return ICONS_BY_LOWER[String(iconName).toLowerCase()] || Sparkles;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Aucun écran configuré pour ce flow.</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Retour à l'accueil
          </Button>
        </Card>
      </div>
    );
  }

  const renderScreen = () => {
    const Icon = getIcon(currentScreen.metadata?.icon);
    
    switch (currentScreen.type) {
      case 'WELCOME':
        return (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl p-4 sm:p-6 md:p-8 text-center">
            <div className="mb-4 sm:mb-6">
              <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2 sm:mb-3 px-2">
                {currentScreen.title}
              </h1>
              {currentScreen.subtitle && (
                <p className="text-muted-foreground text-sm sm:text-base md:text-lg px-2">
                  {currentScreen.subtitle}
                </p>
              )}
            </div>
            <Button 
              size="lg" 
              onClick={handleNext}
              className="w-full btn-hero-gradient h-12 sm:h-14 text-base sm:text-lg font-semibold"
            >
              {currentScreen.metadata?.buttonText || 'Commencer'}
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Card>
        );

      case 'SINGLE_CHOICE':
        return (
          <div className="space-y-3 sm:space-y-4">
            <div className="text-center mb-2 sm:mb-4">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-1 px-2 break-words">
                {currentScreen.title}
              </h2>
              {currentScreen.subtitle && (
                <p className="text-muted-foreground text-xs sm:text-sm px-2 break-words">
                  {currentScreen.subtitle}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              {currentScreen.options.map((option) => {
                const OptionIcon = getIcon(option.icon);
                const isSelected = responses[currentScreen.id] === option.value;
                
                return (
                  <Card
                    key={String(option.value)}
                    onClick={() => handleResponse(currentScreen.id, option.value, 'objective')}
                    className={cn(
                      "p-2.5 sm:p-3 md:p-4 cursor-pointer transition-all duration-200 border-2",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-lg"
                        : "border-border bg-card hover:border-primary/50 hover:shadow-md"
                    )}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div
                        className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                        style={{
                          backgroundColor: option.iconBgColor 
                            ? `hsl(${option.iconBgColor})` 
                            : isSelected ? 'hsl(var(--primary))' : 'hsl(var(--muted))'
                        }}
                      >
                        <OptionIcon
                          className="h-4 w-4 sm:h-5 sm:w-5 md:h-5 md:w-5 transition-colors"
                          style={{
                            color: option.iconColor 
                              ? `hsl(${option.iconColor})` 
                              : isSelected ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted-foreground))'
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm sm:text-base md:text-lg break-words">
                          {option.label}
                        </h3>
                        {option.description && (
                          <p className="text-muted-foreground text-xs sm:text-sm break-words">
                            {option.description}
                          </p>
                        )}
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {isSelected && (
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary-foreground rounded-full" />
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-9 sm:h-10 text-sm"
                disabled={screenHistory.length === 0}
              >
                Retour
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 h-9 sm:h-10 btn-hero-gradient text-sm"
              >
                {currentScreen.metadata?.buttonText || 'Continuer'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'MULTI_CHOICE':
        const selectedValues = responses[currentScreen.id] || [];
        
        return (
          <div className="space-y-3 sm:space-y-4">
            <div className="text-center mb-2 sm:mb-4">
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-1 px-2 break-words">
                {currentScreen.title}
              </h2>
              {currentScreen.subtitle && (
                <p className="text-muted-foreground text-xs sm:text-sm px-2 break-words">
                  {currentScreen.subtitle}
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:space-y-2">
              {currentScreen.options.map((option) => {
                const OptionIcon = getIcon(option.icon);
                const isSelected = selectedValues.includes(option.value);
                
                return (
                  <Card
                    key={String(option.value)}
                    onClick={() => {
                      const newValues = isSelected
                        ? selectedValues.filter((v: any) => v !== option.value)
                        : [...selectedValues, option.value];
                      handleResponse(currentScreen.id, newValues);
                    }}
                    className={cn(
                      "p-2.5 sm:p-3 cursor-pointer transition-all duration-200 border-2",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Checkbox checked={isSelected} className="flex-shrink-0" />
                      {option.icon && (
                        <div 
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{
                            backgroundColor: option.iconBgColor 
                              ? `hsl(${option.iconBgColor})` 
                              : 'hsl(var(--muted))'
                          }}
                        >
                          <OptionIcon 
                            className="h-4 w-4 sm:h-5 sm:w-5"
                            style={{
                              color: option.iconColor 
                                ? `hsl(${option.iconColor})` 
                                : 'hsl(var(--muted-foreground))'
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm sm:text-base break-words">{option.label}</span>
                        {option.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground break-words">{option.description}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-9 sm:h-10 text-sm"
              >
                Retour
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 h-9 sm:h-10 btn-hero-gradient text-sm"
              >
                {currentScreen.metadata?.buttonText || 'Continuer'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 'SLIDER':
        const min = currentScreen.metadata?.min || 0;
        const max = currentScreen.metadata?.max || 100;
        const step = currentScreen.metadata?.step || 1;
        const defaultValue = currentScreen.metadata?.defaultValue || min;
        const sliderUnit = currentScreen.metadata?.unit;
        const value = responses[currentScreen.id] ?? defaultValue;
        
        return (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl p-4 sm:p-6 md:p-8">
            <div className="text-center mb-4 sm:mb-6 md:mb-8">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-1 sm:mb-2 px-2">
                {currentScreen.title}
              </h2>
              {currentScreen.subtitle && (
                <p className="text-muted-foreground text-sm sm:text-base px-2">
                  {currentScreen.subtitle}
                </p>
              )}
            </div>

            <div className="space-y-4 sm:space-y-6 md:space-y-8">
              <div className="text-center">
                <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary">
                  {formatValue(value, sliderUnit)}
                </span>
              </div>

              <div className="px-2 sm:px-4">
                <Slider
                  value={[value]}
                  onValueChange={(values) => {
                    handleResponse(currentScreen.id, values[0], 'income');
                  }}
                  min={min}
                  max={max}
                  step={step}
                  className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5 sm:[&_[role=slider]]:h-6 sm:[&_[role=slider]]:w-6 [&_[role=slider]]:border-4 [&_[role=slider]]:border-primary [&_[role=slider]]:bg-background [&>span:first-child]:h-2 sm:[&>span:first-child]:h-3 [&>span:first-child]:bg-muted [&>span:first-child>span]:bg-primary"
                />
                <div className="flex justify-between mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground">
                  <span>{formatValue(min, sliderUnit)}</span>
                  <span>{formatValue(max, sliderUnit)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 pt-4 sm:pt-6 md:pt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-10 sm:h-12 text-sm sm:text-base"
              >
                Retour
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 h-10 sm:h-12 btn-hero-gradient text-sm sm:text-base"
              >
                {currentScreen.metadata?.buttonText || 'Continuer'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        );

      case 'TOGGLE':
        const toggleValue = responses[currentScreen.id] ?? false;
        
        return (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl p-4 sm:p-6 md:p-8">
            <div className="text-center mb-4 sm:mb-6 md:mb-8">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-1 sm:mb-2 px-2">
                {currentScreen.title}
              </h2>
              {currentScreen.subtitle && (
                <p className="text-muted-foreground text-sm sm:text-base px-2">
                  {currentScreen.subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 sm:gap-6 py-4 sm:py-6 md:py-8">
              <Label 
                className={cn(
                  "text-base sm:text-lg font-medium transition-colors cursor-pointer",
                  !toggleValue ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Non
              </Label>
              <Switch
                checked={toggleValue}
                onCheckedChange={(v) => handleResponse(currentScreen.id, v, 'company_shares')}
                className="scale-125 sm:scale-150 data-[state=checked]:bg-primary"
              />
              <Label 
                className={cn(
                  "text-base sm:text-lg font-medium transition-colors cursor-pointer",
                  toggleValue ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Oui
              </Label>
            </div>

            <div className="flex gap-2 sm:gap-3 pt-2 sm:pt-4">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-10 sm:h-12 text-sm sm:text-base"
              >
                Retour
              </Button>
              <Button
                onClick={handleNext}
                className="flex-1 h-10 sm:h-12 btn-hero-gradient text-sm sm:text-base"
              >
                {currentScreen.metadata?.buttonText || 'Voir mon potentiel'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        );

      case 'CALCULATION_RESULT':
        // Get result from CMS config or use calculated value
        const calcConfig = currentScreen.metadata?.calculationConfig;
        const resultType = calcConfig?.resultType || 'currency';
        const resultValue = calcConfig?.mode === 'fixed' 
          ? calcConfig.fixedValue 
          : estimatedSavings;
        
        // Format the result based on type
        const formatResult = () => {
          if (resultType === 'text') {
            return resultValue;
          }
          if (resultType === 'currency' || resultType === 'number') {
            const numValue = typeof resultValue === 'number' ? resultValue : parseFloat(resultValue) || 0;
            return formatCurrency(numValue);
          }
          return resultValue;
        };

        // Get summary items from CMS or use defaults
        const summaryItems = currentScreen.metadata?.summaryItems || [];
        const showDefaultSummary = summaryItems.length === 0 && resultType !== 'text';

        return (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl p-4 sm:p-6 md:p-8 text-center">
            {isCalculating ? (
              <div className="py-8 sm:py-12">
                <Loader2 className="h-12 w-12 sm:h-16 sm:w-16 text-primary animate-spin mx-auto mb-4 sm:mb-6" />
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-1 sm:mb-2 px-2">
                  {currentScreen.metadata?.loadingText || 'Analyse en cours...'}
                </h2>
                {currentScreen.metadata?.loadingSubtext && (
                  <p className="text-muted-foreground text-sm sm:text-base px-2">
                    {currentScreen.metadata.loadingSubtext}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="mb-4 sm:mb-6 md:mb-8">
                  <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                    <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-1 sm:mb-2 px-2">
                    {currentScreen.title}
                  </h2>
                  {currentScreen.subtitle && (
                    <p className="text-muted-foreground text-sm sm:text-base px-2">
                      {currentScreen.subtitle}
                    </p>
                  )}
                </div>

                {/* Result Display - adapts to text or currency */}
                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8">
                  {resultType === 'text' ? (
                    <p className="text-base sm:text-lg md:text-xl font-medium text-foreground leading-relaxed">
                      {formatResult()}
                    </p>
                  ) : (
                    <>
                      <p className="text-xs sm:text-sm text-primary font-medium mb-1 sm:mb-2">
                        {currentScreen.metadata?.resultLabel || 'Résultat'}
                      </p>
                      <p className="text-3xl sm:text-4xl md:text-5xl font-bold hero-gradient">
                        {formatResult()}
                      </p>
                    </>
                  )}
                </div>

                {/* Summary Items - only show if configured or using default currency calculation */}
                {showDefaultSummary && (
                  <div className="space-y-2 sm:space-y-3 text-left mb-4 sm:mb-6 md:mb-8">
                    <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground text-xs sm:text-sm">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full flex-shrink-0" />
                      <span>Revenu déclaré : {formatCurrency(responses.income || 80000)}</span>
                    </div>
                    {responses.objective && (
                      <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground text-xs sm:text-sm">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full flex-shrink-0" />
                        <span>Objectif sélectionné</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 sm:gap-3 text-muted-foreground text-xs sm:text-sm">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full flex-shrink-0" />
                      <span>Actions d'entreprise : {responses.company_shares ? 'Oui' : 'Non'}</span>
                    </div>
                  </div>
                )}

                {/* CMS-configured summary items */}
                {summaryItems.length > 0 && (
                  <div className="space-y-2 sm:space-y-3 text-left mb-4 sm:mb-6 md:mb-8">
                    {summaryItems.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 sm:gap-3 text-muted-foreground text-xs sm:text-sm">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full flex-shrink-0" />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  size="lg"
                  onClick={handleComplete}
                  className="w-full btn-hero-gradient h-12 sm:h-14 text-base sm:text-lg font-semibold"
                >
                  {currentScreen.metadata?.buttonText || 'Découvrir mes opportunités'}
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </>
            )}
          </Card>
        );

      case 'TEXT_INPUT':
        return (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl p-4 sm:p-6 md:p-8">
            <div className="text-center mb-4 sm:mb-6 md:mb-8">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-1 sm:mb-2 px-2">
                {currentScreen.title}
              </h2>
              {currentScreen.subtitle && (
                <p className="text-muted-foreground text-sm sm:text-base px-2">
                  {currentScreen.subtitle}
                </p>
              )}
            </div>

            <div className="mb-4 sm:mb-6 md:mb-8">
              <Input
                type={currentScreen.metadata?.inputType || 'text'}
                placeholder={currentScreen.metadata?.placeholder || ''}
                value={responses[currentScreen.id] || ''}
                onChange={(e) => handleResponse(currentScreen.id, e.target.value)}
                className="h-12 sm:h-14 text-base sm:text-lg"
              />
            </div>

            <div className="flex gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-10 sm:h-12 text-sm sm:text-base"
              >
                Retour
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1 h-10 sm:h-12 btn-hero-gradient text-sm sm:text-base"
              >
                {currentScreen.metadata?.buttonText || 'Continuer'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-background">
      {/* Progress Bar */}
      {stepsCompleted > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <Progress 
            value={progress} 
            className="h-1 rounded-none [&>div]:bg-primary" 
          />
        </div>
      )}

      {/* Main Content - Split layout for first screen */}
      <div className={cn(
        "flex min-h-screen relative z-10",
        currentIndex === 0 ? "flex-col lg:flex-row" : "items-center justify-center"
      )}>
        {/* FinBear Video - Only on first screen */}
        <div 
          className={cn(
            "lg:w-1/2 flex items-center justify-center p-4 lg:p-8 transition-all duration-1000 ease-out",
            currentIndex === 0 
              ? "opacity-100" 
              : "opacity-0 w-0 h-0 lg:w-0 pointer-events-none"
          )}
          style={{
            transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), width 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s, height 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.4s'
          }}
        >
          {currentIndex <= 1 && (
            <div 
              className="relative p-[3px] rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(271 81% 56%) 50%, hsl(38 92% 50%) 100%)'
              }}
            >
              <div className="rounded-[14px] overflow-hidden bg-card">
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="w-full h-auto max-h-[70vh] object-contain"
                >
                  <source src="/video_index3.mp4" type="video/mp4" />
                </video>
              </div>
            </div>
          )}
        </div>

        {/* Question Content */}
        <div 
          className={cn(
            "flex items-center justify-center p-2 sm:p-4 transition-all duration-700 ease-out overflow-y-auto",
            currentIndex === 0 
              ? "lg:w-1/2 flex-1" 
              : "w-full",
            "py-4 sm:py-6"
          )}
        >
          <div
            className={cn(
              "w-full max-w-sm sm:max-w-md md:max-w-xl transition-all duration-300 ease-out",
              isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            )}
          >
            {renderScreen()}
          </div>
        </div>
      </div>

      {/* CSAT Panel */}
      <CSATPanel
        open={showCSAT}
        onOpenChange={handleCSATClose}
        contentType={contentType}
        contentId={contentId}
        contentName={contentName}
      />
    </div>
  );
}
