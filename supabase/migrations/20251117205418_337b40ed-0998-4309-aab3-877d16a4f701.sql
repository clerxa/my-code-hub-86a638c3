-- Table pour stocker les permissions personnalisées par rôle
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  category text NOT NULL,
  action text NOT NULL,
  can_access boolean NOT NULL DEFAULT false,
  can_modify boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(role, category, action)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view permissions" ON public.role_permissions
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert permissions" ON public.role_permissions
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update permissions" ON public.role_permissions
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete permissions" ON public.role_permissions
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Index pour améliorer les performances
CREATE INDEX idx_role_permissions_role ON public.role_permissions(role);
CREATE INDEX idx_role_permissions_category ON public.role_permissions(category);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_role_permissions_updated_at
  BEFORE UPDATE ON public.role_permissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();