import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, Calculator, TrendingUp, PieChart, Wallet, Shield, Home, Building2, Landmark, Receipt, Lock, Crown } from 'lucide-react';
import { useSimulationQuota } from '@/hooks/useSimulationQuota';
import { cn } from '@/lib/utils';

interface SimulatorCardProps {
  name: string;
  description: string | null;
  icon: string;
  route: string;
  featureKey: string | null;
  durationMinutes: number;
  visibilityStatus?: 'visible' | 'disabled' | 'hidden';
  simulationsCount?: number;
  buttonLabel?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'calculator': Calculator,
  'trending-up': TrendingUp,
  'pie-chart': PieChart,
  'wallet': Wallet,
  'shield': Shield,
  'home': Home,
  'building-2': Building2,
  'landmark': Landmark,
  'receipt': Receipt,
};

type AccessState = 'accessible' | 'not_allowed' | 'quota_exhausted' | 'partner';

export function SimulatorCard({ name, description, icon, route, featureKey, durationMinutes, visibilityStatus = 'visible', simulationsCount = 0, buttonLabel }: SimulatorCardProps) {
  const navigate = useNavigate();
  const IconComponent = iconMap[icon] || Calculator;
  
  const {
    hasPartnership,
    isLimited,
    allowedSimulators = [],
    isLoading,
  } = useSimulationQuota() || {};
  
  const isDisabled = visibilityStatus === 'disabled';

  // Determine access state for non-partner users
  const getAccessState = (): AccessState => {
    if (hasPartnership) return 'partner';
    if (!featureKey) return 'accessible';
    
    const isSimulatorFeature = featureKey.startsWith('simulateur_') || featureKey === 'optimisation_fiscale';
    if (!isSimulatorFeature) return 'not_allowed';
    
    // Check if simulator is in allowed list
    const isAllowed = allowedSimulators.includes(featureKey);
    if (!isAllowed) return 'not_allowed';
    
    // Check quota
    if (isLimited) return 'quota_exhausted';
    
    return 'accessible';
  };

  const accessState = getAccessState();
  const isLocked = accessState === 'not_allowed' || accessState === 'quota_exhausted';

  const handleClick = () => {
    if (isDisabled) return;
    
    if (isLocked) {
      navigate('/proposer-partenariat');
      return;
    }
    
    navigate(route);
  };

  const getButtonContent = () => {
    if (isDisabled) return 'Bientôt disponible';
    if (accessState === 'quota_exhausted') return 'Devenir partenaire';
    if (accessState === 'not_allowed') return 'Réservé aux partenaires';
    return buttonLabel || 'Lancer le simulateur';
  };

  const getLockedBadge = () => {
    if (accessState === 'quota_exhausted') {
      return (
        <Badge variant="destructive" className="text-xs gap-1">
          <Lock className="h-3 w-3" />
          Quota atteint
        </Badge>
      );
    }
    if (accessState === 'not_allowed') {
      return (
        <Badge variant="secondary" className="text-xs gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
          <Crown className="h-3 w-3" />
          Partenaires
        </Badge>
      );
    }
    return null;
  };

  return (
    <Card 
      className={cn(
        "group h-full flex flex-col bg-card border-border/50 transition-all duration-300",
        isDisabled && "opacity-70 cursor-not-allowed",
        isLocked && "opacity-80 cursor-pointer hover:border-primary/30",
        !isDisabled && !isLocked && "hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
      )}
      onClick={isLocked ? handleClick : undefined}
    >
      <CardContent className="flex flex-col h-full p-6">
        {/* Header with icon and badges */}
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            "p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl transition-colors duration-300",
            !isDisabled && !isLocked && "group-hover:from-primary/20 group-hover:to-primary/10",
            isLocked && "grayscale opacity-60"
          )}>
            <IconComponent className={cn(
              "h-6 w-6 text-primary",
              isLocked && "text-muted-foreground"
            )} />
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="text-xs font-normal border-muted-foreground/30 text-muted-foreground">
              <Clock className="h-3 w-3 mr-1" />
              {durationMinutes} min
            </Badge>
            {isDisabled && (
              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Bientôt disponible
              </Badge>
            )}
            {!isDisabled && getLockedBadge()}
            {!isDisabled && !isLocked && simulationsCount > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                {simulationsCount} plan{simulationsCount > 1 ? 's' : ''} en cours
              </Badge>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2 mb-4">
          <h3 className={cn(
            "font-semibold text-lg leading-tight transition-colors duration-300",
            !isDisabled && !isLocked && "group-hover:text-primary",
            isLocked && "text-muted-foreground"
          )}>
            {name}
          </h3>
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>
          )}
        </div>

        {/* Locked message for non-partner simulators */}
        {accessState === 'not_allowed' && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-300 text-center">
              Exclusivement pour les partenaires officiels FinCare
            </p>
          </div>
        )}

        {/* Locked message when quota exhausted */}
        {accessState === 'quota_exhausted' && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-xs text-red-700 dark:text-red-300 text-center">
              Pour continuer à utiliser les simulateurs, devenez partenaire officiel FinCare
              <span className="block mt-1 font-medium">(gratuit pour vous et votre entreprise)</span>
            </p>
          </div>
        )}

        {/* CTA Button - Always at bottom */}
        <Button 
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }} 
          className={cn(
            "w-full group/btn",
            isLocked && "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          variant={isLocked ? "default" : "outline"}
          disabled={isDisabled}
        >
          {isLocked && <Lock className="h-4 w-4 mr-2" />}
          <span>{getButtonContent()}</span>
          {!isDisabled && !isLocked && (
            <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform duration-200" />
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
