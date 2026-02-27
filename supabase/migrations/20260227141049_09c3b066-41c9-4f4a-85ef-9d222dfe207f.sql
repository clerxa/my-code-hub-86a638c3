-- Create feedbacks table
CREATE TABLE public.feedbacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedbacks
CREATE POLICY "Users can view their own feedbacks"
  ON public.feedbacks FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all feedbacks
CREATE POLICY "Admins can view all feedbacks"
  ON public.feedbacks FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can create their own feedbacks
CREATE POLICY "Users can create their own feedbacks"
  ON public.feedbacks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedbacks (only their own, status submitted)
CREATE POLICY "Users can update their own feedbacks"
  ON public.feedbacks FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can update any feedback
CREATE POLICY "Admins can update any feedback"
  ON public.feedbacks FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can delete their own feedbacks
CREATE POLICY "Users can delete their own feedbacks"
  ON public.feedbacks FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_feedbacks_updated_at
  BEFORE UPDATE ON public.feedbacks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();