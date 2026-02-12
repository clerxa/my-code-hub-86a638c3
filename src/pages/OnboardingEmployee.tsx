import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCSATTrigger } from '@/hooks/useCSATTrigger';
import { CSATPanel } from '@/components/csat';

interface OnboardingScene {
  id: string;
  ordre: number;
  image: string;
  texte: string;
  effet: string;
  statut: boolean;
}

const getAnimationClass = (effet: string) => {
  const animations: Record<string, string> = {
    'fade-in': 'animate-fade-in',
    'zoom-in': 'animate-scale-in',
    'spotlight': 'animate-fade-in',
    'particles': 'animate-fade-in',
    'glow': 'animate-fade-in',
    'motion-upward': 'animate-fade-in',
    'pulsation': 'animate-pulse',
  };
  return animations[effet] || 'animate-fade-in';
};

const getEffectStyle = (effet: string) => {
  const effects: Record<string, string> = {
    'spotlight': 'drop-shadow-[0_0_50px_rgba(255,215,0,0.3)]',
    'glow': 'drop-shadow-[0_0_40px_rgba(255,215,0,0.5)]',
    'pulsation': 'drop-shadow-[0_0_30px_rgba(220,38,38,0.4)]',
  };
  return effects[effet] || '';
};

export default function OnboardingEmployee() {
  const [scenes, setScenes] = useState<OnboardingScene[]>([]);
  const [currentScene, setCurrentScene] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showCSATBeforeNavigate, setShowCSATBeforeNavigate] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // CSAT trigger
  const { showCSAT, closeCSAT, triggerCSAT, contentType, contentId, contentName } = useCSATTrigger({
    contentType: 'onboarding',
    contentId: 'employee-onboarding',
    contentName: 'Onboarding Employé',
  });

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Vérifier si l'onboarding est activé globalement
      const { data: settingData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'employee_onboarding_enabled')
        .single();

      const onboardingEnabled = settingData?.value === 'true';

      // Si l'onboarding est désactivé, rediriger vers /employee
      if (!onboardingEnabled) {
        navigate('/employee');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('employee_onboarding_completed')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      // Si l'onboarding est déjà complété, rediriger vers /employee
      if (profile?.employee_onboarding_completed) {
        navigate('/employee');
        return;
      }

      // Sinon, charger les scènes
      await fetchScenes();
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      navigate('/employee');
    }
  };

  const fetchScenes = async () => {
    try {
      const { data, error } = await supabase
        .from('onboarding_scenes')
        .select('*')
        .eq('statut', true)
        .order('ordre', { ascending: true });

      if (error) throw error;
      setScenes(data || []);
    } catch (error) {
      console.error('Error fetching onboarding scenes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger l'onboarding",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentScene < scenes.length - 1) {
      setCurrentScene(currentScene + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ employee_onboarding_completed: true })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error updating onboarding status:', error);
    }
    // Trigger CSAT before navigating
    setShowCSATBeforeNavigate(true);
    triggerCSAT();
  };

  // Navigate after CSAT is closed
  const handleCSATClose = () => {
    closeCSAT();
    if (showCSATBeforeNavigate) {
      navigate('/employee');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#111219] flex items-center justify-center">
        <div className="text-foreground">Chargement...</div>
      </div>
    );
  }

  if (scenes.length === 0) {
    return (
      <div className="min-h-screen bg-[#111219] flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground mb-4">Aucune scène d'onboarding disponible</p>
          <Button onClick={() => navigate('/employee')}>Continuer</Button>
        </div>
      </div>
    );
  }

  const scene = scenes[currentScene];
  const progress = ((currentScene + 1) / scenes.length) * 100;

  return (
    <div className="min-h-screen bg-[#111219] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Texture de fond */}
      <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JhaW4iIHdpZHRoPSI0IiBoZWlnaHQ9IjQiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IndoaXRlIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyYWluKSIvPjwvc3ZnPg==')]" />
      
      {/* Particules lumineuses pour effet glow */}
      {scene.effet === 'glow' && (
        <>
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[hsl(var(--primary))] rounded-full animate-ping opacity-30" />
          <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-[hsl(var(--primary))] rounded-full animate-ping opacity-20" style={{ animationDelay: '0.5s' }} />
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-[hsl(var(--primary))] rounded-full animate-ping opacity-25" style={{ animationDelay: '1s' }} />
        </>
      )}

      {/* Brume pour scène 1 */}
      {scene.effet === 'fade-in' && currentScene === 0 && (
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-[#111219]/50 to-[#111219] animate-pulse" style={{ animationDuration: '4s' }} />
      )}

      {/* Contenu principal */}
      <div className="max-w-2xl w-full space-y-8 z-10">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Scène {currentScene + 1}/{scenes.length}</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>

        {/* Image */}
        <div className={`flex justify-center ${getAnimationClass(scene.effet)}`}>
          <div className="relative">
            <img 
              src={scene.image} 
              alt={`Scène ${currentScene + 1}`}
              className={`w-80 h-80 object-cover rounded-lg shadow-2xl ${getEffectStyle(scene.effet)}`}
              style={{
                animation: scene.effet === 'motion-upward' ? 'float 3s ease-in-out infinite' : undefined
              }}
            />
            {scene.effet === 'spotlight' && (
              <div className="absolute inset-0 bg-gradient-radial from-[hsl(var(--primary))]/20 to-transparent rounded-lg" />
            )}
          </div>
        </div>

        {/* Texte narratif */}
        <div className="text-center space-y-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <p className="text-lg text-foreground leading-relaxed max-w-xl mx-auto">
            {scene.texte}
          </p>

          {/* Bouton */}
          <Button 
            onClick={handleNext}
            size="lg"
            className="min-w-[200px] bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-primary-foreground font-semibold shadow-lg hover:shadow-[0_0_20px_hsl(var(--primary))/50] transition-all duration-300"
          >
            {currentScene === scenes.length - 1 ? 'Commencer ma quête' : 'Suivant'}
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>

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
