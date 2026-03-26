UPDATE sidebar_configurations
SET menu_items = '[
  {"id": "informations", "label": "Informations", "icon": "Info", "order": 0, "visible": true},
  {"id": "webinars", "label": "Webinars", "icon": "Video", "order": 1, "visible": true},
  {"id": "faq", "label": "FAQ", "icon": "HelpCircle", "order": 2, "visible": true},
  {"id": "leaderboard", "label": "Classement", "icon": "Trophy", "order": 3, "visible": true},
  {"id": "company-dashboard", "label": "Dashboard entreprise", "icon": "Building2", "order": 4, "visible": true, "categoryId": "settings"},
  {"id": "contacts", "label": "Mes contacts", "icon": "Contact", "order": 5, "visible": true, "categoryId": "settings"}
]'::jsonb
WHERE sidebar_type = 'company';