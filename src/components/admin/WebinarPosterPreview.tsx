import { useState, useEffect } from "react";
import { pdf } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Eye, Loader2, FileImage } from "lucide-react";
import { WebinarPosterPDF } from "./pdf/WebinarPosterPDF";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PDFViewer } from "@/components/modules/slides/PDFViewer";
import myfincareLogoSrc from "@/assets/logo.png";

/** Strip all HTML tags and decode entities */
const stripHtmlTags = (html: string): string => {
  if (!html) return "";
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || tmp.innerText || "").trim();
};

interface WebinarPosterPreviewProps {
  webinarTitle: string;
  webinarDate: string;
  webinarDescription: string;
  registrationUrl: string;
  bookingUrl: string;
  companyName: string;
  invitationText?: string;
}

export const WebinarPosterPreview = ({
  webinarTitle,
  webinarDate,
  webinarDescription,
  registrationUrl,
  bookingUrl,
  companyName,
  invitationText: initialInvitationText,
}: WebinarPosterPreviewProps) => {
  const [programText, setProgramText] = useState<string>("");
  const [descriptionText, setDescriptionText] = useState<string>("");
  const [invitationText, setInvitationText] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Clean title and description from HTML
  const cleanTitle = stripHtmlTags(webinarTitle);
  const cleanDescription = stripHtmlTags(webinarDescription);

  // Sync invitation text from props
  useEffect(() => {
    if (initialInvitationText) {
      setInvitationText(
        `${initialInvitationText} vous invite au prochain webinar dans le cadre du programme FinCare`
      );
    }
  }, [initialInvitationText]);

  // Sync description from props (keep HTML for rich editing)
  useEffect(() => {
    if (webinarDescription) {
      setDescriptionText(webinarDescription);
    }
  }, [webinarDescription]);

  // Parse date
  const parsedDate = webinarDate ? new Date(webinarDate) : null;
  const formattedDate = parsedDate
    ? parsedDate.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Date à confirmer";
  const formattedTime = parsedDate
    ? parsedDate.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const generatePoster = async (download: boolean = false) => {
    setGenerating(true);
    try {
      const [registrationQr, bookingQr] = await Promise.all([
        registrationUrl
          ? QRCode.toDataURL(registrationUrl, {
              width: 300,
              margin: 2,
              color: { dark: "#6B3FA0" },
            })
          : QRCode.toDataURL("https://myfincare.fr", {
              width: 300,
              margin: 2,
              color: { dark: "#6B3FA0" },
            }),
        bookingUrl
          ? QRCode.toDataURL(bookingUrl, {
              width: 300,
              margin: 2,
              color: { dark: "#3B7DD8" },
            })
          : QRCode.toDataURL("https://myfincare.fr", {
              width: 300,
              margin: 2,
              color: { dark: "#3B7DD8" },
            }),
      ]);

      const logoDataUrl = await imageToDataUrl(myfincareLogoSrc);

      const programItems = programText
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const blob = await pdf(
        <WebinarPosterPDF
          title={cleanTitle}
          date={formattedDate}
          time={formattedTime}
          description={descriptionText || cleanDescription}
          program={programItems}
          registrationQrCode={registrationQr}
          bookingQrCode={bookingQr}
          companyName={companyName}
          logoDataUrl={logoDataUrl}
          invitationText={invitationText}
        />
      ).toBlob();

      if (download) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `affiche-webinar-${cleanTitle.slice(0, 30).replace(/\s/g, "-")}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setShowPreview(true);
      }
    } catch (error) {
      console.error("Error generating poster:", error);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <Card className="border-dashed border-2 border-primary/30 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileImage className="h-5 w-5 text-primary" />
            Affiche Webinar (PDF A4)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
            <div>
              <span className="font-medium text-muted-foreground">Webinar :</span>{" "}
              <span className="font-semibold">{cleanTitle}</span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Date :</span>{" "}
              <span className="font-semibold">
                {formattedDate} {formattedTime && `à ${formattedTime}`}
              </span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Entreprise :</span>{" "}
              <span className="font-semibold">{companyName}</span>
            </div>
          </div>

          {/* Editable invitation text */}
          <div className="space-y-2">
            <Label>Texte d'invitation</Label>
            <Input
              value={invitationText}
              onChange={(e) => setInvitationText(e.target.value)}
              placeholder="Ex: Le CSE de Perlib vous invite au prochain webinar..."
              className="text-sm"
            />
          </div>

          {/* Editable description (rich text) */}
          <div className="space-y-2">
            <Label>Description</Label>
            <RichTextEditor
              value={descriptionText}
              onChange={setDescriptionText}
              placeholder="Description du webinar..."
              className="text-sm [&_.ProseMirror]:min-h-[80px]"
            />
          </div>

          {/* Editable program */}
          <div className="space-y-2">
            <Label>Programme synthétique (1 point par ligne)</Label>
            <Textarea
              value={programText}
              onChange={(e) => setProgramText(e.target.value)}
              placeholder={"Présentation du sujet et des intervenants\nPoints clés et conseils pratiques\nSession de questions-réponses\nRessources et prochaines étapes"}
              rows={5}
              className="text-sm"
            />
          </div>

          {/* QR code URLs */}
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              🔗 <strong>QR inscription :</strong> {registrationUrl || "Non configuré"}
            </p>
            <p>
              🔗 <strong>QR rendez-vous :</strong> {bookingUrl || "Non configuré"}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={() => generatePoster(false)}
              disabled={generating}
              variant="outline"
              className="flex-1"
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Eye className="mr-2 h-4 w-4" />
              )}
              Aperçu
            </Button>
            <Button
              onClick={() => generatePoster(true)}
              disabled={generating}
              className="flex-1"
            >
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Télécharger PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-h-[95vh] max-w-5xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span>Aperçu de l'affiche</span>
              <Button size="sm" onClick={() => generatePoster(true)} disabled={generating}>
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </Button>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Prévisualisation du PDF de l'affiche webinar avant téléchargement.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[85vh] overflow-auto p-4 pt-2">
            {previewUrl ? (
              <PDFViewer pdfUrl={previewUrl} hideNavigation />
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Génération de l'aperçu en cours...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

async function imageToDataUrl(src: string): Promise<string> {
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}
