import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Loader2, Image } from "lucide-react";

interface BlogImageGeneratorProps {
  webinarTitle: string;
  webinarDate: string;
}

export const BlogImageGenerator = ({ webinarTitle, webinarDate }: BlogImageGeneratorProps) => {
  const [generating, setGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const parsedDate = webinarDate ? new Date(webinarDate) : null;
  const formattedDate = parsedDate
    ? parsedDate.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const formattedTime = parsedDate
    ? parsedDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : "";

  const generateImage = () => {
    setGenerating(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Blog image standard dimensions (16:9)
    const width = 1200;
    const height = 630;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background gradient using app colors (primary blue → secondary purple)
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, "#3b82f6"); // primary blue
    gradient.addColorStop(0.5, "#7c3aed"); // secondary purple
    gradient.addColorStop(1, "#1e40af"); // darker blue
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Decorative elements
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(width * 0.85, height * 0.2, 200, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width * 0.1, height * 0.8, 150, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Subtle pattern overlay
    ctx.globalAlpha = 0.05;
    for (let i = 0; i < width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, height);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // "WEBINAR" label
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "bold 18px Inter, system-ui, sans-serif";
    ctx.letterSpacing = "4px";
    const labelText = "📹  WEBINAR";
    // Badge background
    const labelWidth = ctx.measureText(labelText).width + 32;
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    roundRect(ctx, 60, 80, labelWidth, 40, 20);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.fillText(labelText, 76, 106);

    // Title - word wrap
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 48px Inter, system-ui, sans-serif";
    const maxTitleWidth = width - 140;
    const titleLines = wrapText(ctx, webinarTitle, maxTitleWidth);
    const titleStartY = 190;
    titleLines.forEach((line, i) => {
      ctx.fillText(line, 70, titleStartY + i * 60);
    });

    // Date and time
    const dateY = titleStartY + titleLines.length * 60 + 40;
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "600 26px Inter, system-ui, sans-serif";
    const dateText = `📅 ${formattedDate}`;
    ctx.fillText(dateText, 70, dateY);

    if (formattedTime) {
      ctx.fillText(`🕐 ${formattedTime}`, 70, dateY + 40);
    }

    // Bottom bar
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(0, height - 70, width, 70);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "600 20px Inter, system-ui, sans-serif";
    ctx.fillText("Perlib — Éducation financière", 70, height - 28);

    // Accent line
    ctx.fillStyle = "#f59e0b"; // accent orange/amber
    ctx.fillRect(70, titleStartY + titleLines.length * 60 + 10, 80, 4);

    const dataUrl = canvas.toDataURL("image/png");
    setImageUrl(dataUrl);
    setGenerating(false);
  };

  const downloadImage = () => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `blog-webinar-${webinarTitle.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.click();
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Image Blog</h3>
      <p className="text-sm text-muted-foreground">
        Générez une image de couverture pour votre article intranet / blog avec le titre et la date du webinar.
      </p>

      <Button onClick={generateImage} disabled={generating || !webinarTitle}>
        {generating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Image className="mr-2 h-4 w-4" />
        )}
        Générer l'image
      </Button>

      {imageUrl && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <img
              src={imageUrl}
              alt="Aperçu image blog webinar"
              className="w-full rounded-lg shadow-md"
              style={{ aspectRatio: "1200/630" }}
            />
            <Button variant="outline" onClick={downloadImage}>
              <Download className="mr-2 h-4 w-4" />
              Télécharger l'image
            </Button>
          </CardContent>
        </Card>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

// Utility: rounded rectangle
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Utility: word wrap
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) lines.push(currentLine);
  return lines.length > 0 ? lines : [""];
}
