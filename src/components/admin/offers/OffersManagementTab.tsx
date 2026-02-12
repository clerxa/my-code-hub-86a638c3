import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Gift, Plus, MoreHorizontal, Edit, Archive, Trash2, Eye, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useOffers } from '@/hooks/useOffers';
import { OfferFormDialog } from './OfferFormDialog';
import { Offer, OfferStatus, getOfferStatus, getCategoryLabel, getCategoryColor } from '@/components/offers/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_LABELS: Record<OfferStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  active: { label: 'Active', variant: 'default' },
  scheduled: { label: 'Programmée', variant: 'secondary' },
  expired: { label: 'Expirée', variant: 'destructive' },
  archived: { label: 'Archivée', variant: 'outline' },
};

export function OffersManagementTab() {
  const { offers, loading, refetch } = useOffers();
  const [statusFilter, setStatusFilter] = useState<OfferStatus | 'all'>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);

  const filteredOffers = offers.filter(offer => {
    if (statusFilter === 'all') return true;
    return getOfferStatus(offer) === statusFilter;
  });

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setFormOpen(true);
  };

  const handleArchive = async (offer: Offer) => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ is_archived: true })
        .eq('id', offer.id);

      if (error) throw error;
      toast.success('Offre archivée');
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleRestore = async (offer: Offer) => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ is_archived: false })
        .eq('id', offer.id);

      if (error) throw error;
      toast.success('Offre restaurée');
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = async () => {
    if (!offerToDelete) return;

    try {
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerToDelete.id);

      if (error) throw error;
      toast.success('Offre supprimée');
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeleteDialogOpen(false);
      setOfferToDelete(null);
    }
  };

  const stats = {
    active: offers.filter(o => getOfferStatus(o) === 'active').length,
    scheduled: offers.filter(o => getOfferStatus(o) === 'scheduled').length,
    expired: offers.filter(o => getOfferStatus(o) === 'expired').length,
    archived: offers.filter(o => getOfferStatus(o) === 'archived').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-3">
          <Gift className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Gestion des Offres</h2>
            <p className="text-sm text-muted-foreground">
              Créez et gérez les offres du moment
            </p>
          </div>
        </div>
        <Button onClick={() => { setEditingOffer(null); setFormOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle offre
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { key: 'active', label: 'Actives', color: 'text-green-500' },
          { key: 'scheduled', label: 'Programmées', color: 'text-blue-500' },
          { key: 'expired', label: 'Expirées', color: 'text-red-500' },
          { key: 'archived', label: 'Archivées', color: 'text-gray-500' },
        ].map((item) => (
          <Card key={item.key}>
            <CardContent className="pt-4">
              <div className={`text-3xl font-bold ${item.color}`}>
                {stats[item.key as keyof typeof stats]}
              </div>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OfferStatus | 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="active">Actives</SelectItem>
            <SelectItem value="scheduled">Programmées</SelectItem>
            <SelectItem value="expired">Expirées</SelectItem>
            <SelectItem value="archived">Archivées</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Titre</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Période</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : filteredOffers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Aucune offre trouvée
                </TableCell>
              </TableRow>
            ) : (
              filteredOffers.map((offer) => {
                const status = getOfferStatus(offer);
                const statusConfig = STATUS_LABELS[status];

                return (
                  <TableRow key={offer.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {offer.image_url && (
                          <img
                            src={offer.image_url}
                            alt=""
                            className="w-12 h-8 object-cover rounded"
                          />
                        )}
                        <div>
                          <div className="font-medium">{offer.title}</div>
                          {offer.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {offer.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getCategoryColor(offer.category)} text-white border-0`}>
                        {getCategoryLabel(offer.category)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(offer.start_date), 'dd MMM yyyy HH:mm', { locale: fr })}</div>
                        <div className="text-muted-foreground">
                          → {format(new Date(offer.end_date), 'dd MMM yyyy HH:mm', { locale: fr })}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(offer)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          {offer.cta_url && (
                            <DropdownMenuItem onClick={() => window.open(offer.cta_url!, '_blank')}>
                              <Eye className="h-4 w-4 mr-2" />
                              Voir le lien
                            </DropdownMenuItem>
                          )}
                          {offer.is_archived ? (
                            <DropdownMenuItem onClick={() => handleRestore(offer)}>
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Restaurer
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleArchive(offer)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archiver
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => { setOfferToDelete(offer); setDeleteDialogOpen(true); }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Form Dialog */}
      <OfferFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        offer={editingOffer}
        onSuccess={refetch}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette offre ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'offre "{offerToDelete?.title}" sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
