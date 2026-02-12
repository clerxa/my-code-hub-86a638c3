-- Table to store appointment preparation data
CREATE TABLE public.appointment_preparation (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  objectives TEXT[] DEFAULT '{}',
  intention_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_preparation UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.appointment_preparation ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own preparation"
  ON public.appointment_preparation FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preparation"
  ON public.appointment_preparation FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preparation"
  ON public.appointment_preparation FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_appointment_preparation_updated_at
  BEFORE UPDATE ON public.appointment_preparation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Table for preparation documents
CREATE TABLE public.appointment_preparation_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointment_preparation_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own documents"
  ON public.appointment_preparation_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON public.appointment_preparation_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON public.appointment_preparation_documents FOR DELETE
  USING (auth.uid() = user_id);