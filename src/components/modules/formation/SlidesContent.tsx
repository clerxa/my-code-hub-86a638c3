import { Card, CardContent } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { AlertCircle, Presentation, ChevronLeft, ChevronRight, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Whitelist of allowed embed domains for security
const ALLOWED_EMBED_DOMAINS = [
  'slides.com',
  'docs.google.com',
  'prezi.com',
  'slideshare.net',
  'canva.com',
  'pitch.com',
  'gamma.app',
  'beautiful.ai',
  'genially.com',
  'visme.co',
  'mentimeter.com',
  'slido.com',
  'microsoft.com',
  'office.com',
  'sharepoint.com',
  'onedrive.live.com',
];

interface SlidesContentProps {
  embedCode: string;
  title: string;
  onProgressUpdate?: (progress: number) => void;
}

/**
 * Validates if a URL is from an allowed domain
 */
const isAllowedDomain = (urlString: string): boolean => {
  try {
    const url = new URL(urlString);
    return ALLOWED_EMBED_DOMAINS.some(domain => 
      url.hostname === domain || url.hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
};

/**
 * Extracts and validates iframe src from embed code
 */
const extractValidatedSrc = (embedCode: string): string | null => {
  const srcMatch = embedCode.match(/src=["']([^"']+)["']/);
  if (!srcMatch) return null;
  
  const src = srcMatch[1];
  if (isAllowedDomain(src)) {
    return src;
  }
  
  console.warn('Blocked embed from unauthorized domain:', src);
  return null;
};

export const SlidesContent = ({ embedCode, title, onProgressUpdate }: SlidesContentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentSlide, setCurrentSlide] = useState(1);
  const [totalSlides] = useState(10);
  const [blockedDomain, setBlockedDomain] = useState<string | null>(null);

  // Extract and validate src - memoized for performance
  const validatedSrc = useMemo(() => {
    const src = extractValidatedSrc(embedCode);
    
    // Check if there's a blocked domain for user feedback
    if (!src && embedCode) {
      const srcMatch = embedCode.match(/src=["']([^"']+)["']/);
      if (srcMatch) {
        try {
          const url = new URL(srcMatch[1]);
          setBlockedDomain(url.hostname);
        } catch {
          setBlockedDomain(null);
        }
      }
    } else {
      setBlockedDomain(null);
    }
    
    return src;
  }, [embedCode]);

  // Handle script-based embeds with domain validation
  useEffect(() => {
    if (containerRef.current && embedCode.includes("<script") && !validatedSrc) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = embedCode;
      
      const scripts = tempDiv.querySelectorAll("script");
      let hasBlockedScript = false;
      
      scripts.forEach((script) => {
        if (script.src) {
          // Validate script src domain
          if (!isAllowedDomain(script.src)) {
            console.warn('Blocked script from unauthorized domain:', script.src);
            hasBlockedScript = true;
            try {
              const url = new URL(script.src);
              setBlockedDomain(url.hostname);
            } catch {
              // Invalid URL
            }
            return; // Skip this script
          }
          
          const newScript = document.createElement("script");
          newScript.src = script.src;
          containerRef.current?.appendChild(newScript);
        }
        // Inline scripts are blocked for security
      });

      if (!hasBlockedScript) {
        // Only set non-script HTML content (no inline scripts executed)
        const htmlWithoutScripts = embedCode.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
        const contentDiv = containerRef.current.querySelector(".slides-content");
        if (contentDiv) {
          // Use textContent or a sanitizer for non-iframe content
          // For now, we only allow iframes from trusted sources
          contentDiv.innerHTML = "";
        }
      }
    }
  }, [embedCode, validatedSrc]);

  useEffect(() => {
    const progress = Math.min((currentSlide / totalSlides) * 100, 100);
    onProgressUpdate?.(progress);
  }, [currentSlide, totalSlides, onProgressUpdate]);

  const handleNextSlide = () => {
    if (currentSlide < totalSlides) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handlePrevSlide = () => {
    if (currentSlide > 1) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  if (!embedCode) {
    return (
      <Card className="border-destructive/50 bg-destructive/10">
        <CardContent className="p-6 flex items-center gap-3 text-destructive">
          <AlertCircle className="h-5 w-5" />
          <p>Code d'intégration slides invalide</p>
        </CardContent>
      </Card>
    );
  }

  // Show security warning if domain is blocked
  if (blockedDomain && !validatedSrc) {
    return (
      <Card className="border-warning/50 bg-warning/10">
        <CardContent className="p-6 flex items-center gap-3 text-warning-foreground">
          <ShieldAlert className="h-5 w-5 text-warning" />
          <div>
            <p className="font-medium">Contenu bloqué pour des raisons de sécurité</p>
            <p className="text-sm text-muted-foreground">
              Le domaine "{blockedDomain}" n'est pas dans la liste des sources autorisées. 
              Contactez un administrateur pour l'ajouter.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/20">
              <Presentation className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Instructions</h3>
              <p className="text-sm text-muted-foreground">
                Utilise les boutons ci-dessous pour naviguer dans les slides. Chaque slide contient des informations importantes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50 overflow-hidden shadow-card group hover:shadow-hover transition-smooth">
        <CardContent className="p-0 relative">
          {validatedSrc ? (
            <AspectRatio ratio={16 / 9} className="bg-muted">
              <iframe
                src={validatedSrc}
                title={title}
                className="w-full h-full"
                allowFullScreen
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </AspectRatio>
          ) : (
            <AspectRatio ratio={16 / 9} className="bg-muted">
              <div ref={containerRef} className="w-full h-full">
                <div className="slides-content w-full h-full" />
              </div>
            </AspectRatio>
          )}
          <div className="absolute top-4 right-4 flex gap-2">
            <Badge variant="secondary" className="backdrop-blur-sm bg-background/80 gap-1">
              Slide {currentSlide}/{totalSlides}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevSlide}
              disabled={currentSlide === 1}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                Slide {currentSlide} sur {totalSlides}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextSlide}
              disabled={currentSlide === totalSlides}
              className="gap-2"
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-success/30 bg-success/5">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground flex items-start gap-2">
            <span className="text-success text-lg">🎯</span>
            <span>
              <strong className="text-success">En cours :</strong> Parcours chaque slide à ton rythme. 
              Clique sur "Suivant" pour avancer et la progression se mettra à jour automatiquement !
            </span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
