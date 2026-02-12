import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { toast } from "sonner";

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label: string;
  bucketName?: string;
  aspectRatio?: "square" | "landscape" | "portrait";
  hint?: string;
  maxWidth?: string;
}

export const ImageUpload = ({ 
  value, 
  onChange, 
  label,
  bucketName = "landing-images",
  aspectRatio,
  hint,
  maxWidth = "max-w-xs"
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      toast.error("Veuillez sélectionner un fichier image");
      return;
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5MB");
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError, data } = await supabase.storage
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
      toast.success("Image uploadée avec succès");
    } catch (error: any) {
      console.error("Error uploading image:", error);
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
      toast.success("Image supprimée");
    } catch (error: any) {
      console.error("Error deleting image:", error);
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
          <Input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="flex-1"
          />
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
          <p className="text-sm text-muted-foreground">Upload en cours...</p>
        )}
      </div>

      {value && (
        <div className={`relative rounded-lg overflow-hidden border bg-muted/30 ${maxWidth} w-fit`}>
          <img 
            src={value} 
            alt="Preview"
            className="max-h-32 w-auto object-contain"
          />
        </div>
      )}
    </div>
  );
};