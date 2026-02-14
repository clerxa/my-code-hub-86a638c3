import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface LandingHeroProps {
  title: string;
  subtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  image?: string;
  clientLogos?: string[];
  onCtaPrimary?: () => void;
  onCtaSecondary?: () => void;
}

export const LandingHero = ({
  title,
  subtitle,
  ctaPrimary,
  ctaSecondary,
  image,
  clientLogos = [],
  onCtaPrimary,
  onCtaSecondary,
}: LandingHeroProps) => {
  const { ref: leftRef, isVisible: leftVisible } = useScrollAnimation();
  const { ref: rightRef, isVisible: rightVisible } = useScrollAnimation({ threshold: 0.2 });
  
  return (
    <>
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/10" />
      
      <div className="container max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div 
            ref={leftRef as any}
            className={`space-y-8 transition-all duration-700 ${
              leftVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
          >
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
              <span className="hero-gradient">{title}</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-2xl">
              {subtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="btn-hero-gradient text-lg px-8 py-6"
                onClick={onCtaPrimary}
              >
                {ctaPrimary}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-6 border-2"
                onClick={onCtaSecondary}
              >
                {ctaSecondary}
              </Button>
            </div>
          </div>
          
          {/* Right image */}
          <div 
            ref={rightRef as any}
            className={`relative transition-all duration-700 delay-300 ${
              rightVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
            }`}
          >
            {image ? (
              <img 
                src={image} 
                alt="FinCare Platform" 
                className="w-full h-auto rounded-2xl shadow-2xl"
              />
            ) : (
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 shadow-glow flex items-center justify-center">
                <p className="text-muted-foreground">Votre bannière ici</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>

    {/* Full-width logo marquee band */}
    {clientLogos.length > 0 && (
      <div className="w-full py-8 bg-card/50 backdrop-blur-sm border-y border-border/30">
        <p className="text-center text-sm text-muted-foreground uppercase tracking-widest mb-6 font-medium">
          Ils nous font confiance
        </p>
        <div className="relative overflow-hidden w-full">
          {/* Fade edges */}
          <div className="absolute left-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-24 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />
          <div className="flex items-center w-max">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex gap-16 items-center animate-marquee px-8">
                {clientLogos.map((logo, index) => (
                  <div
                    key={`${copy}-${index}`}
                    className="flex-shrink-0 bg-white rounded-xl p-3 shadow-sm"
                  >
                    <img
                      src={logo}
                      alt={`Client ${index + 1}`}
                      className="h-16 w-16 object-contain"
                    />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    )}
    </>
  );
};