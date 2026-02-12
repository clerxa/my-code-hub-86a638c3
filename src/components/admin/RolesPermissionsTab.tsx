import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Permission = {
  action: string;
  admin: { access: boolean; modify: boolean };
  contact_entreprise: { access: boolean; modify: boolean };
  user: { access: boolean; modify: boolean };
};

type PermissionCategory = {
  name: string;
  permissions: Permission[];
};

const defaultPermissionCategories: PermissionCategory[] = [
  {
    name: "Utilisateurs",
    permissions: [
      {
        action: "Voir tous les profils",
        admin: { access: true, modify: false },
        contact_entreprise: { access: true, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Modifier les profils",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Gérer les rôles",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Réinitialiser points/progression",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Transférer utilisateur entre entreprises",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
    ],
  },
  {
    name: "Entreprises",
    permissions: [
      {
        action: "Voir les entreprises",
        admin: { access: true, modify: false },
        contact_entreprise: { access: true, modify: false },
        user: { access: true, modify: false },
      },
      {
        action: "Créer/modifier entreprises",
        admin: { access: true, modify: true },
        contact_entreprise: { access: true, modify: true },
        user: { access: false, modify: false },
      },
      {
        action: "Supprimer entreprises",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Configurer le classement entreprises",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
    ],
  },
  {
    name: "Modules & Formations",
    permissions: [
      {
        action: "Voir les modules",
        admin: { access: true, modify: false },
        contact_entreprise: { access: true, modify: false },
        user: { access: true, modify: false },
      },
      {
        action: "Créer/modifier modules",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Supprimer modules",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Gérer les slides/contenus",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
    ],
  },
  {
    name: "Parcours",
    permissions: [
      {
        action: "Voir les parcours",
        admin: { access: true, modify: false },
        contact_entreprise: { access: true, modify: false },
        user: { access: true, modify: false },
      },
      {
        action: "Créer/modifier parcours",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Supprimer parcours",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Assigner parcours aux entreprises",
        admin: { access: true, modify: true },
        contact_entreprise: { access: true, modify: true },
        user: { access: false, modify: false },
      },
    ],
  },
  {
    name: "Forum & Communauté",
    permissions: [
      {
        action: "Voir les posts",
        admin: { access: true, modify: false },
        contact_entreprise: { access: true, modify: false },
        user: { access: true, modify: false },
      },
      {
        action: "Créer des posts",
        admin: { access: true, modify: true },
        contact_entreprise: { access: true, modify: true },
        user: { access: true, modify: true },
      },
      {
        action: "Modérer les posts",
        admin: { access: true, modify: true },
        contact_entreprise: { access: true, modify: true },
        user: { access: false, modify: false },
      },
      {
        action: "Épingler/fermer posts",
        admin: { access: true, modify: true },
        contact_entreprise: { access: true, modify: true },
        user: { access: false, modify: false },
      },
      {
        action: "Configurer les niveaux de contribution",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
    ],
  },
  {
    name: "Simulations",
    permissions: [
      {
        action: "Voir ses propres simulations",
        admin: { access: true, modify: false },
        contact_entreprise: { access: true, modify: false },
        user: { access: true, modify: false },
      },
      {
        action: "Voir toutes les simulations",
        admin: { access: true, modify: false },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Créer/modifier simulations",
        admin: { access: true, modify: true },
        contact_entreprise: { access: true, modify: true },
        user: { access: true, modify: true },
      },
      {
        action: "Configurer les simulateurs",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
    ],
  },
  {
    name: "Points & Gamification",
    permissions: [
      {
        action: "Configurer les points par action",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Voir le classement",
        admin: { access: true, modify: false },
        contact_entreprise: { access: true, modify: false },
        user: { access: true, modify: false },
      },
      {
        action: "Configurer les célébrations",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
    ],
  },
  {
    name: "Invitations & Partenariats",
    permissions: [
      {
        action: "Inviter des collègues",
        admin: { access: true, modify: true },
        contact_entreprise: { access: true, modify: true },
        user: { access: true, modify: true },
      },
      {
        action: "Voir le suivi des invitations",
        admin: { access: true, modify: false },
        contact_entreprise: { access: true, modify: false },
        user: { access: true, modify: false },
      },
      {
        action: "Configurer les templates d'invitation",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Demander un partenariat",
        admin: { access: true, modify: true },
        contact_entreprise: { access: true, modify: true },
        user: { access: true, modify: true },
      },
    ],
  },
  {
    name: "Rendez-vous & Webinars",
    permissions: [
      {
        action: "Prendre rendez-vous",
        admin: { access: true, modify: true },
        contact_entreprise: { access: true, modify: true },
        user: { access: true, modify: true },
      },
      {
        action: "Voir ses rendez-vous",
        admin: { access: true, modify: false },
        contact_entreprise: { access: true, modify: false },
        user: { access: true, modify: false },
      },
      {
        action: "Gérer les conseillers",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "S'inscrire aux webinars",
        admin: { access: true, modify: true },
        contact_entreprise: { access: true, modify: true },
        user: { access: true, modify: true },
      },
      {
        action: "Créer/modifier webinars",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Assigner webinars aux entreprises",
        admin: { access: true, modify: true },
        contact_entreprise: { access: true, modify: true },
        user: { access: false, modify: false },
      },
    ],
  },
  {
    name: "Profil Financier",
    permissions: [
      {
        action: "Remplir son profil financier",
        admin: { access: true, modify: true },
        contact_entreprise: { access: true, modify: true },
        user: { access: true, modify: true },
      },
      {
        action: "Voir les stats agrégées entreprise",
        admin: { access: true, modify: false },
        contact_entreprise: { access: true, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Configurer les champs obligatoires",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Voir le profil de risque",
        admin: { access: true, modify: false },
        contact_entreprise: { access: false, modify: false },
        user: { access: true, modify: false },
      },
    ],
  },
  {
    name: "Notifications & Recommandations",
    permissions: [
      {
        action: "Recevoir les notifications",
        admin: { access: true, modify: false },
        contact_entreprise: { access: true, modify: false },
        user: { access: true, modify: false },
      },
      {
        action: "Configurer les règles de notification",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Configurer les recommandations",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Configurer les CTAs simulateurs",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
    ],
  },
  {
    name: "Communication",
    permissions: [
      {
        action: "Voir kit de communication",
        admin: { access: true, modify: false },
        contact_entreprise: { access: true, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Modifier kit de communication",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Gérer les templates email",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
    ],
  },
  {
    name: "Onboarding & CMS",
    permissions: [
      {
        action: "Configurer les écrans d'onboarding",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Gérer le workflow d'onboarding",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Assigner parcours depuis onboarding",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
    ],
  },
  {
    name: "Configuration Globale",
    permissions: [
      {
        action: "Gérer les paramètres globaux",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Gérer le design system",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Configurer le header/footer",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Gérer les evaluation keys",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
      {
        action: "Configurer le CSAT",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
    ],
  },
  {
    name: "Produits Financiers",
    permissions: [
      {
        action: "Voir les fiches produits",
        admin: { access: true, modify: false },
        contact_entreprise: { access: true, modify: false },
        user: { access: true, modify: false },
      },
      {
        action: "Créer/modifier les produits",
        admin: { access: true, modify: true },
        contact_entreprise: { access: false, modify: false },
        user: { access: false, modify: false },
      },
    ],
  },
];

const PermissionCheckbox = ({ 
  checked, 
  onChange, 
  disabled = false 
}: { 
  checked: boolean; 
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) => {
  return (
    <Checkbox 
      checked={checked} 
      onCheckedChange={onChange}
      disabled={disabled}
      className="h-5 w-5"
    />
  );
};

export const RolesPermissionsTab = () => {
  const [permissionCategories, setPermissionCategories] = useState<PermissionCategory[]>(defaultPermissionCategories);
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*");

      if (error) throw error;

      if (data && data.length > 0) {
        const updatedCategories = defaultPermissionCategories.map(category => ({
          ...category,
          permissions: category.permissions.map(permission => {
            const updated = { ...permission };
            
            // Charger les permissions depuis la DB pour chaque rôle
            (['admin', 'contact_entreprise', 'user'] as const).forEach(role => {
              const dbPermission = data.find(
                p => p.role === role && 
                     p.category === category.name && 
                     p.action === permission.action
              );
              
              if (dbPermission) {
                updated[role] = {
                  access: dbPermission.can_access,
                  modify: dbPermission.can_modify
                };
              }
            });
            
            return updated;
          })
        }));
        
        setPermissionCategories(updatedCategories);
      }
    } catch (error) {
      console.error("Error loading permissions:", error);
      toast.error("Erreur lors du chargement des permissions");
    }
  };

  const updatePermission = (
    categoryName: string,
    action: string,
    role: 'admin' | 'contact_entreprise' | 'user',
    type: 'access' | 'modify',
    value: boolean
  ) => {
    setPermissionCategories(prev =>
      prev.map(category =>
        category.name === categoryName
          ? {
              ...category,
              permissions: category.permissions.map(permission =>
                permission.action === action
                  ? {
                      ...permission,
                      [role]: {
                        ...permission[role],
                        [type]: value
                      }
                    }
                  : permission
              )
            }
          : category
      )
    );
    setHasChanges(true);
  };

  const savePermissions = async () => {
    setSaving(true);
    try {
      // Préparer toutes les permissions à sauvegarder
      const permissionsToSave = permissionCategories.flatMap(category =>
        category.permissions.flatMap(permission =>
          (['admin', 'contact_entreprise', 'user'] as const).map(role => ({
            role,
            category: category.name,
            action: permission.action,
            can_access: permission[role].access,
            can_modify: permission[role].modify
          }))
        )
      );

      // Upsert toutes les permissions
      for (const perm of permissionsToSave) {
        const { error } = await supabase
          .from("role_permissions")
          .upsert({
            role: perm.role,
            category: perm.category,
            action: perm.action,
            can_access: perm.can_access,
            can_modify: perm.can_modify
          }, {
            onConflict: 'role,category,action'
          });

        if (error) throw error;
      }

      toast.success("Permissions sauvegardées avec succès");
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast.error("Erreur lors de la sauvegarde des permissions");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Droits et autorisations</CardTitle>
              <CardDescription>
                Gérez les permissions par rôle. Cochez les cases pour modifier les droits d'accès et de modification.
              </CardDescription>
            </div>
            {hasChanges && (
              <Button onClick={savePermissions} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="default">Admin</Badge>
              <span className="text-sm text-muted-foreground">Accès complet à toutes les fonctionnalités</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Contact Entreprise</Badge>
              <span className="text-sm text-muted-foreground">Gestion entreprises et modération forum</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">User</Badge>
              <span className="text-sm text-muted-foreground">Accès utilisateur standard</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {permissionCategories.map((category) => (
        <Card key={category.name}>
          <CardHeader>
            <CardTitle className="text-lg">{category.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Action</TableHead>
                  <TableHead className="text-center">Admin</TableHead>
                  <TableHead className="text-center">Contact Entreprise</TableHead>
                  <TableHead className="text-center">User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {category.permissions.map((permission) => (
                  <TableRow key={permission.action}>
                    <TableCell className="font-medium">{permission.action}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2">
                          <PermissionCheckbox
                            checked={permission.admin.access}
                            onChange={(checked) => 
                              updatePermission(category.name, permission.action, 'admin', 'access', checked)
                            }
                          />
                          <span className="text-xs text-muted-foreground">Accès</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PermissionCheckbox
                            checked={permission.admin.modify}
                            onChange={(checked) => 
                              updatePermission(category.name, permission.action, 'admin', 'modify', checked)
                            }
                          />
                          <span className="text-xs text-muted-foreground">Modifier</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2">
                          <PermissionCheckbox
                            checked={permission.contact_entreprise.access}
                            onChange={(checked) => 
                              updatePermission(category.name, permission.action, 'contact_entreprise', 'access', checked)
                            }
                          />
                          <span className="text-xs text-muted-foreground">Accès</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PermissionCheckbox
                            checked={permission.contact_entreprise.modify}
                            onChange={(checked) => 
                              updatePermission(category.name, permission.action, 'contact_entreprise', 'modify', checked)
                            }
                          />
                          <span className="text-xs text-muted-foreground">Modifier</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex items-center gap-2">
                          <PermissionCheckbox
                            checked={permission.user.access}
                            onChange={(checked) => 
                              updatePermission(category.name, permission.action, 'user', 'access', checked)
                            }
                          />
                          <span className="text-xs text-muted-foreground">Accès</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <PermissionCheckbox
                            checked={permission.user.modify}
                            onChange={(checked) => 
                              updatePermission(category.name, permission.action, 'user', 'modify', checked)
                            }
                          />
                          <span className="text-xs text-muted-foreground">Modifier</span>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
