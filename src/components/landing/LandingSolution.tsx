import { Card, CardContent } from "@/components/ui/card";
import * as LucideIcons from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface Pillar {
  title: string;
  description: string;
  icon: string;
}

interface LandingSolutionProps {
  title: string;
  description: string;
  pillars: Pillar[];
}

export const LandingSolution = ({ title, description, pillars }: LandingSolutionProps) => {
  const { ref, isVisible } = useScrollAnimation();
  
  return (
    <section ref={ref as any} className="py-24 px-4">
      <div className="container max-w-7xl">
        <div className="text-center mb-16 space-y-6 max-w-3xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold">
            <span className="hero-gradient">{title}</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            {description}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, index) => {
            const IconComponent = (LucideIcons as any)[pillar.icon] || LucideIcons.Check;
            
            return (
              <Card 
                key={index}
                className={`group hover:shadow-glow transition-all duration-700 hover:-translate-y-1 border-2 ${
                  isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 space-y-4 h-full flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </div>
                  
                  <h3 className="text-lg font-bold">{pillar.title}</h3>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed flex-grow">
                    {pillar.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};