import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { Notification, UserNotification } from "@/types/notifications";
import { NotificationPopup, NotificationToast, NotificationBanner } from "./NotificationDisplay";
import { useNotificationRulesEngine } from "@/hooks/useNotificationRulesEngine";

export const NotificationManager = () => {
  const { user } = useAuth();
  const [activeNotifications, setActiveNotifications] = useState<UserNotification[]>([]);
  const { evaluateAndTrigger, rulesCount } = useNotificationRulesEngine();
  const displayedNotificationIds = useRef<Set<string>>(new Set());

  // Evaluate notification rules on mount and periodically
  useEffect(() => {
    if (!user) return;

    // Initial evaluation after a short delay to allow page to load
    const initialTimeout = setTimeout(() => {
      evaluateAndTrigger();
    }, 3000);

    // Re-evaluate every 5 minutes
    const interval = setInterval(() => {
      evaluateAndTrigger();
    }, 5 * 60 * 1000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [user, evaluateAndTrigger]);

  // Fetch unread non-dropdown notifications on mount to display them
  useEffect(() => {
    if (!user) return;

    const fetchUnreadNotifications = async () => {
      const { data } = await supabase
        .from('user_notifications')
        .select(`
          *,
          notification:notifications(*)
        `)
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('delivered_at', { ascending: false });

      if (data) {
        // Filter for displayable notifications (not dropdown, not silent)
        const displayable = (data as UserNotification[]).filter((n) => {
          const displayType = n.notification?.display_type;
          return displayType && displayType !== 'dropdown' && displayType !== 'silent';
        });

        // Only show notifications that haven't been displayed in this session
        const newToDisplay = displayable.filter(n => 
          !displayedNotificationIds.current.has(n.id)
        );

        if (newToDisplay.length > 0) {
          // Mark as displayed
          newToDisplay.forEach(n => displayedNotificationIds.current.add(n.id));
          // Show only the most recent one to avoid overwhelming the user
          setActiveNotifications([newToDisplay[0]]);
        }
      }
    };

    // Fetch after a short delay to not block initial render
    const timeout = setTimeout(fetchUnreadNotifications, 1000);
    return () => clearTimeout(timeout);
  }, [user]);

  // Subscribe to new notifications via realtime
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('new-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`
        },
        async (payload) => {
          // Fetch the full notification details
          const { data } = await supabase
            .from('user_notifications')
            .select(`
              *,
              notification:notifications(*)
            `)
            .eq('id', payload.new.id)
            .single();

          if (data && data.notification) {
            const notif = data as UserNotification;
            // Only show non-silent and non-dropdown notifications immediately
            if (notif.notification.display_type !== 'silent' && notif.notification.display_type !== 'dropdown') {
              // Check if not already displayed
              if (!displayedNotificationIds.current.has(notif.id)) {
                displayedNotificationIds.current.add(notif.id);
                setActiveNotifications(prev => [...prev, notif]);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const removeNotification = (id: string) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    await supabase
      .from('user_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id);
  };

  const handleActionClick = (notificationId: string) => {
    markAsRead(notificationId);
  };

  return (
    <>
      {activeNotifications.map((notif) => {
        const notification = notif.notification!;

        switch (notification.display_type) {
          case 'popup':
            return (
              <NotificationPopup
                key={notif.id}
                notification={notification}
                onClose={() => removeNotification(notif.id)}
                onActionClick={() => handleActionClick(notif.id)}
              />
            );
          
          case 'toast_left':
          case 'toast_right':
            return (
              <NotificationToast
                key={notif.id}
                notification={notification}
                onClose={() => removeNotification(notif.id)}
                onActionClick={() => handleActionClick(notif.id)}
              />
            );
          
          case 'banner':
            return (
              <NotificationBanner
                key={notif.id}
                notification={notification}
                onClose={() => removeNotification(notif.id)}
                onActionClick={() => handleActionClick(notif.id)}
              />
            );
          
          default:
            return null;
        }
      })}
    </>
  );
};