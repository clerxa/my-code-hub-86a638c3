# Configuration du Système de Webinars

## Vue d'ensemble

Le système de webinars permet de créer des modules de type webinar intégrés avec Livestorm, avec un suivi automatique des inscriptions et des participations.

## Architecture

### Base de données

- **Table `modules`** : Contient les modules de type `webinar` avec les champs :
  - `title`, `description`, `webinar_date`, `points`
  - `embed_code` : iframe Livestorm pour l'inscription/participation
  - `webinar_registration_url` : lien vers Livestorm (si pas d'embed)
  - `webinar_image_url`, `estimated_time`, `difficulty_level`
  - `pedagogical_objectives`, `key_takeaways`, `theme`

- **Table `webinar_registrations`** : Suivi des inscriptions
  - `user_id`, `module_id`, `email`
  - `registered_at`, `joined_at`, `completed_at`
  - `livestorm_participant_id`

- **Table `module_validations`** : Validations des modules
  - Créée automatiquement lors de la participation au webinar

### Edge Function

L'endpoint `/api/livestorm/webhook` gère les webhooks Livestorm :
- `participant.registered` : enregistre l'inscription
- `participant.joined` : valide le module et attribue les points

## Configuration Livestorm

### 1. Créer un webinar sur Livestorm

1. Créez votre webinar sur [app.livestorm.co](https://app.livestorm.co)
2. Configurez la date, les intervenants, etc.
3. Récupérez :
   - Le code d'intégration (iframe)
   - L'URL d'inscription

### 2. Configurer les webhooks

1. Allez dans **Settings > Integrations > Webhooks**
2. Créez un nouveau webhook avec l'URL :
   ```
   https://mftrggltywyfsvlckhad.supabase.co/functions/v1/livestorm-webhook
   ```
3. Sélectionnez les événements :
   - ✅ `participant.registered`
   - ✅ `participant.joined`

### 3. Créer un module webinar

Dans l'interface d'administration :

```sql
INSERT INTO modules (
  title,
  description,
  type,
  webinar_date,
  points,
  embed_code,
  webinar_registration_url,
  webinar_image_url,
  estimated_time,
  difficulty_level,
  theme,
  pedagogical_objectives,
  key_takeaways,
  order_num
) VALUES (
  'Optimise ta fiscalité avec les actions gratuites',
  'Découvre comment optimiser tes impôts avec les dispositifs d''actionnariat',
  'webinar',
  '2024-02-15 18:00:00+00',
  50,
  '<iframe src="https://app.livestorm.co/..." allowfullscreen></iframe>',
  'https://app.livestorm.co/...',
  'https://...',
  60,
  2,
  ARRAY['Fiscalité', 'Actions gratuites'],
  ARRAY['Comprendre les dispositifs fiscaux', 'Calculer son économie d''impôts'],
  ARRAY['Les différents types d''actions gratuites', 'Les stratégies d''optimisation'],
  1
);
```

### 4. Ajouter le module à un parcours

```sql
-- Ajouter le module au parcours
INSERT INTO parcours_modules (parcours_id, module_id, order_num)
VALUES ('uuid-du-parcours', module_id, 1);

-- Assigner le parcours à une entreprise
INSERT INTO parcours_companies (parcours_id, company_id)
VALUES ('uuid-du-parcours', 'uuid-entreprise');
```

## Flux utilisateur

1. **Découverte** : L'utilisateur voit le module webinar dans son parcours
2. **Inscription** :
   - Si `embed_code` est présent : formulaire Livestorm intégré
   - Sinon : lien externe vers Livestorm
   - L'inscription est enregistrée dans `webinar_registrations`
3. **Participation** :
   - L'utilisateur rejoint le webinar via l'iframe ou le lien
   - Livestorm envoie un webhook `participant.joined`
4. **Validation automatique** :
   - Le webhook crée une validation dans `module_validations`
   - Les points sont attribués automatiquement
   - Le module est marqué comme complété

## Sécurité

- ✅ RLS activé sur toutes les tables
- ✅ Les utilisateurs ne peuvent voir que leurs propres inscriptions
- ✅ La validation ne peut être faite que via webhook (pas manuellement)
- ✅ Les points sont attribués une seule fois

## Monitoring

### Logs de l'edge function

```bash
# Voir les logs de l'edge function
supabase functions logs livestorm-webhook --project-ref mftrggltywyfsvlckhad
```

### Vérifier les inscriptions

```sql
SELECT 
  p.email,
  m.title,
  wr.registered_at,
  wr.joined_at,
  wr.completed_at
FROM webinar_registrations wr
JOIN profiles p ON p.id = wr.user_id
JOIN modules m ON m.id = wr.module_id
ORDER BY wr.created_at DESC;
```

### Vérifier les validations

```sql
SELECT 
  p.email,
  m.title,
  mv.success,
  mv.attempted_at
FROM module_validations mv
JOIN profiles p ON p.id = mv.user_id
JOIN modules m ON m.id = mv.module_id
WHERE m.type = 'webinar'
ORDER BY mv.created_at DESC;
```

## Troubleshooting

### L'embed ne s'affiche pas
- Vérifiez que `embed_code` contient bien un iframe
- Vérifiez la hauteur minimale (480px)
- Vérifiez les permissions iframe de Livestorm

### Le webhook ne fonctionne pas
- Vérifiez l'URL du webhook dans Livestorm
- Vérifiez les logs de l'edge function
- Vérifiez que l'email du participant existe dans `profiles`

### Les points ne sont pas attribués
- Vérifiez que le module a bien des points configurés
- Vérifiez les logs pour voir si le webhook a été reçu
- Vérifiez qu'il n'y a pas déjà une validation existante

## Notes importantes

⚠️ **Important** :
- Les utilisateurs doivent s'inscrire avec le même email que leur compte FinCare
- La validation est automatique, il n'y a plus de code à saisir manuellement
- Un utilisateur ne peut valider qu'une seule fois chaque module webinar
