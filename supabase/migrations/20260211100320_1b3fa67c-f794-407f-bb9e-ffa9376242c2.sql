-- Allow admins to manage risk questions
CREATE POLICY "Admins can insert questions"
ON public.risk_questions FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update questions"
ON public.risk_questions FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete questions"
ON public.risk_questions FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage risk answers
CREATE POLICY "Admins can insert answers"
ON public.risk_answers FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update answers"
ON public.risk_answers FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete answers"
ON public.risk_answers FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to manage risk profile settings
CREATE POLICY "Admins can update settings"
ON public.risk_profile_settings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert settings"
ON public.risk_profile_settings FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));