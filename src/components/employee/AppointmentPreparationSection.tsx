import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ClipboardCheck, 
  Target, 
  Shield, 
  Upload, 
  MessageSquare, 
  CheckCircle2, 
  FileText,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const OBJECTIVES = [
  { id: "reduce_taxes", label: "Réduire mes impôts", icon: "📉" },
  { id: "prepare_retirement", label: "Préparer ma retraite", icon: "🏖️" },
  { id: "protect_family", label: "Protéger ma famille (prévoyance)", icon: "👨‍👩‍👧‍👦" },
  { id: "real_estate", label: "Anticiper un achat immobilier", icon: "🏠" },
  { id: "wealth_transfer", label: "Optimiser la transmission de mon patrimoine", icon: "📜" },
];

interface PreparationDocument {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

export function AppointmentPreparationSection() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(true);
  const [selectedObjectives, setSelectedObjectives] = useState<string[]>([]);
  const [intentionNote, setIntentionNote] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch existing preparation data
  const { data: preparation, isLoading: prepLoading } = useQuery({
    queryKey: ['appointment-preparation', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('appointment_preparation')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch uploaded documents
  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['preparation-documents', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('appointment_preparation_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PreparationDocument[];
    },
    enabled: !!user,
  });

  // Fetch financial profile completion
  const { data: financialProfile } = useQuery({
    queryKey: ['financial-profile-status', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('user_financial_profiles')
        .select('is_complete, tmi')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Fetch risk profile
  const { data: riskProfile } = useQuery({
    queryKey: ['risk-profile-status', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('risk_profile')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Initialize state from fetched data
  useEffect(() => {
    if (preparation) {
      setSelectedObjectives(preparation.objectives || []);
      setIntentionNote(preparation.intention_note || "");
    }
  }, [preparation]);

  // Save preparation mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Non connecté");
      
      const { error } = await supabase
        .from('appointment_preparation')
        .upsert({
          user_id: user.id,
          objectives: selectedObjectives,
          intention_note: intentionNote,
        }, { onConflict: 'user_id' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment-preparation'] });
      toast.success("Préparation enregistrée");
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    await saveMutation.mutateAsync();
    setIsSaving(false);
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Le fichier ne doit pas dépasser 10 Mo");
      return;
    }

    setIsUploading(true);
    try {
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save reference in database
      const { error: dbError } = await supabase
        .from('appointment_preparation_documents')
        .insert({
          user_id: user.id,
          file_name: file.name,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
        });

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['preparation-documents'] });
      toast.success("Document téléversé avec succès");
    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Erreur lors du téléversement");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // Handle file delete
  const handleDeleteDocument = async (doc: PreparationDocument) => {
    if (!user) return;

    try {
      // Delete from storage
      await supabase.storage.from('documents').remove([doc.file_path]);
      
      // Delete from database
      await supabase
        .from('appointment_preparation_documents')
        .delete()
        .eq('id', doc.id);

      queryClient.invalidateQueries({ queryKey: ['preparation-documents'] });
      toast.success("Document supprimé");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  // Toggle objective
  const toggleObjective = (id: string) => {
    setSelectedObjectives(prev => {
      if (prev.includes(id)) {
        return prev.filter(o => o !== id);
      }
      if (prev.length >= 3) {
        toast.info("Vous pouvez sélectionner 3 objectifs maximum");
        return prev;
      }
      return [...prev, id];
    });
  };

  // Calculate preparation progress
  const calculateProgress = () => {
    let score = 0;
    let total = 5;

    if (financialProfile?.is_complete) score++;
    if (financialProfile?.tmi) score++;
    if (selectedObjectives.length >= 2) score++;
    if (riskProfile?.id) score++;
    if (documents.length > 0) score++;

    return Math.round((score / total) * 100);
  };

  const progress = calculateProgress();

  if (prepLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200/50 bg-gradient-to-br from-amber-50/50 to-background dark:from-amber-950/20">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <ClipboardCheck className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">Préparer mon rendez-vous</CardTitle>
                  <CardDescription>Optimisez votre session avec le conseiller</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{progress}% complété</span>
                  <Progress value={progress} className="w-24 h-2" />
                </div>
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* 1. Profil Financier 360° */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                <h4 className="font-medium">1. Check-list "360°" - Le socle</h4>
                {financialProfile?.is_complete && (
                  <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Complété
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Remplissez votre profil financier pour donner plus de visibilité au conseiller. 
                N'oubliez pas votre TMI (Taux Marginal d'Imposition) issu de votre dernier avis d'imposition.
              </p>
              {!financialProfile?.is_complete && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/employee?tab=financial-profile">
                    Compléter mon profil
                  </Link>
                </Button>
              )}
            </div>

            {/* 2. Objectifs prioritaires */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <h4 className="font-medium">2. Mes objectifs prioritaires</h4>
                {selectedObjectives.length >= 2 && (
                  <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {selectedObjectives.length}/3
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Un rendez-vous est réussi si le conseiller répond à un besoin précis. 
                Sélectionnez 2 à 3 priorités :
              </p>
              <div className="grid gap-2">
                {OBJECTIVES.map((obj) => (
                  <label
                    key={obj.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedObjectives.includes(obj.id)
                        ? 'bg-primary/5 border-primary/30'
                        : 'bg-muted/30 border-transparent hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox
                      checked={selectedObjectives.includes(obj.id)}
                      onCheckedChange={() => toggleObjective(obj.id)}
                    />
                    <span className="text-lg">{obj.icon}</span>
                    <span className="text-sm">{obj.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 3. Profil de risque */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <h4 className="font-medium">3. Profil de risque</h4>
                {riskProfile?.id && (
                  <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Défini
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Remplir votre profil de risque vous sensibilise à votre propre perception du risque 
                et aide le conseiller à vous proposer des solutions adaptées.
              </p>
              {!riskProfile?.id && (
                <Button variant="outline" size="sm" asChild>
                  <Link to="/risk-profile">
                    Définir mon profil de risque
                  </Link>
                </Button>
              )}
            </div>

            {/* 4. Documents */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                <h4 className="font-medium">4. Coffre-fort documents</h4>
                {documents.length > 0 && (
                  <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {documents.length} fichier(s)
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Déposez votre dernier bulletin de salaire ou avis d'imposition. 
                Le conseiller recevra le dossier en amont pour commencer directement par l'analyse.
              </p>
              
              {/* Uploaded documents list */}
              {documents.length > 0 && (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div 
                      key={doc.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate">{doc.file_name}</span>
                        {doc.file_size && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            ({(doc.file_size / 1024).toFixed(0)} Ko)
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteDocument(doc)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={isUploading} asChild>
                  <label className="cursor-pointer">
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {isUploading ? "Envoi en cours..." : "Téléverser un document"}
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                  </label>
                </Button>
                <span className="text-xs text-muted-foreground">
                  PDF, images, Word (max 10 Mo)
                </span>
              </div>
            </div>

            {/* 5. Note d'intention */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <h4 className="font-medium">5. Note d'intention</h4>
                {intentionNote.trim().length > 0 && (
                  <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Rédigée
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Y a-t-il une question spécifique ou un projet de vie dont vous aimeriez parler ?
              </p>
              <Textarea
                placeholder="Ex: Je prévois une année sabbatique l'année prochaine, j'envisage un mariage, je souhaite créer mon entreprise..."
                value={intentionNote}
                onChange={(e) => setIntentionNote(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>

            {/* Save button */}
            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                )}
                Enregistrer ma préparation
              </Button>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
