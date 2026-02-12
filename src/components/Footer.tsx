import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Mail, ExternalLink } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface FooterSettings {
  id: string;
  company_text: string | null;
  copyright_text: string | null;
  legal_mentions: string | null;
  privacy_policy_url: string | null;
  terms_url: string | null;
  contact_email: string | null;
  show_powered_by: boolean | null;
}

export function Footer() {
  const { data: settings } = useQuery({
    queryKey: ['footer-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('footer_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as FooterSettings | null;
    },
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });

  if (!settings) return null;

  const hasLinks = settings.privacy_policy_url || settings.terms_url || settings.contact_email;

  return (
    <footer className="mt-auto border-t border-border/50 bg-muted/30">
      <div className="container mx-auto px-4 py-6">
        {/* Legal mentions */}
        {settings.legal_mentions && (
          <p className="text-xs text-muted-foreground text-center mb-4 max-w-3xl mx-auto">
            {settings.legal_mentions}
          </p>
        )}

        {hasLinks && (
          <>
            <Separator className="my-4 max-w-xl mx-auto" />
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm mb-4">
              {settings.privacy_policy_url && (
                <a
                  href={settings.privacy_policy_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  Politique de confidentialité
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {settings.terms_url && (
                <a
                  href={settings.terms_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  Conditions d'utilisation
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {settings.contact_email && (
                <a
                  href={`mailto:${settings.contact_email}`}
                  className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  {settings.contact_email}
                </a>
              )}
            </div>
          </>
        )}

        {/* Copyright */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            {settings.copyright_text}
          </p>
        </div>
      </div>
    </footer>
  );
}
