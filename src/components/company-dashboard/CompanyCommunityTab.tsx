/**
 * ===========================================================
 * 📄 File: CompanyCommunityTab.tsx
 * 📌 Rôle : Onglet Communauté dans le dashboard entreprise
 * ===========================================================
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Shield, Globe, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompanyCommunityTabProps {
  companyId: string;
}

interface CompanyContact {
  id: string;
  nom: string;
  email: string;
  is_forum_moderator: boolean;
}

interface CompanySettings {
  forum_access_all_discussions: boolean;
}

export function CompanyCommunityTab({ companyId }: CompanyCommunityTabProps) {
  const [contacts, setContacts] = useState<CompanyContact[]>([]);
  const [settings, setSettings] = useState<CompanySettings>({
    forum_access_all_discussions: false,
  });
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch company settings
      const { data: companyData, error: companyError } = await supabase
        .from("companies")
        .select("forum_access_all_discussions")
        .eq("id", companyId)
        .single();

      if (companyError) throw companyError;
      setSettings({
        forum_access_all_discussions: companyData?.forum_access_all_discussions || false,
      });

      // Fetch company contacts
      const { data: contactsData, error: contactsError } = await supabase
        .from("company_contacts")
        .select("id, nom, email, is_forum_moderator")
        .eq("company_id", companyId)
        .order("nom");

      if (contactsError) throw contactsError;
      setContacts(contactsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const toggleForumAccess = async () => {
    setSavingSettings(true);
    try {
      const newValue = !settings.forum_access_all_discussions;
      
      const { error } = await supabase
        .from("companies")
        .update({ forum_access_all_discussions: newValue })
        .eq("id", companyId);

      if (error) throw error;

      setSettings({ ...settings, forum_access_all_discussions: newValue });
      toast.success(
        newValue
          ? "Les employés ont maintenant accès à toutes les discussions"
          : "Les employés n'ont plus accès aux discussions des autres entreprises"
      );
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSavingSettings(false);
    }
  };

  const toggleModeratorStatus = async (contact: CompanyContact) => {
    try {
      const newValue = !contact.is_forum_moderator;
      
      const { error } = await supabase
        .from("company_contacts")
        .update({ is_forum_moderator: newValue })
        .eq("id", contact.id);

      if (error) throw error;

      setContacts(contacts.map(c =>
        c.id === contact.id ? { ...c, is_forum_moderator: newValue } : c
      ));

      toast.success(
        newValue
          ? `${contact.nom} est maintenant modérateur`
          : `${contact.nom} n'est plus modérateur`
      );
    } catch (error) {
      console.error("Error updating moderator status:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Global Forum Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Accès au forum
          </CardTitle>
          <CardDescription>
            Configurez l'accès de vos employés au forum de la communauté FinCare
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="space-y-1">
              <Label htmlFor="forum-access" className="text-base font-medium">
                Accès aux discussions globales
              </Label>
              <p className="text-sm text-muted-foreground">
                Permettre aux employés de votre entreprise de voir et participer aux discussions de toutes les entreprises partenaires FinCare
              </p>
            </div>
            <Switch
              id="forum-access"
              checked={settings.forum_access_all_discussions}
              onCheckedChange={toggleForumAccess}
              disabled={savingSettings}
            />
          </div>

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">À propos du forum</p>
                <p className="text-muted-foreground mt-1">
                  {settings.forum_access_all_discussions
                    ? "Vos employés peuvent actuellement voir et participer aux discussions de toute la communauté FinCare."
                    : "Vos employés peuvent uniquement voir les discussions internes à votre entreprise."}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Moderators Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Gestion des modérateurs
          </CardTitle>
          <CardDescription>
            Les modérateurs peuvent supprimer les publications et commentaires inappropriés
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun contact entreprise configuré</p>
              <p className="text-sm mt-1">
                Ajoutez des contacts dans la configuration de l'entreprise
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Modérateur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {contact.nom?.charAt(0)?.toUpperCase() || "C"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{contact.nom}</span>
                          {contact.is_forum_moderator && (
                            <Badge variant="secondary" className="gap-1">
                              <Shield className="h-3 w-3" />
                              Modérateur
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.email}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={contact.is_forum_moderator}
                        onCheckedChange={() => toggleModeratorStatus(contact)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
