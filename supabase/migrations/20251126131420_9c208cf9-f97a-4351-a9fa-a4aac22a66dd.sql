-- Modifier la structure de la table themes pour supporter un design system complet
-- On remplace le champ colors (qui ne contenait que 4 couleurs) par design_tokens (qui contient tous les tokens)

ALTER TABLE themes 
DROP COLUMN IF EXISTS colors CASCADE;

ALTER TABLE themes 
ADD COLUMN design_tokens JSONB NOT NULL DEFAULT '{
  "background": "225 19% 8%",
  "foreground": "0 0% 98%",
  "primary": "217 91% 60%",
  "primary-foreground": "0 0% 100%",
  "secondary": "271 81% 56%",
  "secondary-foreground": "0 0% 100%",
  "accent": "38 92% 50%",
  "accent-foreground": "0 0% 100%",
  "muted": "220 10% 20%",
  "muted-foreground": "217 91% 70%",
  "card": "220 12% 12%",
  "card-foreground": "0 0% 98%",
  "border": "210 10% 20%",
  "input": "210 10% 20%",
  "ring": "217 91% 60%",
  "success": "145 60% 45%",
  "success-foreground": "0 0% 100%",
  "destructive": "0 75% 55%",
  "destructive-foreground": "0 0% 100%",
  "warning": "38 92% 50%",
  "warning-foreground": "0 0% 100%"
}'::jsonb;