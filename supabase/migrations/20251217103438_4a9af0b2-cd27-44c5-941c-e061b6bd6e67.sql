-- Change parts_fiscales from integer to numeric to support decimal values like 2.5
ALTER TABLE public.user_financial_profiles 
ALTER COLUMN parts_fiscales TYPE numeric(4,2) USING parts_fiscales::numeric(4,2);