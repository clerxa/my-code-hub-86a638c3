import { Card } from "@/components/ui/card";

interface LandingDemoProps {
  title: string;
  description: string;
  screenshots: string[];
  layout: "2-columns" | "carousel";
}

export const LandingDemo = ({ 
  title, 
  description, 
  screenshots, 
  layout 
}: LandingDemoProps) => {
  return (
    <section className="py-24 px-4">
      <div className="container max-w-7xl">
        <div className="text-center mb-16 space-y-6 max-w-3xl mx-auto">
          <h2 className="text-4xl lg:text-5xl font-bold">
            <span className="hero-gradient">{title}</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            {description}
          </p>
        </div>
        
        {screenshots.length > 0 ? (
          <div className={layout === "2-columns" ? "grid md:grid-cols-2 gap-8" : "space-y-8"}>
            {screenshots.map((screenshot, index) => (
              <Card key={index} className="overflow-hidden">
                <img 
                  src={screenshot} 
                  alt={`Demo ${index + 1}`} 
                  className="w-full h-auto"
                />
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-12 bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center min-h-[400px]">
              <p className="text-muted-foreground text-center">
                Ajoutez vos captures d'écran depuis l'admin
              </p>
            </Card>
            <Card className="p-12 bg-gradient-to-br from-secondary/5 to-accent/5 flex items-center justify-center min-h-[400px]">
              <p className="text-muted-foreground text-center">
                Montrez votre plateforme en action
              </p>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
};