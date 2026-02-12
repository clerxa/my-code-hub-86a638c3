import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";

interface BetaDisclaimerModalProps {
  userId: string;
  onAccepted: () => void;
}

const DISCLAIMER_STORAGE_KEY = "fincare_beta_disclaimer_accepted";

export function BetaDisclaimerModal({ userId, onAccepted }: BetaDisclaimerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkDisclaimerStatus();
  }, [userId]);

  const checkDisclaimerStatus = async () => {
    try {
      const localAccepted = localStorage.getItem(DISCLAIMER_STORAGE_KEY);
      
      if (localAccepted === userId) {
        setIsOpen(false);
        setIsLoading(false);
        onAccepted();
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("beta_disclaimer_accepted_at")
        .eq("id", userId)
        .maybeSingle();

      if (profile?.beta_disclaimer_accepted_at) {
        localStorage.setItem(DISCLAIMER_STORAGE_KEY, userId);
        setIsOpen(false);
        onAccepted();
      } else {
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Error checking disclaimer status:", error);
      setIsOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!isChecked) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ beta_disclaimer_accepted_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) throw error;

      localStorage.setItem(DISCLAIMER_STORAGE_KEY, userId);
      setIsOpen(false);
      onAccepted();
    } catch (error) {
      console.error("Error saving disclaimer acceptance:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-xl mx-4 p-0 gap-0 max-h-[90vh] overflow-hidden border-none shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="p-6 pb-2 text-center">
          <div className="flex items-center justify-center mb-4">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif font-medium tracking-tight">
              Accord de Confidentialité
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1 italic">
              Version Beta — Accès privilégié
            </p>
          </DialogHeader>
        </div>

        {/* Literary content */}
        <ScrollArea className="max-h-[50vh] px-8">
          <div className="prose prose-sm dark:prose-invert max-w-none py-4 text-muted-foreground leading-relaxed">
            <p className="first-letter:text-2xl first-letter:font-serif first-letter:text-foreground first-letter:mr-1">
              En accédant à cette version beta, vous bénéficiez d'un <strong className="text-foreground">accès gratuit et privilégié</strong> à notre plateforme, 
              en contrepartie de votre précieuse participation aux tests.
            </p>

            <p>
              Vous reconnaissez que cette application est <strong className="text-foreground">en cours de développement</strong> et 
              vous est fournie « en l'état ». Des anomalies, interruptions ou dysfonctionnements 
              peuvent survenir à tout moment.
            </p>

            <p>
              La <strong className="text-foreground">confidentialité absolue</strong> de ce programme est impérative. 
              Il vous est strictement interdit de partager des captures d'écran, 
              de divulguer le design, les fonctionnalités, ou même l'existence de cette application. 
              Le lien d'accès ne doit en aucun cas être transmis à des tiers.
            </p>

            <p>
              S'agissant des informations financières présentées, veuillez noter que 
              <strong className="text-foreground"> tout investissement comporte des risques</strong>. 
              Cette application ne constitue en aucun cas un conseil financier personnalisé. 
              Les simulateurs proposés peuvent comporter des <strong className="text-foreground">erreurs de calcul ou des approximations</strong> ; 
              leurs résultats sont fournis à titre purement indicatif.
            </p>

            <p>
              Toute suggestion, remarque ou idée d'amélioration que vous pourriez formuler 
              devient la <strong className="text-foreground">propriété exclusive de l'éditeur</strong>.
            </p>

            <p className="mb-0">
              Enfin, l'éditeur se réserve le droit de <strong className="text-foreground">réinitialiser ou supprimer</strong> les 
              données de test à tout moment, sans préavis ni justification.
            </p>
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-6 space-y-4 bg-muted/30">
          <div 
            className="flex items-start gap-3 cursor-pointer group"
            onClick={() => setIsChecked(!isChecked)}
          >
            <Checkbox 
              id="disclaimer-checkbox"
              checked={isChecked}
              onCheckedChange={(checked) => setIsChecked(checked === true)}
              className="mt-0.5"
            />
            <Label 
              htmlFor="disclaimer-checkbox" 
              className="text-sm leading-relaxed cursor-pointer text-muted-foreground group-hover:text-foreground transition-colors"
            >
              Je reconnais que les simulations ne constituent pas des conseils financiers 
              et que les résultats peuvent être erronés.
            </Label>
          </div>
          
          <Button 
            onClick={handleAccept}
            disabled={!isChecked || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                Validation...
              </div>
            ) : (
              "J'accepte et j'accède à la Beta"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
