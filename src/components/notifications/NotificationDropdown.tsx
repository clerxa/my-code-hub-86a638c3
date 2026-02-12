import { useState, useEffect, useRef } from "react";
import { X, ExternalLink, Check, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { UserNotification } from "@/types/notifications";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface Props {
  onClose: () => void;
  onUnreadCountChange: (count: number) => void;
}

export const NotificationDropdown = ({ onClose, onUnreadCountChange }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();

    // Close on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      // First, get user notifications
      const { data: userNotifs, error: userNotifsError } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('delivered_at', { ascending: false })
        .limit(20);

      if (userNotifsError) throw userNotifsError;
      if (!userNotifs || userNotifs.length === 0) {
        setNotifications([]);
        setLoading(false);
        return;
      }

      // Get unique notification IDs
      const notificationIds = [...new Set(userNotifs.map(un => un.notification_id))];

      // Fetch the actual notifications
      const { data: notifs, error: notifsError } = await supabase
        .from('notifications')
        .select('*')
        .in('id', notificationIds);

      if (notifsError) throw notifsError;

      // Create a map for quick lookup
      const notifsMap = new Map(notifs?.map(n => [n.id, n]) || []);

      // Combine the data
      const combinedData: UserNotification[] = userNotifs.map(un => ({
        ...un,
        notification: notifsMap.get(un.notification_id) as any
      }));

      console.log('Notifications fetched:', combinedData);
      setNotifications(combinedData);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);

    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );

    const unreadCount = notifications.filter(n => !n.is_read && n.id !== notificationId).length;
    onUnreadCountChange(unreadCount);
  };

  const markAllAsRead = async () => {
    if (!user) return;

    await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    onUnreadCountChange(0);
  };

  const deleteNotification = async (notificationId: string) => {
    if (!user) return;

    // Update local state first for immediate feedback
    const notificationToDelete = notifications.find(n => n.id === notificationId);
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    // Update unread count if the deleted notification was unread
    if (notificationToDelete && !notificationToDelete.is_read) {
      const newUnreadCount = notifications.filter(n => !n.is_read && n.id !== notificationId).length;
      onUnreadCountChange(newUnreadCount);
    }

    // Then delete from database
    const { error } = await supabase
      .from('user_notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting notification:', error);
      // Restore the notification if delete failed
      if (notificationToDelete) {
        setNotifications(prev => [...prev, notificationToDelete].sort(
          (a, b) => new Date(b.delivered_at).getTime() - new Date(a.delivered_at).getTime()
        ));
      }
    }
  };

  const handleNotificationClick = async (notification: UserNotification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    if (notification.notification?.url_action) {
      onClose();
      navigate(notification.notification.url_action);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] z-50 animate-in slide-in-from-top-2 duration-200"
    >
      <Card className="border-2 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="h-5">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-8 text-xs"
                >
                  <Check className="h-3 w-3 mr-1" />
                  Tout lire
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
        </CardHeader>

        <Separator />

        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Chargement...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Aucune notification
              </div>
            ) : (
              <div className="divide-y">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer relative group ${
                      !notif.is_read ? 'bg-primary/5' : ''
                    }`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex gap-3">
                      {notif.notification?.image_url && (
                        <img
                          src={notif.notification.image_url}
                          alt=""
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`text-sm font-medium ${!notif.is_read ? 'text-primary' : ''}`}>
                            {notif.notification?.title}
                          </h4>
                          {!notif.is_read && (
                            <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {notif.notification?.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(notif.delivered_at), 'Pp', { locale: fr })}
                          </span>
                          {notif.notification?.url_action && (
                            <ExternalLink className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notif.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};