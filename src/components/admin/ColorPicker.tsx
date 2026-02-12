import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, Pipette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  description?: string;
  variable?: string;
}

// Palette de couleurs prédéfinies avec leurs valeurs HSL
const colorPalette = [
  // Blues
  { name: "Bleu clair", hex: "#60A5FA", hsl: "217 91% 60%" },
  { name: "Bleu", hex: "#3B82F6", hsl: "221 83% 53%" },
  { name: "Bleu foncé", hex: "#1E40AF", hsl: "224 76% 48%" },
  { name: "Cyan", hex: "#06B6D4", hsl: "189 94% 43%" },
  
  // Purples
  { name: "Violet clair", hex: "#A78BFA", hsl: "258 90% 66%" },
  { name: "Violet", hex: "#8B5CF6", hsl: "258 90% 66%" },
  { name: "Violet foncé", hex: "#7C3AED", hsl: "258 90% 58%" },
  { name: "Magenta", hex: "#D946EF", hsl: "292 84% 61%" },
  
  // Greens
  { name: "Vert clair", hex: "#4ADE80", hsl: "142 71% 45%" },
  { name: "Vert", hex: "#22C55E", hsl: "142 76% 36%" },
  { name: "Vert foncé", hex: "#16A34A", hsl: "142 76% 36%" },
  { name: "Emeraude", hex: "#10B981", hsl: "160 84% 39%" },
  
  // Reds/Oranges
  { name: "Rouge", hex: "#EF4444", hsl: "0 72% 51%" },
  { name: "Orange", hex: "#F97316", hsl: "25 95% 53%" },
  { name: "Ambre", hex: "#F59E0B", hsl: "38 92% 50%" },
  { name: "Jaune", hex: "#EAB308", hsl: "48 96% 53%" },
  
  // Neutrals Light
  { name: "Blanc", hex: "#FFFFFF", hsl: "0 0% 100%" },
  { name: "Gris très clair", hex: "#F5F5F5", hsl: "0 0% 96%" },
  { name: "Gris clair", hex: "#E5E5E5", hsl: "0 0% 90%" },
  { name: "Gris", hex: "#A3A3A3", hsl: "0 0% 64%" },
  
  // Neutrals Dark
  { name: "Gris foncé", hex: "#525252", hsl: "0 0% 32%" },
  { name: "Noir grisé", hex: "#262626", hsl: "0 0% 15%" },
  { name: "Noir bleuté", hex: "#1A1F2E", hsl: "225 19% 8%" },
  { name: "Noir", hex: "#000000", hsl: "0 0% 0%" },
];

export function ColorPicker({ label, value, onChange, description, variable }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [customColor, setCustomColor] = useState("#000000");

  const getCurrentColor = () => {
    const match = colorPalette.find(c => c.hsl === value);
    return match ? match.hex : `hsl(${value})`;
  };

  // Convertir HEX en HSL
  const hexToHSL = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return "0 0% 0%";
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
  };

  const handleCustomColorChange = (hex: string) => {
    setCustomColor(hex);
    const hsl = hexToHSL(hex);
    onChange(hsl);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center justify-between">
        <span>{label}</span>
        {variable && <code className="text-xs text-muted-foreground">--{variable}</code>}
      </Label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <div className="flex items-center gap-2 w-full">
              <div
                className="w-8 h-8 rounded border-2 border-border shadow-sm flex-shrink-0"
                style={{ backgroundColor: getCurrentColor() }}
              />
              <span className="flex-1 text-sm truncate">{value}</span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4 bg-card z-50">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Palette prédéfinie</h4>
              <div className="grid grid-cols-6 gap-2">
                {colorPalette.map((color) => (
                  <button
                    key={color.hsl}
                    onClick={() => {
                      onChange(color.hsl);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-10 h-10 rounded border-2 hover:scale-110 transition-transform relative",
                      color.hsl === value ? "border-foreground ring-2 ring-ring" : "border-border"
                    )}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  >
                    {color.hsl === value && (
                      <Check className="h-4 w-4 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-lg" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Pipette className="h-4 w-4" />
                Couleur personnalisée
              </h4>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  className="w-12 h-10 rounded border-2 border-border cursor-pointer"
                />
                <Input
                  type="text"
                  value={customColor}
                  onChange={(e) => handleCustomColorChange(e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Utilisez le sélecteur pour choisir n'importe quelle couleur
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
