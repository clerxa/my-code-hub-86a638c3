import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Notification } from "@/types/notifications";
import { useNavigate } from "react-router-dom";

interface Props {
  notification: Notification;
  onClose: () => void;
  onActionClick?: () => void;
}

// Popup centrale
export const NotificationPopup = ({ notification, onClose, onActionClick }: Props) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (notification.url_action) {
      navigate(notification.url_action);
    }
    if (onActionClick) onActionClick();
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {notification.image_url && (
          <img
            src={notification.image_url}
            alt=""
            className="w-full h-32 object-cover rounded-t-lg -mt-6 -mx-6"
          />
        )}
        <DialogHeader>
          <DialogTitle>{notification.title}</DialogTitle>
          <DialogDescription className="whitespace-pre-wrap">
            {notification.message}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          {notification.url_action && (
            <Button onClick={handleAction}>
              {notification.button_text || 'Voir plus'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Toast (bas gauche ou droite)
export const NotificationToast = ({ notification, onClose, onActionClick }: Props) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const isLeft = notification.display_type === 'toast_left';

  useEffect(() => {
    // Animation d'entrée
    setTimeout(() => setVisible(true), 100);

    // Auto-close après 5 secondes
    const timer = setTimeout(() => {
      handleClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handleAction = () => {
    if (notification.url_action) {
      navigate(notification.url_action);
    }
    if (onActionClick) onActionClick();
    handleClose();
  };

  return (
    <div
      className={`fixed bottom-4 ${isLeft ? 'left-4' : 'right-4'} z-50 w-96 max-w-[calc(100vw-2rem)] transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <Card className="border-2 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-base">{notification.title}</CardTitle>
              {notification.image_url && (
                <img
                  src={notification.image_url}
                  alt=""
                  className="w-full h-20 object-cover rounded mt-2"
                />
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-sm whitespace-pre-wrap">
            {notification.message}
          </CardDescription>
          {notification.url_action && (
            <Button
              onClick={handleAction}
              size="sm"
              className="mt-3 w-full"
            >
              {notification.button_text || 'Voir plus'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Bandeau haut
export const NotificationBanner = ({ notification, onClose, onActionClick }: Props) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (notification.url_action) {
      navigate(notification.url_action);
    }
    if (onActionClick) onActionClick();
    onClose();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300">
      <Alert className="rounded-none border-x-0 border-t-0 bg-primary/10 border-primary/20">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            {notification.image_url && (
              <img
                src={notification.image_url}
                alt=""
                className="w-10 h-10 rounded object-cover"
              />
            )}
            <div className="flex-1">
              <AlertTitle className="text-sm font-semibold">
                {notification.title}
              </AlertTitle>
              <AlertDescription className="text-xs">
                {notification.message}
              </AlertDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {notification.url_action && (
              <Button onClick={handleAction} size="sm">
                {notification.button_text || 'Voir'}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
};