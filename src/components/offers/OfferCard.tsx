import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Clock, Calendar } from 'lucide-react';
import { Offer, getCategoryLabel, getCategoryColor } from './types';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRdvLink } from '@/hooks/useRdvLink';
import { useAuth } from '@/components/AuthProvider';
import { appendUtmParams } from '@/hooks/useBookingReferrer';

interface OfferCardProps {
  offer: Offer;
}

function getTimeRemaining(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  
  if (diff <= 0) return 'Expiré';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  
  if (hours < 24) {
    return 'Expire aujourd\'hui';
  }
  
  if (days === 1) {
    return 'Plus que 1 jour pour en bénéficier';
  }
  
  return `Plus que ${days} jours pour en bénéficier`;
}

export function OfferCard({ offer }: OfferCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { rdvUrl: bookingUrl } = useRdvLink();
  const [timeRemaining, setTimeRemaining] = useState('');
  const endDate = new Date(offer.end_date);
  
  useEffect(() => {
    const updateTime = () => {
      setTimeRemaining(getTimeRemaining(endDate));
    };
    
    updateTime();
    
    // Update every minute
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [offer.end_date]);

  const isUrgent = timeRemaining === 'Expire aujourd\'hui';
  const categoryColor = getCategoryColor(offer.category);

  const handleCtaClick = () => {
    if (!offer.cta_url) return;
    
    // Generate a URL-safe UTM campaign from the offer title
    const offerUtm = `offre_${offer.title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').substring(0, 40)}`;
    
    // Expert booking link - use bookingUrl (the clickable URL)
    if (offer.cta_url === '__EXPERT_BOOKING__') {
      if (bookingUrl) {
        window.open(appendUtmParams(bookingUrl, offerUtm), '_blank');
      }
      return;
    }
    
    // Internal link (starts with /)
    if (offer.cta_url.startsWith('/')) {
      navigate(offer.cta_url);
      return;
    }
    
    // External link
    window.open(offer.cta_url, '_blank');
  };

  const getCtaIcon = () => {
    if (offer.cta_url === '__EXPERT_BOOKING__') {
      return <Calendar className="h-4 w-4" />;
    }
    if (offer.cta_url?.startsWith('/')) {
      return null;
    }
    return <ExternalLink className="h-4 w-4" />;
  };

  const hasValidCta = offer.cta_url && (
    offer.cta_url !== '__EXPERT_BOOKING__' || bookingUrl
  );

  return (
    <Card className="overflow-hidden group hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      {/* Image with 16:9 ratio */}
      <div className="relative aspect-video overflow-hidden bg-muted flex-shrink-0">
        {offer.image_url ? (
          <img
            src={offer.image_url}
            alt={offer.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span className="text-4xl font-bold text-primary/30">
              {offer.title.charAt(0)}
            </span>
          </div>
        )}
        
        {/* Category badge */}
        <Badge 
          className={`absolute top-3 left-3 ${categoryColor} text-white border-0`}
        >
          {getCategoryLabel(offer.category)}
        </Badge>
      </div>

      <CardContent className="p-4 flex flex-col flex-grow">
        <h3 className="font-semibold text-lg leading-tight mb-2">
          {offer.title}
        </h3>
        
        {offer.description && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-3 flex-grow">
            {offer.description}
          </p>
        )}

        {/* Time remaining */}
        <div className={`flex items-center gap-2 text-sm mb-3 ${isUrgent ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
          <Clock className="h-4 w-4 flex-shrink-0" />
          <span>{timeRemaining}</span>
        </div>

        {/* CTA Button */}
        {hasValidCta && (
          <Button 
            className="w-full gap-2 mt-auto" 
            onClick={handleCtaClick}
          >
            <span className="truncate">{offer.cta_text || 'En savoir plus'}</span>
            {getCtaIcon()}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
