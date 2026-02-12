-- Create table to track video progress
CREATE TABLE public.video_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  module_id INTEGER NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  watch_time_seconds INTEGER NOT NULL DEFAULT 0,
  total_duration_seconds INTEGER,
  percentage_watched NUMERIC(5,2) DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_id)
);

-- Enable RLS
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own video progress" 
ON public.video_progress 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own video progress" 
ON public.video_progress 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own video progress" 
ON public.video_progress 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_video_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_video_progress_timestamp
BEFORE UPDATE ON public.video_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_video_progress_updated_at();

-- Create index for performance
CREATE INDEX idx_video_progress_user_module ON public.video_progress(user_id, module_id);