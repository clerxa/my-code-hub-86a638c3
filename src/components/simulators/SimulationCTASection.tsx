import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Save,
  ExternalLink,
  Target,
  Shield,
  TrendingUp,
  Users,
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CTAConfig } from "@/hooks/useCTARulesEngine";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect, useRef } from "react";
import { setBookingReferrer, setBookingReferrerWithUtm } from "@/hooks/useBookingReferrer";

const HtmlContentRenderer = ({ content }: { content: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    containerRef.current.innerHTML = "";

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;

    const scripts = tempDiv.querySelectorAll("script");
    const scriptContents: { src?: string; text?: string }[] = [];

    scripts.forEach((script) => {
      scriptContents.push({
        src: script.src || undefined,
        text: script.textContent || undefined,
      });
      script.remove();
    });

    containerRef.current.innerHTML = tempDiv.innerHTML;

    scriptContents.forEach((scriptData) => {
      const newScript = document.createElement("script");
      if (scriptData.src) {
        newScript.src = scriptData.src;
        newScript.async = true;
      } else if (scriptData.text) {
        newScript.textContent = scriptData.text;
      }
      document.body.appendChild(newScript);
    });

    return () => {
      scriptContents.forEach((scriptData) => {
        if (!scriptData.src) return;
        const existingScript = document.querySelector(`script[src="${scriptData.src}"]`);
        if (existingScript) existingScript.remove();
      });
    };
  }, [content]);

  return <div ref={containerRef} className="py-4 min-h-[400px]" />;
};

interface SimulationCTASectionProps {
  ctas: Partial<CTAConfig>[];
  onSave?: () => void;
  onAction?: (actionType: string, actionValue: string) => void;
  onCTAClick?: (ctaId: string, isAppointment: boolean) => void;
  utmCampaign?: string;
}

const ICON_MAP: Record<string, any> = {
  Calendar,
  Save,
  ExternalLink,
  Target,
  Shield,
  TrendingUp,
  Users,
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight,
};

const APPOINTMENT_PATTERNS = ["rdv", "appointment", "meeting", "calendly", "hubspot", "booking", "expert"];

export const SimulationCTASection = ({ ctas, onSave, onAction, onCTAClick, utmCampaign }: SimulationCTASectionProps) => {
  const navigate = useNavigate();
  const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);

  const isAppointmentCTA = (cta: Partial<CTAConfig>): boolean => {
    if (cta.action_type === "expert_booking") return true;

    const textToCheck = [cta.id || "", cta.title || "", cta.button_text || "", cta.action_value || ""]
      .join(" ")
      .toLowerCase();

    return APPOINTMENT_PATTERNS.some((pattern) => textToCheck.includes(pattern));
  };

  const handleCTAClick = (cta: Partial<CTAConfig>) => {
    if (onCTAClick && cta.id) {
      onCTAClick(cta.id, isAppointmentCTA(cta));
    }

    if (cta.action_value === "save" && onSave) {
      onSave();
      return;
    }

    if (onAction) {
      onAction(cta.action_type || "", cta.action_value || "");
    }

    switch (cta.action_type) {
      case "internal_link":
        navigate(cta.action_value || "/");
        break;

      case "external_link":
        window.open(cta.action_value, "_blank", "noopener,noreferrer");
        break;

      case "html_script":
        setModalContent({
          title: cta.title || "",
          content: cta.action_value || "",
        });
        break;

      case "modal":
        setModalContent({
          title: cta.title || "",
          content: cta.description || "",
        });
        break;

      case "expert_booking":
        if (utmCampaign) {
          setBookingReferrerWithUtm(window.location.pathname, utmCampaign);
        } else {
          setBookingReferrer(window.location.pathname);
        }
        navigate("/expert-booking");
        break;

      default:
        console.warn("Unknown action type:", cta.action_type);
    }
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return Calendar;
    return ICON_MAP[iconName] || Calendar;
  };

  const getButtonVariant = (cta: Partial<CTAConfig>): "default" | "outline" | "secondary" | "destructive" => {
    if (cta.action_value === "save") return "outline";
    return "default";
  };

  if (ctas.length === 0) return null;

  return (
    <>
      <Card className="p-6 mt-8 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm border-border/50 shadow-lg">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Prochaines étapes</h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {ctas.map((cta, index) => {
              const Icon = getIcon(cta.icon);

              return (
                <Button
                  key={cta.id || `cta-${index}`}
                  onClick={() => handleCTAClick(cta)}
                  variant={getButtonVariant(cta)}
                  className="h-auto py-4 px-4 justify-start text-left gap-3 group hover:scale-[1.02] transition-all"
                  style={{ borderColor: cta.button_color }}
                >
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{cta.button_text}</div>
                    {cta.description && <div className="text-xs text-foreground/70 mt-1 line-clamp-2">{cta.description}</div>}
                  </div>
                  <ArrowRight className="h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      <Dialog open={!!modalContent} onOpenChange={() => setModalContent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modalContent?.title}</DialogTitle>
            <DialogDescription className="sr-only">Contenu d’action contextuelle du simulateur</DialogDescription>
          </DialogHeader>
          {modalContent?.content && <HtmlContentRenderer content={modalContent.content} />}
        </DialogContent>
      </Dialog>
    </>
  );
};