import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Award, Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Certification {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Advisor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  bio: string | null;
  photo_url: string | null;
  is_active: boolean;
  certifications: string[];
  ranks: number[];
}

const AVAILABLE_RANKS = [1, 2, 3, 4, 5];

export function AdvisorsTab() {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [advisorDialogOpen, setAdvisorDialogOpen] = useState(false);
  const [certDialogOpen, setCertDialogOpen] = useState(false);
  const [editingAdvisor, setEditingAdvisor] = useState<Advisor | null>(null);
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  
  // Advisor form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [selectedRanks, setSelectedRanks] = useState<number[]>([]);
  const [isActive, setIsActive] = useState(true);

  // Certification form state
  const [certName, setCertName] = useState("");
  const [certLogoFile, setCertLogoFile] = useState<File | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchAdvisors(), fetchCertifications()]);
    setLoading(false);
  };

  const fetchAdvisors = async () => {
    const { data: advisorsData, error: advisorsError } = await supabase
      .from("advisors")
      .select("*")
      .order("last_name");

    if (advisorsError) {
      toast.error("Erreur lors du chargement des conseillers");
      return;
    }

    // Fetch certifications and ranks for each advisor
    const advisorsWithRelations = await Promise.all(
      (advisorsData || []).map(async (advisor) => {
        const { data: certData } = await supabase
          .from("advisor_certifications")
          .select("certification_id")
          .eq("advisor_id", advisor.id);

        const { data: rankData } = await supabase
          .from("advisor_ranks")
          .select("rank")
          .eq("advisor_id", advisor.id);

        return {
          ...advisor,
          certifications: certData?.map((c) => c.certification_id) || [],
          ranks: rankData?.map((r) => r.rank) || [],
        };
      })
    );

    setAdvisors(advisorsWithRelations);
  };

  const fetchCertifications = async () => {
    const { data, error } = await supabase
      .from("certifications")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Erreur lors du chargement des certifications");
      return;
    }

    setCertifications(data || []);
  };

  const uploadPhoto = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("advisor-photos")
      .upload(fileName, file);

    if (error) {
      toast.error("Erreur lors de l'upload de l'image");
      return null;
    }

    const { data } = supabase.storage.from("advisor-photos").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const resetAdvisorForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setBio("");
    setPhotoFile(null);
    setSelectedCerts([]);
    setSelectedRanks([]);
    setIsActive(true);
    setEditingAdvisor(null);
  };

  const openEditAdvisor = (advisor: Advisor) => {
    setEditingAdvisor(advisor);
    setFirstName(advisor.first_name);
    setLastName(advisor.last_name);
    setEmail(advisor.email);
    setBio(advisor.bio || "");
    setSelectedCerts(advisor.certifications);
    setSelectedRanks(advisor.ranks);
    setIsActive(advisor.is_active);
    setAdvisorDialogOpen(true);
  };

  const handleSaveAdvisor = async () => {
    if (!firstName || !lastName || !email) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    let photoUrl = editingAdvisor?.photo_url || null;
    if (photoFile) {
      photoUrl = await uploadPhoto(photoFile, "advisors");
    }

    if (editingAdvisor) {
      // Update existing advisor
      const { error } = await supabase
        .from("advisors")
        .update({
          first_name: firstName,
          last_name: lastName,
          email,
          bio,
          photo_url: photoUrl,
          is_active: isActive,
        })
        .eq("id", editingAdvisor.id);

      if (error) {
        toast.error("Erreur lors de la mise à jour");
        return;
      }

      // Update certifications
      await supabase.from("advisor_certifications").delete().eq("advisor_id", editingAdvisor.id);
      if (selectedCerts.length > 0) {
        await supabase.from("advisor_certifications").insert(
          selectedCerts.map((certId) => ({
            advisor_id: editingAdvisor.id,
            certification_id: certId,
          }))
        );
      }

      // Update ranks
      await supabase.from("advisor_ranks").delete().eq("advisor_id", editingAdvisor.id);
      if (selectedRanks.length > 0) {
        await supabase.from("advisor_ranks").insert(
          selectedRanks.map((rank) => ({
            advisor_id: editingAdvisor.id,
            rank,
          }))
        );
      }

      toast.success("Conseiller mis à jour");
    } else {
      // Create new advisor
      const { data: newAdvisor, error } = await supabase
        .from("advisors")
        .insert({
          first_name: firstName,
          last_name: lastName,
          email,
          bio,
          photo_url: photoUrl,
          is_active: isActive,
        })
        .select()
        .single();

      if (error || !newAdvisor) {
        toast.error("Erreur lors de la création");
        return;
      }

      // Add certifications
      if (selectedCerts.length > 0) {
        await supabase.from("advisor_certifications").insert(
          selectedCerts.map((certId) => ({
            advisor_id: newAdvisor.id,
            certification_id: certId,
          }))
        );
      }

      // Add ranks
      if (selectedRanks.length > 0) {
        await supabase.from("advisor_ranks").insert(
          selectedRanks.map((rank) => ({
            advisor_id: newAdvisor.id,
            rank,
          }))
        );
      }

      toast.success("Conseiller créé");
    }

    setAdvisorDialogOpen(false);
    resetAdvisorForm();
    fetchAdvisors();
  };

  const handleDeleteAdvisor = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce conseiller ?")) return;

    const { error } = await supabase.from("advisors").delete().eq("id", id);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    toast.success("Conseiller supprimé");
    fetchAdvisors();
  };

  const resetCertForm = () => {
    setCertName("");
    setCertLogoFile(null);
    setEditingCert(null);
  };

  const openEditCert = (cert: Certification) => {
    setEditingCert(cert);
    setCertName(cert.name);
    setCertDialogOpen(true);
  };

  const handleSaveCert = async () => {
    if (!certName) {
      toast.error("Veuillez entrer un nom");
      return;
    }

    let logoUrl = editingCert?.logo_url || null;
    if (certLogoFile) {
      logoUrl = await uploadPhoto(certLogoFile, "certifications");
    }

    if (editingCert) {
      const { error } = await supabase
        .from("certifications")
        .update({ name: certName, logo_url: logoUrl })
        .eq("id", editingCert.id);

      if (error) {
        toast.error("Erreur lors de la mise à jour");
        return;
      }

      toast.success("Certification mise à jour");
    } else {
      const { error } = await supabase
        .from("certifications")
        .insert({ name: certName, logo_url: logoUrl });

      if (error) {
        toast.error("Erreur lors de la création");
        return;
      }

      toast.success("Certification créée");
    }

    setCertDialogOpen(false);
    resetCertForm();
    fetchCertifications();
  };

  const handleDeleteCert = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette certification ?")) return;

    const { error } = await supabase.from("certifications").delete().eq("id", id);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    toast.success("Certification supprimée");
    fetchCertifications();
  };

  if (loading) {
    return <div className="p-6">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="advisors">
        <TabsList>
          <TabsTrigger value="advisors">Conseillers</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
        </TabsList>

        <TabsContent value="advisors" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestion des conseillers</h2>
            <Dialog open={advisorDialogOpen} onOpenChange={(open) => {
              setAdvisorDialogOpen(open);
              if (!open) resetAdvisorForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter un conseiller
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAdvisor ? "Modifier le conseiller" : "Nouveau conseiller"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom *</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom *</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Présentation</Label>
                    <Textarea
                      id="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Photo</Label>
                    <div className="flex items-center gap-4">
                      {editingAdvisor?.photo_url && (
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={editingAdvisor.photo_url} />
                          <AvatarFallback>
                            {firstName[0]}{lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Certifications</Label>
                    <div className="flex flex-wrap gap-2">
                      {certifications.map((cert) => (
                        <div key={cert.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`cert-${cert.id}`}
                            checked={selectedCerts.includes(cert.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCerts([...selectedCerts, cert.id]);
                              } else {
                                setSelectedCerts(selectedCerts.filter((c) => c !== cert.id));
                              }
                            }}
                          />
                          <label htmlFor={`cert-${cert.id}`} className="text-sm flex items-center gap-1">
                            {cert.logo_url && (
                              <img src={cert.logo_url} alt="" className="h-4 w-4 object-contain" />
                            )}
                            {cert.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Rangs d'entreprise</Label>
                    <div className="flex flex-wrap gap-2">
                      {AVAILABLE_RANKS.map((rank) => (
                        <div key={rank} className="flex items-center space-x-2">
                          <Checkbox
                            id={`rank-${rank}`}
                            checked={selectedRanks.includes(rank)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRanks([...selectedRanks, rank]);
                              } else {
                                setSelectedRanks(selectedRanks.filter((r) => r !== rank));
                              }
                            }}
                          />
                          <label htmlFor={`rank-${rank}`} className="text-sm">
                            Rang {rank}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isActive"
                      checked={isActive}
                      onCheckedChange={(checked) => setIsActive(checked as boolean)}
                    />
                    <label htmlFor="isActive" className="text-sm">Actif</label>
                  </div>

                  <Button onClick={handleSaveAdvisor} className="w-full">
                    {editingAdvisor ? "Mettre à jour" : "Créer"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {advisors.map((advisor) => (
              <Card key={advisor.id} className={!advisor.is_active ? "opacity-50" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={advisor.photo_url || undefined} />
                        <AvatarFallback>
                          {advisor.first_name[0]}{advisor.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base">
                          {advisor.first_name} {advisor.last_name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">{advisor.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEditAdvisor(advisor)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAdvisor(advisor.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {advisor.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{advisor.bio}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-1">
                    {advisor.ranks.map((rank) => (
                      <Badge key={rank} variant="secondary">
                        Rang {rank}
                      </Badge>
                    ))}
                  </div>

                  {advisor.certifications.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {advisor.certifications.map((certId) => {
                        const cert = certifications.find((c) => c.id === certId);
                        return cert ? (
                          <Badge key={certId} variant="outline" className="gap-1">
                            {cert.logo_url && (
                              <img src={cert.logo_url} alt="" className="h-3 w-3 object-contain" />
                            )}
                            {cert.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Gestion des certifications</h2>
            <Dialog open={certDialogOpen} onOpenChange={(open) => {
              setCertDialogOpen(open);
              if (!open) resetCertForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter une certification
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCert ? "Modifier la certification" : "Nouvelle certification"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="certName">Nom *</Label>
                    <Input
                      id="certName"
                      value={certName}
                      onChange={(e) => setCertName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Logo</Label>
                    <div className="flex items-center gap-4">
                      {editingCert?.logo_url && (
                        <img src={editingCert.logo_url} alt="" className="h-8 w-8 object-contain" />
                      )}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCertLogoFile(e.target.files?.[0] || null)}
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveCert} className="w-full">
                    {editingCert ? "Mettre à jour" : "Créer"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {certifications.map((cert) => (
              <Card key={cert.id}>
                <CardContent className="pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {cert.logo_url ? (
                      <img src={cert.logo_url} alt="" className="h-8 w-8 object-contain" />
                    ) : (
                      <Award className="h-8 w-8 text-muted-foreground" />
                    )}
                    <span className="font-medium">{cert.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditCert(cert)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteCert(cert.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
