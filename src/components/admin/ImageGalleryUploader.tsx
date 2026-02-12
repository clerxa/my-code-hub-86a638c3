import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, X, GripVertical, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
}

interface ImageGalleryUploaderProps {
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
  bucketName?: string;
  folderPath?: string;
}

function SortableImageItem({ 
  image, 
  onRemove,
  onCaptionChange
}: { 
  image: GalleryImage; 
  onRemove: () => void;
  onCaptionChange: (caption: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group space-y-2"
    >
      <Card className="overflow-hidden aspect-square relative">
        <img
          src={image.url}
          alt={image.alt || "Gallery image"}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="cursor-grab text-white hover:bg-white/20"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={onRemove}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </Card>
      <Input
        value={image.caption || ""}
        onChange={(e) => onCaptionChange(e.target.value)}
        placeholder="Légende de l'image..."
        className="text-sm"
      />
    </div>
  );
}

export function ImageGalleryUploader({
  images,
  onChange,
  bucketName = "landing-images",
  folderPath = "expert-booking",
}: ImageGalleryUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      onChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages: GalleryImage[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${folderPath}/${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        newImages.push({
          id: crypto.randomUUID(),
          url: publicUrl,
          alt: file.name,
          caption: "",
        });
      }

      onChange([...images, ...newImages]);
      toast.success(`${newImages.length} image(s) ajoutée(s)`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (id: string) => {
    onChange(images.filter((img) => img.id !== id));
  };

  const updateCaption = (id: string, caption: string) => {
    onChange(images.map((img) => img.id === id ? { ...img, caption } : img));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Galerie d'images</Label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Upload...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Ajouter des images
            </>
          )}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {images.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={images.map(img => img.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((image) => (
                <SortableImageItem
                  key={image.id}
                  image={image}
                  onRemove={() => removeImage(image.id)}
                  onCaptionChange={(caption) => updateCaption(image.id, caption)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
          <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucune image. Cliquez sur "Ajouter des images" pour commencer.</p>
        </div>
      )}
    </div>
  );
}
