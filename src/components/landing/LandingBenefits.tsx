import { Card, CardContent } from "@/components/ui/card";
import * as LucideIcons from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface Benefit {
  title: string;
  description: string;
  icon: string;
}

interface LandingBenefitsProps {
  title: string;
  items: Benefit[];
}

export const LandingBenefits = ({ title, items }: LandingBenefitsProps) => {
  const { ref, isVisible } = useScrollAnimation();
  
  return (
    <section ref={ref as any} className="py-24 px-4 bg-card/30">
      <div className="container max-w-7xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold">{title}</h2>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {items.map((benefit, index) => {
            const IconComponent = (LucideIcons as any)[benefit.icon] || LucideIcons.Check;
            
            return (
              <Card 
                key={index}
                className={`group hover:shadow-hover transition-all duration-700 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 space-y-4 text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                    <IconComponent className="h-8 w-8 text-success" />
                  </div>
                  
                  <h3 className="text-lg font-bold">{benefit.title}</h3>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {benefit.description}
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