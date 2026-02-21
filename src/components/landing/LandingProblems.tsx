import { Card, CardContent } from "@/components/ui/card";
import * as LucideIcons from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface Problem {
  title: string;
  description: string;
  icon: string;
}

interface LandingProblemsProps {
  problems: Problem[];
}

export const LandingProblems = ({ problems }: LandingProblemsProps) => {
  const { ref, isVisible } = useScrollAnimation();
  
  if (!Array.isArray(problems) || problems.length === 0) {
    return null;
  }
  
  return (
    <section ref={ref as any} className="py-24 px-4 bg-card/30">
      <div className="container max-w-7xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl font-bold">
            Les défis de vos collaborateurs
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Des problématiques concrètes qui impactent le quotidien de vos équipes
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => {
            const IconComponent = (LucideIcons as any)[problem.icon] || LucideIcons.AlertCircle;
            
            return (
              <Card 
                key={index} 
                className={`group hover:shadow-hover transition-all duration-700 hover:-translate-y-2 ${
                  isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <CardContent className="p-8 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                    <IconComponent className="h-7 w-7 text-destructive" />
                  </div>
                  
                  <h3 className="text-xl font-bold">{problem.title}</h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {problem.description}
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