import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

type AcceptType = "image" | "pdf" | "image+pdf";

interface FileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label: string;
  bucketName?: string;
  accept?: AcceptType;
  hint?: string;
  maxWidth?: string;
  maxSizeMB?: number;
}

const ACCEPT_MAP: Record<AcceptType, string> = {
  image: "image/*",
  pdf: "application/pdf,.pdf",
  "image+pdf": "image/*,application/pdf,.pdf",
};

const MIME_VALIDATORS: Record<AcceptType, (type: string) => boolean> = {
  image: (type) => type.startsWith("image/"),
  pdf: (type) => type === "application/pdf",
  "image+pdf": (type) => type.startsWith("image/") || type === "application/pdf",
};

const ERROR_MESSAGES: Record<AcceptType, string> = {
  image: "Veuillez sélectionner un fichier image",
  pdf: "Veuillez sélectionner un fichier PDF",
  "image+pdf": "Veuillez sélectionner une image ou un PDF",
};

export const FileUpload = ({
  value,
  onChange,
  label,
  bucketName = "landing-images",
  accept = "image",
  hint,
  maxWidth = "max-w-xs",
  maxSizeMB = 10,
}: FileUploadProps) => {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!MIME_VALIDATORS[accept](file.type)) {
      toast.error(ERROR_MESSAGES[accept]);
      return;
    }

    // Vérifier la taille
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Le fichier ne doit pas dépasser ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(filePath);

      onChange(publicUrl);
      toast.success("Fichier uploadé avec succès");
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast.error(error.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!value) return;

    try {
      const url = new URL(value);
      const pathParts = url.pathname.split("/");
      const filePath = pathParts[pathParts.length - 1];

      const { error } = await supabase.storage.from(bucketName).remove([filePath]);

      if (error) throw error;

      onChange("");
      toast.success("Fichier supprimé");
    } catch (error: any) {
      console.error("Error deleting file:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const isPdf = value?.toLowerCase().endsWith(".pdf");

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        {label && <Label>{label}</Label>}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            type="file"
            accept={ACCEPT_MAP[accept]}
            onChange={handleUpload}
            disabled={uploading}
            className="flex-1"
          />
          {value && (
            <Button type="button" variant="destructive" size="icon" onClick={handleDelete}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {uploading && <p className="text-sm text-muted-foreground">Upload en cours...</p>}
      </div>

      {value && (
        <div
          className={`relative rounded-lg overflow-hidden border bg-muted/30 ${maxWidth} w-fit p-2`}
        >
          {isPdf ? (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-8 w-8 text-destructive" />
              <span className="truncate max-w-[200px]">{value.split("/").pop()}</span>
            </div>
          ) : (
            <img src={value} alt="Preview" className="max-h-32 w-auto object-contain" />
          )}
        </div>
      )}
    </div>
  );
};
