import mascotte from "@/assets/mascotte-fincare.png";

interface CompanyBannerProps {
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

export function CompanyBanner({ primaryColor, secondaryColor }: CompanyBannerProps) {
  return (
    <div style={{
      position: 'relative',
      minHeight: '240px',
      background: '#0f0f14',
      borderRadius: '16px',
      overflow: 'visible',
      display: 'flex',
      alignItems: 'center',
      zIndex: 1,
      isolation: 'isolate',
    }}>

      {/* Glow 1 */}
      <div style={{
        position: 'absolute', top: '-80px', right: '-60px',
        width: '500px', height: '500px', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(120,80,220,0.20) 0%, transparent 65%)',
      }} />

      {/* Glow 2 */}
      <div style={{
        position: 'absolute', bottom: '-100px', left: '35%',
        width: '350px', height: '350px', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(200,80,180,0.10) 0%, transparent 65%)',
      }} />

      {/* Mascotte */}
      <div style={{
        flexShrink: 0, width: '220px', alignSelf: 'stretch',
        position: 'relative', overflow: 'visible',
        background: 'rgba(255,255,255,0.05)',
      }}>
        <img
          src={mascotte}
          alt="mascotte"
          style={{
            height: '110%', width: 'auto',
            position: 'absolute', bottom: 0, left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      </div>

      {/* Séparateur */}
      <div style={{
        width: '1px', height: '100px', flexShrink: 0,
        background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.15), transparent)',
      }} />

      {/* Contenu */}
      <div style={{
        flex: 1, minWidth: 0, padding: '32px 48px 32px 28px',
        display: 'flex', flexDirection: 'column' as const,
        gap: '12px', justifyContent: 'center',
      }}>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.20)',
          borderRadius: '20px', padding: '5px 14px',
          width: 'fit-content',
        }}>
          <div style={{
            width: '7px', height: '7px',
            background: 'rgba(255,255,255,0.70)',
            borderRadius: '50%',
          }} />
          <span style={{
            fontSize: '11px', fontWeight: 700,
            letterSpacing: '0.08em', color: 'rgba(255,255,255,0.85)',
            textTransform: 'uppercase' as const,
          }}>Par Perlib</span>
        </div>

        {/* Titre */}
        <h1 style={{
          margin: 0,
          fontSize: 'clamp(28px, 3.8vw, 44px)',
          fontWeight: 800,
          lineHeight: 1.15,
          display: 'inline-block',
          width: '100%',
          maxWidth: '600px',
          background: 'linear-gradient(90deg, #4f7cf7 0%, #8b5cf6 40%, #d946a8 70%, #f97316 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          MyFinCare, l'application{'\n'}qui redonne aux salariés{'\n'}le pouvoir sur leurs finances.
        </h1>

      </div>
    </div>
  );
}
