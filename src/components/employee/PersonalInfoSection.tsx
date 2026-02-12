/**
 * ===========================================================
 * 📄 File: PersonalInfoSection.tsx
 * 📌 Rôle : Section d'informations personnelles avec édition directe
 * ===========================================================
 */

import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Phone, 
  Calendar, 
  Users, 
  Briefcase,
  Euro,
  Save,
  X,
  Lock,
  Building2,
  Upload,
  Info
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ForumAnonymousSettings } from "./ForumAnonymousSettings";

interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone_number: string | null;
  birth_date: string | null;
  marital_status: string | null;
  children_count: number | null;
  job_title: string | null;
  net_taxable_income: number | null;
  household_taxable_income?: number | null;
  company_id?: string | null;
  forum_anonymous_mode?: boolean;
  forum_pseudo?: string | null;
  forum_avatar_url?: string | null;
}

interface PersonalInfoSectionProps {
  profile: ProfileData;
  companyName?: string;
  avatarUrl?: string | null;
  onAvatarUpload?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  uploading?: boolean;
  onProfileUpdate?: () => void;
}

export function PersonalInfoSection({ 
  profile, 
  companyName, 
  avatarUrl,
  onAvatarUpload,
  uploading = false,
  onProfileUpdate 
}: PersonalInfoSectionProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<ProfileData>(profile);
  const [originalData, setOriginalData] = useState<ProfileData>(profile);
  const [saving, setSaving] = useState(false);

  // Reset form data when profile changes
  useEffect(() => {
    setFormData(profile);
    setOriginalData(profile);
  }, [profile]);

  // Détecte si des modifications ont été apportées
  const hasChanges = useMemo(() => {
    return JSON.stringify(formData) !== JSON.stringify(originalData);
  }, [formData, originalData]);

  const updateField = <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone_number: formData.phone_number,
          birth_date: formData.birth_date,
          marital_status: formData.marital_status,
          children_count: formData.children_count,
          job_title: formData.job_title,
          net_taxable_income: formData.net_taxable_income,
          household_taxable_income: formData.household_taxable_income,
        })
        .eq("id", formData.id);

      if (error) throw error;
      setOriginalData(formData);
      // Invalidate the user-profile-names query so financial profile completeness updates
      queryClient.invalidateQueries({ queryKey: ['user-profile-names'] });
      toast.success("Informations mises à jour");
      onProfileUpdate?.();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
  };

  const maritalStatusLabels: Record<string, string> = {
    single: "Célibataire",
    married: "Marié(e)",
    pacs: "Pacsé(e)",
    divorced: "Divorcé(e)",
    widowed: "Veuf(ve)"
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header avec Avatar */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-xl sm:text-2xl">Mes informations personnelles</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Gérez et mettez à jour vos informations de profil</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <Avatar className="h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0">
              <AvatarImage src={avatarUrl || ""} />
              <AvatarFallback className="text-xl sm:text-2xl">
                {formData.first_name?.[0]}{formData.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <h3 className="font-semibold text-base sm:text-lg">{formData.first_name} {formData.last_name}</h3>
              <p className="text-muted-foreground text-sm break-all">{formData.email}</p>
              {onAvatarUpload && (
                <div className="mt-2">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={onAvatarUpload} 
                    disabled={uploading} 
                    className="hidden" 
                    id="avatar-upload-section" 
                  />
                  <Label htmlFor="avatar-upload-section">
                    <Button variant="outline" size="sm" disabled={uploading} asChild>
                      <span className="cursor-pointer">
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? "Upload..." : "Changer la photo"}
                      </span>
                    </Button>
                  </Label>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bloc Identité */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Identité</CardTitle>
              <CardDescription>Vos informations de base</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Prénom</Label>
              <Input
                id="first_name"
                value={formData.first_name || ""}
                onChange={(e) => updateField("first_name", e.target.value)}
                placeholder="Votre prénom"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Nom</Label>
              <Input
                id="last_name"
                value={formData.last_name || ""}
                onChange={(e) => updateField("last_name", e.target.value)}
                placeholder="Votre nom"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              Email
              <Lock className="h-3 w-3 text-muted-foreground" />
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email || ""}
              disabled
              className="bg-muted cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              L'email ne peut pas être modifié
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Forum Anonymous Settings */}
      <ForumAnonymousSettings
        profileId={formData.id}
        companyId={formData.company_id || null}
        forumAnonymousMode={formData.forum_anonymous_mode}
        forumPseudo={formData.forum_pseudo}
        forumAvatarUrl={formData.forum_avatar_url}
        onUpdate={onProfileUpdate}
      />

      {/* Bloc Coordonnées */}
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
              value={formData.phone_number || ""}
              onChange={(e) => updateField("phone_number", e.target.value)}
              placeholder="06 12 34 56 78"
            />
          </div>
        </CardContent>
      </Card>

      {/* Bloc Situation personnelle */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Situation personnelle</CardTitle>
              <CardDescription>Informations pour personnaliser vos recommandations</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birth_date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date de naissance
              </Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date || ""}
                onChange={(e) => updateField("birth_date", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Âge
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3.5 w-3.5 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Calculé automatiquement à partir de votre date de naissance</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <div className="h-10 px-3 py-2 rounded-md border bg-muted flex items-center text-muted-foreground">
                {formData.birth_date ? (
                  <span className="text-foreground font-medium">
                    {Math.floor((new Date().getTime() - new Date(formData.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} ans
                  </span>
                ) : (
                  <span className="text-sm">Non renseigné</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="marital_status">Situation familiale</Label>
              <Select
                value={formData.marital_status || "single"}
                onValueChange={(value) => updateField("marital_status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Célibataire</SelectItem>
                  <SelectItem value="married">Marié(e)</SelectItem>
                  <SelectItem value="pacs">Pacsé(e)</SelectItem>
                  <SelectItem value="divorced">Divorcé(e)</SelectItem>
                  <SelectItem value="widowed">Veuf(ve)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="children_count">Nombre d'enfants à charge</Label>
            <Input
              id="children_count"
              type="number"
              min="0"
              value={formData.children_count ?? 0}
              onChange={(e) => updateField("children_count", parseInt(e.target.value) || 0)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bloc Situation professionnelle */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Situation professionnelle</CardTitle>
              <CardDescription>Votre emploi actuel</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {companyName && (
            <div className="space-y-2">
              <Label htmlFor="company" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Entreprise
                <Lock className="h-3 w-3 text-muted-foreground" />
              </Label>
              <Input
                id="company"
                value={companyName}
                disabled
                className="bg-muted cursor-not-allowed"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="job_title">Poste occupé</Label>
            <Input
              id="job_title"
              value={formData.job_title || ""}
              onChange={(e) => updateField("job_title", e.target.value)}
              placeholder="Ex: Développeur, Chef de projet..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Bloc Situation fiscale */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Euro className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Situation fiscale</CardTitle>
              <CardDescription>Ces informations permettent d'optimiser vos simulations</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="net_taxable_income">Revenu net imposable personnel (€/an)</Label>
            <Input
              id="net_taxable_income"
              type="number"
              min="0"
              value={formData.net_taxable_income || ""}
              onChange={(e) => updateField("net_taxable_income", parseFloat(e.target.value) || null)}
              placeholder="Ex: 45000"
            />
            <p className="text-xs text-muted-foreground">
              Votre revenu net imposable individuel (avant abattement 10%)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="household_taxable_income">Revenu net imposable du foyer fiscal (€/an)</Label>
            <Input
              id="household_taxable_income"
              type="number"
              min="0"
              value={formData.household_taxable_income || ""}
              onChange={(e) => updateField("household_taxable_income", parseFloat(e.target.value) || null)}
              placeholder="Ex: 75000"
            />
            <p className="text-xs text-muted-foreground">
              Le revenu total de votre foyer fiscal (vous + conjoint si applicable)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Barre de sauvegarde flottante */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 sm:py-4 transition-all duration-300 z-50",
          hasChanges ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
            Vous avez des modifications non enregistrées
          </p>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={handleCancel} disabled={saving} size="sm" className="flex-1 sm:flex-none">
              <X className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden xs:inline">Annuler</span>
            </Button>
            <Button onClick={handleSave} disabled={saving} size="sm" className="flex-1 sm:flex-none">
              <Save className="h-4 w-4 mr-1 sm:mr-2" />
              {saving ? "..." : "Enregistrer"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
