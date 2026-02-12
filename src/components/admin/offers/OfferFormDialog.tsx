import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { OFFER_CATEGORIES, type Offer } from '@/components/offers/types';
import { Calendar, Link as LinkIcon, ExternalLink } from 'lucide-react';

interface OfferFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer?: Offer | null;
  onSuccess: () => void;
}

type LinkType = 'expert' | 'internal' | 'external';

const INTERNAL_PAGES = [
  { value: '/parcours', label: 'Mes parcours' },
  { value: '/employee/simulations', label: 'Mes simulations' },
  { value: '/employee/profile', label: 'Mon profil' },
  { value: '/forum', label: 'Communauté' },
  { value: '/employee?section=appointments', label: 'Mes rendez-vous' },
  { value: '/employee?section=webinars', label: 'Mes webinaires' },
  { value: '/employee?section=invitations', label: 'Mes invitations' },
];

export function OfferFormDialog({ open, onOpenChange, offer, onSuccess }: OfferFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [linkType, setLinkType] = useState<LinkType>('external');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    cta_text: 'En savoir plus',
    cta_url: '',
    cta_link_type: 'external' as LinkType,
    category: 'general',
    start_date: '',
    end_date: '',
    is_active: true,
  });

  useEffect(() => {
    if (offer) {
      // Determine link type from stored URL
      let detectedLinkType: LinkType = 'external';
      if (offer.cta_url === '__EXPERT_BOOKING__') {
        detectedLinkType = 'expert';
      } else if (offer.cta_url?.startsWith('/')) {
        detectedLinkType = 'internal';
      }
      
      setLinkType(detectedLinkType);
      setFormData({
        title: offer.title || '',
        description: offer.description || '',
        image_url: offer.image_url || '',
        cta_text: offer.cta_text || 'En savoir plus',
        cta_url: offer.cta_url || '',
        cta_link_type: detectedLinkType,
        category: offer.category || 'general',
        start_date: offer.start_date ? new Date(offer.start_date).toISOString().slice(0, 16) : '',
        end_date: offer.end_date ? new Date(offer.end_date).toISOString().slice(0, 16) : '',
        is_active: offer.is_active ?? true,
      });
    } else {
      // Default: starts now, ends in 30 days
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      
      setLinkType('external');
      setFormData({
        title: '',
        description: '',
        image_url: '',
        cta_text: 'En savoir plus',
        cta_url: '',
        cta_link_type: 'external',
        category: 'general',
        start_date: now.toISOString().slice(0, 16),
        end_date: endDate.toISOString().slice(0, 16),
        is_active: true,
      });
    }
  }, [offer, open]);

  const handleLinkTypeChange = (type: LinkType) => {
    setLinkType(type);
    // Reset URL when changing type
    if (type === 'expert') {
      setFormData({ ...formData, cta_url: '__EXPERT_BOOKING__', cta_link_type: type });
    } else {
      setFormData({ ...formData, cta_url: '', cta_link_type: type });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('Le titre est requis');
      return;
    }
    
    if (!formData.end_date) {
      toast.error('La date de fin est requise');
      return;
    }

    // Validate URL based on type
    if (linkType === 'external' && formData.cta_url && !formData.cta_url.startsWith('http')) {
      toast.error('L\'URL externe doit commencer par http:// ou https://');
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        title: formData.title,
        description: formData.description || null,
        image_url: formData.image_url || null,
        cta_text: formData.cta_text || 'En savoir plus',
        cta_url: formData.cta_url || null,
        category: formData.category,
        start_date: new Date(formData.start_date).toISOString(),
        end_date: new Date(formData.end_date).toISOString(),
        is_active: formData.is_active,
      };

      if (offer) {
        const { error } = await supabase
          .from('offers')
          .update(payload)
          .eq('id', offer.id);
        
        if (error) throw error;
        toast.success('Offre mise à jour avec succès');
      } else {
        const { error } = await supabase
          .from('offers')
          .insert(payload);
        
        if (error) throw error;
        toast.success('Offre créée avec succès');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving offer:', error);
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {offer ? 'Modifier l\'offre' : 'Créer une nouvelle offre'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Titre * <span className="text-muted-foreground text-xs">({formData.title.length}/120)</span></Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value.slice(0, 120) })}
              placeholder="Ex: Webinar exclusif sur l'épargne"
              maxLength={120}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description <span className="text-muted-foreground text-xs">({formData.description.length}/240)</span></Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value.slice(0, 240) })}
              placeholder="Description courte de l'offre..."
              rows={3}
              maxLength={240}
            />
          </div>

          {/* Image */}
          <div className="space-y-2">
            <ImageUpload
              label="Image (ratio 16/9 recommandé)"
              bucketName="banners"
              value={formData.image_url}
              onChange={(url) => setFormData({ ...formData, image_url: url })}
              hint="Format recommandé : 1920x1080 px"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OFFER_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CTA Text */}
          <div className="space-y-2">
            <Label htmlFor="cta_text">Texte du bouton <span className="text-muted-foreground text-xs">({formData.cta_text.length}/30)</span></Label>
            <Input
              id="cta_text"
              value={formData.cta_text}
              onChange={(e) => setFormData({ ...formData, cta_text: e.target.value.slice(0, 30) })}
              placeholder="En savoir plus"
              maxLength={30}
            />
          </div>

          {/* Link Type Selection */}
          <div className="space-y-3">
            <Label>Type de lien</Label>
            <RadioGroup
              value={linkType}
              onValueChange={(value) => handleLinkTypeChange(value as LinkType)}
              className="grid grid-cols-3 gap-3"
            >
              <div className="flex items-center space-x-2 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="expert" id="link-expert" />
                <Label htmlFor="link-expert" className="flex items-center gap-2 cursor-pointer text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  RDV Expert
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="internal" id="link-internal" />
                <Label htmlFor="link-internal" className="flex items-center gap-2 cursor-pointer text-sm">
                  <LinkIcon className="h-4 w-4 text-primary" />
                  Page App
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="external" id="link-external" />
                <Label htmlFor="link-external" className="flex items-center gap-2 cursor-pointer text-sm">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  Lien externe
                </Label>
              </div>
            </RadioGroup>

            {/* Conditional URL input based on link type */}
            {linkType === 'expert' && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm text-primary">
                  Le lien de prise de rendez-vous sera automatiquement adapté au rang de l'entreprise de l'utilisateur.
                </p>
              </div>
            )}

            {linkType === 'internal' && (
              <div className="space-y-2">
                <Label>Page de destination</Label>
                <Select
                  value={formData.cta_url}
                  onValueChange={(value) => setFormData({ ...formData, cta_url: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une page" />
                  </SelectTrigger>
                  <SelectContent>
                    {INTERNAL_PAGES.map((page) => (
                      <SelectItem key={page.value} value={page.value}>
                        {page.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {linkType === 'external' && (
              <div className="space-y-2">
                <Label htmlFor="cta_url">URL externe</Label>
                <Input
                  id="cta_url"
                  type="url"
                  value={formData.cta_url}
                  onChange={(e) => setFormData({ ...formData, cta_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">Date de début *</Label>
              <Input
                id="start_date"
                type="datetime-local"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Date de fin *</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Offre active</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Enregistrement...' : offer ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
