import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";

interface QRCodeSectionProps {
  registrationUrl: string;
  bookingUrl: string;
  webinarTitle: string;
}

export const QRCodeSection = ({ registrationUrl, bookingUrl, webinarTitle }: QRCodeSectionProps) => {
  const [registrationQR, setRegistrationQR] = useState<string>("");
  const [bookingQR, setBookingQR] = useState<string>("");

  useEffect(() => {
    const generateQRCodes = async () => {
      if (registrationUrl) {
        const qr = await QRCode.toDataURL(registrationUrl, { width: 400, margin: 2, color: { dark: "#1a1a2e" } });
        setRegistrationQR(qr);
      }
      if (bookingUrl) {
        const qr = await QRCode.toDataURL(bookingUrl, { width: 400, margin: 2, color: { dark: "#1a1a2e" } });
        setBookingQR(qr);
      }
    };
    generateQRCodes();
  }, [registrationUrl, bookingUrl]);

  const downloadQR = (dataUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    link.click();
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">QR Codes</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Webinar Registration QR */}
        {registrationUrl && (
          <Card>
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <h4 className="font-medium text-sm text-muted-foreground">Inscription au webinar</h4>
              {registrationQR && (
                <img src={registrationQR} alt="QR Code inscription webinar" className="w-48 h-48 rounded-lg" />
              )}
              <p className="text-xs text-muted-foreground text-center max-w-[200px] truncate">
                {registrationUrl}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQR(registrationQR, `qr-inscription-${webinarTitle.replace(/\s+/g, "-").toLowerCase()}.png`)}
                disabled={!registrationQR}
              >
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Expert Booking QR */}
        {bookingUrl && (
          <Card>
            <CardContent className="p-6 flex flex-col items-center gap-4">
              <h4 className="font-medium text-sm text-muted-foreground">Prise de RDV conseiller Perlib</h4>
              {bookingQR && (
                <img src={bookingQR} alt="QR Code prise de rendez-vous" className="w-48 h-48 rounded-lg" />
              )}
              <p className="text-xs text-muted-foreground text-center max-w-[200px] truncate">
                {bookingUrl}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQR(bookingQR, `qr-rdv-conseiller-perlib.png`)}
                disabled={!bookingQR}
              >
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {!registrationUrl && !bookingUrl && (
        <p className="text-sm text-muted-foreground">Aucune URL disponible pour générer les QR codes. Vérifiez la configuration de la session et de l'entreprise.</p>
      )}
    </div>
  );
};
