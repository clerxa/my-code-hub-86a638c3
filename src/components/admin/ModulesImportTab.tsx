import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileText, CheckCircle, AlertCircle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ModuleRow {
  titre: string;
  type: string;
  description: string;
  points_inscription?: number;
  points_participation?: number;
  theme?: string;
  parcours?: string;
  entreprises?: string;
  duree?: string;
  url_inscription?: string;
  date_webinar?: string;
  embed_code?: string;
  objectifs_pedagogiques?: string;
  difficulte?: number;
  temps_estime?: number;
  questions_quiz?: string;
  url_calendrier?: string;
  type_contenu?: string;
  url_contenu?: string;
}

type ModuleType = 'webinar' | 'quiz' | 'meeting' | 'formation' | 'guide' | 'mixed';

const MODULE_TYPES: { value: ModuleType; label: string; description: string }[] = [
  { value: 'webinar', label: 'Webinaire', description: 'Session en direct avec inscription et participation' },
  { value: 'quiz', label: 'Quiz', description: 'Module de questions avec réponses multiples ou uniques' },
  { value: 'meeting', label: 'Rendez-vous', description: 'Prise de rendez-vous avec un expert' },
  { value: 'formation', label: 'Formation', description: 'Contenu pédagogique (vidéo, slides, texte)' },
  { value: 'guide', label: 'Guide', description: 'Document ou ressource téléchargeable' },
  { value: 'mixed', label: 'Mixte', description: 'Combinaison de plusieurs types de contenu' },
];

interface ImportReport {
  total: number;
  created: number;
  updated: number;
  themesCreated: number;
  parcoursCreated: number;
  companiesCreated: number;
  errors: string[];
}

export function ModulesImportTab() {
  const [selectedType, setSelectedType] = useState<ModuleType>('webinar');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ModuleRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);

  const parseSimplifiedQuizFormat = (text: string): string => {
    try {
      // Format: Q1:Question|type|points|Réponse:correct;Réponse:correct|explication||Q2:...
      const questions = text.split('||').filter(q => q.trim());
      const parsed = questions.map(questionBlock => {
        const parts = questionBlock.split('|');
        if (parts.length < 4) return null;
        
        const questionText = parts[0].replace(/^Q\d+:/, '').trim();
        const type = parts[1].trim().toLowerCase();
        const points = parseInt(parts[2].trim()) || 10;
        const answersText = parts[3].trim();
        const explanation = parts[4]?.trim() || "";
        
        const answers = answersText.split(';').filter(a => a.trim()).map(answer => {
          const [text, correct] = answer.split(':');
          return {
            id: crypto.randomUUID(),
            text: text.trim(),
            isCorrect: correct?.trim().toLowerCase() === 'true'
          };
        });
        
        return {
          id: crypto.randomUUID(),
          title: questionText,
          description: "",
          explanation: explanation,
          points: points,
          type: type === "multiple" ? "multiple" : "single",
          answers: answers
        };
      }).filter(q => q !== null);
      
      return JSON.stringify(parsed);
    } catch (error) {
      console.error('Error parsing simplified quiz format:', error);
      return text; // Retourner le texte original en cas d'erreur
    }
  };

  // Parser CSV qui gère les champs entre guillemets
  const parseCSVLine = (line: string, separator: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Double guillemets = guillemet échappé
          current += '"';
          i++;
        } else {
          // Toggle état guillemets
          inQuotes = !inQuotes;
        }
      } else if (char === separator && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Ajouter le dernier champ
    result.push(current.trim());
    
    return result;
  };

  const parseCSV = (text: string): ModuleRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const separator = lines[0].includes(';') ? ';' : ',';
    const headers = parseCSVLine(lines[0], separator).map(h => h.trim().toLowerCase());
    const rows: ModuleRow[] = [];

    console.log('CSV Headers détectés:', headers);

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], separator);
      const row: any = {};

      console.log(`Ligne ${i + 1} - Valeurs:`, values);

      headers.forEach((header, index) => {
        const value = values[index];
        if (header.includes('titre') || header === 'title') {
          row.titre = value;
        } else if (header === 'type') {
          row.type = value;
        } else if (header.includes('description')) {
          row.description = value;
        } else if (header.includes('points') && header.includes('inscription')) {
          row.points_inscription = parseInt(value) || undefined;
        } else if (header.includes('points') && header.includes('participation')) {
          row.points_participation = parseInt(value) || undefined;
        } else if (header.includes('points') && !header.includes('inscription') && !header.includes('participation')) {
          row.points_inscription = parseInt(value) || undefined;
        } else if (header.includes('theme') || header.includes('thème')) {
          row.theme = value;
        } else if (header.includes('parcours')) {
          row.parcours = value;
        } else if (header.includes('entreprise')) {
          row.entreprises = value;
        } else if (header.includes('duree') || header.includes('durée')) {
          row.duree = value;
        } else if (header.includes('url') && header.includes('inscription')) {
          row.url_inscription = value;
        } else if (header.includes('url') && header.includes('calendrier')) {
          row.url_calendrier = value;
        } else if (header.includes('url') && header.includes('contenu')) {
          row.url_contenu = value;
        } else if (header.includes('date')) {
          row.date_webinar = value;
        } else if (header.includes('embed')) {
          row.embed_code = value;
        } else if (header.includes('objectif')) {
          row.objectifs_pedagogiques = value;
        } else if (header.includes('difficulte') || header.includes('difficulté')) {
          row.difficulte = parseInt(value) || undefined;
        } else if (header.includes('temps')) {
          row.temps_estime = parseInt(value) || undefined;
        } else if (header.includes('question') && header.includes('quiz')) {
          // Tenter de parser le nouveau format simplifié ou l'ancien JSON
          if (value && value.trim()) {
            console.log('Questions quiz brutes:', value);
            if (value.trim().startsWith('[')) {
              // Ancien format JSON
              row.questions_quiz = value;
            } else {
              // Nouveau format simplifié: convertir en JSON
              row.questions_quiz = parseSimplifiedQuizFormat(value);
            }
            console.log('Questions quiz parsées:', row.questions_quiz);
          }
        } else if (header.includes('type') && header.includes('contenu')) {
          row.type_contenu = value;
        }
      });

      if (row.titre && row.description) {
        // Si pas de type spécifié, utiliser le type sélectionné
        if (!row.type) {
          row.type = selectedType;
        }
        rows.push(row);
        console.log('Module parsé:', row);
      }
    }

    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error("Le fichier doit être au format CSV");
      return;
    }

    setFile(selectedFile);
    setReport(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSV(text);
      setPreview(parsed);
      
      if (parsed.length === 0) {
        toast.error("Aucune donnée valide trouvée dans le fichier");
      } else {
        toast.success(`${parsed.length} ligne(s) détectée(s)`);
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleImport = async () => {
    if (!preview.length) {
      toast.error("Aucune donnée à importer");
      return;
    }

    setImporting(true);
    
    try {
      // Forcer un rafraîchissement de la session pour avoir un token valide
      const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
      
      if (sessionError || !session?.access_token) {
        console.error('Session refresh error:', sessionError);
        toast.error("Session expirée, veuillez vous reconnecter");
        return;
      }

      const response = await supabase.functions.invoke('import-modules', {
        body: { modules: preview },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw response.error;
      }

      const result = response.data;
      
      if (result.success) {
        setReport(result.report);
        toast.success(`Import terminé : ${result.report.created} créé(s), ${result.report.updated} mis à jour`);
      } else {
        throw new Error(result.error || 'Erreur lors de l\'import');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(`Erreur lors de l'import : ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const getTemplateForType = (type: ModuleType): { csv: string; instructions: string } => {
    const commonColumns = 'Titre;Description;Thème;Parcours;Entreprises;Difficulté;Temps estimé;Objectifs pédagogiques';
    
    switch (type) {
      case 'webinar':
        return {
          csv: `${commonColumns};Points inscription;Points participation;URL inscription;Date webinar;Durée\n` +
               'Introduction à la fiscalité;Découvrez les bases de la fiscalité française;Fiscalité;Parcours Fiscal;Meta, Hubspot;1;90;Comprendre l\'IR;Maîtriser les dispositifs;50;100;https://livestorm.co/example;2025-04-15T14:00:00;1h30',
          instructions: `**Colonnes spécifiques webinaire:**
- **Points inscription**: Points gagnés à l'inscription (ex: 50)
- **Points participation**: Points gagnés en participant (ex: 100)
- **URL inscription**: Lien d'inscription Livestorm
- **Date webinar**: Format ISO (YYYY-MM-DDTHH:mm:ss) ou date simple (2025-04-15)
- **Durée**: Texte libre (ex: "1h30", "45min")`
        };
      
      case 'quiz':
        return {
          csv: `${commonColumns};Points;Questions quiz\n` +
               'Quiz Fiscalité;Testez vos connaissances;Fiscalité;Parcours Fiscal;Meta;2;15;Valider ses acquis;100;"Q1:Quel est le taux du TMI max ?|single|10|45%:false;49%:true;55%:false|Le TMI maximum en France est de 45% mais le taux marginal peut atteindre 49% avec la contribution exceptionnelle||Q2:Cochez les niches fiscales|multiple|15|PER:true;PEA:false;Pinel:true;SCPI:false|Le PER et le Pinel sont des dispositifs de défiscalisation"',
          instructions: `**Format simplifié des questions quiz (colonne Questions quiz):**

Format texte avec séparateurs (mettre entre guillemets dans le CSV):
\`\`\`
Q1:Question 1|type|points|Réponse A:correct;Réponse B:correct|explication||Q2:Question 2|type|points|Réponse A:correct;Réponse B:correct|explication
\`\`\`

**Structure:**
- **||** sépare les questions
- **|** sépare les éléments d'une question (texte, type, points, réponses, explication)
- **;** sépare les réponses
- **:** sépare le texte de la réponse et sa validité (true/false)

**Exemple concret:**
\`\`\`
Q1:Quel est le TMI maximum ?|single|10|45%:false;49%:true;55%:false|Le taux marginal max est 45% + 4% CEHR||Q2:Niches fiscales ?|multiple|15|PER:true;PEA:false;Pinel:true|Le PER et Pinel permettent de réduire ses impôts
\`\`\`

**Types:**
- **single** = choix unique (une seule bonne réponse)
- **multiple** = choix multiples (plusieurs bonnes réponses possibles)

**Important:**
- Mettre toute la chaîne entre guillemets doubles dans le CSV
- Au moins une réponse avec :true
- Le préfixe "Q1:", "Q2:" etc. est obligatoire pour identifier les questions
- L'explication (5ème élément) est optionnelle et s'affiche après une bonne réponse`
        };

      
      case 'meeting':
        return {
          csv: `${commonColumns};Points;URL calendrier\n` +
               'Rendez-vous fiscal;Prenez RDV avec un expert;Fiscalité;Parcours Fiscal;Meta;1;30;Obtenir des conseils personnalisés;150;https://calendly.com/expert-fiscal',
          instructions: `**Colonnes spécifiques rendez-vous:**
- **Points**: Points gagnés après le RDV (ex: 150)
- **URL calendrier**: Lien Calendly, HubSpot Meetings ou autre`
        };
      
      case 'formation':
        return {
          csv: `${commonColumns};Points;Type contenu;URL contenu;Durée\n` +
               'Formation PER;Comprendre le Plan Épargne Retraite;Épargne;Parcours Retraite;Meta, Hubspot;2;60;Maîtriser le PER;Optimiser sa retraite;100;video;https://youtube.com/watch?v=example;45min',
          instructions: `**Colonnes spécifiques formation:**
- **Points**: Points gagnés après validation (ex: 100)
- **Type contenu**: "video", "slides", "text", "resources"
- **URL contenu**: Lien vers la vidéo, présentation, etc.
- **Durée**: Temps estimé (ex: "45min", "1h")`
        };
      
      case 'guide':
        return {
          csv: `${commonColumns};Points;URL contenu\n` +
               'Guide ISR;Guide complet de l\'investissement responsable;ISR;Parcours ISR;Meta;1;20;Comprendre l\'ISR;50;https://example.com/guide-isr.pdf',
          instructions: `**Colonnes spécifiques guide:**
- **Points**: Points gagnés après consultation (ex: 50)
- **URL contenu**: Lien vers le PDF ou document`
        };
      
      case 'mixed':
        return {
          csv: `${commonColumns};Points;Type contenu;URL contenu;Questions quiz\n` +
               'Module Mixte ESPP;Comprendre et simuler votre ESPP;ESPP;Parcours Actions;Meta;3;90;Comprendre l\'ESPP;Simuler son gain;150;video,quiz;https://youtube.com/watch?v=example;"[{\\"question\\":\\"Qu\'est-ce que l\'ESPP ?\\",\\"type\\":\\"single\\",\\"points\\":10,\\"answers\\":[{\\"text\\":\\"Plan épargne\\",\\"correct\\":true},{\\"text\\":\\"Crédit\\",\\"correct\\":false}]}]"',
          instructions: `**Module mixte combine plusieurs types:**
- Peut inclure vidéo + quiz, ou slides + rendez-vous, etc.
- **Type contenu**: Types séparés par virgule (ex: "video,quiz")
- Suivez les formats des autres types pour les colonnes spécifiques`
        };
    }
  };

  const downloadTemplate = () => {
    const { csv, instructions } = getTemplateForType(selectedType);
    const moduleInfo = MODULE_TYPES.find(t => t.value === selectedType);
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `template_${selectedType}_modules.csv`;
    link.click();
    
    toast.success(`Modèle ${moduleInfo?.label} téléchargé`);
  };

  const { instructions } = getTemplateForType(selectedType);
  const moduleInfo = MODULE_TYPES.find(t => t.value === selectedType);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import CSV - Modules</CardTitle>
          <CardDescription>
            Importez des modules en masse depuis un fichier CSV. Sélectionnez le type de module pour obtenir un modèle adapté.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Type de module</label>
              <Select value={selectedType} onValueChange={(value) => setSelectedType(value as ModuleType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODULE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{type.label}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={downloadTemplate} variant="outline" className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              Télécharger le modèle CSV pour {moduleInfo?.label}
            </Button>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Instructions pour {moduleInfo?.label}</div>
                <div className="text-sm whitespace-pre-line">{instructions}</div>
                <div className="mt-3 pt-3 border-t">
                  <strong>Colonnes communes à tous les types:</strong>
                  <ul className="list-disc pl-4 mt-1 text-sm space-y-1">
                    <li><strong>Titre</strong>: Nom du module (obligatoire)</li>
                    <li><strong>Description</strong>: Description courte (obligatoire)</li>
                    <li><strong>Thème</strong>: Thématiques séparées par virgules (ex: "Fiscalité, ISR")</li>
                    <li><strong>Parcours</strong>: Nom du parcours (créé automatiquement si inexistant)</li>
                    <li><strong>Entreprises</strong>: Noms séparés par virgules (ex: "Meta, Hubspot")</li>
                    <li><strong>Difficulté</strong>: Niveau de 1 à 5 (1=débutant, 5=expert)</li>
                    <li><strong>Temps estimé</strong>: Durée en minutes (ex: 45)</li>
                    <li><strong>Objectifs pédagogiques</strong>: Séparés par point-virgule (;)</li>
                  </ul>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="max-w-md"
            />
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <FileText className="h-4 w-4" />
                {file.name}
              </div>
            )}
          </div>

          {preview.length > 0 && (
            <>
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 font-medium">
                  Prévisualisation ({preview.length} lignes)
                </div>
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titre</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Thème</TableHead>
                        <TableHead>Parcours</TableHead>
                        <TableHead>Entreprises</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.slice(0, 10).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.titre}</TableCell>
                          <TableCell>{row.type}</TableCell>
                          <TableCell>{row.theme || '-'}</TableCell>
                          <TableCell>{row.parcours || '-'}</TableCell>
                          <TableCell>{row.entreprises || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {preview.length > 10 && (
                    <div className="text-center py-2 text-sm text-muted-foreground">
                      ... et {preview.length - 10} ligne(s) supplémentaire(s)
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleImport}
                disabled={importing}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {importing ? "Import en cours..." : "Lancer l'import"}
              </Button>
            </>
          )}

          {report && (
            <Alert className={report.errors.length > 0 ? "border-yellow-500" : "border-green-500"}>
              {report.errors.length > 0 ? <AlertCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Rapport d'import</div>
                  <div className="space-y-1 text-sm">
                    <div>✓ {report.created} module(s) créé(s)</div>
                    <div>✓ {report.updated} module(s) mis à jour</div>
                    <div>✓ {report.parcoursCreated} parcours créé(s)</div>
                    <div>✓ {report.companiesCreated} entreprise(s) créée(s)</div>
                    {report.errors.length > 0 && (
                      <div className="mt-2">
                        <div className="font-medium text-yellow-600">
                          ⚠️ {report.errors.length} erreur(s) :
                        </div>
                        <ul className="list-disc pl-4 mt-1">
                          {report.errors.slice(0, 5).map((error, i) => (
                            <li key={i}>{error}</li>
                          ))}
                          {report.errors.length > 5 && (
                            <li>... et {report.errors.length - 5} autre(s) erreur(s)</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}