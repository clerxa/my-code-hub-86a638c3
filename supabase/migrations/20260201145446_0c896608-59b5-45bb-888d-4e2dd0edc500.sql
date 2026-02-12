-- Add DELETE policy for users to delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.user_notifications
FOR DELETE
USING (auth.uid() = user_id);