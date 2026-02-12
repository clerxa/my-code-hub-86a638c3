-- Create table for customizable communication templates
CREATE TABLE public.communication_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  communication_type VARCHAR(50) NOT NULL, -- email, intranet, slack, teams
  deadline VARCHAR(50) NOT NULL, -- j-30, j-14, j-7, j-3, j-1, jour-j, custom
  template_content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(communication_type, deadline)
);

-- Enable RLS
ALTER TABLE public.communication_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow read access to all" 
ON public.communication_templates 
FOR SELECT 
USING (true);

CREATE POLICY "Allow admin to manage templates" 
ON public.communication_templates 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_communication_templates_updated_at
BEFORE UPDATE ON public.communication_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();