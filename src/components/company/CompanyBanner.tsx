import mascotte from "@/assets/mascotte-fincare.png";

interface CompanyBannerProps {
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

export function CompanyBanner({ primaryColor, secondaryColor }: CompanyBannerProps) {
  return (
    <div
      className="w-full overflow-hidden relative rounded-2xl"
      style={{
        background: "linear-gradient(135deg, #7B6FE8 0%, #A78BFA 30%, #C084FC 55%, #E879A5 75%, #F59E0B 100%)",
        padding: "2px",
      }}
    >
      <div
        className="w-full relative flex items-center justify-center px-4 sm:px-8 md:px-12 py-6 sm:py-8 md:py-10 rounded-2xl"
        style={{ backgroundColor: "#101218" }}
      >
        {/* Company color overlay */}
        {(primaryColor || secondaryColor) && (
          <div
            className="absolute inset-0 opacity-20 rounded-2xl pointer-events-none"
            style={{
              background: `linear-gradient(to right, ${primaryColor || "transparent"}, transparent, ${secondaryColor || "transparent"})`,
            }}
          />
        )}

        <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-8 md:gap-12 max-w-5xl w-full">
          {/* Mascot */}
          <img
            src={mascotte}
            alt="FinCare mascotte"
            className="h-40 sm:h-48 md:h-56 lg:h-64 w-auto object-contain shrink-0 drop-shadow-lg"
          />

          {/* Text content */}
          <div className="flex flex-col gap-2 sm:gap-3 text-center sm:text-left">
            <h2
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight"
              style={{
                background: "linear-gradient(135deg, #7B6FE8 0%, #A78BFA 30%, #C084FC 55%, #E879A5 75%, #F59E0B 100%)",
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
            <p className="text-white/80 text-xs sm:text-sm md:text-base">
              Une application développée par Perlib
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
