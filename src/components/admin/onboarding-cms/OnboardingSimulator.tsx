import { useState, useEffect } from "react";
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
import { OnboardingScreen, CalculationConfig } from "@/types/onboarding-cms";

interface OnboardingSimulatorProps {
  screens: OnboardingScreen[];
}

const ICONS_BY_LOWER: Record<string, any> = Object.fromEntries(
  Object.entries(icons as any).map(([name, Comp]) => [String(name).toLowerCase(), Comp])
);

export function OnboardingSimulator({ screens }: OnboardingSimulatorProps) {
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(null);
  const [screenHistory, setScreenHistory] = useState<string[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [calculationResult, setCalculationResult] = useState<number | string>(0);

  const sortedScreens = [...screens].sort((a, b) => a.order_num - b.order_num);
  
  // Initialize with first screen
  useEffect(() => {
    if (sortedScreens.length > 0 && !currentScreenId) {
      setCurrentScreenId(sortedScreens[0].id);
    }
  }, [sortedScreens, currentScreenId]);

  const currentScreen = screens.find(s => s.id === currentScreenId);
  const currentIndex = sortedScreens.findIndex(s => s.id === currentScreenId);
  const totalSteps = sortedScreens.length;
  const progress = currentIndex >= 0 ? ((currentIndex + 1) / totalSteps) * 100 : 0;

  const goToScreen = (screenId: string) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setScreenHistory(prev => [...prev, currentScreenId!]);
      setCurrentScreenId(screenId);
      setIsTransitioning(false);
    }, 200);
  };

  const getNextScreenId = (selectedOption?: any): string | null => {
    if (!currentScreen) return null;

    // Check if selected option has a specific nextStepId
    if (selectedOption?.nextStepId) {
      return selectedOption.nextStepId;
    }

    // Check transition conditions based on current screen response
    const transitionConditions = currentScreen.metadata?.transitionConditions;
    if (transitionConditions && Array.isArray(transitionConditions) && transitionConditions.length > 0) {
      const currentValue = responses[currentScreen.id];
      
      // Sort by priority (lower = first)
      const sortedConditions = [...transitionConditions].sort((a, b) => (a.priority || 0) - (b.priority || 0));
      
      for (const condition of sortedConditions) {
        let matches = false;
        
        // Check numeric range conditions
        if (condition.minValue !== undefined || condition.maxValue !== undefined) {
          const numValue = typeof currentValue === 'number' ? currentValue : parseFloat(currentValue);
          if (!isNaN(numValue)) {
            const minOk = condition.minValue === undefined || numValue >= condition.minValue;
            const maxOk = condition.maxValue === undefined || numValue <= condition.maxValue;
            matches = minOk && maxOk;
          }
        }
        
        // Check exact value condition
        if (condition.exactValue !== undefined) {
          matches = currentValue === condition.exactValue;
        }
        
        // Check contains condition
        if (condition.containsValue !== undefined && typeof currentValue === 'string') {
          matches = currentValue.toLowerCase().includes(condition.containsValue.toLowerCase());
        }
        
        if (matches && condition.targetScreenId) {
          return condition.targetScreenId;
        }
      }
    }

    // Check if screen has a default next_step_id
    if (currentScreen.next_step_id) {
      return currentScreen.next_step_id;
    }

    // IMPORTANT: no implicit fallback by order — if there's no visual link, we don't route.
    return null;
  };

  const calculateResult = (screen: OnboardingScreen): number | string => {
    const config = screen.metadata?.calculationConfig;
    if (!config) {
      // Legacy fallback calculation
      const income = responses.income || 80000;
      const hasShares = responses.company_shares || false;
      const baseSavings = income * 0.08;
      const equityBonus = hasShares ? income * 0.03 : 0;
      return Math.round(baseSavings + equityBonus);
    }

    switch (config.mode) {
      case 'fixed':
        return config.fixedValue ?? (config.resultType === 'text' ? '' : 0);

      case 'formula':
        if (!config.formula) return 0;
        try {
          // Replace {screenId} with actual values
          let formula = config.formula;
          const screenIdPattern = /\{([^}]+)\}/g;
          let match;
          while ((match = screenIdPattern.exec(config.formula)) !== null) {
            const screenId = match[1];
            const value = responses[screenId] ?? 0;
            formula = formula.replace(match[0], String(value));
          }
          // Safely evaluate the formula (only basic math operations)
          // eslint-disable-next-line no-new-func
          const result = Function('"use strict"; return (' + formula + ')')();
          return Math.round(result);
        } catch (e) {
          console.error('Formula evaluation error:', e);
          return 0;
        }

      case 'thresholds':
        if (!config.thresholds?.sourceField) return config.resultType === 'text' ? '' : 0;
        const sourceValue = responses[config.thresholds.sourceField] ?? 0;
        for (const range of config.thresholds.ranges) {
          const minOk = range.min === undefined || sourceValue >= range.min;
          const maxOk = range.max === undefined || sourceValue <= range.max;
          if (minOk && maxOk) {
            return range.result;
          }
        }
        return config.resultType === 'text' ? '' : 0;

      case 'weighted':
        let total = config.baseValue || 0;
        for (const cond of config.weightedConditions || []) {
          const responseValue = responses[cond.screenId];
          if (responseValue === cond.value) {
            total += cond.points;
          }
        }
        return Math.round(total);

      case 'mapping':
        for (const rule of config.mappingRules || []) {
          const allMatch = rule.conditions.every(cond => {
            const responseValue = responses[cond.screenId];
            return responseValue === cond.value;
          });
          if (allMatch && rule.conditions.length > 0) {
            return rule.result;
          }
        }
        return config.defaultResult ?? (config.resultType === 'text' ? '' : 0);

      default:
        return config.resultType === 'text' ? '' : 0;
    }
  };

  const handleNext = (selectedOption?: any) => {
    // Check for screen-level redirects first
    if (currentScreen?.metadata?.redirectExternalUrl) {
      window.open(currentScreen.metadata.redirectExternalUrl, '_blank');
      return;
    }
    if (currentScreen?.metadata?.redirectInternalUrl) {
      // In simulator, just show a toast/alert since we can't actually navigate
      alert(`Redirection vers: ${currentScreen.metadata.redirectInternalUrl}`);
      return;
    }

    const nextScreenId = getNextScreenId(selectedOption);
    
    if (nextScreenId) {
      const nextScreen = screens.find(s => s.id === nextScreenId);
      
      if (nextScreen?.type === 'CALCULATION_RESULT') {
        goToScreen(nextScreenId);
        setIsCalculating(true);
        setTimeout(() => {
          const result = calculateResult(nextScreen);
          setCalculationResult(result);
          setIsCalculating(false);
        }, 2000);
      } else {
        goToScreen(nextScreenId);
      }
    }
  };

  const handleBack = () => {
    if (screenHistory.length > 0) {
      const previousScreenId = screenHistory[screenHistory.length - 1];
      setIsTransitioning(true);
      setTimeout(() => {
        setScreenHistory(prev => prev.slice(0, -1));
        setCurrentScreenId(previousScreenId);
        setIsTransitioning(false);
      }, 200);
    }
  };

  const handleOptionSelect = (screenId: string, option: any) => {
    handleResponse(screenId, option.value);
    
    // Handle redirects - in simulator, show alert for internal URLs
    if (option.redirectInternalUrl) {
      alert(`Redirection vers: ${option.redirectInternalUrl}`);
      return;
    }
    if (option.redirectExternalUrl) {
      window.open(option.redirectExternalUrl, '_blank');
      return;
    }
  };

  const handleResponse = (screenId: string, value: any) => {
    setResponses(prev => ({ ...prev, [screenId]: value }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatValue = (value: number, unit?: string) => {
    if (!unit || unit === '€') {
      return formatCurrency(value);
    }
    return `${new Intl.NumberFormat("fr-FR").format(value)} ${unit}`;
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
      case 'TEXT_INPUT':
        return true;
      default:
        return true;
    }
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return Sparkles;
    return ICONS_BY_LOWER[String(iconName).toLowerCase()] || Sparkles;
  };

  if (!currentScreen) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Aucun écran actif à afficher</p>
      </div>
    );
  }

  const renderScreen = () => {
    const Icon = getIcon(currentScreen.metadata?.icon);
    
    switch (currentScreen.type) {
      case 'WELCOME':
        return (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl p-6 text-center">
            <div className="mb-4">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Icon className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-2">
                {currentScreen.title}
              </h1>
              {currentScreen.subtitle && (
                <p className="text-muted-foreground text-sm">
                  {currentScreen.subtitle}
                </p>
              )}
            </div>
            <Button 
              size="lg" 
              onClick={handleNext}
              className="w-full btn-hero-gradient h-12 font-semibold"
            >
              {currentScreen.metadata?.buttonText || 'Commencer'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Card>
        );

      case 'SINGLE_CHOICE':
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-foreground mb-1">
                {currentScreen.title}
              </h2>
              {currentScreen.subtitle && (
                <p className="text-muted-foreground text-xs">
                  {currentScreen.subtitle}
                </p>
              )}
            </div>

            <div className="space-y-2">
              {currentScreen.options.map((option) => {
                const OptionIcon = getIcon(option.icon);
                const isSelected = responses[currentScreen.id] === option.value;
                
                return (
                  <Card
                    key={String(option.value)}
                    onClick={() => handleOptionSelect(currentScreen.id, option)}
                    className={cn(
                      "p-4 cursor-pointer transition-all duration-200 border-2",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-lg"
                        : "border-border bg-card hover:border-primary/50 hover:shadow-md"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                          isSelected ? "bg-primary" : "bg-muted"
                        )}
                      >
                        <OptionIcon
                          className={cn(
                            "h-5 w-5 transition-colors",
                            isSelected ? "text-primary-foreground" : "text-muted-foreground"
                          )}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-sm">
                          {option.label}
                        </h3>
                        {option.description && (
                          <p className="text-muted-foreground text-xs">
                            {option.description}
                          </p>
                        )}
                      </div>
                      <div
                        className={cn(
                          "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                          isSelected
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30"
                        )}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-10"
                disabled={screenHistory.length === 0}
              >
                Retour
              </Button>
              <Button
                onClick={() => {
                  // Find the selected option to check for conditional branching
                  const selectedOption = currentScreen.options.find(
                    o => o.value === responses[currentScreen.id]
                  );
                  handleNext(selectedOption);
                }}
                disabled={!canProceed()}
                className="flex-1 h-10 btn-hero-gradient"
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
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h2 className="text-lg font-bold text-foreground mb-1">
                {currentScreen.title}
              </h2>
              {currentScreen.subtitle && (
                <p className="text-muted-foreground text-xs">
                  {currentScreen.subtitle}
                </p>
              )}
            </div>

            <div className="space-y-2">
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
                      "p-3 cursor-pointer transition-all duration-200 border-2",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox checked={isSelected} className="flex-shrink-0" />
                      {option.icon && (
                        <OptionIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm">{option.label}</span>
                        {option.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{option.description}</p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-10"
                disabled={screenHistory.length === 0}
              >
                Retour
              </Button>
              <Button
                onClick={() => handleNext()}
                disabled={!canProceed()}
                className="flex-1 h-10 btn-hero-gradient"
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
        const unit = currentScreen.metadata?.unit;
        const value = responses[currentScreen.id] ?? defaultValue;
        
        return (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl p-6">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-foreground mb-1">
                {currentScreen.title}
              </h2>
              {currentScreen.subtitle && (
                <p className="text-muted-foreground text-xs">
                  {currentScreen.subtitle}
                </p>
              )}
            </div>

            <div className="space-y-6">
              <div className="text-center">
                <span className="text-3xl font-bold text-primary">
                  {formatValue(value, unit)}
                </span>
              </div>

              <div className="px-2">
                <Slider
                  value={[value]}
                  onValueChange={(values) => {
                    handleResponse(currentScreen.id, values[0]);
                    handleResponse('income', values[0]);
                  }}
                  min={min}
                  max={max}
                  step={step}
                  className="[&_[role=slider]]:h-5 [&_[role=slider]]:w-5"
                />
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  <span>{formatValue(min, unit)}</span>
                  <span>{formatValue(max, unit)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-10"
              >
                Retour
              </Button>
              <Button
                onClick={() => handleNext()}
                className="flex-1 h-10 btn-hero-gradient"
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
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl p-6">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-foreground mb-1">
                {currentScreen.title}
              </h2>
              {currentScreen.subtitle && (
                <p className="text-muted-foreground text-xs">
                  {currentScreen.subtitle}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-4 py-6">
              <Label 
                className={cn(
                  "text-base font-medium transition-colors cursor-pointer",
                  !toggleValue ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Non
              </Label>
              <Switch
                checked={toggleValue}
                onCheckedChange={(v) => {
                  handleResponse(currentScreen.id, v);
                  handleResponse('company_shares', v);
                }}
                className="scale-125 data-[state=checked]:bg-primary"
              />
              <Label 
                className={cn(
                  "text-base font-medium transition-colors cursor-pointer",
                  toggleValue ? "text-foreground" : "text-muted-foreground"
                )}
              >
                Oui
              </Label>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-10"
              >
                Retour
              </Button>
              <Button
                onClick={() => handleNext()}
                className="flex-1 h-10 btn-hero-gradient"
              >
                {currentScreen.metadata?.buttonText || 'Voir mon potentiel'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        );

      case 'CALCULATION_RESULT':
        return (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl p-6 text-center">
            {isCalculating ? (
              <div className="py-8">
                <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  {currentScreen.metadata?.loadingText || 'Analyse en cours...'}
                </h2>
                {currentScreen.metadata?.loadingSubtext && (
                  <p className="text-muted-foreground text-sm">
                    {currentScreen.metadata.loadingSubtext}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h2 className="text-lg font-bold text-foreground mb-1">
                    {currentScreen.title}
                  </h2>
                  {currentScreen.subtitle && (
                    <p className="text-muted-foreground text-sm">
                      {currentScreen.subtitle}
                    </p>
                  )}
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl p-6 mb-6">
                  <p className="text-xs text-primary font-medium mb-1">
                    {currentScreen.metadata?.resultLabel || 'Résultat'}
                  </p>
                  <p className="text-3xl font-bold hero-gradient">
                    {typeof calculationResult === 'string' 
                      ? calculationResult 
                      : formatValue(calculationResult, currentScreen.metadata?.resultUnit || '€')}
                  </p>
                </div>

                <Button
                  size="lg"
                  onClick={() => handleNext()}
                  className="w-full btn-hero-gradient h-12 font-semibold"
                >
                  {currentScreen.metadata?.buttonText || 'Continuer'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
          </Card>
        );

      case 'TEXT_INPUT':
        return (
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm shadow-xl p-6">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-foreground mb-1">
                {currentScreen.title}
              </h2>
              {currentScreen.subtitle && (
                <p className="text-muted-foreground text-xs">
                  {currentScreen.subtitle}
                </p>
              )}
            </div>

            <div className="mb-6">
              <Input
                type={currentScreen.metadata?.inputType || 'text'}
                placeholder={currentScreen.metadata?.placeholder || ''}
                value={responses[currentScreen.id] || ''}
                onChange={(e) => handleResponse(currentScreen.id, e.target.value)}
                className="h-12 text-center text-lg"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-10"
              >
                Retour
              </Button>
              <Button
                onClick={() => handleNext()}
                disabled={!responses[currentScreen.id]}
                className="flex-1 h-10 btn-hero-gradient"
              >
                {currentScreen.metadata?.buttonText || 'Continuer'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        );

      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Type d'écran non supporté: {currentScreen.type}
          </div>
        );
    }
  };

  return (
    <div className="w-[320px] h-[640px] bg-gradient-to-b from-muted/50 to-background rounded-[2.5rem] border-4 border-foreground/20 overflow-hidden shadow-2xl flex flex-col">
      {/* Status Bar */}
      <div className="h-8 bg-foreground/5 flex items-center justify-center">
        <div className="w-20 h-4 bg-foreground/20 rounded-full" />
      </div>

      {/* Progress Bar */}
      {currentIndex > 0 && (
        <div className="px-4 pt-2">
          <Progress value={progress} className="h-1" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 flex items-center">
        <div
          className={cn(
            "w-full transition-all duration-300 ease-out",
            isTransitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
          )}
        >
          {renderScreen()}
        </div>
      </div>

      {/* Home Indicator */}
      <div className="h-6 flex items-center justify-center">
        <div className="w-32 h-1 bg-foreground/20 rounded-full" />
      </div>
    </div>
  );
}
