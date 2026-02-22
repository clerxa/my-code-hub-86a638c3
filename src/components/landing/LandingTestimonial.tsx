import { Quote } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const testimonials = [
  {
    quote:
      "Depuis que MyFinCare est déployé, nous avons constaté une baisse significative du stress financier chez nos collaborateurs. C'est devenu un vrai pilier de notre politique sociale.",
    author: "Sophie M.",
    role: "Directrice des Ressources Humaines",
    company: "Groupe industriel, 2 500 salariés",
  },
  {
    quote:
      "L'accompagnement est concret et confidentiel. Nos salariés nous remercient régulièrement d'avoir mis ce programme en place. Le taux de satisfaction dépasse les 90 %.",
    author: "Laurent D.",
    role: "Secrétaire du CSE",
    company: "ETI du secteur tech, 800 salariés",
  },
  {
    quote:
      "J'ai enfin pu comprendre ma fiche de paie, optimiser mes impôts et commencer à épargner. Tout ça grâce aux experts MyFinCare, en toute confidentialité.",
    author: "Camille R.",
    role: "Collaboratrice bénéficiaire",
    company: "",
  },
];

export const LandingTestimonial = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref as any} className="py-24 px-4">
      <div className="container max-w-6xl">
        <div
          className={`text-center space-y-4 mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <p className="text-sm font-semibold tracking-widest uppercase text-primary">
            Témoignages
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
            Ils ont adopté <span className="hero-gradient">MyFinCare</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`relative rounded-2xl border border-border/50 bg-card p-8 space-y-6 shadow-sm transition-all duration-600 ${
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 150 + 200}ms` }}
            >
              <Quote className="h-8 w-8 text-primary/20" />
              <p className="text-muted-foreground leading-relaxed italic">
                "{t.quote}"
              </p>
              <div className="pt-2 border-t border-border/50">
                <p className="font-semibold text-foreground">{t.author}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
                {t.company && (
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {t.company}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
