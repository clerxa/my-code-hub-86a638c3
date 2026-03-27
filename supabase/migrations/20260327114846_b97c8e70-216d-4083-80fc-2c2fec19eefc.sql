ALTER TABLE public.feedbacks DROP CONSTRAINT feedbacks_user_id_fkey;
ALTER TABLE public.feedbacks ADD CONSTRAINT feedbacks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.feedbacks DROP CONSTRAINT feedbacks_responded_by_fkey;
ALTER TABLE public.feedbacks ADD CONSTRAINT feedbacks_responded_by_fkey FOREIGN KEY (responded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;