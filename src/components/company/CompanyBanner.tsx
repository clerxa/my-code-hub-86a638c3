import mascotte from "@/assets/mascotte-fincare.png";

interface CompanyBannerProps {
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

export function CompanyBanner({ primaryColor, secondaryColor }: CompanyBannerProps) {
  return (
    <div
      className="w-full overflow-hidden"
      style={{
        backgroundColor: "#0f0f14",
        borderRadius: 16,
        position: "relative",
        zIndex: 1,
        isolation: "isolate",
      }}
    >
      <style>{`
        .hero-banner-root { height: 240px; min-height: 240px; }
        @media (max-width: 639px) { .hero-banner-root { height: auto; min-height: 320px; } }
      `}</style>

      {/* Glow 1 */}
      <div
        className="absolute pointer-events-none"
        style={{ top: -80, right: -60, width: 500, height: 500, zIndex: 0, borderRadius: "50%", background: "radial-gradient(circle, rgba(120,80,220,0.20) 0%, transparent 65%)" }}
      />
      {/* Glow 2 */}
      <div
        className="absolute pointer-events-none"
        style={{ bottom: -100, left: "35%", width: 350, height: 350, zIndex: 0, borderRadius: "50%", background: "radial-gradient(circle, rgba(200,80,180,0.10) 0%, transparent 65%)" }}
      />

      {/* Company color overlay */}
      {(primaryColor || secondaryColor) && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 0, borderRadius: 16, opacity: 0.15, background: `linear-gradient(to right, ${primaryColor || "transparent"}, transparent, ${secondaryColor || "transparent"})` }}
        />
      )}

      {/* Content layout */}
      <div
        className="hero-banner-root relative flex flex-col sm:flex-row w-full"
        style={{ zIndex: 1 }}
      >
        {/* Mascotte column */}
        <div className="sm:flex-[0_0_220px] sm:h-full relative overflow-visible flex items-end justify-center sm:block">
          <img
            src={mascotte}
            alt="FinCare mascotte"
            className="hidden sm:block absolute w-auto"
            style={{ height: "110%", bottom: 0, left: "50%", transform: "translateX(-50%)" }}
          />
          <img
            src={mascotte}
            alt="FinCare mascotte"
            className="sm:hidden w-auto mx-auto pt-4"
            style={{ height: 160 }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{
              bottom: 0,
              width: 80,
              height: 16,
              borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(120,80,220,0.5) 0%, transparent 70%)",
              filter: "blur(8px)",
            }}
          />
        </div>

        {/* Separator — desktop only */}
        <div
          className="hidden sm:flex shrink-0 self-center"
          style={{
            width: 1,
            height: 100,
            background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.15), transparent)",
          }}
        />

        {/* Content column */}
        <div
          className="flex flex-col items-center sm:items-start justify-center text-center sm:text-left"
          style={{ flex: "1 1 auto", minWidth: 0 }}
        >
          <div className="flex flex-col gap-3 px-6 py-5 sm:py-0 sm:pl-7 sm:pr-12 w-full">
            {/* Badge */}
            <div className="flex sm:justify-start justify-center">
              <span
                className="inline-flex items-center uppercase"
                style={{
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "rgba(255,255,255,0.85)",
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.20)",
                  borderRadius: 20,
                  padding: "5px 14px",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    backgroundColor: "rgba(255,255,255,0.70)",
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                PAR PERLIB
              </span>
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: 'clamp(28px, 3.8vw, 44px)',
              fontWeight: 800,
              lineHeight: 1.15,
              margin: 0,
              background: 'linear-gradient(135deg, #e8e0ff 0%, #c4a8f8 35%, #f0a0d0 70%, #ffd0a0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              display: 'inline-block',
              width: '100%',
            }}>
              MyFinCare, l'application qui redonne aux salariés le pouvoir sur leurs finances.
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
}
