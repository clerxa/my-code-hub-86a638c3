import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Shield, Star, CheckCircle, ArrowRight, Quote, Clock, Users, Award, Zap, Heart, Lightbulb, Gift, Trophy, ThumbsUp, MessageCircle, Calendar, Briefcase, Rocket, Smile, Eye, Euro, Home, Calculator, Compass, BookOpen, Landmark, PiggyBank, Scale, FileText, HandCoins, Building, Wallet } from "lucide-react";

interface Benefit {
  icon: string;
  title: string;
  description: string;
}

interface GalleryImage {
  id: string;
  url: string;
  alt?: string;
  caption?: string;
}

interface LandingSettings {
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string | null;
  benefits: Benefit[];
  expertises?: Benefit[];
  cta_text: string;
  cta_secondary_text: string;
  testimonial_enabled: boolean;
  testimonial_text: string | null;
  testimonial_author: string | null;
  testimonial_role: string | null;
  footer_text: string;
  gallery_images?: GalleryImage[];
}

interface ExpertBookingLandingPreviewProps {
  settings: LandingSettings;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Target, TrendingUp, Shield, Star, CheckCircle, Clock, Users, Award, Zap,
  Heart, Lightbulb, Gift, Trophy, ThumbsUp, MessageCircle, Calendar,
  Briefcase, Rocket, Smile, Eye, Euro, Home, Calculator, Compass,
  BookOpen, Landmark, PiggyBank, Scale, FileText, HandCoins, Building, Wallet
};

export function ExpertBookingLandingPreview({ settings }: ExpertBookingLandingPreviewProps) {
  return (
    <div className="bg-gradient-to-b from-background to-muted/30 rounded-lg overflow-hidden border">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5" />
        <div className="px-6 py-10 relative">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight hero-gradient">
                {settings.hero_title || "Titre principal"}
              </h1>
              <p className="text-base text-muted-foreground">
                {settings.hero_subtitle || "Sous-titre descriptif"}
              </p>
              {settings.gallery_images && settings.gallery_images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {settings.gallery_images.map((image) => (
                    <div key={image.id} className="w-16 h-16 rounded-md overflow-hidden shadow-sm border border-border/50">
                      <img
                        src={image.url}
                        alt={image.alt || "Réassurance"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="default" className="text-sm">
                  {settings.cta_text || "Bouton CTA"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              {settings.cta_secondary_text && (
                <p className="text-xs text-muted-foreground">
                  {settings.cta_secondary_text}
                </p>
              )}
            </div>
            {settings.hero_image_url && (
              <div className="relative">
                <img
                  src={settings.hero_image_url}
                  alt="Expert consultation"
                  className="rounded-xl shadow-lg max-h-40 object-cover w-full"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      {settings.benefits && settings.benefits.length > 0 && (
        <section className="py-8 px-6">
          <h2 className="text-lg font-bold text-center mb-6">
            Pourquoi prendre rendez-vous ?
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            {settings.benefits.map((benefit, index) => {
              const IconComponent = iconMap[benefit.icon] || CheckCircle;
              return (
                <Card key={index} className="border-0 shadow-md">
                  <CardContent className="p-4 text-center space-y-2">
                    <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-semibold">{benefit.title || "Titre"}</h3>
                    <p className="text-xs text-muted-foreground">{benefit.description || "Description"}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* Expertises Section */}
      {settings.expertises && settings.expertises.length > 0 && (
        <section className="py-6 px-6 bg-muted/30">
          <h2 className="text-lg font-bold text-center mb-2">
            Nos expertises
          </h2>
          <p className="text-xs text-center text-muted-foreground mb-4">
            Des domaines de compétence variés pour répondre à tous vos besoins
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {settings.expertises.map((expertise, index) => {
              const IconComponent = iconMap[expertise.icon] || CheckCircle;
              return (
                <div key={index} className="flex flex-col items-center text-center p-3 rounded-lg bg-background border border-border/50">
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center mb-2">
                    <IconComponent className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-xs font-semibold">{expertise.title || "Titre"}</h3>
                  <p className="text-[10px] text-muted-foreground">{expertise.description || "Description"}</p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Testimonial Section */}
      {settings.testimonial_enabled && settings.testimonial_text && (
        <section className="py-6 px-6 bg-muted/50">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <Quote className="h-8 w-8 text-primary/30 mb-3" />
              <blockquote className="text-sm text-foreground mb-4 leading-relaxed">
                "{settings.testimonial_text}"
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary">
                    {settings.testimonial_author?.charAt(0) || "?"}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold">{settings.testimonial_author}</p>
                  {settings.testimonial_role && (
                    <p className="text-xs text-muted-foreground">{settings.testimonial_role}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Gallery Section */}
      {settings.gallery_images && settings.gallery_images.length > 0 && (
        <section className="py-6 px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {settings.gallery_images.map((image) => (
              <div key={image.id} className="space-y-2">
                <div className="aspect-square rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.alt || "Gallery"}
                    className="w-full h-full object-cover"
                  />
                </div>
                {image.caption && (
                  <p className="text-xs text-center text-muted-foreground">{image.caption}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-8 px-6 text-center">
        <h2 className="text-lg font-bold mb-3">Prêt à démarrer ?</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Réservez votre créneau dès maintenant.
        </p>
        <Button size="default" className="text-sm">
          {settings.cta_text || "Réserver"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        {settings.footer_text && (
          <p className="mt-4 text-xs text-muted-foreground">
            {settings.footer_text}
          </p>
        )}
      </section>
    </div>
  );
}
