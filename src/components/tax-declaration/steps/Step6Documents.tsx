import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { TaxDeclarationFormData, TaxPermanenceConfig } from "@/types/tax-declaration";
import { Upload, Calendar, MessageSquare, Video, Building, MapPin, FileText, X, ExternalLink, Trash2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface StepProps {
  formData: TaxDeclarationFormData;
  updateFormData: (updates: Partial<TaxDeclarationFormData>) => void;
  permanenceConfig?: TaxPermanenceConfig | null;
}

const getIconForType = (typeId: string) => {
  switch (typeId) {
    case 'visio':
      return Video;
    case 'bureaux_perlib':
      return Building;
    case 'bureaux_entreprise':
      return MapPin;
    default:
      return Calendar;
  }
};

// Helper to get file name from URL
const getFileNameFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const fileName = pathParts[pathParts.length - 1];
    // Remove UUID prefix if present
    if (fileName.includes('-')) {
      const parts = fileName.split('.');
      const ext = parts.pop();
      return `document.${ext}`;
    }
    return fileName;
  } catch {
    return 'document';
  }
};

// Helper to check if file is an image
const isImageFile = (url: string): boolean => {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg') || lowerUrl.endsWith('.png') || lowerUrl.endsWith('.webp');
};

// Helper to extract storage path from URL
const getStoragePathFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    // URL format: .../storage/v1/object/public/documents/path/to/file
    const match = urlObj.pathname.match(/\/storage\/v1\/object\/public\/documents\/(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
};

export function Step6Documents({ formData, updateFormData, permanenceConfig }: StepProps) {
  const [uploadingAvis, setUploadingAvis] = useState(false);
  const [uploadingJustificatifs, setUploadingJustificatifs] = useState(false);
  const [deletingAvis, setDeletingAvis] = useState(false);
  const [deletingJustificatif, setDeletingJustificatif] = useState<string | null>(null);

  // Get enabled permanence options
  const enabledOptions = permanenceConfig?.options?.filter(opt => opt.enabled) || [
    { id: 'visio', label: 'En visio', enabled: true },
    { id: 'bureaux_perlib', label: 'Dans les bureaux de Perlib', enabled: true },
    { id: 'bureaux_entreprise', label: 'Dans les locaux de l\'entreprise', enabled: true },
  ];

  // Auto-select first enabled option if none selected
  useEffect(() => {
    if (!formData.type_rdv && enabledOptions.length > 0) {
      updateFormData({ type_rdv: enabledOptions[0].id });
    }
  }, [enabledOptions, formData.type_rdv, updateFormData]);

  const handleAvisUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvis(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `tax-declarations/avis/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      updateFormData({ avis_imposition_url: publicUrl });
      toast.success("Avis d'imposition téléchargé");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors du téléchargement");
    } finally {
      setUploadingAvis(false);
    }
  };

  const handleDeleteAvis = async () => {
    if (!formData.avis_imposition_url) return;
    
    setDeletingAvis(true);
    try {
      const storagePath = getStoragePathFromUrl(formData.avis_imposition_url);
      if (storagePath) {
        await supabase.storage.from('documents').remove([storagePath]);
      }
      updateFormData({ avis_imposition_url: '' });
      toast.success("Document supprimé");
    } catch (error) {
      console.error("Delete error:", error);
      // Even if storage delete fails, clear the URL so user can upload again
      updateFormData({ avis_imposition_url: '' });
      toast.success("Document retiré");
    } finally {
      setDeletingAvis(false);
    }
  };

  const handleJustificatifsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadingJustificatifs(true);
    try {
      const uploadedUrls: string[] = [...formData.autres_justificatifs_urls];

      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `tax-declarations/justificatifs/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      updateFormData({ autres_justificatifs_urls: uploadedUrls });
      toast.success(`${files.length} fichier(s) téléchargé(s)`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors du téléchargement");
    } finally {
      setUploadingJustificatifs(false);
    }
  };

  const handleDeleteJustificatif = async (urlToDelete: string) => {
    setDeletingJustificatif(urlToDelete);
    try {
      const storagePath = getStoragePathFromUrl(urlToDelete);
      if (storagePath) {
        await supabase.storage.from('documents').remove([storagePath]);
      }
      const newUrls = formData.autres_justificatifs_urls.filter(url => url !== urlToDelete);
      updateFormData({ autres_justificatifs_urls: newUrls });
      toast.success("Document supprimé");
    } catch (error) {
      console.error("Delete error:", error);
      // Even if storage delete fails, remove from list
      const newUrls = formData.autres_justificatifs_urls.filter(url => url !== urlToDelete);
      updateFormData({ autres_justificatifs_urls: newUrls });
      toast.success("Document retiré");
    } finally {
      setDeletingJustificatif(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Avis d'imposition */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          <Label>Votre avis d'imposition (revenus 2025)</Label>
        </div>
        
        {formData.avis_imposition_url ? (
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center gap-4">
              {isImageFile(formData.avis_imposition_url) ? (
                <div className="relative h-16 w-16 rounded overflow-hidden border bg-white shrink-0">
                  <img 
                    src={formData.avis_imposition_url} 
                    alt="Avis d'imposition" 
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="h-16 w-16 rounded border bg-white flex items-center justify-center shrink-0">
                  <FileText className="h-8 w-8 text-destructive" />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">Avis d'imposition</p>
                <p className="text-xs text-muted-foreground truncate">
                  {getFileNameFromUrl(formData.avis_imposition_url)}
                </p>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(formData.avis_imposition_url, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAvis}
                  disabled={deletingAvis}
                >
                  {deletingAvis ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/30 transition-colors">
            <input
              type="file"
              id="avis-upload"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleAvisUpload}
              disabled={uploadingAvis}
            />
            <label htmlFor="avis-upload" className="cursor-pointer">
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {uploadingAvis ? "Téléchargement..." : "Cliquez pour télécharger"}
                </p>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Autres justificatifs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" />
          <Label>Autres justificatifs (optionnel)</Label>
        </div>
        
        {/* Upload zone */}
        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/30 transition-colors">
          <input
            type="file"
            id="justificatifs-upload"
            accept=".pdf,.jpg,.jpeg,.png"
            multiple
            className="hidden"
            onChange={handleJustificatifsUpload}
            disabled={uploadingJustificatifs}
          />
          <label htmlFor="justificatifs-upload" className="cursor-pointer">
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {uploadingJustificatifs ? "Téléchargement..." : "Cliquez pour télécharger plusieurs fichiers"}
              </p>
            </div>
          </label>
        </div>

        {/* List of uploaded files */}
        {formData.autres_justificatifs_urls.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {formData.autres_justificatifs_urls.length} fichier(s) téléchargé(s)
            </p>
            <div className="grid gap-2">
              {formData.autres_justificatifs_urls.map((url, index) => (
                <div 
                  key={url} 
                  className="border rounded-lg p-3 bg-muted/30 flex items-center gap-3"
                >
                  {isImageFile(url) ? (
                    <div className="relative h-10 w-10 rounded overflow-hidden border bg-white shrink-0">
                      <img 
                        src={url} 
                        alt={`Justificatif ${index + 1}`} 
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded border bg-white flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-destructive" />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">Justificatif {index + 1}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {getFileNameFromUrl(url)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(url, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteJustificatif(url)}
                      disabled={deletingJustificatif === url}
                    >
                      {deletingJustificatif === url ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Type de RDV - avec options configurables par entreprise */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <Label>Quel type de rendez-vous souhaitez-vous ?</Label>
        </div>
        
        <RadioGroup
          value={formData.type_rdv}
          onValueChange={(value) => updateFormData({ type_rdv: value })}
          className="grid gap-3"
        >
          {enabledOptions.map((option) => {
            const Icon = getIconForType(option.id);
            const isSelected = formData.type_rdv === option.id;
            
            return (
              <label
                key={option.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                  isSelected 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                )}
              >
                <RadioGroupItem value={option.id} />
                <Icon className={cn(
                  "h-5 w-5",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )} />
                <div className="flex-1">
                  <p className={cn(
                    "font-medium",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {option.label}
                  </p>
                  {option.id === 'bureaux_entreprise' && option.dates && option.dates.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Dates disponibles : {option.dates.join(', ')}
                    </p>
                  )}
                </div>
              </label>
            );
          })}
        </RadioGroup>
      </div>

      {/* Commentaires */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <Label>Commentaires ou questions supplémentaires</Label>
        </div>
        <Textarea
          value={formData.commentaires}
          onChange={(e) => updateFormData({ commentaires: e.target.value })}
          placeholder="Précisez toute information utile pour préparer votre rendez-vous..."
          rows={4}
        />
      </div>
    </div>
  );
}
