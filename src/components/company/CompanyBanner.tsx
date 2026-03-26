import mascotte from "@/assets/mascotte-fincare.png";

interface CompanyBannerProps {
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

export function CompanyBanner({ primaryColor, secondaryColor }: CompanyBannerProps) {
  return (
    <div
      className="w-full overflow-hidden relative"
      style={{
        backgroundColor: "#0f0f14",
        borderRadius: 16,
      }}
    >
      {/* Glow 1 — top-right */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -80,
          right: -80,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(120,80,220,0.18) 0%, transparent 70%)",
        }}
      />
      {/* Glow 2 — bottom-center */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: -60,
          left: "50%",
          transform: "translateX(-50%)",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(200,80,180,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Company color overlay */}
      {(primaryColor || secondaryColor) && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: 16,
            opacity: 0.15,
            background: `linear-gradient(to right, ${primaryColor || "transparent"}, transparent, ${secondaryColor || "transparent"})`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative flex flex-col sm:flex-row items-center sm:items-end w-full">
        {/* Mascotte */}
        <div className="flex items-end justify-center shrink-0 pt-6 sm:pt-0 sm:pl-8 md:pl-10">
          <div className="relative">
            <img
              src={mascotte}
              alt="FinCare mascotte"
              className="w-[110px] sm:w-[200px] h-auto object-contain relative z-10"
            />
            {/* Purple shadow under mascotte */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 z-0"
              style={{
                width: "80%",
                height: 18,
                borderRadius: "50%",
                background: "radial-gradient(ellipse, rgba(120,80,220,0.45) 0%, transparent 70%)",
                filter: "blur(8px)",
              }}
            />
          </div>
        </div>

        {/* Vertical separator — hidden on mobile */}
        <div className="hidden sm:flex self-stretch items-center mx-6 md:mx-8">
          <div
            style={{
              width: 1,
              height: "60%",
              background: "linear-gradient(to bottom, transparent, rgba(120,80,220,0.3), transparent)",
            }}
          />
        </div>

        {/* Text content */}
        <div className="flex flex-col gap-3 py-6 sm:py-8 px-5 sm:px-0 sm:pr-8 text-center sm:text-left">
          {/* Badge */}
          <div className="flex sm:justify-start justify-center">
            <span
              className="inline-flex items-center gap-1.5 uppercase"
              style={{
                fontSize: 11,
                letterSpacing: "0.06em",
                fontWeight: 500,
                color: "rgba(196,168,248,0.9)",
                background: "rgba(120,80,220,0.15)",
                border: "1px solid rgba(120,80,220,0.3)",
                borderRadius: 20,
                padding: "4px 12px",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: "rgba(140,100,240,0.9)",
                  display: "inline-block",
                }}
              />
              PAR PERLIB
            </span>
          </div>

          {/* Titre principal */}
          <h2
            style={{
              fontWeight: 800,
              fontSize: "clamp(22px, 3.5vw, 36px)",
              lineHeight: 1.18,
              background: "linear-gradient(135deg, #e8e0ff 0%, #c4a8f8 35%, #f0a0d0 70%, #ffd0a0 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            MyFinCare, l'application
            <br />
            qui redonne aux salariés
            <br />
            le pouvoir sur leurs finances.
          </h2>

          {/* Texte secondaire */}
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.45)",
              fontWeight: 400,
            }}
          >
            Une application développée par Perlib
          </p>
        </div>
      </div>
    </div>
  );
}
