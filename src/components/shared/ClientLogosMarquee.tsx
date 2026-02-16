import { useClientLogos } from "@/hooks/useClientLogos";

interface ClientLogosMarqueeProps {
  title?: string;
  showNames?: boolean;
}

export function ClientLogosMarquee({ title = "Ils nous font confiance", showNames = true }: ClientLogosMarqueeProps) {
  const { data: logos } = useClientLogos();

  if (!logos || logos.length === 0) return null;

  // Triple the logos for seamless infinite scroll
  const tripled = [...logos, ...logos, ...logos];

  return (
    <section className="w-full py-10 overflow-hidden">
      {title && (
        <p className="text-center text-sm font-medium text-muted-foreground mb-6 tracking-wider uppercase">
          {title}
        </p>
      )}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-background to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        <div
          className="flex gap-10 items-center w-max"
          style={{ animation: "marquee 25s linear infinite" }}
        >
          {tripled.map((logo, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-card rounded-full px-5 py-3 shadow-sm border border-border/50 shrink-0"
            >
              <img
                src={logo.logo_url}
                alt={logo.name}
                className="h-10 w-10 object-contain rounded-full bg-white p-1"
                loading="lazy"
              />
              {showNames && (
                <span className="text-sm font-medium whitespace-nowrap">{logo.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
