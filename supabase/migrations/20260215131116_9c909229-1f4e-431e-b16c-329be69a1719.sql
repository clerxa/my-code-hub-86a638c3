
CREATE POLICY "Admins can insert product_category_links"
ON public.product_category_links FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product_category_links"
ON public.product_category_links FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
