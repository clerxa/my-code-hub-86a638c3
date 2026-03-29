import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { BookOpen, PlusCircle, Clock, Loader2 } from "lucide-react";

interface CatalogItem {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  category: string;
  visual_url: string | null;
}

interface WebinarCatalogPickerProps {
  onSelectCatalog: (item: CatalogItem) => void;
  onSelectNew: () => void;
  selectedCatalogId?: string | null;
}

export function WebinarCatalogPicker({ onSelectCatalog, onSelectNew, selectedCatalogId }: WebinarCatalogPickerProps) {
  const [mode, setMode] = useState<"catalog" | "new">(selectedCatalogId ? "catalog" : "new");
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    const { data } = await supabase
      .from("webinar_catalog")
      .select("*")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("name", { ascending: true });
    if (data) setCatalog(data as CatalogItem[]);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Source du webinar</Label>
      <RadioGroup
        value={mode}
        onValueChange={(v) => {
          setMode(v as "catalog" | "new");
          if (v === "new") onSelectNew();
        }}
        className="grid grid-cols-2 gap-3"
      >
        <Label
          htmlFor="mode-catalog"
          className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
            mode === "catalog" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
          }`}
        >
          <RadioGroupItem value="catalog" id="mode-catalog" />
          <BookOpen className="h-5 w-5 text-primary" />
          <div>
            <div className="font-medium">Depuis le catalogue</div>
            <div className="text-xs text-muted-foreground">Choisir un webinar prédéfini</div>
          </div>
        </Label>
        <Label
          htmlFor="mode-new"
          className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
            mode === "new" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
          }`}
        >
          <RadioGroupItem value="new" id="mode-new" />
          <PlusCircle className="h-5 w-5 text-primary" />
          <div>
            <div className="font-medium">Hors catalogue</div>
            <div className="text-xs text-muted-foreground">Créer un nouveau webinar</div>
          </div>
        </Label>
      </RadioGroup>

      {mode === "catalog" && (
        <div className="space-y-2">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement du catalogue…
            </div>
          ) : catalog.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-lg">
              Aucun webinar dans le catalogue. Ajoutez-en depuis la gestion du catalogue.
            </p>
          ) : (
            <div className="grid gap-2 max-h-80 overflow-y-auto pr-1">
              {catalog.map((item) => (
                <Card
                  key={item.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedCatalogId === item.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => onSelectCatalog(item)}
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    {item.visual_url ? (
                      <img src={item.visual_url} alt="" className="h-12 w-20 rounded object-cover" />
                    ) : (
                      <div className="h-12 w-20 rounded bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant={item.category === "parcours_fincare" ? "default" : "secondary"} className="text-xs">
                          {item.category === "parcours_fincare" ? "Parcours FinCare" : "À la demande"}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.duration_minutes} min
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
