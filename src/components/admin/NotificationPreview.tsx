import { Bell, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DisplayType } from "@/types/notifications";

interface NotificationPreviewProps {
  title: string;
  message: string;
  imageUrl?: string;
  urlAction?: string;
  displayType: DisplayType;
  ctaText?: string;
}

export const NotificationPreview = ({
  title,
  message,
  imageUrl,
  urlAction,
  displayType,
  ctaText = "Voir plus"
}: NotificationPreviewProps) => {
  const hasContent = title || message;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
        <Bell className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">Remplissez les champs pour voir l'aperçu</p>
      </div>
    );
  }

  // Dropdown preview
  if (displayType === "dropdown") {
    return (
      <div className="relative">
        <p className="text-xs text-muted-foreground mb-2 text-center">Aperçu Dropdown</p>
        <div className="max-w-xs mx-auto bg-card border rounded-lg shadow-lg overflow-hidden">
          <div className="p-3 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex gap-3">
              {imageUrl && (
                <img src={imageUrl} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{title || "Titre"}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{message || "Message"}</p>
                <p className="text-xs text-muted-foreground mt-1">À l'instant</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Popup preview
  if (displayType === "popup") {
    return (
      <div className="relative">
        <p className="text-xs text-muted-foreground mb-2 text-center">Aperçu Popup</p>
        <div className="bg-background/80 backdrop-blur-sm rounded-lg p-4">
          <div className="max-w-sm mx-auto bg-card border rounded-lg shadow-xl overflow-hidden">
            {imageUrl && (
              <img src={imageUrl} alt="" className="w-full h-24 object-cover" />
            )}
            <div className="p-4">
              <h3 className="font-semibold text-base mb-1">{title || "Titre"}</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{message || "Message"}</p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1">Fermer</Button>
                {urlAction && <Button size="sm" className="flex-1">{ctaText}</Button>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Toast preview (left or right)
  if (displayType === "toast_left" || displayType === "toast_right") {
    const isLeft = displayType === "toast_left";
    return (
      <div className="relative">
        <p className="text-xs text-muted-foreground mb-2 text-center">
          Aperçu Toast ({isLeft ? "Gauche" : "Droite"})
        </p>
        <div className={`flex ${isLeft ? "justify-start" : "justify-end"}`}>
          <Card className="w-72 border-2 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-sm">{title || "Titre"}</CardTitle>
                  {imageUrl && (
                    <img src={imageUrl} alt="" className="w-full h-16 object-cover rounded mt-2" />
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-5 w-5">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-xs whitespace-pre-wrap line-clamp-3">
                {message || "Message"}
              </CardDescription>
              {urlAction && (
                <Button size="sm" className="mt-2 w-full text-xs h-7">{ctaText}</Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Banner preview
  if (displayType === "banner") {
    return (
      <div className="relative">
        <p className="text-xs text-muted-foreground mb-2 text-center">Aperçu Bandeau</p>
        <Alert className="rounded-lg bg-primary/10 border-primary/20">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1">
              {imageUrl && (
                <img src={imageUrl} alt="" className="w-8 h-8 rounded object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <AlertTitle className="text-xs font-semibold">{title || "Titre"}</AlertTitle>
                <AlertDescription className="text-xs truncate">{message || "Message"}</AlertDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {urlAction && <Button size="sm" className="h-6 text-xs px-2">{ctaText}</Button>}
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </Alert>
      </div>
    );
  }

  // Silent preview
  if (displayType === "silent") {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-muted-foreground border-2 border-dashed rounded-lg">
        <Bell className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">Notification silencieuse</p>
        <p className="text-xs">Visible uniquement dans la liste des notifications</p>
      </div>
    );
  }

  return null;
};
