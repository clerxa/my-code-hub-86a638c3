-- Insert default landing page content structure
INSERT INTO public.settings (key, value, metadata) 
VALUES 
  ('landing_hero', '{"title": "Transformez la culture financière de vos collaborateurs", "subtitle": "FinCare est la première plateforme d''éducation financière dédiée aux salariés. Webinars, simulateurs, parcours personnalisés.", "ctaPrimary": "Demander une démo", "ctaSecondary": "Voir un exemple de webinar", "image": "", "clientLogos": []}', '{"section": "hero"}'),
  
  ('landing_problems', '[
    {"title": "Les salariés ne comprennent pas leurs fiches de paie", "description": "La complexité des bulletins de salaire crée confusion et frustration. FinCare démystifie chaque ligne.", "icon": "FileQuestion"},
    {"title": "Les erreurs fiscales coûtent cher", "description": "Déclarations erronées, crédits d''impôt non utilisés... Nous aidons à optimiser légalement.", "icon": "AlertCircle"},
    {"title": "La rémunération variable est opaque", "description": "ESPP, RSU, bonus... vos collaborateurs méritent de comprendre leur package complet.", "icon": "Eye"}
  ]', '{"section": "problems"}'),
  
  ('landing_solution', '{"title": "La solution FinCare", "description": "Une approche complète pour éduquer, accompagner et rassurer vos collaborateurs sur tous les sujets financiers liés à leur rémunération.", "pillars": [
    {"title": "Webinars experts", "description": "Sessions live animées par des experts certifiés sur des thématiques concrètes", "icon": "Video"},
    {"title": "Guides & simulateurs", "description": "Outils interactifs pour calculer impôts, optimiser épargne salariale, comprendre les stock-options", "icon": "Calculator"},
    {"title": "Quiz personnalisés", "description": "Parcours gamifiés pour tester et renforcer les connaissances", "icon": "Brain"},
    {"title": "Accompagnement individuel", "description": "Accès à des conseillers financiers certifiés pour des questions spécifiques", "icon": "UserCheck"}
  ]}', '{"section": "solution"}'),
  
  ('landing_social_proof', '{"title": "Ils nous font confiance", "companies": ["Salesforce", "Thales", "Meta", "Wavestone"], "testimonials": [
    {"name": "Marie Dubois", "role": "DRH, Tech Company", "content": "Nos collaborateurs apprécient énormément les webinars. Enfin des réponses claires à leurs questions financières.", "avatar": ""},
    {"name": "Thomas Martin", "role": "Salarié, Fintech", "content": "Grâce à FinCare, j''ai pu optimiser ma déclaration d''impôts et économiser plus de 2000€.", "avatar": ""}
  ], "stats": [
    {"value": "500+", "label": "Entreprises partenaires"},
    {"value": "50k+", "label": "Collaborateurs formés"},
    {"value": "4.8/5", "label": "Note de satisfaction"}
  ]}', '{"section": "social_proof"}'),
  
  ('landing_demo', '{"title": "Découvrez la plateforme en action", "description": "Parcours personnalisés, simulateurs interactifs, webinars thématiques... tout ce dont vos collaborateurs ont besoin.", "screenshots": [], "layout": "2-columns"}', '{"section": "demo"}'),
  
  ('landing_benefits', '{"title": "Pourquoi choisir FinCare ?", "items": [
    {"title": "Sérénité financière", "description": "Réduisez le stress lié aux finances personnelles", "icon": "Heart"},
    {"title": "Compréhension de la rémunération", "description": "Clarifiez tous les éléments du package salarial", "icon": "BookOpen"},
    {"title": "Moins d''erreurs fiscales", "description": "Évitez les déclarations incorrectes et les pénalités", "icon": "ShieldCheck"},
    {"title": "Engagement collaborateurs", "description": "Un avantage qui fait vraiment la différence", "icon": "TrendingUp"}
  ]}', '{"section": "benefits"}'),
  
  ('landing_comparison', '{"title": "Sans FinCare vs Avec FinCare", "enabled": true, "rows": [
    {"without": "Questions RH sans réponse", "with": "Support expert disponible", "highlight": true},
    {"without": "Erreurs fiscales coûteuses", "with": "Optimisation légale guidée", "highlight": true},
    {"without": "Package salarial mal compris", "with": "Transparence totale", "highlight": false},
    {"without": "Formation financière inexistante", "with": "Webinars & parcours certifiés", "highlight": true}
  ]}', '{"section": "comparison"}'),
  
  ('landing_faq', '[
    {"question": "FinCare est-il vraiment gratuit pour l''entreprise ?", "answer": "Oui, totalement. Notre modèle économique repose sur des partenariats avec des institutions financières. Aucun coût pour vous."},
    {"question": "Comment se met en place FinCare ?", "answer": "En moins de 48h. Nous configurons la plateforme, intégrons votre charte graphique, et lançons la communication interne."},
    {"question": "Combien de temps cela prend-il pour voir des résultats ?", "answer": "Dès le premier mois, vous verrez une baisse des questions RH liées aux fiches de paie et une meilleure compréhension des avantages."},
    {"question": "Les données de nos collaborateurs sont-elles sécurisées ?", "answer": "Absolument. Conformité RGPD, hébergement en Europe, aucune revente de données. La confidentialité est notre priorité."}
  ]', '{"section": "faq"}'),
  
  ('landing_cta_final', '{"title": "Prêt à transformer la culture financière de vos équipes ?", "subtitle": "Rejoignez les 500+ entreprises qui font confiance à FinCare", "cta": "Demander une démonstration"}', '{"section": "cta_final"}')
ON CONFLICT (key) DO NOTHING;