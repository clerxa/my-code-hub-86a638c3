

## Nettoyage automatique des sessions d'ancien projet Supabase

### Probleme
Apres la migration, le navigateur conserve dans `localStorage` un token JWT lie a l'ancien projet Supabase. L'application tente de l'utiliser, ce qui provoque des comportements inattendus (affichage de donnees fantomes, session invalide).

### Solution
Ajouter une verification au demarrage de l'application qui compare le project ref stocke dans la cle de session localStorage avec le project ref actuel. Si ils ne correspondent pas, supprimer toutes les cles liees a l'ancien projet et forcer une deconnexion propre.

### Comment ca fonctionne
Supabase stocke les sessions dans localStorage avec des cles au format `sb-<project-ref>-auth-token`. En verifiant si une cle `sb-*-auth-token` existe pour un project ref different de `gbotqqeirtbmmyxqwtzl`, on detecte une session orpheline.

### Etapes techniques

1. **Creer un utilitaire `src/lib/sessionCleanup.ts`**
   - Scanner toutes les cles localStorage correspondant au pattern `sb-*-auth-token`
   - Comparer le project ref extrait avec le ref actuel (`gbotqqeirtbmmyxqwtzl`)
   - Si une cle d'un ancien projet est trouvee, supprimer toutes les cles `sb-<old-ref>-*` du localStorage
   - Logger l'operation pour le debugging

2. **Integrer dans `src/integrations/supabase/client.ts`**
   - Appeler la fonction de nettoyage **avant** la creation du client Supabase
   - Cela garantit que le client demarre toujours avec un etat propre

### Impact
- Aucun changement visible pour les utilisateurs avec une session valide
- Les utilisateurs avec une session d'un ancien projet seront automatiquement deconnectes et rediriges vers la page de login
- Correction permanente : le mecanisme reste actif pour toute future migration

