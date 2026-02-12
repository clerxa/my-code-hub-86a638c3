import { LandingHero } from "@/components/landing/LandingHero";
import { LandingProblems } from "@/components/landing/LandingProblems";
import { LandingSolution } from "@/components/landing/LandingSolution";
import { LandingSocialProof } from "@/components/landing/LandingSocialProof";
import { LandingDemo } from "@/components/landing/LandingDemo";
import { LandingBenefits } from "@/components/landing/LandingBenefits";
import { LandingComparison } from "@/components/landing/LandingComparison";
import { LandingFAQ } from "@/components/landing/LandingFAQ";
import { LandingCTAFinal } from "@/components/landing/LandingCTAFinal";

interface LandingPreviewProps {
  hero: any;
  problems: any[];
  solution: any;
  socialProof: any;
  demo: any;
  benefits: any;
  comparison: any;
  faq: any[];
  ctaFinal: any;
}

export const LandingPreview = ({
  hero,
  problems,
  solution,
  socialProof,
  demo,
  benefits,
  comparison,
  faq,
  ctaFinal,
}: LandingPreviewProps) => {
  return (
    <div className="space-y-0 overflow-auto h-[calc(100vh-12rem)] bg-background">
      {/* Hero */}
      {hero && (
        <LandingHero
          title={hero.title}
          subtitle={hero.subtitle}
          ctaPrimary={hero.ctaPrimary}
          ctaSecondary={hero.ctaSecondary}
          image={hero.image}
          clientLogos={hero.clientLogos}
        />
      )}
      
      {/* Problems */}
      {problems && problems.length > 0 && <LandingProblems problems={problems} />}
      
      {/* Solution */}
      {solution && solution.pillars && (
        <LandingSolution
          title={solution.title || ""}
          description={solution.description || ""}
          pillars={solution.pillars || []}
        />
      )}
      
      {/* Social Proof */}
      {socialProof && socialProof.companies && (
        <LandingSocialProof
          title={socialProof.title || ""}
          companies={socialProof.companies || []}
          testimonials={socialProof.testimonials || []}
          stats={socialProof.stats || []}
        />
      )}
      
      {/* Demo */}
      {demo && (
        <LandingDemo
          title={demo.title}
          description={demo.description}
          screenshots={demo.screenshots}
          layout={demo.layout}
        />
      )}
      
      {/* Benefits */}
      {benefits && benefits.items && (
        <LandingBenefits
          title={benefits.title || ""}
          items={benefits.items || []}
        />
      )}
      
      {/* Comparison */}
      {comparison && (
        <LandingComparison
          title={comparison.title}
          enabled={comparison.enabled}
          rows={comparison.rows}
        />
      )}
      
      {/* FAQ */}
      {faq && faq.length > 0 && <LandingFAQ items={faq} />}
      
      {/* CTA Final */}
      {ctaFinal && (
        <LandingCTAFinal
          title={ctaFinal.title}
          subtitle={ctaFinal.subtitle}
          cta={ctaFinal.cta}
        />
      )}
    </div>
  );
};