import { useState, useCallback, useEffect } from "react";
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

// Slide component wrapper — renders at 1920x1080 and scales
function SlideFrame({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`w-[1920px] h-[1080px] flex flex-col justify-center p-24 ${className}`}>
      {children}
    </div>
  );
}

export function PresentationViewer({ presentation }: Props) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const p = presentation;

  // Build slides array
  const slides: React.ReactNode[] = [];

  // 1. Hero
  slides.push(
    <SlideFrame key="hero" className="bg-gradient-to-br from-[hsl(217,91%,15%)] to-[hsl(271,81%,20%)] text-white items-center text-center">
      <div className="flex items-center justify-center gap-12 mb-16">
        {p.prospect_logo_url && <img src={p.prospect_logo_url} alt="" className="h-24 object-contain bg-white rounded-2xl p-4" />}
        <span className="text-5xl font-light text-white/40">×</span>
        <div className="text-5xl font-bold tracking-tight">Fin<span className="text-[hsl(38,92%,50%)]">Care</span></div>
      </div>
      <h1 className="text-7xl font-bold leading-tight mb-8">
        Programme d'éducation financière
        {p.prospect_name && <span className="block text-[hsl(38,92%,50%)]">pour {p.prospect_name}</span>}
      </h1>
      <p className="text-2xl text-white/70">Accompagner vos collaborateurs dans leurs décisions financières</p>
    </SlideFrame>
  );

  // 2. Stats
  const selectedStats = PRESENTATION_STATS.filter(s => (p.selected_stats || []).includes(s.id));
  selectedStats.forEach(stat => {
    slides.push(
      <SlideFrame key={`stat-${stat.id}`} className="bg-gradient-to-br from-[hsl(217,91%,25%)] to-[hsl(271,81%,30%)] text-white items-center text-center">
        <div className="text-[180px] font-black leading-none mb-12 bg-clip-text text-transparent bg-gradient-to-r from-white to-[hsl(38,92%,50%)]">
          {stat.figure}
        </div>
        <p className="text-4xl leading-relaxed max-w-[1200px] font-light">{stat.text}</p>
        {stat.source && <p className="text-xl text-white/40 mt-8">{stat.source}</p>}
      </SlideFrame>
    );
  });

  // 3. Employee questions
  slides.push(
    <SlideFrame key="questions" className="bg-white text-gray-900">
      <h2 className="text-5xl font-bold mb-16 text-center">Les questions que se posent vos salariés</h2>
      <div className="grid grid-cols-2 gap-8">
        {EMPLOYEE_QUESTIONS.map((q, i) => (
          <div key={i} className={`flex items-start gap-6 p-6 rounded-2xl border-2 ${q.techHighlight && p.prospect_sector === "tech" ? "border-[hsl(38,92%,50%)] bg-amber-50" : "border-gray-200"}`}>
            <span className="text-4xl">{q.icon}</span>
            <p className="text-2xl leading-snug">{q.text}</p>
            {q.techHighlight && p.prospect_sector === "tech" && (
              <span className="shrink-0 px-4 py-1 rounded-full bg-[hsl(38,92%,50%)] text-white text-sm font-bold">Tech</span>
            )}
          </div>
        ))}
      </div>
    </SlideFrame>
  );

  // 4. Education needs
  slides.push(
    <SlideFrame key="needs" className="bg-gradient-to-br from-gray-50 to-white text-gray-900">
      <h2 className="text-5xl font-bold mb-16 text-center">Les 5 besoins en éducation financière</h2>
      <div className="flex gap-8 mb-16">
        {EDUCATION_NEEDS.map((need, i) => (
          <div key={i} className="flex-1 bg-white rounded-3xl shadow-lg p-8 border border-gray-100 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(217,91%,60%)] to-[hsl(271,81%,56%)] text-white flex items-center justify-center text-3xl font-bold mx-auto mb-6">{i + 1}</div>
            <p className="text-xl font-medium leading-snug">{need}</p>
          </div>
        ))}
      </div>
      <p className="text-xl text-gray-500 text-center max-w-[1400px] mx-auto italic">{EDUCATION_NEEDS_FOOTER}</p>
    </SlideFrame>
  );

  // 5. Challenge
  if (p.challenge_text) {
    slides.push(
      <SlideFrame key="challenge" className="bg-gradient-to-br from-[hsl(0,84%,60%)] to-[hsl(271,81%,30%)] text-white items-center text-center">
        <h2 className="text-5xl font-bold mb-12">Le défi de {p.prospect_name || "votre entreprise"}</h2>
        <p className="text-3xl leading-relaxed max-w-[1200px] font-light">{p.challenge_text}</p>
      </SlideFrame>
    );
  }

  // 6. FinCare definition
  slides.push(
    <SlideFrame key="fincare" className="bg-white text-gray-900">
      <h2 className="text-5xl font-bold mb-6 text-center">FinCare, qu'est-ce que c'est ?</h2>
      <p className="text-2xl text-gray-500 text-center mb-16">Un programme d'éducation financière complet, gratuit et clé en main pour vos collaborateurs</p>
      <div className="flex gap-12">
        {FINCARE_PILLARS.map((pillar, i) => (
          <div key={i} className="flex-1 text-center p-8 bg-gradient-to-b from-blue-50 to-white rounded-3xl border border-blue-100">
            <div className="text-6xl mb-6">{pillar.icon}</div>
            <h3 className="text-3xl font-bold mb-4">{pillar.title}</h3>
            <p className="text-xl text-gray-600 leading-relaxed">{pillar.description}</p>
          </div>
        ))}
      </div>
    </SlideFrame>
  );

  // 7. Benefits
  slides.push(
    <SlideFrame key="benefits" className="bg-gradient-to-br from-[hsl(217,91%,15%)] to-[hsl(271,81%,20%)] text-white">
      <h2 className="text-5xl font-bold mb-16 text-center">Les 6 bénéfices pour l'entreprise</h2>
      <div className="grid grid-cols-3 gap-8">
        {COMPANY_BENEFITS.map((b, i) => (
          <div key={i} className="bg-white/10 backdrop-blur rounded-3xl p-8 border border-white/10">
            <div className="w-12 h-12 rounded-full bg-[hsl(38,92%,50%)] text-white flex items-center justify-center text-xl font-bold mb-4">{i + 1}</div>
            <p className="text-xl leading-snug">{b}</p>
          </div>
        ))}
      </div>
    </SlideFrame>
  );

  // 8. Modules (placeholder)
  slides.push(
    <SlideFrame key="modules" className="bg-white text-gray-900 items-center text-center">
      <h2 className="text-5xl font-bold mb-8">Les modules sélectionnés pour {p.prospect_name || "vous"}</h2>
      <p className="text-2xl text-gray-500">Formation personnalisée selon vos besoins</p>
      {(p.selected_modules || []).length > 0 ? (
        <div className="grid grid-cols-3 gap-6 mt-12">
          {(p.selected_modules as any[]).map((m: any, i: number) => (
            <div key={i} className="bg-blue-50 rounded-2xl p-6 text-left border border-blue-100">
              <p className="font-bold text-xl">{m.title || m.name || `Module ${i + 1}`}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xl text-gray-400 mt-8">Modules à définir selon vos priorités</p>
      )}
    </SlideFrame>
  );

  // 9. How it works
  slides.push(
    <SlideFrame key="how" className="bg-gradient-to-br from-gray-50 to-white text-gray-900">
      <h2 className="text-5xl font-bold mb-16 text-center">Comment ça fonctionne</h2>
      <div className="flex gap-4 items-start">
        {HOW_IT_WORKS.map((step, i) => (
          <div key={i} className="flex-1 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(217,91%,60%)] to-[hsl(271,81%,56%)] text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6">{step.step}</div>
            <h3 className="text-xl font-bold mb-3">{step.title}</h3>
            <p className="text-base text-gray-600 leading-relaxed">{step.description}</p>
            {i < HOW_IT_WORKS.length - 1 && <div className="hidden" />}
          </div>
        ))}
      </div>
    </SlideFrame>
  );

  // 10. Employee advantages
  slides.push(
    <SlideFrame key="advantages" className="bg-white text-gray-900">
      <h2 className="text-5xl font-bold mb-12 text-center">Des avantages supplémentaires pour vos salariés</h2>
      <div className="grid grid-cols-3 gap-6">
        {EMPLOYEE_ADVANTAGES.map((a, i) => (
          <div key={i} className={`rounded-2xl p-8 border ${i < 3 ? "border-blue-200 bg-blue-50" : "border-amber-200 bg-amber-50"}`}>
            <h3 className="text-xl font-bold mb-3">{a.title}</h3>
            <p className="text-base text-gray-600 leading-relaxed">{a.description}</p>
          </div>
        ))}
      </div>
    </SlideFrame>
  );

  // 11. Key figures
  const selectedFigures = KEY_FIGURES.filter(f => (p.selected_key_figures || []).includes(f.id));
  if (selectedFigures.length > 0) {
    slides.push(
      <SlideFrame key="figures" className="bg-gradient-to-br from-[hsl(217,91%,15%)] to-[hsl(271,81%,20%)] text-white items-center text-center">
        <h2 className="text-5xl font-bold mb-16">Nos chiffres clés</h2>
        <div className="flex gap-16 justify-center">
          {selectedFigures.map(f => (
            <div key={f.id}>
              <div className="text-7xl font-black text-[hsl(38,92%,50%)] mb-4">{f.value}</div>
              <p className="text-2xl text-white/70">{f.label}</p>
            </div>
          ))}
        </div>
      </SlideFrame>
    );
  }

  // 12. Client logos
  const selectedLogos = CLIENT_LOGOS_BANK.filter(l => (p.selected_client_logos || []).includes(l.id));
  if (selectedLogos.length > 0) {
    slides.push(
      <SlideFrame key="logos" className="bg-gray-50 text-gray-900 items-center text-center">
        <h2 className="text-5xl font-bold mb-16">Ils nous font confiance</h2>
        <div className="flex flex-wrap gap-8 justify-center max-w-[1400px]">
          {selectedLogos.map(l => (
            <div key={l.id} className="bg-white rounded-2xl shadow-md px-10 py-6 text-2xl font-semibold text-gray-700 border">{l.name}</div>
          ))}
        </div>
      </SlideFrame>
    );
  }

  // 13. Testimonials
  const selectedTestimonials = TESTIMONIALS.filter(t => (p.selected_testimonials || []).includes(t.id));
  selectedTestimonials.forEach(t => {
    slides.push(
      <SlideFrame key={`testi-${t.id}`} className="bg-white text-gray-900 items-center">
        <div className="max-w-[1400px] mx-auto text-center">
          <div className="text-8xl text-[hsl(217,91%,60%)] mb-8">"</div>
          <blockquote className="text-3xl leading-relaxed italic mb-12">{t.verbatim}</blockquote>
          <div className="text-2xl font-bold">{t.name}</div>
          <div className="text-xl text-gray-500">{t.role} — {t.company}</div>
          {t.figures && <div className="text-lg text-[hsl(217,91%,60%)] mt-4">{t.figures}</div>}
          <div className="text-base text-gray-400 mt-4">{t.context}</div>
        </div>
      </SlideFrame>
    );
  });

  // 14. Perlib
  slides.push(
    <SlideFrame key="perlib" className="bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <h2 className="text-4xl font-bold mb-8 text-center max-w-[1400px] mx-auto">{PERLIB_INFO.headline}</h2>
      <div className="flex gap-8 justify-center mb-12">
        {PERLIB_INFO.keyFacts.map((f, i) => (
          <div key={i} className="bg-white/10 rounded-2xl px-8 py-4 text-xl">{f}</div>
        ))}
      </div>
      <div className="text-center">
        <p className="text-2xl font-semibold text-[hsl(38,92%,50%)] mb-2">{PERLIB_INFO.label}</p>
        <p className="text-lg text-white/60">{PERLIB_INFO.subLabel}</p>
        <div className="flex gap-4 justify-center mt-8">
          {PERLIB_INFO.badges.map((b, i) => (
            <span key={i} className="bg-white/10 border border-white/20 rounded-full px-6 py-2 text-sm">{b}</span>
          ))}
        </div>
      </div>
    </SlideFrame>
  );

  // 15. Business model
  slides.push(
    <SlideFrame key="model" className="bg-white text-gray-900">
      <h2 className="text-5xl font-bold mb-12 text-center text-[hsl(217,91%,60%)]">{BUSINESS_MODEL.title}</h2>
      <div className="space-y-8 max-w-[1400px] mx-auto">
        {BUSINESS_MODEL.paragraphs.map((para, i) => (
          <p key={i} className="text-2xl leading-relaxed text-gray-700">{para}</p>
        ))}
      </div>
    </SlideFrame>
  );

  // 16. Contact
  slides.push(
    <SlideFrame key="contact" className="bg-gradient-to-br from-[hsl(217,91%,15%)] to-[hsl(271,81%,20%)] text-white items-center text-center">
      <h2 className="text-5xl font-bold mb-12">Vous souhaitez avoir plus d'informations sur FinCare ?</h2>
      <p className="text-3xl text-white/70 mb-16">Prenons rendez-vous.</p>
      <div className="bg-white/10 backdrop-blur rounded-3xl p-12 border border-white/10">
        <p className="text-3xl font-bold">{p.contact_name}</p>
        <p className="text-xl text-white/70 mb-6">{p.contact_role}</p>
        <div className="flex gap-8 justify-center text-xl">
          <span>{p.contact_phone}</span>
          <span>{p.contact_email}</span>
        </div>
        {p.contact_booking_url && (
          <a href={p.contact_booking_url} target="_blank" rel="noopener noreferrer"
            className="inline-block mt-8 px-12 py-4 bg-[hsl(38,92%,50%)] text-white rounded-full text-xl font-bold hover:opacity-90 transition">
            Prendre rendez-vous →
          </a>
        )}
      </div>
    </SlideFrame>
  );

  // 17. Legal
  slides.push(
    <SlideFrame key="legal" className="bg-gray-950 text-gray-500 items-center justify-end pb-16 text-center">
      <p className="text-base max-w-[1400px] leading-relaxed">{LEGAL_FOOTER}</p>
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

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Slide viewport */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        <ScaledSlide>{slides[currentSlide]}</ScaledSlide>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 border-t border-gray-800 px-6 py-3 flex items-center justify-between text-white">
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
      <div className="h-1 bg-gray-800">
        <div className="h-full bg-gradient-to-r from-[hsl(217,91%,60%)] to-[hsl(38,92%,50%)] transition-all duration-300"
          style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }} />
      </div>
    </div>
  );
}

// Scales 1920x1080 content to fit viewport
function ScaledSlide({ children }: { children: React.ReactNode }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const calc = () => {
      const sx = window.innerWidth / 1920;
      const sy = (window.innerHeight - 60) / 1080; // minus controls
      setScale(Math.min(sx, sy));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  return (
    <div className="relative" style={{ width: 1920 * scale, height: 1080 * scale }}>
      <div
        className="absolute left-1/2 top-1/2 origin-center rounded-lg overflow-hidden shadow-2xl"
        style={{
          width: 1920,
          height: 1080,
          transform: `translate(-50%, -50%) scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
