import { useEffect } from 'react';
import { Gift, Sparkles } from 'lucide-react';
import { useActiveOffers, useOfferViewTracking } from '@/hooks/useOffers';
import { OfferCard } from './OfferCard';
import { Skeleton } from '@/components/ui/skeleton';
import { useEventTracking } from '@/hooks/useEventTracking';

export function OffersSection() {
  const { offers, loading } = useActiveOffers();
  const { markAsViewed } = useOfferViewTracking();
  const { trackPageView } = useEventTracking();

  // Mark as viewed when component mounts
  useEffect(() => {
    markAsViewed();
    trackPageView("offers_page");
  }, [markAsViewed, trackPageView]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Gift className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Offres du moment</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (offers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Gift className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Offres du moment</h2>
        </div>
        
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-card">
          <div className="p-4 rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            De nouvelles offres arrivent bientôt !
          </h3>
          <p className="text-muted-foreground max-w-md">
            Restez connecté pour découvrir nos prochaines offres exclusives et avantages.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Gift className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Offres du moment</h2>
        <span className="text-sm text-muted-foreground">
          ({offers.length} offre{offers.length > 1 ? 's' : ''} disponible{offers.length > 1 ? 's' : ''})
        </span>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer) => (
          <OfferCard key={offer.id} offer={offer} />
        ))}
      </div>
    </div>
  );
}
