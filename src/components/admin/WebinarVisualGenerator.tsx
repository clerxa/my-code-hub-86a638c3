import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Loader2, Image, RefreshCw } from "lucide-react";

interface WebinarVisualGeneratorProps {
  webinarTitle: string;
  onVisualGenerated?: (dataUrl: string) => void;
}

export const WebinarVisualGenerator = ({ webinarTitle, onVisualGenerated }: WebinarVisualGeneratorProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const generateVisual = () => {
    const canvas = canvasRef.current;
    if (!canvas || !webinarTitle.trim()) return;

    const width = 1280;
    const height = 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Dark background
    ctx.fillStyle = "#1a1a2e";
    ctx.fillRect(0, 0, width, height);

    // Subtle grid pattern
    ctx.globalAlpha = 0.04;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // "WEBINAR EXCLUSIF" gradient text
    const labelText = "WEBINAR EXCLUSIF";
    ctx.font = "bold 72px Inter, system-ui, sans-serif";
    const labelMetrics = ctx.measureText(labelText);
    const labelX = (width - labelMetrics.width) / 2;
    const labelY = 160;

    const gradient = ctx.createLinearGradient(labelX, 0, labelX + labelMetrics.width, 0);
    gradient.addColorStop(0, "#3b82f6");    // blue
    gradient.addColorStop(0.3, "#7c3aed");  // purple
    gradient.addColorStop(0.6, "#f59e0b");  // amber
    gradient.addColorStop(1, "#ef4444");     // red
    ctx.fillStyle = gradient;
    ctx.fillText(labelText, labelX, labelY);

    // Title - centered, white, bold, word-wrapped
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 56px Inter, system-ui, sans-serif";
    const maxTitleWidth = width - 120;
    const titleLines = wrapText(ctx, webinarTitle.toUpperCase(), maxTitleWidth);
    
    const lineHeight = 72;
    const totalTitleHeight = titleLines.length * lineHeight;
    const titleStartY = labelY + 100 + (height - labelY - 100 - totalTitleHeight) / 2 - 40;

    titleLines.forEach((line, i) => {
      const lineWidth = ctx.measureText(line).width;
      const x = (width - lineWidth) / 2;
      ctx.fillText(line, x, titleStartY + i * lineHeight);
    });

    // Bottom accent line
    const accentGradient = ctx.createLinearGradient(width * 0.3, 0, width * 0.7, 0);
    accentGradient.addColorStop(0, "#3b82f6");
    accentGradient.addColorStop(1, "#7c3aed");
    ctx.fillStyle = accentGradient;
    ctx.fillRect(width * 0.35, height - 40, width * 0.3, 4);

    const dataUrl = canvas.toDataURL("image/png");
    setImageUrl(dataUrl);
    onVisualGenerated?.(dataUrl);
  };

  // Auto-generate when title changes
  useEffect(() => {
    if (webinarTitle.trim()) {
      generateVisual();
    }
  }, [webinarTitle]);

  const downloadImage = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `webinar-${webinarTitle.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.click();
  };

  return (
    <div className="space-y-3">
      {imageUrl && (
        <Card>
          <CardContent className="p-3 space-y-3">
            <img
              src={imageUrl}
              alt="Visuel webinar"
              className="w-full rounded-lg shadow-md"
              style={{ aspectRatio: "1280/720" }}
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={generateVisual}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Régénérer
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={downloadImage}>
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Télécharger
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {!imageUrl && webinarTitle.trim() && (
        <Button type="button" variant="outline" onClick={generateVisual}>
          <Image className="mr-2 h-4 w-4" />
          Générer le visuel
        </Button>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [""];
}
