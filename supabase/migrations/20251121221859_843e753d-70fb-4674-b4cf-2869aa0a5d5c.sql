-- Modifier la table partnership_requests pour inclure les infos de l'émetteur
ALTER TABLE public.partnership_requests
ADD COLUMN sender_first_name TEXT,
ADD COLUMN sender_last_name TEXT,
ADD COLUMN sender_email TEXT,
ADD COLUMN contact_first_name TEXT;

-- Renommer contact_name en contact_last_name pour plus de clarté
ALTER TABLE public.partnership_requests
RENAME COLUMN contact_name TO contact_last_name;

-- Créer une table pour les demandes de contact depuis la page partenariat
CREATE TABLE public.partnership_contact_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  company TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_size TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partnership_contact_requests ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre l'insertion publique
CREATE POLICY "Anyone can create partnership contact requests"
  ON public.partnership_contact_requests
  FOR INSERT
  WITH CHECK (true);

-- Politique pour les admins
CREATE POLICY "Admins can view all partnership contact requests"
  ON public.partnership_contact_requests
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update partnership contact requests"
  ON public.partnership_contact_requests
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete partnership contact requests"
  ON public.partnership_contact_requests
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Ajouter le template d'email dans les settings
INSERT INTO public.settings (key, value, metadata)
VALUES (
  'partnership_email_template',
  'Template email partenariat',
  jsonb_build_object(
    'subject', 'Découvrez FinCare - Programme d''éducation financière',
    'body', 'Bonjour {contact_first_name},

Je voulais vous partager une initiative qui pourrait avoir un vrai impact positif : FinCare.

C''est un programme d''éducation financière gratuit, déjà utilisé dans plusieurs entreprises réputées comme Salesforce, Thales, Meta ou encore Wavestone.
Il aide les collaborateurs à :

• mieux comprendre leur rémunération,
• éviter des erreurs fiscales coûteuses,
• optimiser épargne salariale / PER / RSU,
• et réduire le stress lié aux finances.

C''est 100% gratuit pour l''entreprise, et les équipes peuvent assister à des webinars thématiques, accéder à des parcours pédagogiques et échanger avec des conseillers certifiés.

Je serais ravi(e) si nous pouvions en bénéficier également.

Découvrez tous les avantages : {partnership_url}

Merci pour votre attention,
{sender_first_name}'
  )
)
ON CONFLICT (key) DO UPDATE
SET metadata = EXCLUDED.metadata;