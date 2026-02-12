-- Table for moderation reasons (configurable in CMS)
CREATE TABLE public.forum_moderation_reasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  description TEXT,
  order_num INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_moderation_reasons ENABLE ROW LEVEL SECURITY;

-- Everyone can read moderation reasons
CREATE POLICY "Anyone can read moderation reasons"
ON public.forum_moderation_reasons FOR SELECT
USING (true);

-- Only admins can manage moderation reasons
CREATE POLICY "Admins can manage moderation reasons"
ON public.forum_moderation_reasons FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Insert default moderation reasons
INSERT INTO public.forum_moderation_reasons (label, description, order_num) VALUES
('Haine & Insultes', 'Propos discriminatoires, injures ou harcèlement.', 1),
('Contenu Illégal', 'Piratage, drogues ou partage de données privées.', 2),
('Spam & Pub', 'Publicités non désirées ou liens répétitifs.', 3),
('Hors-Sujet', 'Messages sans rapport avec le thème traité.', 4),
('Provocation', 'Messages visant uniquement à créer des conflits.', 5),
('Illisibilité', 'Langage SMS excessif ou majuscules (cris).', 6),
('Doublons', 'Sujet ou message déjà publié précédemment.', 7);

-- Table for moderation logs
CREATE TABLE public.forum_moderation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
  target_id UUID NOT NULL,
  reason_id UUID REFERENCES public.forum_moderation_reasons(id) ON DELETE SET NULL,
  custom_reason TEXT,
  action TEXT NOT NULL DEFAULT 'delete',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.forum_moderation_logs ENABLE ROW LEVEL SECURITY;

-- Moderators can view logs
CREATE POLICY "Moderators can view moderation logs"
ON public.forum_moderation_logs FOR SELECT
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'contact_entreprise')
);

-- Moderators can insert logs
CREATE POLICY "Moderators can insert moderation logs"
ON public.forum_moderation_logs FOR INSERT
WITH CHECK (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'contact_entreprise')
);

-- Add company community settings columns
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS forum_access_all_discussions BOOLEAN DEFAULT false;

-- Add moderator status to company contacts
ALTER TABLE public.company_contacts 
ADD COLUMN IF NOT EXISTS is_forum_moderator BOOLEAN DEFAULT true;

-- Add is_deleted and deleted_reason to forum posts
ALTER TABLE public.forum_posts 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deletion_reason_id UUID REFERENCES public.forum_moderation_reasons(id);

-- Add is_deleted and deleted_reason to forum comments
ALTER TABLE public.forum_comments 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS deletion_reason_id UUID REFERENCES public.forum_moderation_reasons(id);