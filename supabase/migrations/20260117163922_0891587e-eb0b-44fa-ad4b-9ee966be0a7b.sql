-- Table pour les messages/questions aux contacts
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_type TEXT NOT NULL CHECK (recipient_type IN ('company_contact', 'admin')),
  recipient_id UUID, -- NULL si c'est pour les admins, sinon ID du company_contact
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour les requêtes fréquentes
CREATE INDEX idx_contact_messages_sender ON public.contact_messages(sender_id);
CREATE INDEX idx_contact_messages_company ON public.contact_messages(company_id);
CREATE INDEX idx_contact_messages_recipient_type ON public.contact_messages(recipient_type);

-- Activer RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Les utilisateurs peuvent voir leurs propres messages envoyés
CREATE POLICY "Users can view their own sent messages"
ON public.contact_messages
FOR SELECT
USING (auth.uid() = sender_id);

-- Policy: Les contacts entreprise peuvent voir les messages de leur entreprise
CREATE POLICY "Company contacts can view messages for their company"
ON public.contact_messages
FOR SELECT
USING (
  recipient_type = 'company_contact' 
  AND EXISTS (
    SELECT 1 FROM public.company_contacts cc 
    JOIN public.profiles p ON p.email = cc.email
    WHERE cc.company_id = contact_messages.company_id 
    AND p.id = auth.uid()
  )
);

-- Policy: Les admins peuvent voir tous les messages qui leur sont destinés
CREATE POLICY "Admins can view admin-destined messages"
ON public.contact_messages
FOR SELECT
USING (
  recipient_type = 'admin' 
  AND public.has_role(auth.uid(), 'admin')
);

-- Policy: Les utilisateurs authentifiés peuvent créer des messages
CREATE POLICY "Authenticated users can create messages"
ON public.contact_messages
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_contact_messages_updated_at
BEFORE UPDATE ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();