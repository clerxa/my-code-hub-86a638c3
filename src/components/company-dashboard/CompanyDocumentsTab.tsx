import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FileText, Download, Loader2, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import QRCode from "qrcode";
import { WelcomeKitPDF } from "./pdf/WelcomeKitPDF";
import myfincareLogoSrc from "@/assets/logo.png";

interface CompanyDocumentsTabProps {
  companyId: string;
}

interface GeneratedDocument {
  name: string;
  path: string;
  url: string;
  created_at: string;
}

export function CompanyDocumentsTab({ companyId }: CompanyDocumentsTabProps) {
  const [documents, setDocuments] = useState<GeneratedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchDocuments = useCallback(async () => {
    try {
      const { data, error } = await supabase.storage
        .from("company-documents")
        .list(companyId, { limit: 100, sortBy: { column: "created_at", order: "desc" } });

      if (error) throw error;

      const docs: GeneratedDocument[] = (data || []).map((file) => {
        const { data: urlData } = supabase.storage
          .from("company-documents")
          .getPublicUrl(`${companyId}/${file.name}`);
        return {
          name: file.name,
          path: `${companyId}/${file.name}`,
          url: urlData.publicUrl,
          created_at: file.created_at || "",
        };
      });

      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const getBookingUrl = async (companyRang: number | null): Promise<string> => {
    // Try rank-specific URL first
    if (companyRang) {
      const { data: rankSetting } = await supabase
        .from("settings")
        .select("value")
        .eq("key", `expert_booking_url_rang_${companyRang}`)
        .single();

      if (rankSetting?.value) {
        try {
          const parsed = JSON.parse(rankSetting.value);
          if (parsed) return parsed;
        } catch {
          if (rankSetting.value) return rankSetting.value;
        }
      }
    }

    // Fallback to default URL
    const { data: defaultSetting } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "default_expert_booking_url")
      .single();

    if (defaultSetting?.value) {
      try {
        return JSON.parse(defaultSetting.value);
      } catch {
        return defaultSetting.value;
      }
    }

    return "https://myfincare.lovable.app";
  };

  const fetchImageAsBase64 = async (url: string): Promise<string | null> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      // Fetch company data
      const { data: company, error: companyError } = await supabase
        .from("companies")
        .select("name, logo_url, rang")
        .eq("id", companyId)
        .single();

      if (companyError || !company) throw new Error("Impossible de charger les données entreprise");

      const companyRang = (company as any).rang as number | null;
      const [bookingUrl, contactsResult] = await Promise.all([
        getBookingUrl(companyRang),
        supabase.from("company_contacts").select("nom, email, role_contact").eq("company_id", companyId),
      ]);
      const companyContacts = contactsResult.data || [];

      // Use local asset for MyFinCare logo (avoids blocked external URLs)
      const [myfincareLogoBase64, companyLogoBase64, qrCodeDataUrl] = await Promise.all([
        fetchImageAsBase64(new URL(myfincareLogoSrc, window.location.origin).href),
        company.logo_url ? fetchImageAsBase64(company.logo_url) : Promise.resolve(null),
        QRCode.toDataURL(bookingUrl, {
          width: 300,
          margin: 2,
          color: { dark: "#ffffff", light: "#131720" },
        }),
      ]);

      // Generate PDF with base64 images
      const blob = await pdf(
        <WelcomeKitPDF
          companyName={company.name}
          companyLogoUrl={companyLogoBase64}
          myfincareLogoUrl={myfincareLogoBase64}
          bookingUrl={bookingUrl}
          qrCodeDataUrl={qrCodeDataUrl}
          companyContacts={companyContacts}
        />
      ).toBlob();

      // Upload to storage
      const fileName = "welcome-kit-salaries.pdf";
      const filePath = `${companyId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("company-documents")
        .upload(filePath, blob, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      toast.success("Kit Salariés généré avec succès !");
      await fetchDocuments();
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error(`Erreur lors de la génération : ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (path: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from("company-documents")
        .download(path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("Erreur lors du téléchargement");
    }
  };

  const handleDelete = async (path: string) => {
    try {
      const { error } = await supabase.storage
        .from("company-documents")
        .remove([path]);

      if (error) throw error;

      toast.success("Document supprimé");
      await fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Documents Générés
          </CardTitle>
          <CardDescription>
            Générez et gérez les documents de communication pour vos salariés. Le Kit Salariés est un PDF personnalisé avec votre identité, un QR Code de prise de rendez-vous et les informations clés du programme.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="gap-2"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {generating ? "Génération en cours..." : "Générer le Kit Salariés"}
            </Button>
            <Button
              variant="outline"
              onClick={fetchDocuments}
              size="icon"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents list */}
      {documents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">Aucun document généré</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Cliquez sur "Générer le Kit Salariés" pour créer votre premier document.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <Card key={doc.path} className="group hover:border-primary/30 transition-colors">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    {doc.created_at && (
                      <p className="text-xs text-muted-foreground">
                        Généré le {new Date(doc.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleDownload(doc.path, doc.name)}
                  >
                    <Download className="h-4 w-4" />
                    Télécharger
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(doc.path)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
