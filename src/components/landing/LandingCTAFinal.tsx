import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface LandingCTAFinalProps {
  title: string;
  subtitle: string;
  cta: string;
  onCTA?: () => void;
}

export const LandingCTAFinal = ({ title, subtitle, cta, onCTA }: LandingCTAFinalProps) => {
  return (
    <section className="py-24 px-4">
      <div className="container max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-secondary to-accent p-1">
          <div className="bg-background rounded-3xl p-12 md:p-20 text-center space-y-8">
            <h2 className="text-4xl lg:text-6xl font-bold text-foreground">
              <span className="hero-gradient">{title}</span>
            </h2>
            
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
              {subtitle}
            </p>
            
            <Button 
              size="lg" 
              className="btn-hero-gradient text-xl px-12 py-8"
              onClick={onCTA}
            >
              {cta}
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};