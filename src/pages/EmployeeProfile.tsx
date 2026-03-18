/**
 * Page Mon Profil — Informations personnelles uniquement
 * Les données patrimoniales sont dans /panorama/audit
 */

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  User, Mail, Phone, Building2, Palette, Save, X, Lock, Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ForumAnonymousSettings } from "@/components/employee/ForumAnonymousSettings";

// Re-export for backward compatibility (PANORAMA uses these)
export { AUDIT_FIELD_TO_TAB as FIELD_TO_TAB } from "@/pages/PanoramaAuditPage";

interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone_number: string | null;
  avatar_url: string | null;
  company_id: string | null;
  forum_anonymous_mode?: boolean;
  forum_pseudo?: string | null;
  forum_avatar_url?: string | null;
  personal_email?: string | null;
  receive_on_personal_email?: boolean;
}

export default function EmployeeProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(null);
  const [company, setCompany] = useState<{ name: string } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const hasChanges = useMemo(() => {
    if (!profile || !originalProfile) return false;
    return JSON.stringify(profile) !== JSON.stringify(originalProfile);
  }, [profile, originalProfile]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, phone_number, avatar_url, company_id, forum_anonymous_mode, forum_pseudo, forum_avatar_url, personal_email, receive_on_personal_email")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setProfile(profileData);
      setOriginalProfile(profileData);

      if (profileData.company_id) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("name")
          .eq("id", profileData.company_id)
          .single();
        setCompany(companyData);
      }
    } catch (error: any) {
      console.error("Failed to fetch data", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hasChanges || !profile) return;
    try {
      setSavingProfile(true);
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone_number: profile.phone_number,
          personal_email: profile.personal_email,
          receive_on_personal_email: profile.receive_on_personal_email,
        })
        .eq("id", profile.id);

      if (error) throw error;
      setOriginalProfile(profile);
      toast.success("Profil mis à jour avec succès");
    } catch (error: any) {
      console.error("Failed to update profile", error);
      toast.error("Erreur lors de la mise à jour du profil");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancel = () => {
    setProfile(originalProfile);
  };

  const updateField = (field: keyof ProfileData, value: any) => {
    setProfile((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  if (loading) {
    return (
      <EmployeeLayout activeSection="profile-info">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-primary text-xl animate-pulse">Chargement...</div>
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout activeSection="profile-info">
      <div className="pb-24">
        <div className="max-w-3xl mx-auto space-y-6 p-4 md:p-6">
          {/* Header with Avatar */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-2">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-4 border-primary/20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                  {profile?.first_name?.charAt(0)}{profile?.last_name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !profile?.id) return;
                    try {
                      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
                      const timestamp = Date.now();
                      const fileName = `${profile.id}/${timestamp}.${fileExt}`;
                      const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(fileName, file, { upsert: true, contentType: file.type });
                      if (uploadError) throw uploadError;
                      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
                      const avatarUrl = urlData.publicUrl;
                      const { error: updateError } = await supabase
                        .from('profiles')
                        .update({ avatar_url: avatarUrl })
                        .eq('id', profile.id);
                      if (updateError) throw updateError;
                      setProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
                      setOriginalProfile(prev => prev ? { ...prev, avatar_url: avatarUrl } : null);
                      toast.success("Avatar mis à jour !");
                    } catch (error: any) {
                      console.error("Error uploading avatar:", error);
                      toast.error(`Erreur lors de l'upload: ${error.message || 'Erreur inconnue'}`);
                    }
                  }}
                />
                <Palette className="h-6 w-6 text-white" />
              </label>
            </div>
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl md:text-3xl font-bold">
                {profile?.first_name} {profile?.last_name}
              </h1>
              <p className="text-muted-foreground flex items-center gap-2 justify-center md:justify-start mt-1">
                <Mail className="h-4 w-4" />
                {profile?.email}
              </p>
              {company && (
                <p className="text-muted-foreground flex items-center gap-2 justify-center md:justify-start mt-1">
                  <Building2 className="h-4 w-4" />
                  {company.name}
                </p>
              )}
            </div>
          </div>

          {/* Identity Card */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Identité</CardTitle>
                  <CardDescription>Vos informations personnelles de base</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    value={profile?.first_name || ""}
                    onChange={(e) => updateField("first_name", e.target.value)}
                    placeholder="Votre prénom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    value={profile?.last_name || ""}
                    onChange={(e) => updateField("last_name", e.target.value)}
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  Email professionnel
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profile?.email || ""}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">L'email professionnel ne peut pas être modifié</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="personal_email" className="flex items-center gap-2">
                  Adresse mail personnelle
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Cette adresse peut être utilisée pour recevoir des informations même après votre départ de l'entreprise.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <Input
                  id="personal_email"
                  type="email"
                  value={profile?.personal_email || ""}
                  onChange={(e) => updateField("personal_email", e.target.value)}
                  placeholder="votre.email.personnel@exemple.com"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="receive_on_personal_email"
                  checked={profile?.receive_on_personal_email || false}
                  onCheckedChange={(checked) => updateField("receive_on_personal_email", checked === true)}
                />
                <Label htmlFor="receive_on_personal_email" className="text-sm font-normal cursor-pointer">
                  Recevoir les communications sur mon adresse personnelle
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Coordonnées */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Coordonnées</CardTitle>
                  <CardDescription>Comment vous contacter</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profile?.phone_number || ""}
                  onChange={(e) => updateField("phone_number", e.target.value)}
                  placeholder="06 12 34 56 78"
                />
              </div>
            </CardContent>
          </Card>

          {/* Forum Anonymous Settings */}
          {profile && (
            <ForumAnonymousSettings
              profileId={profile.id}
              companyId={profile.company_id}
              forumAnonymousMode={profile.forum_anonymous_mode}
              forumPseudo={profile.forum_pseudo}
              forumAvatarUrl={profile.forum_avatar_url}
              onUpdate={fetchData}
            />
          )}
        </div>
      </div>

      {/* Floating save bar */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-4 transition-all duration-300 z-50",
          hasChanges ? "translate-y-0 opacity-100" : "translate-y-full opacity-0"
        )}
      >
        <div className="container mx-auto max-w-3xl flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">Vous avez des modifications non enregistrées</p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleCancel} disabled={savingProfile}>
              <X className="h-4 w-4 mr-2" /> Annuler
            </Button>
            <Button onClick={handleSave} disabled={savingProfile}>
              <Save className="h-4 w-4 mr-2" /> {savingProfile ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
