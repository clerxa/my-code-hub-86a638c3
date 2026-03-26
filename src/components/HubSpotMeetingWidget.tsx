import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { appendUtmParams, setBookingReferrerWithUtm } from "@/hooks/useBookingReferrer";

// Whitelist of allowed embed domains for security
const ALLOWED_EMBED_DOMAINS = [
  'hubspot.com',
  'hsappstatic.net',
  'hs-scripts.com',
  'hubspotusercontent.com',
  'fillout.com',
  'calendly.com',
  'cal.com',
  'savvycal.com',
  'zcal.co',
  'youcanbook.me',
  'acuityscheduling.com',
  'tidycal.com',
];

interface PrefillData {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  phone?: string;
}

interface HubSpotMeetingWidgetProps {
  embedCode?: string;
  fallbackUrl?: string;
  primaryColor?: string;
  triggerText?: string;
  redirectToLanding?: boolean;
  /** UTM campaign label to append to booking URLs/embeds */
  utmCampaign?: string;
  /** Custom dialog title (overrides default) */
  dialogTitle?: string;
  /** Custom dialog description (shown below title) */
  dialogDescription?: string | null;
  /** Prefill data for the booking form */
  prefillData?: PrefillData;
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
 * Extract and validate data-src from HubSpot embed code
 */
const extractHubSpotDataSrc = (code: string): string | null => {
  const match = code.match(/data-src="([^"]+)"/);
  if (!match) return null;
  
  if (isAllowedDomain(match[1])) {
    return match[1];
  }
  console.warn('Blocked HubSpot embed from unauthorized domain:', match[1]);
  return null;
};

/**
 * Extract and validate Fillout ID from embed code
 */
const extractFilloutId = (code: string): string | null => {
  const match = code.match(/data-fillout-id="([^"]+)"/);
  // Fillout IDs are alphanumeric only - validate format
  if (match && /^[a-zA-Z0-9_-]+$/.test(match[1])) {
    return match[1];
  }
  return null;
};

/**
 * Detect embed type from the code and validate domain
 */
const detectEmbedType = (code: string): { type: 'hubspot' | 'fillout' | 'iframe' | 'blocked' | 'unknown', blockedDomain?: string } => {
  if (code.includes('hubspot.com') || code.includes('MeetingsEmbed')) {
    return { type: 'hubspot' };
  }
  if (code.includes('fillout.com') || code.includes('data-fillout')) {
    return { type: 'fillout' };
  }
  if (code.includes('<iframe')) {
    // Extract and validate iframe src
    const srcMatch = code.match(/src=["']([^"']+)["']/);
    if (srcMatch) {
      if (isAllowedDomain(srcMatch[1])) {
        return { type: 'iframe' };
      }
      try {
        const url = new URL(srcMatch[1]);
        return { type: 'blocked', blockedDomain: url.hostname };
      } catch {
        return { type: 'blocked' };
      }
    }
  }
  return { type: 'unknown' };
};

export const HubSpotMeetingWidget = ({ 
  embedCode, 
  fallbackUrl,
  primaryColor,
  triggerText = "Prendre rendez-vous",
  redirectToLanding = false,
  utmCampaign,
  dialogTitle,
  dialogDescription,
}: HubSpotMeetingWidgetProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Analyze embed code - memoized for performance
  const embedAnalysis = useMemo(() => {
    if (!embedCode) return null;
    return detectEmbedType(embedCode);
  }, [embedCode]);

  // If redirectToLanding is true, just render a button that navigates to the landing page
  if (redirectToLanding) {
    return (
      <Button onClick={() => {
        if (utmCampaign) {
          setBookingReferrerWithUtm(window.location.pathname, utmCampaign);
        }
        navigate("/expert-booking");
      }} style={{ backgroundColor: primaryColor }}>
        <Calendar className="h-4 w-4 mr-2" />
        {triggerText}
      </Button>
    );
  }

  useEffect(() => {
    if (isOpen && embedCode && embedAnalysis) {
      if (embedAnalysis.type === 'hubspot') {
        // Clean up any existing HubSpot scripts
        const existingScripts = document.querySelectorAll('script[src*="MeetingsEmbedCode.js"]');
        existingScripts.forEach(script => script.remove());

        // Load HubSpot embed script when dialog opens
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://static.hsappstatic.net/MeetingsEmbed/ex/MeetingsEmbedCode.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
          const scripts = document.querySelectorAll('script[src*="MeetingsEmbedCode.js"]');
          scripts.forEach(s => s.remove());
        };
      } else if (embedAnalysis.type === 'fillout') {
        // Clean up existing Fillout scripts
        const existingScripts = document.querySelectorAll('script[src*="fillout.com"]');
        existingScripts.forEach(script => script.remove());

        // Load Fillout embed script
        const script = document.createElement('script');
        script.src = 'https://server.fillout.com/embed/v1/';
        script.async = true;
        document.body.appendChild(script);

        return () => {
          const scripts = document.querySelectorAll('script[src*="fillout.com"]');
          scripts.forEach(s => s.remove());
        };
      }
    }
  }, [isOpen, embedCode, embedAnalysis]);

  // If we have embed code, show the widget in a dialog
  if (embedCode && embedAnalysis) {
    // Handle blocked domains
    if (embedAnalysis.type === 'blocked') {
      return (
        <Card className="border-warning/50 bg-warning/10">
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-warning" />
            <div>
              <p className="font-medium text-warning-foreground">Contenu bloqué</p>
              <p className="text-sm text-muted-foreground">
                Le domaine "{embedAnalysis.blockedDomain}" n'est pas autorisé.
              </p>
            </div>
          </CardContent>
        </Card>
      );
    }

    let embedContent: React.ReactNode = null;

    if (embedAnalysis.type === 'hubspot') {
      const dataSrc = extractHubSpotDataSrc(embedCode);
      if (dataSrc) {
        const finalSrc = utmCampaign ? appendUtmParams(dataSrc, utmCampaign) : dataSrc;
        embedContent = (
          <div 
            className="meetings-iframe-container" 
            data-src={finalSrc}
            style={{ minHeight: '600px' }}
          />
        );
      }
    } else if (embedAnalysis.type === 'fillout') {
      const filloutId = extractFilloutId(embedCode);
      if (filloutId) {
        embedContent = (
          <div 
            style={{ width: '100%', height: '600px' }}
            data-fillout-id={filloutId}
            data-fillout-embed-type="standard"
            data-fillout-inherit-parameters
            data-fillout-dynamic-resize
          />
        );
      }
    } else if (embedAnalysis.type === 'iframe') {
      // Extract validated iframe src
      const srcMatch = embedCode.match(/src=["']([^"']+)["']/);
      if (srcMatch && isAllowedDomain(srcMatch[1])) {
        const finalSrc = utmCampaign ? appendUtmParams(srcMatch[1], utmCampaign) : srcMatch[1];
        embedContent = (
          <div className="w-full min-h-[600px]">
            <iframe
              src={finalSrc}
              className="w-full h-[600px] border-0"
              title="Booking Widget"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              referrerPolicy="strict-origin-when-cross-origin"
            />
          </div>
        );
      }
    }
    // Note: 'unknown' type is not rendered - we don't execute arbitrary HTML/scripts

    if (embedContent) {
      return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button style={{ backgroundColor: primaryColor }}>
              <Calendar className="h-4 w-4 mr-2" />
              {triggerText}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>{dialogTitle || "Réserver un rendez-vous"}</DialogTitle>
              {dialogDescription && (
                <p className="text-sm text-muted-foreground mt-1">{dialogDescription}</p>
              )}
            </DialogHeader>
            <div className="overflow-y-auto max-h-[70vh]">
              {embedContent}
            </div>
          </DialogContent>
        </Dialog>
      );
    }
  }

  // Fallback to external link if no embed code
  if (fallbackUrl) {
    const finalUrl = utmCampaign ? appendUtmParams(fallbackUrl, utmCampaign) : fallbackUrl;
    return (
      <Button asChild style={{ backgroundColor: primaryColor }}>
        <a href={finalUrl} target="_blank" rel="noopener noreferrer">
          <Calendar className="h-4 w-4 mr-2" />
          {triggerText}
        </a>
      </Button>
    );
  }

  return null;
};
