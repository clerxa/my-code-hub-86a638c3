import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Save, FileText, Link, Mail } from 'lucide-react';

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

export function FooterTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Partial<FooterSettings>>({
    company_text: '',
    copyright_text: '',
    legal_mentions: '',
    privacy_policy_url: '',
    terms_url: '',
    contact_email: '',
    show_powered_by: true,
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['footer-settings-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('footer_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as FooterSettings | null;
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        company_text: settings.company_text || '',
        copyright_text: settings.copyright_text || '',
        legal_mentions: settings.legal_mentions || '',
        privacy_policy_url: settings.privacy_policy_url || '',
        terms_url: settings.terms_url || '',
        contact_email: settings.contact_email || '',
        show_powered_by: settings.show_powered_by ?? true,
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<FooterSettings>) => {
      if (settings?.id) {
        const { error } = await supabase
          .from('footer_settings')
          .update(data)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('footer_settings')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: 'Paramètres sauvegardés', description: 'Le footer a été mis à jour avec succès' });
      queryClient.invalidateQueries({ queryKey: ['footer-settings'] });
      queryClient.invalidateQueries({ queryKey: ['footer-settings-admin'] });
    },
    onError: (error) => {
      console.error('Error saving footer settings:', error);
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder les paramètres', variant: 'destructive' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Paramètres du Footer</h2>
        <p className="text-muted-foreground">Personnalisez le footer affiché sur toutes les pages de l'application</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Textes principaux
            </CardTitle>
            <CardDescription>Les textes affichés dans le footer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_text">Nom de l'entreprise</Label>
              <Input
                id="company_text"
                value={formData.company_text || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, company_text: e.target.value }))}
                placeholder="FinCare"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="copyright_text">Texte de copyright</Label>
              <Input
                id="copyright_text"
                value={formData.copyright_text || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, copyright_text: e.target.value }))}
                placeholder="© 2024 FinCare. Tous droits réservés."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="legal_mentions">Mentions légales</Label>
              <Textarea
                id="legal_mentions"
                value={formData.legal_mentions || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, legal_mentions: e.target.value }))}
                placeholder="Les informations fournies sur cette plateforme sont à titre indicatif..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Ce texte apparaît en haut du footer
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Liens et contact
            </CardTitle>
            <CardDescription>URLs vers vos pages légales et email de contact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="privacy_policy_url">URL Politique de confidentialité</Label>
              <Input
                id="privacy_policy_url"
                type="url"
                value={formData.privacy_policy_url || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, privacy_policy_url: e.target.value }))}
                placeholder="https://example.com/privacy"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terms_url">URL Conditions d'utilisation</Label>
              <Input
                id="terms_url"
                type="url"
                value={formData.terms_url || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, terms_url: e.target.value }))}
                placeholder="https://example.com/terms"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_email">Email de contact</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="contact@example.com"
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Options d'affichage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Afficher "Powered by"</Label>
                <p className="text-sm text-muted-foreground">Affiche une mention de la technologie utilisée</p>
              </div>
              <Switch
                checked={formData.show_powered_by ?? true}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_powered_by: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>
      </form>
    </div>
  );
}
