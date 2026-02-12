import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Upload } from "lucide-react";
import { toast } from "sonner";

interface VideoUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label: string;
  bucketName?: string;
  hint?: string;
}

export const VideoUpload = ({ 
  value, 
  onChange, 
  label,
  bucketName = "landing-images",
  hint,
}: VideoUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('video/')) {
      toast.error("Veuillez sélectionner un fichier vidéo");
      return;
    }

    // Vérifier la taille (max 50MB pour les vidéos)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("La vidéo ne doit pas dépasser 50MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `video-${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success("Vidéo uploadée avec succès");
    } catch (error: any) {
      console.error("Error uploading video:", error);
      toast.error(error.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!value) return;

    try {
      // Extraire le path du fichier depuis l'URL
      const url = new URL(value);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts[pathParts.length - 1];

      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) throw error;

      onChange("");
      toast.success("Vidéo supprimée");
    } catch (error: any) {
      console.error("Error deleting video:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>{label}</Label>
        {hint && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type="file"
              accept="video/*"
              onChange={handleUpload}
              disabled={uploading}
              className="flex-1"
            />
          </div>
          {value && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleDelete}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {uploading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Upload className="h-4 w-4 animate-pulse" />
            Upload en cours...
          </div>
        )}
      </div>

      {value && (
        <div className="relative rounded-lg overflow-hidden border bg-muted/30 max-w-md">
          <video 
            src={value} 
            className="max-h-48 w-auto"
            controls
            muted
          />
        </div>
      )}
    </div>
  );
};
