import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  Database, 
  Shield, 
  Palette, 
  Layout, 
  Code2,
  FileText,
  Users,
  Settings,
  BookOpen,
  Star,
  Building2,
  Trophy,
  Bell,
  Calendar,
  Target,
  UserCheck,
  Lock,
  Swords,
  Sparkles,
  Calculator,
  MessageSquare,
  Play,
  Zap
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export const DocumentationTab = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Documentation Technique</h2>
        <p className="text-muted-foreground">
          Guide complet de l'architecture, des modèles et des bonnes pratiques
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="rules">Règles métier</TabsTrigger>
          <TabsTrigger value="models">Modèles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="themes">Thèmes</TabsTrigger>
          <TabsTrigger value="ux">UX/UI</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
          <TabsTrigger value="issues">Problèmes</TabsTrigger>
          <TabsTrigger value="roadmap">Plan d'action</TabsTrigger>
        </TabsList>

        {/* VUE D'ENSEMBLE */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                À propos de cette application
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Technologies utilisées</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li><strong>Frontend:</strong> React 18, TypeScript, Vite, TailwindCSS</li>
                  <li><strong>Backend:</strong> Supabase (PostgreSQL, Auth, Storage, Edge Functions)</li>
                  <li><strong>UI Components:</strong> shadcn/ui (Radix UI primitives)</li>
                  <li><strong>State Management:</strong> React Query (@tanstack/react-query)</li>
                  <li><strong>Routing:</strong> React Router DOM v6</li>
                  <li><strong>Forms:</strong> React Hook Form + Zod</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Structure de l'application</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Pages principales</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <div><Badge variant="outline">Employee</Badge> Dashboard salarié</div>
                      <div><Badge variant="outline">Company</Badge> Espace entreprise</div>
                      <div><Badge variant="outline">Admin</Badge> Back-office</div>
                      <div><Badge variant="outline">Parcours</Badge> Modules de formation</div>
                      <div><Badge variant="outline">Forum</Badge> Communauté</div>
                      <div><Badge variant="outline">Simulateurs</Badge> PER, ESPP, Épargne, etc.</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Rôles utilisateurs</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <div><Badge>admin</Badge> Accès complet au back-office</div>
                      <div><Badge variant="secondary">contact_entreprise</Badge> Gestion de l'entreprise</div>
                      <div><Badge variant="outline">user</Badge> Utilisateur standard (salarié)</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Statut actuel de l'audit</AlertTitle>
            <AlertDescription>
              <strong>Dernière mise à jour : 17 décembre 2024</strong> - Audit complet : Quête FinCare, multi-thèmes, simulateurs, forum, webinaires, onboarding.
              <br />
              <span className="text-xs">70+ tables, 8 simulateurs, 3 thèmes narratifs, système de gamification complet.</span>
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* RÈGLES MÉTIER */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Règles métier de l'application
              </CardTitle>
              <CardDescription>
                Ensemble des règles fonctionnelles qui régissent le comportement de l'application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Gamification */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  Gamification & Points
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Attribution des points :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Chaque module validé rapporte les points définis dans sa configuration (champ <code>points</code>)</li>
                      <li>Les webinaires ont 2 types de points : inscription (<code>points_registration</code>) et participation (<code>points_participation</code>)</li>
                      <li>Les rendez-vous avec un expert peuvent rapporter des points (configurables par formulaire)</li>
                      <li>Les quiz réussis rapportent un pourcentage des points selon le nombre de tentatives</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Classement entreprise :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Le leaderboard classe les employés d'une même entreprise par <code>total_points</code> décroissant</li>
                      <li>Le rang de l'utilisateur est calculé dynamiquement à chaque affichage</li>
                      <li>Le classement n'est visible qu'aux membres de la même entreprise</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Niveaux FinCare :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li><Badge variant="outline">Débutant</Badge> 0 - 299 points</li>
                      <li><Badge variant="outline">Intermédiaire</Badge> 300 - 699 points</li>
                      <li><Badge variant="outline">Avancé</Badge> 700 - 1199 points</li>
                      <li><Badge variant="outline">Expert</Badge> 1200+ points</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Accès et partenariats */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-500" />
                  Partenariats & Accès
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Types de partenariat :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li><Badge className="bg-green-500">partner</Badge> Entreprise partenaire active avec accès complet</li>
                      <li><Badge className="bg-orange-500">pending</Badge> Demande de partenariat en cours d'évaluation</li>
                      <li><Badge variant="outline">null/aucun</Badge> Utilisateur sans entreprise partenaire → Page d'accueil non-partenaire</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Détection automatique de l'entreprise :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>À l'inscription, le domaine email est comparé aux <code>email_domains</code> des entreprises</li>
                      <li>Si correspondance, l'utilisateur est automatiquement rattaché à l'entreprise</li>
                      <li>Si aucune correspondance, l'utilisateur est redirigé vers la page non-partenaire</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Règles d'accès aux pages :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li><code>/admin/*</code> : Réservé aux utilisateurs avec rôle <code>admin</code></li>
                      <li><code>/company/*</code> : Accessible si <code>company_id</code> existe et partenariat actif</li>
                      <li><code>/employee/*</code> : Accessible à tout utilisateur authentifié</li>
                      <li><code>/parcours</code> : Accessible si l'entreprise a un parcours assigné</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Plans et fonctionnalités */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-purple-500" />
                  Plans & Fonctionnalités
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Hiérarchie des plans :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Chaque plan a un <code>niveau</code> (1=Starter, 2=Pro, 3=Enterprise, etc.)</li>
                      <li>Un plan inclut toutes les fonctionnalités des plans de niveau inférieur</li>
                      <li>Les fonctionnalités sont liées aux plans via la table <code>plan_features</code></li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Déblocage de plan par points :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Configurable via <code>plan_unlock_config</code> : points nécessaires par employé</li>
                      <li>Le total des points de l'entreprise est calculé à partir des <code>total_points</code> des employés</li>
                      <li>Lorsque le seuil est atteint, le plan supérieur peut être débloqué</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Feature gates :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Le composant <code>FeatureGate</code> vérifie si la fonctionnalité est accessible</li>
                      <li>Vérification : plan de l'utilisateur OU plan de son entreprise ≥ plan minimum requis</li>
                      <li>Si non accessible : affichage d'un placeholder ou masquage du composant</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Modules et validation */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-green-500" />
                  Modules & Validation
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Types de modules :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li><Badge variant="outline">video</Badge> Vidéo à visionner (durée minimum configurable)</li>
                      <li><Badge variant="outline">quiz</Badge> Questions à choix multiples</li>
                      <li><Badge variant="outline">webinar</Badge> Webinaire en direct ou replay</li>
                      <li><Badge variant="outline">formation</Badge> Contenu pédagogique (slides, texte, ressources)</li>
                      <li><Badge variant="outline">appointment</Badge> Rendez-vous avec un expert</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Règles de validation :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li><strong>Vidéo :</strong> L'utilisateur doit regarder au moins X% de la vidéo (configurable dans <code>module_validation_settings</code>)</li>
                      <li><strong>Quiz :</strong> Score minimum requis (par défaut 70% des bonnes réponses)</li>
                      <li><strong>Webinaire :</strong> Points d'inscription à la confirmation, points de participation après le live</li>
                      <li><strong>Formation :</strong> Validation manuelle à la fin du contenu</li>
                      <li><strong>Rendez-vous :</strong> Validation automatique après confirmation du RDV via webhook</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Tentatives et replay :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Nombre de tentatives maximum configurable par type de module</li>
                      <li>Première tentative réussie : 100% des points</li>
                      <li>Tentatives suivantes : pourcentage réduit (configurable)</li>
                      <li>Historique des tentatives stocké dans <code>module_validations</code></li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Recommandations */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-orange-500" />
                  Recommandations personnalisées
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Conditions de déclenchement :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li><code>no_risk_profile</code> : L'utilisateur n'a pas complété son profil de risque</li>
                      <li><code>financial_profile_incomplete</code> : Le profil financier est incomplet (&lt;100%)</li>
                      <li><code>simulation_threshold</code> : Nombre de simulations en dessous d'un seuil</li>
                      <li><code>no_modules</code> : Aucun module validé</li>
                      <li><code>always</code> : Toujours afficher (recommandation générique)</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Logique d'affichage :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Les recommandations sont triées par <code>priority</code> (plus élevé = plus important)</li>
                      <li>Seules les recommandations actives (<code>is_active=true</code>) sont évaluées</li>
                      <li>Maximum 3 recommandations affichées simultanément sur le dashboard</li>
                      <li>Les recommandations peuvent cibler des segments spécifiques (config JSON)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              {/* RDV Expert */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-cyan-500" />
                  Rendez-vous Expert
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>URL de réservation dynamique :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>L'URL est déterminée par le <code>rang</code> de l'entreprise (1, 2 ou 3)</li>
                      <li>Rang 1 : URL prioritaire (conseiller dédié)</li>
                      <li>Rang 2 : URL standard</li>
                      <li>Rang 3 ou sans rang : URL par défaut</li>
                      <li>Fallback : URL globale si aucun rang configuré</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Webhook Fillout :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>À la confirmation d'un RDV, le webhook crée une entrée dans <code>appointments</code></li>
                      <li>L'utilisateur est identifié par son email</li>
                      <li>Le statut du RDV est suivi (scheduled, completed, cancelled)</li>
                      <li>Si le formulaire est lié à un module, les points sont attribués</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Profil financier */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-emerald-500" />
                  Profil Financier
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Champs obligatoires pour 100% :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Revenu mensuel net (<code>revenu_mensuel_net</code>)</li>
                      <li>Revenu fiscal annuel (<code>revenu_fiscal_annuel</code>)</li>
                      <li>Charges fixes mensuelles (<code>charges_fixes_mensuelles</code>)</li>
                      <li>Épargne livrets (<code>epargne_livrets</code>)</li>
                      <li>Type de contrat (<code>type_contrat</code>)</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Utilisation des données :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Pré-remplissage automatique des simulateurs</li>
                      <li>Calcul du TMI (Taux Marginal d'Imposition)</li>
                      <li>Personnalisation des recommandations</li>
                      <li>Données jamais partagées sans consentement explicite</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Profil de risque */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-red-500" />
                  Profil de Risque (AMF)
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Calcul du profil :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Questionnaire conforme aux recommandations AMF</li>
                      <li>Chaque réponse a un score pondéré (<code>amf_weight</code>)</li>
                      <li>Le score total détermine le type de profil</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Seuils de profil (configurables) :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li><Badge variant="outline">Prudent</Badge> Score ≤ 30% du maximum</li>
                      <li><Badge variant="outline">Équilibré</Badge> Score entre 30% et 55%</li>
                      <li><Badge variant="outline">Dynamique</Badge> Score entre 55% et 80%</li>
                      <li><Badge variant="outline">Offensif</Badge> Score &gt; 80%</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notifications */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Bell className="h-4 w-4 text-pink-500" />
                  Notifications
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Types de notifications :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li><Badge variant="outline">toast</Badge> Message éphémère (disparaît après quelques secondes)</li>
                      <li><Badge variant="outline">banner</Badge> Bandeau persistant en haut de page</li>
                      <li><Badge variant="outline">modal</Badge> Fenêtre modale nécessitant une action</li>
                      <li><Badge variant="outline">bell</Badge> Notification dans la cloche (dropdown)</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Règles de déclenchement :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Les règles sont définies dans <code>notification_rules</code></li>
                      <li>Chaque règle a une condition de déclenchement et une fréquence limite</li>
                      <li>L'historique est stocké dans <code>notification_logs</code> pour éviter les doublons</li>
                      <li>Les notifications peuvent cibler des segments d'utilisateurs spécifiques</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Invitations collègues */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-indigo-500" />
                  Invitations de collègues
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Processus d'invitation :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Un utilisateur peut inviter des collègues de son entreprise</li>
                      <li>L'email d'invitation contient un lien avec token unique</li>
                      <li>Le collègue invité est automatiquement rattaché à l'entreprise</li>
                      <li>Statuts possibles : pending, accepted, expired</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Limites et quotas :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Le nombre d'invitations peut être limité par utilisateur ou par entreprise</li>
                      <li>Les invitations expirent après un délai configurable</li>
                      <li>Un même email ne peut pas être invité deux fois par la même entreprise</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quête FinCare */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Swords className="h-4 w-4 text-red-500" />
                  Quête FinCare (Vilains)
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Concept :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Système de gamification où les utilisateurs "battent" des vilains en validant des modules</li>
                      <li>Chaque vilain est associé à un thème financier (fiscalité, épargne, retraite, etc.)</li>
                      <li>Les modules sont tagués avec des thèmes via le champ <code>theme[]</code></li>
                      <li>L'utilisateur accumule des points en validant des modules du thème du vilain</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Calcul de la victoire :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Chaque vilain a un <code>score_a_battre</code> (ex: 300 points)</li>
                      <li>Points du thème = somme des points des modules validés ayant ce thème</li>
                      <li>Vilain vaincu quand : points du thème ≥ score_a_battre</li>
                      <li>Animation de victoire déclenchée une seule fois (stockée en sessionStorage)</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Filtrage par parcours :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Seuls les vilains avec des modules dans le parcours de l'entreprise sont affichés</li>
                      <li>Seuls les modules du parcours de l'utilisateur comptent pour les points</li>
                      <li>Un vilain peut apparaître pour plusieurs entreprises si leurs parcours partagent des modules</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Thèmes financiers disponibles :</strong>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="outline">Les bases financières</Badge>
                      <Badge variant="outline">Fiscalité personnelle</Badge>
                      <Badge variant="outline">Optimisation fiscale</Badge>
                      <Badge variant="outline">Épargne salariale</Badge>
                      <Badge variant="outline">Enveloppes d'investissement</Badge>
                      <Badge variant="outline">Bourse</Badge>
                      <Badge variant="outline">Immobilier</Badge>
                      <Badge variant="outline">Vie familiale</Badge>
                      <Badge variant="outline">Retraite</Badge>
                      <Badge variant="outline">Assurances</Badge>
                      <Badge variant="outline">Stratégie patrimoniale</Badge>
                      <Badge variant="outline">Entrepreneurs</Badge>
                      <Badge variant="outline">Réglementation</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Système multi-thèmes */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-violet-500" />
                  Système Multi-Thèmes (Narratif)
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Thèmes narratifs disponibles :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li><Badge className="bg-red-500">Vilains</Badge> Mode super-héros (Lord Taxon, Dr. Obscurus, Panikra...)</li>
                      <li><Badge className="bg-orange-500">Obstacles</Badge> Mode parcours du combattant (barrières, défis)</li>
                      <li><Badge className="bg-blue-500">Challenges</Badge> Mode compétition (missions, objectifs)</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Variantes par thème :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Chaque vilain a des données différentes selon le thème choisi (<code>theme_data</code> JSONB)</li>
                      <li>Nom, description, image, pouvoirs et faiblesses varient</li>
                      <li>Labels adaptatifs : "Battre" → "Surmonter" → "Relever"</li>
                      <li>Fallback automatique vers "villains" si données manquantes</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Personnalisation utilisateur :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Préférence stockée dans <code>profiles.theme_preference</code></li>
                      <li>Sélecteur de thème accessible dans les paramètres utilisateur</li>
                      <li>Tokens de design (couleurs) appliqués dynamiquement au DOM</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Simulateurs */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Calculator className="h-4 w-4 text-teal-500" />
                  Simulateurs Financiers
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Simulateurs disponibles :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li><Badge variant="outline">PER</Badge> Plan Épargne Retraite avec économie d'impôts</li>
                      <li><Badge variant="outline">ESPP</Badge> Plans d'actionnariat salarié (Employee Stock Purchase Plan)</li>
                      <li><Badge variant="outline">Épargne de précaution</Badge> Calcul du matelas de sécurité</li>
                      <li><Badge variant="outline">Capacité d'emprunt</Badge> Estimation crédit immobilier</li>
                      <li><Badge variant="outline">Prêt immobilier</Badge> Calcul des mensualités et coût total</li>
                      <li><Badge variant="outline">LMNP</Badge> Comparaison régime réel vs micro-BIC</li>
                      <li><Badge variant="outline">Optimisation fiscale</Badge> Dispositifs de défiscalisation</li>
                      <li><Badge variant="outline">Intérêts composés</Badge> Projection de croissance</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Fonctionnalités communes :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Pré-remplissage automatique depuis le profil financier</li>
                      <li>Sauvegarde des simulations (nom personnalisable)</li>
                      <li>Historique des simulations dans l'espace employé</li>
                      <li>CTAs contextuels configurables par admin</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Forum */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-sky-500" />
                  Forum Communautaire
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Structure :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Catégories définies par les admins (<code>forum_categories</code>)</li>
                      <li>Posts créés par les utilisateurs authentifiés</li>
                      <li>Commentaires et réponses imbriquées</li>
                      <li>Système de likes sur posts et commentaires</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Modération :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Posts épinglés (<code>is_pinned</code>) par les admins</li>
                      <li>Posts fermés (<code>is_closed</code>) pour empêcher les commentaires</li>
                      <li>Marquage de meilleure réponse (<code>is_best_answer</code>)</li>
                      <li>Compteur de vues sur chaque post</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Webinaires */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Play className="h-4 w-4 text-rose-500" />
                  Webinaires (Livestorm)
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Intégration Livestorm :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Création de webinaires via API Livestorm</li>
                      <li>Inscription automatique des utilisateurs</li>
                      <li>Stockage des registrations dans <code>webinar_registrations</code></li>
                      <li>Webhook pour tracking de participation</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Points webinaires :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li><code>points_registration</code> : attribués à l'inscription</li>
                      <li><code>points_participation</code> : attribués après participation confirmée</li>
                      <li>Replays disponibles après le live (configurables par entreprise)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Onboarding */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Onboarding Employé
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Étapes d'onboarding :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Scènes configurables dans <code>onboarding_scenes</code></li>
                      <li>Chaque scène : image, texte, effet d'animation</li>
                      <li>Ordre personnalisable, scènes activables/désactivables</li>
                      <li>Progression stockée dans <code>profiles.onboarding_completed</code></li>
                    </ul>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <strong>Déclenchement :</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                      <li>Automatique à la première connexion si <code>onboarding_completed = false</code></li>
                      <li>Skip possible à tout moment</li>
                      <li>Ne se relance pas après complétion</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Separator />
            </CardContent>
          </Card>
        </TabsContent>

        {/* MODÈLES DE DONNÉES */}
        <TabsContent value="models" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Modèles de données principaux
              </CardTitle>
              <CardDescription>
                Structure de la base de données et relations entre les tables
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profiles */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  profiles
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Profil utilisateur étendu (complète auth.users de Supabase)
                </p>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>id</code>
                    <Badge variant="outline">uuid (PK, FK → auth.users)</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>email</code>
                    <Badge variant="outline">text (unique)</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>company_id</code>
                    <Badge variant="outline">uuid (FK → companies)</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>total_points</code>
                    <Badge variant="outline">integer (gamification)</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>completed_modules</code>
                    <Badge variant="outline">integer[] (progression)</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>theme_preference</code>
                    <Badge variant="outline">text (villains/obstacles/challenges)</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>plan_id</code>
                    <Badge variant="outline">uuid (FK → plans)</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Companies */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  companies
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Entreprises partenaires avec configuration personnalisée
                </p>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>id</code>
                    <Badge variant="outline">uuid (PK)</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>name</code>
                    <Badge variant="outline">text</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>primary_color / secondary_color</code>
                    <Badge variant="outline">text (branding)</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>plan_id</code>
                    <Badge variant="outline">uuid (FK → plans)</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>partnership_type</code>
                    <Badge variant="outline">text (entité en charge du partenariat)</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>cover_url</code>
                    <Badge variant="outline">text (image de couverture)</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>rang</code>
                    <Badge variant="outline">integer (1, 2 ou 3 - priorité RDV expert)</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>company_size</code>
                    <Badge variant="outline">integer (effectif déclaré)</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* User Roles */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  user_roles
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  ⚠️ <strong>CRITIQUE:</strong> Gestion des permissions (table séparée pour éviter la privilege escalation)
                </p>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>id</code>
                    <Badge variant="outline">uuid (PK)</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>user_id</code>
                    <Badge variant="outline">uuid (FK → auth.users, unique avec role)</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>role</code>
                    <Badge variant="outline">app_role enum (admin/contact_entreprise/user)</Badge>
                  </div>
                </div>
                <Alert className="mt-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Une fonction <code>has_role(user_id, role)</code> doit être utilisée dans les RLS policies 
                    avec <code>SECURITY DEFINER</code> pour éviter la récursion.
                  </AlertDescription>
                </Alert>
              </div>

              <Separator />

              {/* Modules & Parcours */}
              <div>
                <h3 className="font-semibold mb-2">modules, parcours, parcours_modules</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Système de formation modulaire avec parcours personnalisables
                </p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li><code>modules</code>: vidéos, quiz, webinaires, formations, rendez-vous</li>
                  <li><code>parcours</code>: regroupements de modules</li>
                  <li><code>parcours_modules</code>: table de liaison (many-to-many)</li>
                  <li><code>parcours_companies</code>: attribution de parcours à des entreprises</li>
                  <li><code>module_validations</code>: suivi des tentatives et succès utilisateur</li>
                </ul>
              </div>

              <Separator />

              {/* Simulateurs */}
              <div>
                <h3 className="font-semibold mb-2">Tables de simulations</h3>
                <div className="grid gap-2 text-sm">
                  <div className="p-2 bg-muted/50 rounded">
                    <code>per_simulations</code> - Simulations PER (Plan Épargne Retraite)
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>optimisation_fiscale_simulations</code> - Optimisation fiscale globale
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>epargne_precaution_simulations</code> - Épargne de précaution
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>espp_plans, espp_lots, ventes_espp</code> - Plans d'actionnariat salarié (ESPP)
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>capacite_emprunt_simulations</code> - Capacité d'emprunt immobilier
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>pret_immobilier_simulations</code> - Prêt immobilier
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>lmnp_simulations</code> - Location meublée non professionnelle
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>simulations_impots</code> - Simulations d'impôts
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quête FinCare */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Swords className="h-4 w-4" />
                  villains, themes
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Système de gamification "Quête FinCare" avec multi-thèmes
                </p>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>villains.theme_data</code>
                    <Badge variant="outline">JSONB (variantes par thème narratif)</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>villains.score_a_battre</code>
                    <Badge variant="outline">integer (points nécessaires)</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>themes.design_tokens</code>
                    <Badge variant="outline">JSONB (couleurs CSS)</Badge>
                  </div>
                  <div className="flex justify-between p-2 bg-muted/50 rounded">
                    <code>themes.labels</code>
                    <Badge variant="outline">JSONB (termes narratifs)</Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Forum */}
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Tables du forum
                </h3>
                <div className="grid gap-2 text-sm">
                  <div className="p-2 bg-muted/50 rounded">
                    <code>forum_categories</code> - Catégories de discussion
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>forum_posts</code> - Posts/sujets de discussion
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>forum_comments</code> - Commentaires et réponses
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>forum_post_likes, forum_comment_likes</code> - Likes
                  </div>
                </div>
              </div>

              <Separator />

              {/* Autres tables importantes */}
              <div>
                <h3 className="font-semibold mb-2">Autres tables clés</h3>
                <div className="grid gap-2 text-sm md:grid-cols-2">
                  <div className="p-2 bg-muted/50 rounded">
                    <code>appointments</code> - Rendez-vous
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>appointment_forms</code> - Formulaires Fillout
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>user_financial_profiles</code> - Profils financiers
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>risk_profile, risk_questions</code> - Profil de risque
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>notifications, notification_rules</code> - Notifications
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>recommendation_rules</code> - Recommandations
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>colleague_invitations</code> - Invitations
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>webinar_registrations</code> - Inscriptions webinaires
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>advisors, advisor_certifications</code> - Conseillers
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>plans, features, plan_features</code> - Plans tarifaires
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>settings, block_orders</code> - Configuration
                  </div>
                  <div className="p-2 bg-muted/50 rounded">
                    <code>sidebar_configurations</code> - Menus latéraux
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PERMISSIONS */}
        <TabsContent value="permissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Système de permissions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Architecture de sécurité</AlertTitle>
                <AlertDescription>
                  Les rôles sont stockés dans la table <code>user_roles</code> (JAMAIS dans profiles ou directement dans auth.users).
                  Une fonction <code>has_role()</code> avec SECURITY DEFINER est nécessaire pour les RLS policies.
                </AlertDescription>
              </Alert>

              <div>
                <h3 className="font-semibold mb-2">Rôles applicatifs</h3>
                <div className="space-y-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge>admin</Badge>
                        Administrateur
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className="text-muted-foreground mb-2">Droits complets:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Accès au back-office (/admin/*)</li>
                        <li>Gestion des entreprises, modules, parcours</li>
                        <li>Gestion des utilisateurs et permissions</li>
                        <li>Configuration des thèmes, plans, fonctionnalités</li>
                        <li>Mode édition des layouts (drag & drop blocks)</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge variant="secondary">contact_entreprise</Badge>
                        Contact Entreprise
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className="text-muted-foreground mb-2">Droits limités:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Modification des informations de leur entreprise</li>
                        <li>Visualisation du leaderboard de leur entreprise</li>
                        <li>Accès aux settings entreprise</li>
                        <li>Aucun accès aux autres entreprises</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Badge variant="outline">user</Badge>
                        Utilisateur (salarié)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <p className="text-muted-foreground mb-2">Droits standards:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Accès à son profil et ses données uniquement</li>
                        <li>Parcours de formation</li>
                        <li>Simulateurs financiers</li>
                        <li>Forum communautaire</li>
                        <li>Espace entreprise (lecture seule)</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">RLS (Row Level Security)</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Toutes les tables sensibles DOIVENT avoir des policies RLS activées.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <strong>profiles:</strong> Les utilisateurs ne voient que leur propre profil
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <strong>companies:</strong> Admins voient tout, contacts voient leur entreprise, users lisent leur entreprise
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                    <div>
                      <strong>simulations (PER, ESPP, etc.):</strong> Chaque user voit uniquement ses simulations
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* THÈMES */}
        <TabsContent value="themes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Système multi-thèmes
              </CardTitle>
              <CardDescription>
                Architecture permettant aux utilisateurs de choisir leur univers narratif
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Thèmes disponibles</h3>
                <div className="grid gap-2">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge>villains</Badge>
                          <p className="text-sm mt-1">Thème par défaut - Univers de super-héros</p>
                        </div>
                      </div>
                      <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                        <li>• Labels: Villain, Faiblesse, Pouvoir, Vaincre</li>
                        <li>• Couleurs: Bleu primary, Violet secondary</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge variant="secondary">obstacles</Badge>
                          <p className="text-sm mt-1">Thème aventure - Exploration et navigation</p>
                        </div>
                      </div>
                      <ul className="text-xs text-muted-foreground mt-2 space-y-1">
                        <li>• Labels: Obstacle, Point d'équilibre, Défi, Surmonter</li>
                        <li>• Couleurs: Navy primary, Gold secondary</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge variant="outline">challenges</Badge>
                          <p className="text-sm mt-1">Thème défis - À venir</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Architecture technique</h3>
                <div className="space-y-2 text-sm">
                  <div className="p-3 bg-muted rounded">
                    <strong>ThemeContext:</strong> Context React global qui charge et applique les thèmes
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <strong>themes (table):</strong> Stocke les thèmes, design tokens (HSL), et labels personnalisés
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <strong>villains (table):</strong> Les "ennemis" de chaque thème avec data multi-thème
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <strong>profiles.theme_preference:</strong> Choix de thème de l'utilisateur (villains par défaut)
                  </div>
                </div>
              </div>

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Fallback system</AlertTitle>
                <AlertDescription className="text-xs">
                  Si un thème n'a pas de données pour un villain, le système doit fallback sur le thème "villains" (défaut).
                  Si le thème "villains" n'a pas de données, fallback sur les données legacy du villain.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* UX/UI */}
        <TabsContent value="ux" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layout className="h-5 w-5" />
                Standards UX/UI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Design System (Tailwind + shadcn/ui)</h3>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Tokens sémantiques:</strong> Toujours utiliser <code>bg-background</code>, <code>text-foreground</code>, 
                      <code>bg-primary</code>, etc. au lieu de couleurs hardcodées
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>HSL uniquement:</strong> Toutes les couleurs en format HSL pour cohérence avec le système de thèmes
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Responsive:</strong> Mobile-first avec breakpoints standards (sm, md, lg, xl, 2xl)
                    </span>
                  </li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Patterns de navigation</h3>
                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-muted rounded">
                    <strong>Header:</strong> Toujours visible avec logo, avatar, notifications, liens rapides
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <strong>Sidebar Admin:</strong> Navigation hiérarchique organisée par domaine métier
                    <ul className="mt-1 ml-4 list-disc list-inside text-xs text-muted-foreground">
                      <li>General: Documentation</li>
                      <li>Companies: Companies (avec rang et effectif), Employees, Users (avec nb connexions et modules réalisés)</li>
                      <li>Content: Modules, Parcours, Missions, Superpowers</li>
                      <li>Gamification: Plans, Features, Plans & Features, Themes</li>
                      <li>Settings: Permissions, Risk Profile, Validation, Notifications, Storage, Layout, Communication, Partnership, RDV Expert (URLs par rang), etc.</li>
                    </ul>
                  </div>
                  <div className="p-2 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded">
                    <strong>✓ Breadcrumbs:</strong> Implémentés dans le header admin pour navigation contextuelle
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Composants réutilisables clés</h3>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li><code>Header</code>: Barre de navigation principale</li>
                  <li><code>DraggableSection</code>: Blocs réorganisables (admin uniquement)</li>
                  <li><code>ProtectedRoute</code>: Gestion des permissions de routes</li>
                  <li><code>ThemeSelectorCompact</code>: Sélecteur de thème utilisateur</li>
                  <li><code>CompanyLeaderboard</code>: Classement des collaborateurs</li>
                  <li><code>SimulationCard</code>: Carte de résultat de simulation</li>
                  <li><code>ResultsChart</code>: Graphique de comparaison/progression</li>
                  <li><code>SimulationFormField</code>: Champ de formulaire simulateur</li>
                </ul>
                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Hooks simulateurs</AlertTitle>
                  <AlertDescription className="text-xs">
                    <code>useSimulationForm</code>, <code>useSimulationSave</code> - Hooks réutilisables pour tous les simulateurs.
                    Voir le guide complet dans <code>src/hooks/README-SIMULATORS.md</code>
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ARCHITECTURE */}
        <TabsContent value="architecture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code2 className="h-5 w-5" />
                Architecture de l'application
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Structure des fichiers</h3>
                <pre className="text-xs bg-muted p-4 rounded overflow-x-auto">
{`src/
├── components/
│   ├── admin/              # Composants back-office
│   │   ├── *Tab.tsx        # Onglets admin
│   │   └── landing/        # Éditeur landing page
│   ├── dashboard/          # Composants dashboard
│   ├── modules/            # Modules de formation
│   ├── notifications/      # Système de notifications
│   ├── onboarding/         # Étapes onboarding
│   ├── risk-profile/       # Profil de risque
│   ├── simulators/         # Composants simulateurs
│   ├── user/               # Composants utilisateur
│   └── ui/                 # shadcn/ui components
├── contexts/
│   └── ThemeContext.tsx    # Context multi-thèmes
├── hooks/                  # Custom hooks
├── integrations/
│   └── supabase/           # Client Supabase (auto-généré)
├── lib/                    # Utilitaires
├── pages/                  # Pages React Router
├── types/                  # Types TypeScript
└── App.tsx                 # Point d'entrée + routing`}
                </pre>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Flux de données</h3>
                <ol className="text-sm space-y-2 list-decimal list-inside">
                  <li>
                    <strong>Authentification:</strong> AuthProvider (Supabase Auth) → vérification RLS automatique
                  </li>
                  <li>
                    <strong>Données utilisateur:</strong> React Query + Supabase → cache intelligent
                  </li>
                  <li>
                    <strong>Thème:</strong> ThemeContext lit DB → applique CSS custom properties → persist dans profile
                  </li>
                  <li>
                    <strong>Permissions:</strong> ProtectedRoute vérifie user_roles → redirige si non autorisé
                  </li>
                </ol>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Edge Functions</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Logique backend serverless pour actions sensibles ou complexes
                </p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li><code>import-employees</code>: Import CSV d'employés</li>
                  <li><code>send-invitations</code>: Envoi d'emails d'invitation</li>
                  <li><code>send-colleague-invitation</code>: Invitation de collègues</li>
                  <li><code>send-partnership-email</code>: Contact partenariats</li>
                  <li><code>send-employee-partnership-email</code>: Email partenariat employé</li>
                  <li><code>livestorm-webhook</code>: Webhook intégration Livestorm</li>
                  <li><code>create-livestorm-webinar</code>: Création webinaire Livestorm</li>
                  <li><code>get-livestorm-owner</code>: Récupération owner Livestorm</li>
                  <li><code>create-test-users</code>: Création utilisateurs de test</li>
                  <li><code>auto-signup</code>: Inscription automatique</li>
                  <li><code>import-modules</code>: Import de modules</li>
                </ul>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-2">Logique RDV Expert par Rang</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Système de priorité pour les URLs de prise de RDV expert (hook <code>useExpertBookingUrl</code>)
                </p>
                <ol className="text-sm space-y-1 list-decimal list-inside">
                  <li>Embed code selon le rang de l'entreprise (si configuré)</li>
                  <li>URL selon le rang de l'entreprise (si configuré)</li>
                  <li>Embed code par défaut (settings)</li>
                  <li>URL par défaut (settings)</li>
                  <li>Embed code spécifique à l'entreprise</li>
                  <li>URL spécifique à l'entreprise</li>
                </ol>
                <Alert className="mt-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Les rangs (1, 2, 3) sont configurés dans l'onglet Entreprises. Les URLs/embed par rang 
                    sont configurés dans l'onglet RDV Expert. Cette logique s'applique au dashboard et à la landing page RDV.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PROBLÈMES IDENTIFIÉS */}
        <TabsContent value="issues" className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Problèmes critiques (P1)</AlertTitle>
            <AlertDescription>
              Ces problèmes impactent la scalabilité, la maintenance ou la sécurité.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">🔴 P1 - Problèmes Critiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded">
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                  1. Fonction has_role() manquante
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">✓ RÉSOLU</Badge>
                </h4>
                <p className="text-sm text-muted-foreground">
                  La fonction <code>has_role(auth.uid(), 'admin'::app_role)</code> existe déjà dans la base de données 
                  avec <code>SECURITY DEFINER</code> pour éviter les récursions RLS. Toutes les policies l'utilisent correctement.
                </p>
                <Badge variant="outline" className="mt-2">Sécurité</Badge>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded">
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                  2. Doublons de pages de simulations
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">✓ RÉSOLU</Badge>
                </h4>
                <p className="text-sm text-muted-foreground">
                  Les 3 pages séparées (<code>EmployeeSimulationsPER</code>, <code>EmployeeSimulationsEpargnePrecaution</code>) 
                  ont été fusionnées en une seule page <code>EmployeeSimulations</code> avec 3 onglets : 
                  Simulateurs disponibles, Mes simulations PER, Mes simulations Épargne. Routes mises à jour.
                </p>
                <Badge variant="outline" className="mt-2">Architecture</Badge>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded">
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                  3. Types redondants Profile
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">✓ RÉSOLU</Badge>
                </h4>
                <p className="text-sm text-muted-foreground">
                  <code>ProfileWithCompanyId</code> renommé en <code>UserProfile</code> dans <code>src/types/database.ts</code>. 
                  Tous les fichiers ont été mis à jour pour utiliser le type unifié. Un alias deprecated maintient la compatibilité.
                </p>
                <Badge variant="outline" className="mt-2">Qualité code</Badge>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded">
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                  4. Navigation incohérente
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">✓ RÉSOLU</Badge>
                </h4>
                <p className="text-sm text-muted-foreground">
                  Route <code>/fincare-home</code> supprimée. Le dashboard employé est accessible uniquement via <code>/employee</code>.
                </p>
                <Badge variant="outline" className="mt-2">UX</Badge>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded">
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                  5. Fallback thèmes incomplet
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">✓ RÉSOLU</Badge>
                </h4>
                <p className="text-sm text-muted-foreground">
                  Fallback robuste à 4 niveaux implémenté dans <code>ThemeContext</code> :
                  <br />1️⃣ Thème choisi → 2️⃣ Villains (défaut) → 3️⃣ Premier thème actif → 4️⃣ Données legacy
                  <br />Chaque fallback est loggé avec des messages explicites pour faciliter le debugging.
                </p>
                <Badge variant="outline" className="mt-2">Stabilité</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">🟠 P2 - Problèmes Importants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded">
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                  6. Onglets Admin éparpillés
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">✓ RÉSOLU</Badge>
                </h4>
                <p className="text-sm text-muted-foreground">
                  Fichier <code>src/components/admin/index.ts</code> créé avec exports organisés par module logique :
                  General, Companies, Content, Gamification, Settings, Shared. Architecture claire et maintenable.
                </p>
                <Badge variant="outline" className="mt-2">Maintenance</Badge>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded line-through">
                <h4 className="font-semibold text-sm mb-1 text-green-600">✓ 7. Breadcrumbs ajoutés</h4>
                <p className="text-sm text-muted-foreground">
                  Fil d'Ariane maintenant présent dans le header admin pour toute navigation profonde.
                  L'utilisateur peut se perdre.
                </p>
                <Badge className="mt-2 bg-orange-500">UX</Badge>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded">
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                  8. Responsivité non testée systématiquement
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">✓ RÉSOLU</Badge>
                </h4>
                <p className="text-sm text-muted-foreground">
                  Navigation mobile ajoutée (MobileEmployeeNav), layouts responsives sur Employee, Company, Admin. 
                  Header adaptatif avec boutons condensés sur mobile.
                </p>
                <Badge variant="outline" className="mt-2">Qualité</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600">🔵 P3 - Améliorations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded">
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                  9. Centraliser les simulateurs
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">✓ RÉSOLU</Badge>
                </h4>
                <p className="text-sm text-muted-foreground">
                  Composants partagés créés dans <code>src/components/simulators/</code> : 
                  SimulatorLayout, SimulatorHeader, SimulatorResultCard, SaveSimulationDialog. 
                  Hooks centralisés : useSimulationForm, useSimulationSave. Export unifié via index.ts.
                </p>
                <Badge variant="outline" className="mt-2">Refactor</Badge>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded">
                <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                  10. Améliorer les messages d'erreur
                  <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">✓ RÉSOLU</Badge>
                </h4>
                <p className="text-sm text-muted-foreground">
                  Logger centralisé créé dans <code>src/lib/logger.ts</code> avec messages structurés, contexte 
                  (composant, action, données), helpers spécialisés (supabaseError, apiError, authError), 
                  et support des loggers scopés par composant.
                </p>
                <Badge variant="outline" className="mt-2">DX</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PLAN D'ACTION */}
        <TabsContent value="roadmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Plan d'action recommandé
              </CardTitle>
              <CardDescription>
                Roadmap priorisée pour résoudre les problèmes identifiés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge variant="destructive">Phase 1</Badge>
                  Correctifs critiques (Sécurité & Stabilité)
                </h3>
                <ol className="space-y-2 text-sm list-decimal list-inside">
                  <li className="pl-2 text-green-600">
                    <strong>✓ Créer la fonction has_role() en migration SQL</strong>
                    <ul className="ml-6 mt-1 text-muted-foreground list-disc list-inside">
                      <li>✓ Fonction existante avec SECURITY DEFINER</li>
                      <li>✓ Toutes les policies utilisent correctement la fonction</li>
                    </ul>
                  </li>
                  <li className="pl-2 text-green-600">
                    <strong>✓ Fusionner les pages de simulations</strong>
                    <ul className="ml-6 mt-1 text-muted-foreground list-disc list-inside">
                      <li>✓ Créé <code>EmployeeSimulations</code> avec 3 onglets</li>
                      <li>✓ Supprimé les 2 pages redondantes</li>
                      <li>✓ Routes et imports mis à jour</li>
                    </ul>
                  </li>
                  <li className="pl-2 text-green-600">
                    <strong>✓ Unifier les types Profile</strong>
                    <ul className="ml-6 mt-1 text-muted-foreground list-disc list-inside">
                      <li>✓ Renommé <code>ProfileWithCompanyId</code> en <code>UserProfile</code></li>
                      <li>✓ Mis à jour tous les imports et usages</li>
                      <li>✓ Alias deprecated pour compatibilité</li>
                    </ul>
                  </li>
                  <li className="pl-2 text-green-600">
                    <strong>✓ Implémenter le fallback thème robuste</strong>
                    <ul className="ml-6 mt-1 text-muted-foreground list-disc list-inside">
                      <li>✓ Cascade à 4 niveaux : choisi → villains → actif → legacy</li>
                      <li>✓ Logs explicites pour chaque niveau de fallback</li>
                      <li>✓ Messages d'erreur détaillés pour debugging</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge className="bg-orange-500">Phase 2</Badge>
                  Refactoring architecture
                </h3>
                <ol className="space-y-2 text-sm list-decimal list-inside" start={5}>
                  <li className="pl-2 line-through text-muted-foreground">
                    <strong className="text-green-600">✓ RÉSOLU: Restructurer les composants Admin</strong>
                    <ul className="ml-6 mt-1 list-disc list-inside">
                      <li>AdminSidebar organisé en 5 groupes métier (General, Companies, Content, Gamification, Settings)</li>
                      <li>Navigation hiérarchique et intuitive</li>
                    </ul>
                  </li>
                  <li className="pl-2 line-through text-muted-foreground">
                    <strong className="text-green-600">✓ RÉSOLU: Standardiser la navigation</strong>
                    <ul className="ml-6 mt-1 list-disc list-inside">
                      <li>Route /fincare-home supprimée</li>
                      <li>Pattern de routing documenté dans la section Navigation & Routing</li>
                    </ul>
                  </li>
                  <li className="pl-2 line-through text-muted-foreground">
                    <strong className="text-green-600">✓ RÉSOLU: Ajouter des breadcrumbs</strong>
                    <ul className="ml-6 mt-1 list-disc list-inside">
                      <li>Composant Breadcrumbs créé dans @/components/ui/breadcrumb</li>
                      <li>Intégré dans le header admin avec mapping dynamique</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <Separator />

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Badge className="bg-blue-500">Phase 3</Badge>
                  Qualité & Expérience
                </h3>
                <ol className="space-y-2 text-sm list-decimal list-inside" start={8}>
                  <li className="pl-2">
                    <strong>Process responsivité</strong>
                    <ul className="ml-6 mt-1 text-muted-foreground list-disc list-inside">
                      <li>Checklist: tester mobile, tablette, desktop avant chaque PR</li>
                      <li>Outils: Chrome DevTools, Lighthouse</li>
                    </ul>
                  </li>
                  <li className="pl-2 line-through text-muted-foreground">
                    <strong className="text-green-600">✓ RÉSOLU: Centraliser la logique des simulateurs</strong>
                    <ul className="ml-6 mt-1 list-disc list-inside">
                      <li>Hooks partagés créés: <code>useSimulationForm</code>, <code>useSimulationSave</code></li>
                      <li>Composants communs: <code>SimulationCard</code>, <code>ResultsChart</code>, <code>SimulationFormField</code></li>
                      <li>Architecture modulaire et réutilisable</li>
                    </ul>
                  </li>
                  <li className="pl-2">
                    <strong>Améliorer le logging</strong>
                    <ul className="ml-6 mt-1 text-muted-foreground list-disc list-inside">
                      <li>Créer un service de logging avec contexte (user, action, timestamp)</li>
                      <li>Intégrer un outil comme Sentry pour la prod</li>
                    </ul>
                  </li>
                </ol>
              </div>

              <Alert className="mt-6">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Maintenabilité</AlertTitle>
                <AlertDescription className="text-xs">
                  <strong>Cette documentation doit être mise à jour à chaque nouvelle fonctionnalité majeure.</strong>
                  <br />
                  Les changements doivent être reflétés dans les sections appropriées (Modèles, Permissions, Architecture, etc.).
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};