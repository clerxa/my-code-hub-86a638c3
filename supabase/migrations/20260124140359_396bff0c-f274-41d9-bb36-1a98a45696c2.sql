
-- Drop the old permissive ALL policy (the problematic one)
DROP POLICY IF EXISTS "Authenticated users can manage evaluation keys" ON public.evaluation_keys_registry;

-- Drop the admin policy we just created to recreate it properly
DROP POLICY IF EXISTS "Admins can manage evaluation keys" ON public.evaluation_keys_registry;

-- Create proper admin-only policy for write operations
CREATE POLICY "Admins can manage evaluation keys"
ON public.evaluation_keys_registry
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
