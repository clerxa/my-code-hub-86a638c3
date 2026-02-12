import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { FolderOpen, Trash2, Download, Search, Image, RefreshCw, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

interface BucketInfo {
  id: string;
  name: string;
  public: boolean;
  file_size_limit?: number;
  allowed_mime_types?: string[];
}

// Liste des buckets connus (depuis la configuration Supabase)
const KNOWN_BUCKETS: BucketInfo[] = [
  { id: "avatars", name: "avatars", public: true },
  { id: "company-covers", name: "company-covers", public: true },
  { id: "landing-images", name: "landing-images", public: true },
  { id: "villain-themes", name: "villain-themes", public: true },
  { id: "company-assets", name: "company-assets", public: true },
  { id: "advisor-photos", name: "advisor-photos", public: true },
];

export function StorageBucketsTab() {
  const [buckets] = useState<BucketInfo[]>(KNOWN_BUCKETS);
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);

  const loadFiles = async (bucketId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.storage.from(bucketId).list();
      
      if (error) throw error;
      setFiles(data as StorageFile[]);
      setSelectedBucket(bucketId);
    } catch (error: any) {
      console.error("Error loading files:", error);
      toast.error("Erreur lors du chargement des fichiers");
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (bucketId: string, fileName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${fileName} ?`)) return;

    try {
      const { error } = await supabase.storage.from(bucketId).remove([fileName]);
      if (error) throw error;
      toast.success("Fichier supprimé avec succès");
      loadFiles(bucketId);
    } catch (error: any) {
      console.error("Error deleting file:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const getFileUrl = (bucketId: string, fileName: string) => {
    const { data } = supabase.storage.from(bucketId).getPublicUrl(fileName);
    return data.publicUrl;
  };

  const downloadFile = async (bucketId: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from(bucketId).download(fileName);
      if (error) throw error;
      
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Téléchargement lancé");
    } catch (error: any) {
      console.error("Error downloading file:", error);
      toast.error("Erreur lors du téléchargement");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isImage = (mimetype: string) => {
    return mimetype?.startsWith('image/');
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTotalSize = () => {
    return files.reduce((acc, file) => acc + (file.metadata?.size as number || 0), 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gestion du Stockage</h2>
        <p className="text-sm text-muted-foreground">
          Visualisez et gérez les fichiers uploadés dans vos buckets
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {buckets.map((bucket) => (
          <Card
            key={bucket.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedBucket === bucket.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => loadFiles(bucket.id)}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                {bucket.name}
              </CardTitle>
              <CardDescription>
                <Badge variant={bucket.public ? "default" : "secondary"}>
                  {bucket.public ? "Public" : "Privé"}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Cliquez pour voir les fichiers
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedBucket && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Fichiers dans {selectedBucket}</CardTitle>
                <CardDescription>
                  {files.length} fichier(s) • {formatFileSize(getTotalSize())}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadFiles(selectedBucket)}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un fichier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              {filteredFiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {searchQuery ? "Aucun fichier trouvé" : "Aucun fichier dans ce bucket"}
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Taille</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFiles.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {isImage(file.metadata?.mimetype as string) && (
                                <Image className="h-4 w-4 text-primary" />
                              )}
                              <span className="font-medium truncate max-w-[300px]">
                                {file.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {(file.metadata?.mimetype as string) || 'inconnu'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatFileSize((file.metadata?.size as number) || 0)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(file.updated_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {isImage(file.metadata?.mimetype as string) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setPreviewFile({
                                      url: getFileUrl(selectedBucket, file.name),
                                      name: file.name
                                    })
                                  }
                                >
                                  <Image className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(getFileUrl(selectedBucket, file.name), '_blank')}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadFile(selectedBucket, file.name)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteFile(selectedBucket, file.name)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.name}</DialogTitle>
            <DialogDescription>Prévisualisation de l'image</DialogDescription>
          </DialogHeader>
          {previewFile && (
            <div className="flex justify-center">
              <img
                src={previewFile.url}
                alt={previewFile.name}
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
