-- Modifier la colonne theme pour accepter un tableau de strings
ALTER TABLE public.modules 
ALTER COLUMN theme TYPE text[] USING 
  CASE 
    WHEN theme IS NULL THEN NULL
    WHEN theme = '' THEN NULL
    ELSE ARRAY[theme]
  END;