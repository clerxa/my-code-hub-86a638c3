import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EmployeeRow {
  prenom: string;
  nom: string;
  email: string;
  entreprise: string;
  domaine_email?: string;
  niveau_financier?: string;
  role?: string;
}

interface ImportReport {
  total: number;
  created: number;
  updated: number;
  companiesCreated: number;
  errors: string[];
}

export function EmployeesImportTab() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<EmployeeRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);

  const parseCSV = (text: string): EmployeeRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    // Détecter le séparateur
    const separator = lines[0].includes(';') ? ';' : ',';
    
    const headers = lines[0].split(separator).map(h => h.trim().toLowerCase());
    const rows: EmployeeRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator).map(v => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        const h = header.toLowerCase().trim();
        
        // Mapper les en-têtes avec une logique plus stricte
        // Prénom - doit contenir "prénom" ou "prenom" mais PAS "nom" seul
        if ((h.includes('prénom') || h.includes('prenom') || h === 'firstname') && !h.match(/^nom$/)) {
          row.prenom = values[index];
        } 
        // Nom - uniquement "nom" ou "lastname", pas "prénom"
        else if ((h === 'nom' || h === 'lastname' || h.includes('nom')) && !h.includes('prénom') && !h.includes('prenom')) {
          row.nom = values[index];
        }
        // Email - doit contenir "email" ou "mail" mais PAS "domaine"
        else if ((h.includes('email') || h.includes('mail') || h.includes('e-mail')) && !h.includes('domaine') && !h.includes('domain')) {
          row.email = values[index];
        }
        // Entreprise
        else if (h.includes('entreprise') || h.includes('company') || h.includes('société')) {
          row.entreprise = values[index];
        }
        // Domaine email - doit contenir "domaine" OU "domain" avec "email"/"autorisé"
        else if ((h.includes('domaine') && (h.includes('email') || h.includes('autorisé') || h.includes('autorise'))) || 
                 (h.includes('domain') && !h.match(/^email$/))) {
          row.domaine_email = values[index];
        }
        // Niveau financier
        else if (h.includes('niveau') || h.includes('financier')) {
          row.niveau_financier = values[index];
        }
        // Rôle
        else if (h.includes('role') || h.includes('rôle') || h.includes('poste') || h.includes('fonction')) {
          row.role = values[index];
        }
      });

      if (row.prenom && row.nom && row.email && row.entreprise) {
        rows.push(row);
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
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('import-employees', {
        body: { employees: preview },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
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

  const downloadTemplate = () => {
    const template = 'Prénom;Nom;Email;Entreprise;Domaine email autorisé;Niveau financier;Rôle\n' +
                    'Jean;Dupont;jean.dupont@example.com;Meta;@meta.com;moyen;Manager\n' +
                    'Marie;Martin;marie.martin@example.com;Hubspot;;élevé;Salarié\n' +
                    'Pierre;Durand;pierre.durand@apple.com;Apple France;@apple.com;faible;Développeur';
    
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'template_import_salaries.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import CSV - Salariés</CardTitle>
          <CardDescription>
            Importez des salariés en masse depuis un fichier CSV. Les entreprises seront créées automatiquement si nécessaire.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Format attendu :</strong> Prénom, Nom, Email, Entreprise, Domaine email autorisé (optionnel), 
              Niveau financier (optionnel), Rôle (optionnel)
              <br />
              <Button variant="link" onClick={downloadTemplate} className="p-0 h-auto">
                Télécharger un modèle CSV
              </Button>
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
                        <TableHead>Prénom</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Entreprise</TableHead>
                        <TableHead>Domaine</TableHead>
                        <TableHead>Niveau</TableHead>
                        <TableHead>Rôle</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.slice(0, 10).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.prenom}</TableCell>
                          <TableCell>{row.nom}</TableCell>
                          <TableCell>{row.email}</TableCell>
                          <TableCell>{row.entreprise}</TableCell>
                          <TableCell>{row.domaine_email || '-'}</TableCell>
                          <TableCell>{row.niveau_financier || '-'}</TableCell>
                          <TableCell>{row.role || '-'}</TableCell>
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
                    <div>✓ {report.created} salarié(s) créé(s)</div>
                    <div>✓ {report.updated} salarié(s) mis à jour</div>
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