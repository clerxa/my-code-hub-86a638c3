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
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CTAConfig } from "@/hooks/useCTARulesEngine";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { appendUtmParams } from "@/hooks/useBookingReferrer";

// Component to safely render and execute HTML with scripts
const HtmlContentRenderer = ({ content }: { content: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !content) return;

    // Clear previous content
    containerRef.current.innerHTML = '';

    // Create a temporary container to parse the HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    // Extract and handle scripts separately
    const scripts = tempDiv.querySelectorAll('script');
    const scriptContents: { src?: string; text?: string }[] = [];

    scripts.forEach((script) => {
      scriptContents.push({
        src: script.src || undefined,
        text: script.textContent || undefined,
      });
      script.remove();
    });

    // Add the non-script HTML
    containerRef.current.innerHTML = tempDiv.innerHTML;

    // Execute scripts
    scriptContents.forEach((scriptData) => {
      const newScript = document.createElement('script');
      if (scriptData.src) {
        newScript.src = scriptData.src;
        newScript.async = true;
      } else if (scriptData.text) {
        newScript.textContent = scriptData.text;
      }
      document.body.appendChild(newScript);
    });

    // Cleanup function to remove added scripts
    return () => {
      scriptContents.forEach((scriptData) => {
        if (scriptData.src) {
          const existingScript = document.querySelector(`script[src="${scriptData.src}"]`);
          if (existingScript) {
            existingScript.remove();
          }
        }
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
  /** UTM campaign identifier for this simulator (e.g. "simulateur_per") */
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

// Liste des IDs ou patterns qui indiquent un CTA de prise de RDV
const APPOINTMENT_PATTERNS = ['rdv', 'appointment', 'meeting', 'calendly', 'hubspot', 'booking', 'expert'];

export const SimulationCTASection = ({ 
  ctas, 
  onSave,
  onAction,
  onCTAClick,
  utmCampaign,
}: SimulationCTASectionProps) => {
  const navigate = useNavigate();
  const [modalContent, setModalContent] = useState<{ title: string; content: string } | null>(null);
  const [expertBookingUrl, setExpertBookingUrl] = useState<string | null>(null);
  const [expertBookingEmbed, setExpertBookingEmbed] = useState<string | null>(null);
  const [loadingExpertBooking, setLoadingExpertBooking] = useState(false);

  // Check if any CTA needs expert_booking and pre-fetch the URL
  useEffect(() => {
    const hasExpertBookingCTA = ctas.some(cta => cta.action_type === 'expert_booking');
    if (!hasExpertBookingCTA) return;

    const fetchExpertBookingUrl = async () => {
      setLoadingExpertBooking(true);
      try {
        // Get current user's company
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoadingExpertBooking(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (!profile?.company_id) {
          setLoadingExpertBooking(false);
          return;
        }

        // Get company rank
        const { data: company } = await supabase
          .from('companies')
          .select('rang, expert_booking_hubspot_embed, expert_booking_url')
          .eq('id', profile.company_id)
          .single();

        const companyRang = company?.rang;

        // Fetch settings for rank-based URLs
        const { data: settings } = await supabase
          .from('settings')
          .select('key, value')
          .in('key', [
            'default_expert_booking_url', 
            'default_expert_booking_embed',
            'expert_booking_url_rang_1',
            'expert_booking_embed_rang_1',
            'expert_booking_url_rang_2',
            'expert_booking_embed_rang_2',
            'expert_booking_url_rang_3',
            'expert_booking_embed_rang_3',
            'expert_booking_url_rang_4',
            'expert_booking_embed_rang_4'
          ]);

        const parseValue = (value: string | undefined): string | null => {
          if (!value) return null;
          try {
            const parsed = JSON.parse(value);
            return typeof parsed === 'string' ? parsed : value;
          } catch {
            return value;
          }
        };

        const defaultUrl = settings?.find(s => s.key === 'default_expert_booking_url')?.value;
        const defaultEmbed = settings?.find(s => s.key === 'default_expert_booking_embed')?.value;
        const urlRang1 = settings?.find(s => s.key === 'expert_booking_url_rang_1')?.value;
        const embedRang1 = settings?.find(s => s.key === 'expert_booking_embed_rang_1')?.value;
        const urlRang2 = settings?.find(s => s.key === 'expert_booking_url_rang_2')?.value;
        const embedRang2 = settings?.find(s => s.key === 'expert_booking_embed_rang_2')?.value;
        const urlRang3 = settings?.find(s => s.key === 'expert_booking_url_rang_3')?.value;
        const embedRang3 = settings?.find(s => s.key === 'expert_booking_embed_rang_3')?.value;
        const urlRang4 = settings?.find(s => s.key === 'expert_booking_url_rang_4')?.value;
        const embedRang4 = settings?.find(s => s.key === 'expert_booking_embed_rang_4')?.value;

        // Priority: rank-based embed > rank-based URL > default embed > default URL > company embed > company URL
        if (companyRang) {
          const rankEmbed = companyRang === 1 ? parseValue(embedRang1) : 
                            companyRang === 2 ? parseValue(embedRang2) : 
                            companyRang === 3 ? parseValue(embedRang3) : 
                            companyRang === 4 ? parseValue(embedRang4) : null;
          const rankUrl = companyRang === 1 ? parseValue(urlRang1) : 
                          companyRang === 2 ? parseValue(urlRang2) : 
                          companyRang === 3 ? parseValue(urlRang3) : 
                          companyRang === 4 ? parseValue(urlRang4) : null;

          if (rankEmbed) {
            setExpertBookingEmbed(rankEmbed);
            setLoadingExpertBooking(false);
            return;
          }
          if (rankUrl) {
            setExpertBookingUrl(rankUrl);
            setLoadingExpertBooking(false);
            return;
          }
        }

        // Fallbacks
        if (parseValue(defaultEmbed)) {
          setExpertBookingEmbed(parseValue(defaultEmbed));
        } else if (parseValue(defaultUrl)) {
          setExpertBookingUrl(parseValue(defaultUrl));
        } else if (company?.expert_booking_hubspot_embed) {
          setExpertBookingEmbed(company.expert_booking_hubspot_embed);
        } else if (company?.expert_booking_url) {
          setExpertBookingUrl(company.expert_booking_url);
        }
      } catch (error) {
        console.error('Error fetching expert booking URL:', error);
      } finally {
        setLoadingExpertBooking(false);
      }
    };

    fetchExpertBookingUrl();
  }, [ctas]);

  const isAppointmentCTA = (cta: Partial<CTAConfig>): boolean => {
    // expert_booking is always an appointment CTA
    if (cta.action_type === 'expert_booking') return true;
    
    const textToCheck = [
      cta.id || '',
      cta.title || '',
      cta.button_text || '',
      cta.action_value || '',
    ].join(' ').toLowerCase();
    
    return APPOINTMENT_PATTERNS.some(pattern => textToCheck.includes(pattern));
  };

  const handleCTAClick = (cta: Partial<CTAConfig>) => {
    // Track CTA click
    if (onCTAClick && cta.id) {
      const isAppointment = isAppointmentCTA(cta);
      onCTAClick(cta.id, isAppointment);
    }

    // CTA obligatoire "Enregistrer"
    if (cta.action_value === 'save' && onSave) {
      onSave();
      return;
    }

    // Actions personnalisées
    if (onAction) {
      onAction(cta.action_type || '', cta.action_value || '');
    }

    // Actions par défaut
    switch (cta.action_type) {
      case 'internal_link':
        navigate(cta.action_value || '/');
        break;
      
      case 'external_link':
        window.open(cta.action_value, '_blank', 'noopener,noreferrer');
        break;
      
      case 'html_script':
        // Ouvrir une modale avec le contenu HTML
        setModalContent({
          title: cta.title || '',
          content: cta.action_value || '',
        });
        break;
      
      case 'modal':
        // Ouvrir une modale avec un ID spécifique
        setModalContent({
          title: cta.title || '',
          content: cta.description || '',
        });
        break;
      
      case 'expert_booking':
        // Use pre-fetched expert booking URL based on company rank
        if (expertBookingEmbed) {
          // Inject UTM into the embed content
          const embedWithUtm = utmCampaign 
            ? expertBookingEmbed.replace(/data-src="([^"]+)"/, (_, url) => `data-src="${appendUtmParams(url, utmCampaign)}"`)
            : expertBookingEmbed;
          setModalContent({
            title: cta.title || 'Prendre rendez-vous',
            content: embedWithUtm,
          });
        } else if (expertBookingUrl) {
          const urlWithUtm = utmCampaign ? appendUtmParams(expertBookingUrl, utmCampaign) : expertBookingUrl;
          window.open(urlWithUtm, '_blank', 'noopener,noreferrer');
        } else {
          // Fallback to action_value or default page
          navigate(cta.action_value || '/employee/rdv-expert');
        }
        break;
      
      default:
        console.warn('Unknown action type:', cta.action_type);
    }
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return Calendar;
    return ICON_MAP[iconName] || Calendar;
  };

  const getButtonVariant = (cta: Partial<CTAConfig>): "default" | "outline" | "secondary" | "destructive" => {
    // CTA obligatoire Enregistrer = outline
    if (cta.action_value === 'save') return 'outline';
    
    // Autres CTA = default (ou selon config future)
    return 'default';
  };

  if (ctas.length === 0) {
    return null;
  }

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
              const isExpertBookingLoading = cta.action_type === 'expert_booking' && loadingExpertBooking;
              
              return (
                <Button
                  key={cta.id || `cta-${index}`}
                  onClick={() => handleCTAClick(cta)}
                  variant={getButtonVariant(cta)}
                  disabled={isExpertBookingLoading}
                  className="h-auto py-4 px-4 justify-start text-left gap-3 group hover:scale-[1.02] transition-all"
                  style={{
                    borderColor: cta.button_color,
                  }}
                >
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    {isExpertBookingLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{cta.button_text}</div>
                    {cta.description && (
                      <div className="text-xs text-foreground/70 mt-1 line-clamp-2">
                        {cta.description}
                      </div>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Modal pour HTML/Script */}
      <Dialog open={!!modalContent} onOpenChange={() => setModalContent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modalContent?.title}</DialogTitle>
          </DialogHeader>
          {modalContent?.content && (
            <HtmlContentRenderer content={modalContent.content} />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};