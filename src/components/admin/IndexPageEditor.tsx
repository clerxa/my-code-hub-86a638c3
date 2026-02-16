import { ClientLogosManager } from "./ClientLogosManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";

export function IndexPageEditor() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Page d'accueil (Index)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Le contenu textuel de la page d'accueil (titre, sous-titre, FAQ…) est géré dans le code.
              Ci-dessous vous pouvez gérer les <strong>logos de références clients</strong> qui apparaissent
              sur toutes les landing pages du site.
            </p>
          </div>
        </CardContent>
      </Card>

      <ClientLogosManager />
    </div>
  );
}
