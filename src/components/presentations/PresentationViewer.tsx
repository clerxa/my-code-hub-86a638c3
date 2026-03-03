import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProspectPresentation } from "@/hooks/useProspectPresentations";
import { useClientLogos } from "@/hooks/useClientLogos";
import { useProspectEmployeeQuestions } from "@/hooks/useProspectEmployeeQuestions";
import { useExpertBookingSettings } from "@/hooks/useExpertBookingSettings";
import {
  PRESENTATION_STATS,
  EDUCATION_NEEDS,
  EDUCATION_NEEDS_FOOTER,
  COMPANY_BENEFITS,
  HOW_IT_WORKS,
  EMPLOYEE_ADVANTAGES,
  KEY_FIGURES,
  TESTIMONIALS,
  BUSINESS_MODEL,
  LEGAL_FOOTER,
} from "@/data/presentationContent";
import finBear from "@/assets/FinBear.png";

interface Props {
  presentation: ProspectPresentation;
}

/* ─── Slide Frame ─── */
function SlideFrame({ children, variant = "light", className = "" }: {
  children: React.ReactNode;
  variant?: "dark" | "light" | "subtle" | "accent" | "deep" | "hero";
  className?: string;
}) {
  const styles: Record<string, React.CSSProperties> = {
    hero: {
      background: "linear-gradient(135deg, hsl(217 91% 8%) 0%, hsl(271 81% 14%) 40%, hsl(217 91% 18%) 100%)",
      color: "white",
    },
    dark: {
      background: "linear-gradient(135deg, hsl(var(--primary) / 1) 0%, hsl(var(--secondary) / 1) 100%)",
      color: "hsl(var(--primary-foreground))",
    },
    deep: {
      background: "linear-gradient(135deg, hsl(217 91% 12%) 0%, hsl(271 81% 18%) 100%)",
      color: "white",
    },
    light: {
      background: "hsl(var(--card))",
      color: "hsl(var(--card-foreground))",
    },
    subtle: {
      background: "hsl(var(--muted))",
      color: "hsl(var(--card-foreground))",
    },
    accent: {
      background: "linear-gradient(135deg, hsl(var(--secondary) / 1) 0%, hsl(var(--primary) / 1) 100%)",
      color: "hsl(var(--primary-foreground))",
    },
  };

  return (
    <div
      className={`w-[1920px] h-[1080px] flex flex-col justify-center p-24 relative overflow-hidden ${className}`}
      style={styles[variant]}
    >
      {/* Subtle animated gradient overlay for depth */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.05) 0%, transparent 60%)"
      }} />
      {/* Glass dots pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />
      <div className="relative z-10 flex flex-col justify-center flex-1">
        {children}
      </div>
    </div>
  );
}

const accentColor = "hsl(var(--accent))";
const primaryColor = "hsl(var(--primary))";
const mutedText = "hsl(var(--muted-foreground))";

/* ─── Glass Card ─── */
function GlassCard({ children, className = "", dark = false }: { children: React.ReactNode; className?: string; dark?: boolean }) {
  return (
    <div
      className={`rounded-3xl p-8 backdrop-blur-xl transition-all duration-500 ${className}`}
      style={{
        background: dark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.7)",
        border: `1px solid ${dark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.06)"}`,
        boxShadow: dark
          ? "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)"
          : "0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.9)",
      }}
    >
      {children}
    </div>
  );
}

function AccentBadge({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold"
      style={{ background: "var(--gradient-hero)", color: "white", boxShadow: "0 4px 15px rgba(99,102,241,0.3)" }}
    >
      {children}
    </div>
  );
}

function NumberCircle({ n }: { n: number }) {
  return (
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6"
      style={{ background: "var(--gradient-hero)", color: "white", boxShadow: "0 4px 15px rgba(99,102,241,0.3)" }}
    >
      {n}
    </div>
  );
}

/* ─── Floating Mascot ─── */
function FloatingMascot({ size = 120, position = "bottom-right" }: { size?: number; position?: string }) {
  const posStyles: Record<string, React.CSSProperties> = {
    "bottom-right": { position: "absolute", bottom: 40, right: 40 },
    "bottom-left": { position: "absolute", bottom: 40, left: 40 },
    "top-right": { position: "absolute", top: 40, right: 40 },
  };
  return (
    <img
      src={finBear}
      alt="MyFinCare Mascotte"
      style={{
        ...posStyles[position],
        width: size,
        height: size,
        objectFit: "contain",
        filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.2))",
        animation: "float 3s ease-in-out infinite",
      }}
    />
  );
}

/* ─── Gradient Text ─── */
function GradientText({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`bg-clip-text text-transparent ${className}`}
      style={{ backgroundImage: "var(--gradient-superhero)" }}
    >
      {children}
    </span>
  );
}

/* ─── Main Component ─── */
export function PresentationViewer({ presentation }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const p = presentation;

  // Unified data sources
  const { data: clientLogos } = useClientLogos();
  const { data: employeeQuestions } = useProspectEmployeeQuestions();
  const { data: expertSettings } = useExpertBookingSettings();

  const slides: React.ReactNode[] = [];

  // ───── 1. HERO ─────
  slides.push(
    <SlideFrame key="hero" variant="hero" className="items-center text-center">
      {/* Glow circles */}
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full opacity-20 blur-3xl" style={{ background: "hsl(var(--primary))" }} />
      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] rounded-full opacity-15 blur-3xl" style={{ background: "hsl(var(--secondary))" }} />
      <div className="absolute top-[30%] right-[20%] w-[300px] h-[300px] rounded-full opacity-10 blur-3xl" style={{ background: "hsl(var(--accent))" }} />

      <div className="flex items-center justify-center gap-12 mb-16">
        {p.prospect_logo_url && (
          <GlassCard dark className="!p-4 !rounded-2xl">
            <img src={p.prospect_logo_url} alt="" className="h-20 object-contain" />
          </GlassCard>
        )}
        <span className="text-5xl font-light opacity-30">×</span>
        <GlassCard dark className="!p-4 !rounded-2xl flex items-center gap-3">
          <img src={finBear} alt="MyFinCare" className="h-16 w-16 object-contain" />
          <div className="text-4xl font-bold tracking-tight">
            My<GradientText>FinCare</GradientText>
          </div>
        </GlassCard>
      </div>
      <h1 className="text-7xl font-bold leading-tight mb-8">
        Programme d'éducation financière
        {p.prospect_name && (
          <span className="block mt-4">
            <GradientText>pour {p.prospect_name}</GradientText>
          </span>
        )}
      </h1>
      <p className="text-2xl opacity-60 max-w-[1000px] mx-auto">Accompagner vos collaborateurs dans leurs décisions financières</p>
      <FloatingMascot size={160} position="bottom-right" />
    </SlideFrame>
  );

  // ───── 2. STATS ─────
  const selectedStats = PRESENTATION_STATS.filter(s => (p.selected_stats || []).includes(s.id));
  selectedStats.forEach(stat => {
    slides.push(
      <SlideFrame key={`stat-${stat.id}`} variant="dark" className="items-center text-center">
        <div className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl" style={{ background: "hsl(var(--accent))" }} />
        <div
          className="text-[180px] font-black leading-none mb-12"
          style={{
            backgroundImage: "linear-gradient(135deg, white 0%, hsl(var(--accent)) 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {stat.figure}
        </div>
        <p className="text-4xl leading-relaxed max-w-[1200px] font-light">{stat.text}</p>
        {stat.source && <p className="text-xl opacity-40 mt-8">{stat.source}</p>}
      </SlideFrame>
    );
  });

  // ───── 3. EMPLOYEE QUESTIONS (from CMS) ─────
  const questions = employeeQuestions || [];
  if (questions.length > 0) {
    slides.push(
      <SlideFrame key="questions" variant="light">
        <h2 className="text-5xl font-bold mb-16 text-center" style={{ color: "hsl(var(--foreground))" }}>
          Les questions que se posent vos salariés
        </h2>
        <div className="grid grid-cols-2 gap-6">
          {questions.map((q, i) => (
            <GlassCard key={q.id} className="flex items-start gap-6 !p-6">
              <span className="text-4xl">{q.icon}</span>
              <p className="text-2xl leading-snug" style={{ color: "hsl(var(--foreground))" }}>{q.text}</p>
              {q.tech_highlight && p.prospect_sector === "tech" && (
                <span
                  className="shrink-0 px-4 py-1 rounded-full text-sm font-bold"
                  style={{ background: "var(--gradient-hero)", color: "white" }}
                >
                  Tech
                </span>
              )}
            </GlassCard>
          ))}
        </div>
        <FloatingMascot size={100} position="bottom-right" />
      </SlideFrame>
    );
  }

  // ───── 4. EDUCATION NEEDS ─────
  slides.push(
    <SlideFrame key="needs" variant="subtle">
      <h2 className="text-5xl font-bold mb-16 text-center" style={{ color: "hsl(var(--foreground))" }}>
        Les 5 besoins en éducation financière
      </h2>
      <div className="flex gap-8 mb-16">
        {EDUCATION_NEEDS.map((need, i) => (
          <GlassCard key={i} className="flex-1 text-center">
            <NumberCircle n={i + 1} />
            <p className="text-xl font-medium leading-snug" style={{ color: "hsl(var(--foreground))" }}>{need}</p>
          </GlassCard>
        ))}
      </div>
      <p className="text-xl text-center max-w-[1400px] mx-auto italic" style={{ color: mutedText }}>
        {EDUCATION_NEEDS_FOOTER}
      </p>
    </SlideFrame>
  );

  // ───── 5. CHALLENGE ─────
  const challengeBullets = (p.challenge_bullets || []) as string[];
  if (p.challenge_text || challengeBullets.length > 0) {
    slides.push(
      <SlideFrame key="challenge" variant="accent" className="items-center text-center">
        <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full opacity-20 blur-3xl" style={{ background: "white" }} />
        <h2 className="text-5xl font-bold mb-12">Le défi de {p.prospect_name || "votre entreprise"}</h2>
        {p.challenge_text && <p className="text-3xl leading-relaxed max-w-[1200px] font-light mb-12">{p.challenge_text}</p>}
        {challengeBullets.length > 0 && (
          <div className="space-y-4 max-w-[1000px] mx-auto text-left">
            {challengeBullets.map((b, i) => (
              <GlassCard key={i} dark className="flex items-center gap-6 !p-5 !rounded-2xl">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold" style={{ background: "rgba(255,255,255,0.2)" }}>
                  {i + 1}
                </div>
                <p className="text-2xl">{b}</p>
              </GlassCard>
            ))}
          </div>
        )}
      </SlideFrame>
    );
  }

  // ───── 6. FINCARE DEFINITION + MyFinCare App card ─────
  const FINCARE_PILLARS = [
    { title: 'Webinars', description: "Des sessions live animées par des experts certifiés, sur des thématiques concrètes.", icon: '🎓' },
    { title: 'Ressources', description: "Modules interactifs, simulateurs et contenus pédagogiques accessibles 24/7.", icon: '📚' },
    { title: 'Experts', description: "Des rendez-vous individuels gratuits avec des conseillers financiers indépendants.", icon: '👨‍💼' },
    { title: 'Application MyFinCare', description: "Une application dédiée pour suivre sa progression, accéder aux outils et prendre rendez-vous.", icon: '📱' },
  ];

  slides.push(
    <SlideFrame key="fincare" variant="light">
      <h2 className="text-5xl font-bold mb-6 text-center" style={{ color: "hsl(var(--foreground))" }}>
        My<GradientText>FinCare</GradientText>, qu'est-ce que c'est ?
      </h2>
      <p className="text-2xl text-center mb-16" style={{ color: mutedText }}>
        Un programme d'éducation financière complet, gratuit et clé en main pour vos collaborateurs
      </p>
      <div className="grid grid-cols-2 gap-8">
        {FINCARE_PILLARS.map((pillar, i) => (
          <GlassCard key={i} className="text-center">
            <div className="text-6xl mb-6">{pillar.icon}</div>
            <h3 className="text-2xl font-bold mb-4" style={{ color: "hsl(var(--foreground))" }}>{pillar.title}</h3>
            <p className="text-lg leading-relaxed" style={{ color: mutedText }}>{pillar.description}</p>
          </GlassCard>
        ))}
      </div>
      <FloatingMascot size={100} position="bottom-right" />
    </SlideFrame>
  );

  // ───── 7. BENEFITS ─────
  slides.push(
    <SlideFrame key="benefits" variant="deep">
      <div className="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full opacity-15 blur-3xl" style={{ background: "hsl(var(--accent))" }} />
      <h2 className="text-5xl font-bold mb-16 text-center">Les 6 bénéfices pour l'entreprise</h2>
      <div className="grid grid-cols-3 gap-6">
        {COMPANY_BENEFITS.map((b, i) => (
          <GlassCard key={i} dark>
            <AccentBadge>{i + 1}</AccentBadge>
            <p className="text-xl leading-snug mt-4">{b}</p>
          </GlassCard>
        ))}
      </div>
    </SlideFrame>
  );

  // ───── 8. MODULES (from presentation data) ─────
  slides.push(
    <SlideFrame key="modules" variant="light" className="items-center text-center">
      <h2 className="text-5xl font-bold mb-4" style={{ color: "hsl(var(--foreground))" }}>
        Les modules sélectionnés pour <GradientText>{p.prospect_name || "vous"}</GradientText>
      </h2>
      <p className="text-2xl mb-12" style={{ color: mutedText }}>Formation personnalisée selon vos besoins</p>
      {(p.selected_modules || []).length > 0 ? (
        <div className="grid grid-cols-3 gap-6">
          {(p.selected_modules as any[]).map((m: any, i: number) => (
            <GlassCard key={i} className="text-left">
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0"
                  style={{ background: "var(--gradient-hero)", color: "white" }}
                >
                  {i + 1}
                </div>
                <p className="font-bold text-xl" style={{ color: "hsl(var(--foreground))" }}>
                  {m.title || m.name || `Module ${i + 1}`}
                </p>
              </div>
              {m.description && (
                <p className="text-base mt-4 leading-relaxed" style={{ color: mutedText }}>{m.description}</p>
              )}
            </GlassCard>
          ))}
        </div>
      ) : (
        <p className="text-xl mt-8" style={{ color: mutedText }}>Modules à définir selon vos priorités</p>
      )}
      <FloatingMascot size={90} position="bottom-right" />
    </SlideFrame>
  );

  // ───── 9. HOW IT WORKS ─────
  slides.push(
    <SlideFrame key="how" variant="subtle">
      <h2 className="text-5xl font-bold mb-16 text-center" style={{ color: "hsl(var(--foreground))" }}>
        Comment ça fonctionne
      </h2>
      <div className="flex gap-4 items-start">
        {HOW_IT_WORKS.map((step, i) => (
          <div key={i} className="flex-1 text-center">
            <NumberCircle n={step.step} />
            <GlassCard>
              <h3 className="text-xl font-bold mb-3" style={{ color: "hsl(var(--foreground))" }}>{step.title}</h3>
              <p className="text-base leading-relaxed" style={{ color: mutedText }}>{step.description}</p>
            </GlassCard>
          </div>
        ))}
      </div>
    </SlideFrame>
  );

  // ───── 10. EMPLOYEE ADVANTAGES ─────
  slides.push(
    <SlideFrame key="advantages" variant="light">
      <h2 className="text-5xl font-bold mb-12 text-center" style={{ color: "hsl(var(--foreground))" }}>
        Des avantages supplémentaires pour vos salariés
      </h2>
      <div className="grid grid-cols-3 gap-6">
        {EMPLOYEE_ADVANTAGES.map((a, i) => (
          <GlassCard key={i}>
            <h3 className="text-xl font-bold mb-3" style={{ color: "hsl(var(--foreground))" }}>{a.title}</h3>
            <p className="text-base leading-relaxed" style={{ color: mutedText }}>{a.description}</p>
          </GlassCard>
        ))}
      </div>
    </SlideFrame>
  );

  // ───── 11. KEY FIGURES ─────
  const selectedFigures = KEY_FIGURES.filter(f => (p.selected_key_figures || []).includes(f.id));
  if (selectedFigures.length > 0) {
    slides.push(
      <SlideFrame key="figures" variant="deep" className="items-center text-center">
        <div className="absolute top-[-100px] left-[30%] w-[500px] h-[500px] rounded-full opacity-15 blur-3xl" style={{ background: "hsl(var(--accent))" }} />
        <h2 className="text-5xl font-bold mb-16">Nos chiffres clés</h2>
        <div className="flex gap-12 justify-center">
          {selectedFigures.map(f => (
            <GlassCard key={f.id} dark className="text-center min-w-[200px]">
              <div className="text-6xl font-black mb-4" style={{ color: accentColor }}>{f.value}</div>
              <p className="text-xl opacity-70">{f.label}</p>
            </GlassCard>
          ))}
        </div>
      </SlideFrame>
    );
  }

  // ───── 12. CLIENT LOGOS (from DB) ─────
  const logos = clientLogos || [];
  if (logos.length > 0) {
    slides.push(
      <SlideFrame key="logos" variant="subtle" className="items-center text-center">
        <h2 className="text-5xl font-bold mb-16" style={{ color: "hsl(var(--foreground))" }}>
          Ils nous font confiance
        </h2>
        <div className="flex flex-wrap gap-8 justify-center max-w-[1600px]">
          {logos.map(l => (
            <GlassCard key={l.id} className="flex items-center gap-4 !p-5 !rounded-2xl">
              <img
                src={l.logo_url}
                alt={l.name}
                className="h-12 w-12 object-contain rounded-lg bg-white p-1"
              />
              <span className="text-xl font-semibold" style={{ color: "hsl(var(--foreground))" }}>{l.name}</span>
            </GlassCard>
          ))}
        </div>
      </SlideFrame>
    );
  }

  // ───── 13. TESTIMONIALS ─────
  const selectedTestimonialsList = TESTIMONIALS.filter(t => (p.selected_testimonials || []).includes(t.id));
  selectedTestimonialsList.forEach(t => {
    slides.push(
      <SlideFrame key={`testi-${t.id}`} variant="light" className="items-center">
        <div className="max-w-[1400px] mx-auto text-center">
          <div className="text-8xl mb-8" style={{ color: primaryColor, opacity: 0.3 }}>"</div>
          <blockquote className="text-3xl leading-relaxed italic mb-12" style={{ color: "hsl(var(--foreground))" }}>
            {t.verbatim}
          </blockquote>
          <div className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{t.name}</div>
          <div className="text-xl" style={{ color: mutedText }}>{t.role} — {t.company}</div>
          {t.figures && (
            <GlassCard className="inline-block !p-4 !rounded-2xl mt-6">
              <span style={{ color: primaryColor }} className="text-lg font-semibold">{t.figures}</span>
            </GlassCard>
          )}
          <div className="text-base mt-4" style={{ color: mutedText }}>{t.context}</div>
        </div>
      </SlideFrame>
    );
  });

  // ───── 14. PERLIB (from expert booking settings) ─────
  const perlibCerts = expertSettings
    ? [
      expertSettings.testimonial_enabled ? `${expertSettings.testimonial_author} — ${expertSettings.testimonial_role}` : null,
    ].filter(Boolean)
    : [];

  const expertBenefits = (expertSettings?.benefits as any[] || []);
  const expertExpertises = (expertSettings?.expertises as any[] || []);

  slides.push(
    <SlideFrame key="perlib" variant="deep">
      <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] rounded-full opacity-15 blur-3xl" style={{ background: "hsl(var(--accent))" }} />
      <h2 className="text-4xl font-bold mb-8 text-center max-w-[1400px] mx-auto">
        Perlib est la 1ère entreprise en France à proposer un programme d'éducation financière à destination des salariés sans budget.
      </h2>
      <div className="flex gap-6 justify-center mb-10 flex-wrap">
        {['Créé en 2021', '4,9/5 sur près de 700 avis Google', '6 000 personnes accompagnées', '40 collaborateurs et experts'].map((f, i) => (
          <GlassCard key={i} dark className="!p-4 !rounded-2xl">
            <span className="text-lg">{f}</span>
          </GlassCard>
        ))}
      </div>
      {expertExpertises.length > 0 && (
        <div className="mt-6">
          <p className="text-center text-xl font-semibold mb-6 opacity-80">Nos expertises</p>
          <div className="grid grid-cols-4 gap-4 max-w-[1400px] mx-auto">
            {expertExpertises.slice(0, 8).map((exp: any, i: number) => (
              <GlassCard key={i} dark className="!p-4 !rounded-2xl text-center">
                <p className="text-base font-medium">{exp.title}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
      <div className="text-center mt-8">
        <p className="text-2xl font-semibold" style={{ color: accentColor }}>Cabinet indépendant</p>
        <div className="flex gap-4 justify-center mt-4 flex-wrap">
          {['ORIAS', 'ACPR', 'AMF', 'Challenges 2023', 'Challenges 2024', 'Challenges 2025'].map((b, i) => (
            <GlassCard key={i} dark className="!py-2 !px-5 !rounded-full !backdrop-blur-sm">
              <span className="text-sm">{b}</span>
            </GlassCard>
          ))}
        </div>
      </div>
    </SlideFrame>
  );

  // ───── 15. BUSINESS MODEL ─────
  slides.push(
    <SlideFrame key="model" variant="light">
      <h2 className="text-5xl font-bold mb-12 text-center">
        <GradientText>{BUSINESS_MODEL.title}</GradientText>
      </h2>
      <div className="space-y-6 max-w-[1400px] mx-auto">
        {BUSINESS_MODEL.paragraphs.map((para, i) => (
          <GlassCard key={i}>
            <p className="text-2xl leading-relaxed" style={{ color: mutedText }}>{para}</p>
          </GlassCard>
        ))}
      </div>
      <FloatingMascot size={100} position="bottom-right" />
    </SlideFrame>
  );

  // ───── 16. CONTACT ─────
  slides.push(
    <SlideFrame key="contact" variant="hero" className="items-center text-center">
      <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full opacity-20 blur-3xl" style={{ background: "hsl(var(--primary))" }} />
      <div className="absolute bottom-[-150px] right-[-150px] w-[400px] h-[400px] rounded-full opacity-15 blur-3xl" style={{ background: "hsl(var(--accent))" }} />
      <h2 className="text-5xl font-bold mb-8">
        Vous souhaitez en savoir plus sur <GradientText>MyFinCare</GradientText> ?
      </h2>
      <p className="text-3xl opacity-60 mb-16">Prenons rendez-vous.</p>
      <GlassCard dark className="max-w-[700px] mx-auto text-center">
        <p className="text-3xl font-bold">{p.contact_name}</p>
        <p className="text-xl opacity-70 mb-6">{p.contact_role}</p>
        <div className="flex gap-8 justify-center text-xl">
          <span>{p.contact_phone}</span>
          <span>{p.contact_email}</span>
        </div>
        {p.contact_booking_url && (
          <a
            href={p.contact_booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-8 px-12 py-4 rounded-full text-xl font-bold hover:opacity-90 transition-all hover:scale-105"
            style={{ background: "var(--gradient-legend)", color: "white", boxShadow: "var(--shadow-glow)" }}
          >
            Prendre rendez-vous →
          </a>
        )}
      </GlassCard>
      <FloatingMascot size={140} position="bottom-left" />
    </SlideFrame>
  );

  // ───── 17. LEGAL ─────
  slides.push(
    <SlideFrame key="legal" variant="light" className="items-center justify-end pb-16 text-center">
      <GlassCard>
        <p className="text-base max-w-[1400px] leading-relaxed" style={{ color: mutedText }}>
          {LEGAL_FOOTER}
        </p>
      </GlassCard>
    </SlideFrame>
  );

  const totalSlides = slides.length;

  const goTo = useCallback((idx: number) => {
    setCurrentSlide(Math.max(0, Math.min(idx, totalSlides - 1)));
  }, [totalSlides]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") goTo(currentSlide + 1);
      if (e.key === "ArrowLeft") goTo(currentSlide - 1);
      if (e.key === "Escape" && isFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
      if (e.key === "f" || e.key === "F5") {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentSlide, goTo, isFullscreen, toggleFullscreen]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const calc = () => {
      const rect = el.getBoundingClientRect();
      const sx = rect.width / 1920;
      const sy = rect.height / 1080;
      setScale(Math.min(sx, sy, 1));
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="h-screen flex flex-col" style={{ background: "hsl(217 91% 6%)" }}>
      {/* CSS for float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
      `}</style>

      {/* Slide viewport */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden flex items-center justify-center min-h-0">
        <div className="relative" style={{ width: 1920 * scale, height: 1080 * scale }}>
          <div
            className="absolute left-1/2 top-1/2 origin-center rounded-xl overflow-hidden"
            style={{
              width: 1920,
              height: 1080,
              transform: `translate(-50%, -50%) scale(${scale})`,
              boxShadow: "0 25px 80px rgba(0,0,0,0.5)",
            }}
          >
            {slides[currentSlide]}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-3 flex items-center justify-between shrink-0" style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => goTo(currentSlide - 1)} disabled={currentSlide === 0} className="text-white hover:text-white hover:bg-white/10">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm tabular-nums text-white/70">{currentSlide + 1} / {totalSlides}</span>
          <Button variant="ghost" size="sm" onClick={() => goTo(currentSlide + 1)} disabled={currentSlide === totalSlides - 1} className="text-white hover:text-white hover:bg-white/10">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {/* Slide dots */}
          <div className="flex gap-1 mr-4">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  background: i === currentSlide ? "hsl(var(--accent))" : "rgba(255,255,255,0.2)",
                  transform: i === currentSlide ? "scale(1.5)" : "scale(1)",
                }}
              />
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-white hover:text-white hover:bg-white/10">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 shrink-0" style={{ background: "rgba(255,255,255,0.05)" }}>
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${((currentSlide + 1) / totalSlides) * 100}%`,
            background: "var(--gradient-superhero)",
          }}
        />
      </div>
    </div>
  );
}
