import { useState, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Download, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ProspectPresentation } from "@/hooks/useProspectPresentations";
import {
  PRESENTATION_STATS,
  EMPLOYEE_QUESTIONS,
  EDUCATION_NEEDS,
  EDUCATION_NEEDS_FOOTER,
  COMPANY_BENEFITS,
  HOW_IT_WORKS,
  EMPLOYEE_ADVANTAGES,
  KEY_FIGURES,
  CLIENT_LOGOS_BANK,
  TESTIMONIALS,
  BUSINESS_MODEL,
  PERLIB_INFO,
  LEGAL_FOOTER,
  FINCARE_PILLARS,
} from "@/data/presentationContent";

interface Props {
  presentation: ProspectPresentation;
}

/**
 * Slide wrapper — fixed 1920×1080, scaled to fit container.
 * Uses inline styles referencing CSS custom properties for theme coherence.
 */
function SlideFrame({ children, variant = "light", className = "" }: {
  children: React.ReactNode;
  variant?: "dark" | "light" | "subtle" | "accent" | "deep";
  className?: string;
}) {
  const variantStyles: Record<string, React.CSSProperties> = {
    dark: {
      background: "linear-gradient(135deg, hsl(var(--primary) / 1) 0%, hsl(var(--secondary) / 1) 100%)",
      color: "hsl(var(--primary-foreground))",
    },
    deep: {
      background: "linear-gradient(135deg, hsl(217 91% 12%) 0%, hsl(271 81% 18%) 100%)",
      color: "hsl(var(--primary-foreground))",
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
      className={`w-[1920px] h-[1080px] flex flex-col justify-center p-24 ${className}`}
      style={variantStyles[variant]}
    >
      {children}
    </div>
  );
}

/* Reusable style constants using CSS vars */
const accentColor = "hsl(var(--accent))";
const primaryColor = "hsl(var(--primary))";
const mutedText = "hsl(var(--muted-foreground))";

function AccentBadge({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
      style={{ background: accentColor, color: "white" }}
    >
      {children}
    </div>
  );
}

function NumberCircle({ n }: { n: number }) {
  return (
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6"
      style={{ background: "var(--gradient-hero)", color: "white" }}
    >
      {n}
    </div>
  );
}

export function PresentationViewer({ presentation }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const p = presentation;

  const slides: React.ReactNode[] = [];

  // ───── 1. HERO ─────
  slides.push(
    <SlideFrame key="hero" variant="deep" className="items-center text-center">
      <div className="flex items-center justify-center gap-12 mb-16">
        {p.prospect_logo_url && (
          <img src={p.prospect_logo_url} alt="" className="h-24 object-contain bg-white rounded-2xl p-4" />
        )}
        <span className="text-5xl font-light opacity-40">×</span>
        <div className="text-5xl font-bold tracking-tight">
          Fin<span style={{ color: accentColor }}>Care</span>
        </div>
      </div>
      <h1 className="text-7xl font-bold leading-tight mb-8">
        Programme d'éducation financière
        {p.prospect_name && (
          <span className="block" style={{ color: accentColor }}>
            pour {p.prospect_name}
          </span>
        )}
      </h1>
      <p className="text-2xl opacity-70">Accompagner vos collaborateurs dans leurs décisions financières</p>
    </SlideFrame>
  );

  // ───── 2. STATS ─────
  const selectedStats = PRESENTATION_STATS.filter(s => (p.selected_stats || []).includes(s.id));
  selectedStats.forEach(stat => {
    slides.push(
      <SlideFrame key={`stat-${stat.id}`} variant="dark" className="items-center text-center">
        <div
          className="text-[180px] font-black leading-none mb-12 bg-clip-text text-transparent"
          style={{ backgroundImage: `linear-gradient(90deg, white 0%, ${accentColor} 100%)` }}
        >
          {stat.figure}
        </div>
        <p className="text-4xl leading-relaxed max-w-[1200px] font-light">{stat.text}</p>
        {stat.source && <p className="text-xl opacity-40 mt-8">{stat.source}</p>}
      </SlideFrame>
    );
  });

  // ───── 3. EMPLOYEE QUESTIONS ─────
  slides.push(
    <SlideFrame key="questions" variant="light">
      <h2 className="text-5xl font-bold mb-16 text-center" style={{ color: "hsl(var(--foreground))" }}>
        Les questions que se posent vos salariés
      </h2>
      <div className="grid grid-cols-2 gap-8">
        {EMPLOYEE_QUESTIONS.map((q, i) => (
          <div
            key={i}
            className="flex items-start gap-6 p-6 rounded-2xl border-2"
            style={{
              borderColor: q.techHighlight && p.prospect_sector === "tech" ? accentColor : "hsl(var(--border))",
              background: q.techHighlight && p.prospect_sector === "tech" ? "hsl(var(--accent) / 0.08)" : "transparent",
            }}
          >
            <span className="text-4xl">{q.icon}</span>
            <p className="text-2xl leading-snug">{q.text}</p>
            {q.techHighlight && p.prospect_sector === "tech" && (
              <span
                className="shrink-0 px-4 py-1 rounded-full text-sm font-bold"
                style={{ background: accentColor, color: "white" }}
              >
                Tech
              </span>
            )}
          </div>
        ))}
      </div>
    </SlideFrame>
  );

  // ───── 4. EDUCATION NEEDS ─────
  slides.push(
    <SlideFrame key="needs" variant="subtle">
      <h2 className="text-5xl font-bold mb-16 text-center" style={{ color: "hsl(var(--foreground))" }}>
        Les 5 besoins en éducation financière
      </h2>
      <div className="flex gap-8 mb-16">
        {EDUCATION_NEEDS.map((need, i) => (
          <div key={i} className="flex-1 rounded-3xl shadow-lg p-8 text-center" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
            <NumberCircle n={i + 1} />
            <p className="text-xl font-medium leading-snug">{need}</p>
          </div>
        ))}
      </div>
      <p className="text-xl text-center max-w-[1400px] mx-auto italic" style={{ color: mutedText }}>
        {EDUCATION_NEEDS_FOOTER}
      </p>
    </SlideFrame>
  );

  // ───── 5. CHALLENGE ─────
  if (p.challenge_text) {
    slides.push(
      <SlideFrame key="challenge" variant="accent" className="items-center text-center">
        <h2 className="text-5xl font-bold mb-12">Le défi de {p.prospect_name || "votre entreprise"}</h2>
        <p className="text-3xl leading-relaxed max-w-[1200px] font-light">{p.challenge_text}</p>
      </SlideFrame>
    );
  }

  // ───── 6. FINCARE DEFINITION ─────
  slides.push(
    <SlideFrame key="fincare" variant="light">
      <h2 className="text-5xl font-bold mb-6 text-center" style={{ color: "hsl(var(--foreground))" }}>
        FinCare, qu'est-ce que c'est ?
      </h2>
      <p className="text-2xl text-center mb-16" style={{ color: mutedText }}>
        Un programme d'éducation financière complet, gratuit et clé en main pour vos collaborateurs
      </p>
      <div className="flex gap-12">
        {FINCARE_PILLARS.map((pillar, i) => (
          <div
            key={i}
            className="flex-1 text-center p-8 rounded-3xl"
            style={{
              background: "hsl(var(--primary) / 0.06)",
              border: "1px solid hsl(var(--primary) / 0.15)",
            }}
          >
            <div className="text-6xl mb-6">{pillar.icon}</div>
            <h3 className="text-3xl font-bold mb-4" style={{ color: "hsl(var(--foreground))" }}>{pillar.title}</h3>
            <p className="text-xl leading-relaxed" style={{ color: mutedText }}>{pillar.description}</p>
          </div>
        ))}
      </div>
    </SlideFrame>
  );

  // ───── 7. BENEFITS ─────
  slides.push(
    <SlideFrame key="benefits" variant="deep">
      <h2 className="text-5xl font-bold mb-16 text-center">Les 6 bénéfices pour l'entreprise</h2>
      <div className="grid grid-cols-3 gap-8">
        {COMPANY_BENEFITS.map((b, i) => (
          <div key={i} className="bg-white/10 backdrop-blur rounded-3xl p-8 border border-white/10">
            <AccentBadge>{i + 1}</AccentBadge>
            <p className="text-xl leading-snug mt-4">{b}</p>
          </div>
        ))}
      </div>
    </SlideFrame>
  );

  // ───── 8. MODULES ─────
  slides.push(
    <SlideFrame key="modules" variant="light" className="items-center text-center">
      <h2 className="text-5xl font-bold mb-8" style={{ color: "hsl(var(--foreground))" }}>
        Les modules sélectionnés pour {p.prospect_name || "vous"}
      </h2>
      <p className="text-2xl" style={{ color: mutedText }}>Formation personnalisée selon vos besoins</p>
      {(p.selected_modules || []).length > 0 ? (
        <div className="grid grid-cols-3 gap-6 mt-12">
          {(p.selected_modules as any[]).map((m: any, i: number) => (
            <div
              key={i}
              className="rounded-2xl p-6 text-left"
              style={{
                background: "hsl(var(--primary) / 0.06)",
                border: "1px solid hsl(var(--primary) / 0.15)",
              }}
            >
              <p className="font-bold text-xl" style={{ color: "hsl(var(--foreground))" }}>
                {m.title || m.name || `Module ${i + 1}`}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xl mt-8" style={{ color: mutedText }}>Modules à définir selon vos priorités</p>
      )}
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
            <h3 className="text-xl font-bold mb-3" style={{ color: "hsl(var(--foreground))" }}>{step.title}</h3>
            <p className="text-base leading-relaxed" style={{ color: mutedText }}>{step.description}</p>
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
          <div
            key={i}
            className="rounded-2xl p-8"
            style={{
              background: i < 3 ? "hsl(var(--primary) / 0.06)" : "hsl(var(--accent) / 0.08)",
              border: `1px solid ${i < 3 ? "hsl(var(--primary) / 0.15)" : "hsl(var(--accent) / 0.2)"}`,
            }}
          >
            <h3 className="text-xl font-bold mb-3" style={{ color: "hsl(var(--foreground))" }}>{a.title}</h3>
            <p className="text-base leading-relaxed" style={{ color: mutedText }}>{a.description}</p>
          </div>
        ))}
      </div>
    </SlideFrame>
  );

  // ───── 11. KEY FIGURES ─────
  const selectedFigures = KEY_FIGURES.filter(f => (p.selected_key_figures || []).includes(f.id));
  if (selectedFigures.length > 0) {
    slides.push(
      <SlideFrame key="figures" variant="deep" className="items-center text-center">
        <h2 className="text-5xl font-bold mb-16">Nos chiffres clés</h2>
        <div className="flex gap-16 justify-center">
          {selectedFigures.map(f => (
            <div key={f.id}>
              <div className="text-7xl font-black mb-4" style={{ color: accentColor }}>{f.value}</div>
              <p className="text-2xl opacity-70">{f.label}</p>
            </div>
          ))}
        </div>
      </SlideFrame>
    );
  }

  // ───── 12. CLIENT LOGOS ─────
  const selectedLogos = CLIENT_LOGOS_BANK.filter(l => (p.selected_client_logos || []).includes(l.id));
  if (selectedLogos.length > 0) {
    slides.push(
      <SlideFrame key="logos" variant="subtle" className="items-center text-center">
        <h2 className="text-5xl font-bold mb-16" style={{ color: "hsl(var(--foreground))" }}>
          Ils nous font confiance
        </h2>
        <div className="flex flex-wrap gap-8 justify-center max-w-[1400px]">
          {selectedLogos.map(l => (
            <div
              key={l.id}
              className="rounded-2xl shadow-md px-10 py-6 text-2xl font-semibold"
              style={{
                background: "hsl(var(--card))",
                color: "hsl(var(--card-foreground))",
                border: "1px solid hsl(var(--border))",
              }}
            >
              {l.name}
            </div>
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
          <div className="text-8xl mb-8" style={{ color: primaryColor }}>"</div>
          <blockquote className="text-3xl leading-relaxed italic mb-12" style={{ color: "hsl(var(--foreground))" }}>
            {t.verbatim}
          </blockquote>
          <div className="text-2xl font-bold" style={{ color: "hsl(var(--foreground))" }}>{t.name}</div>
          <div className="text-xl" style={{ color: mutedText }}>{t.role} — {t.company}</div>
          {t.figures && <div className="text-lg mt-4" style={{ color: primaryColor }}>{t.figures}</div>}
          <div className="text-base mt-4" style={{ color: mutedText }}>{t.context}</div>
        </div>
      </SlideFrame>
    );
  });

  // ───── 14. PERLIB ─────
  slides.push(
    <SlideFrame key="perlib" variant="deep">
      <h2 className="text-4xl font-bold mb-8 text-center max-w-[1400px] mx-auto">{PERLIB_INFO.headline}</h2>
      <div className="flex gap-8 justify-center mb-12">
        {PERLIB_INFO.keyFacts.map((f, i) => (
          <div key={i} className="bg-white/10 rounded-2xl px-8 py-4 text-xl">{f}</div>
        ))}
      </div>
      <div className="text-center">
        <p className="text-2xl font-semibold mb-2" style={{ color: accentColor }}>{PERLIB_INFO.label}</p>
        <p className="text-lg opacity-60">{PERLIB_INFO.subLabel}</p>
        <div className="flex gap-4 justify-center mt-8">
          {PERLIB_INFO.badges.map((b, i) => (
            <span key={i} className="bg-white/10 border border-white/20 rounded-full px-6 py-2 text-sm">{b}</span>
          ))}
        </div>
      </div>
    </SlideFrame>
  );

  // ───── 15. BUSINESS MODEL ─────
  slides.push(
    <SlideFrame key="model" variant="light">
      <h2 className="text-5xl font-bold mb-12 text-center" style={{ color: primaryColor }}>
        {BUSINESS_MODEL.title}
      </h2>
      <div className="space-y-8 max-w-[1400px] mx-auto">
        {BUSINESS_MODEL.paragraphs.map((para, i) => (
          <p key={i} className="text-2xl leading-relaxed" style={{ color: mutedText }}>{para}</p>
        ))}
      </div>
    </SlideFrame>
  );

  // ───── 16. CONTACT ─────
  slides.push(
    <SlideFrame key="contact" variant="deep" className="items-center text-center">
      <h2 className="text-5xl font-bold mb-12">Vous souhaitez avoir plus d'informations sur FinCare ?</h2>
      <p className="text-3xl opacity-70 mb-16">Prenons rendez-vous.</p>
      <div className="bg-white/10 backdrop-blur rounded-3xl p-12 border border-white/10">
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
            className="inline-block mt-8 px-12 py-4 rounded-full text-xl font-bold hover:opacity-90 transition"
            style={{ background: accentColor, color: "white" }}
          >
            Prendre rendez-vous →
          </a>
        )}
      </div>
    </SlideFrame>
  );

  // ───── 17. LEGAL ─────
  slides.push(
    <SlideFrame key="legal" variant="light" className="items-center justify-end pb-16 text-center">
      <p className="text-base max-w-[1400px] leading-relaxed" style={{ color: mutedText, background: "hsl(var(--muted))", padding: "2rem", borderRadius: "1rem" }}>
        {LEGAL_FOOTER}
      </p>
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
    <div className="h-screen flex flex-col" style={{ background: "hsl(var(--foreground))" }}>
      {/* Slide viewport */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden flex items-center justify-center min-h-0">
        <div className="relative" style={{ width: 1920 * scale, height: 1080 * scale }}>
          <div
            className="absolute left-1/2 top-1/2 origin-center rounded-lg overflow-hidden shadow-2xl"
            style={{
              width: 1920,
              height: 1080,
              transform: `translate(-50%, -50%) scale(${scale})`,
            }}
          >
            {slides[currentSlide]}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 py-3 flex items-center justify-between shrink-0" style={{ background: "hsl(var(--foreground) / 0.95)", color: "hsl(var(--background))" }}>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => goTo(currentSlide - 1)} disabled={currentSlide === 0} className="text-white hover:text-white hover:bg-white/10">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <span className="text-sm tabular-nums">{currentSlide + 1} / {totalSlides}</span>
          <Button variant="ghost" size="sm" onClick={() => goTo(currentSlide + 1)} disabled={currentSlide === totalSlides - 1} className="text-white hover:text-white hover:bg-white/10">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="text-white hover:text-white hover:bg-white/10">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 shrink-0" style={{ background: "hsl(var(--foreground) / 0.8)" }}>
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${((currentSlide + 1) / totalSlides) * 100}%`,
            background: "var(--gradient-hero)",
          }}
        />
      </div>
    </div>
  );
}
