-- Permettre aux utilisateurs de lire les notifications qui leur sont attribuées
CREATE POLICY "Users can view notifications assigned to them" 
ON public.notifications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM user_notifications 
    WHERE user_notifications.notification_id = notifications.id 
    AND user_notifications.user_id = auth.uid()
  )
);