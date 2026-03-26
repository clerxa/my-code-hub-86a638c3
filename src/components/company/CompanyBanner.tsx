import mascotte from "@/assets/mascotte-fincare.png";

export function CompanyBanner() {
  return (
    <div
      className="w-full overflow-hidden relative flex items-center justify-center px-4 sm:px-8 md:px-12 py-6 sm:py-8 md:py-10"
      style={{ backgroundColor: "#101218", minHeight: "180px" }}
    >
      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 md:gap-12 max-w-5xl w-full">
        {/* Mascot */}
        <img
          src={mascotte}
          alt="FinCare mascotte"
          className="h-28 sm:h-36 md:h-44 w-auto object-contain shrink-0 drop-shadow-lg"
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
            MyFinCare, l'application qui redonne aux salariés le pouvoir sur leurs finances.
          </h2>
          <p className="text-white/80 text-xs sm:text-sm md:text-base">
            Une application développée par Perlib
          </p>
        </div>
      </div>
    </div>
  );
}
