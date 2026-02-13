UPDATE public.themes 
SET design_tokens = jsonb_build_object(
  'background', '210 20% 96%',
  'foreground', '222.2 84% 4.9%',
  'card', '0 0% 100%',
  'card-foreground', '222.2 84% 4.9%',
  'popover', '0 0% 100%',
  'popover-foreground', '222.2 84% 4.9%',
  'primary', '217 91% 60%',
  'primary-foreground', '0 0% 100%',
  'secondary', '271 81% 56%',
  'secondary-foreground', '0 0% 100%',
  'accent', '38 92% 50%',
  'accent-foreground', '0 0% 100%',
  'muted', '210 40% 96.1%',
  'muted-foreground', '215.4 16.3% 46.9%',
  'success', '145 60% 45%',
  'success-foreground', '0 0% 100%',
  'destructive', '0 84.2% 60.2%',
  'destructive-foreground', '0 0% 100%',
  'border', '214.3 31.8% 91.4%',
  'input', '214.3 31.8% 91.4%',
  'ring', '217 91% 60%',
  'warning', '38 90% 50%',
  'warning-foreground', '0 0% 100%'
)
WHERE id = 'perlib';