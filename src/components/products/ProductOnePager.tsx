import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FinancialProduct } from "@/types/financial-products";
import { getIconByName } from "@/components/admin/IconSelector";
import { supabase } from "@/integrations/supabase/client";
import { Check, ArrowRight, Lightbulb, Clock, TrendingUp, Shield, Wallet, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductOnePagerProps {
  product: FinancialProduct;
  className?: string;
}

export function ProductOnePager({ product, className }: ProductOnePagerProps) {
  const [partners, setPartners] = useState<{ id: string; name: string; logo_url: string | null }[]>([]);
  
  useEffect(() => {
    if (product.id && product.id !== 'preview') {
      supabase
        .from("financial_product_partners")
        .select("id, name, logo_url")
        .eq("product_id", product.id)
        .order("display_order", { ascending: true })
        .then(({ data }) => setPartners(data || []));
    }
  }, [product.id]);

  const MainIcon = getIconByName(product.icon) || Wallet;
  const ExpertIcon = getIconByName(product.expert_tip_icon) || Lightbulb;
  const AvailabilityIcon = getIconByName(product.availability_icon) || Clock;

  const gradientStyle = {
    background: `linear-gradient(135deg, hsl(${product.gradient_start}) 0%, hsl(${product.gradient_end}) 100%)`,
  };

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Hero Header */}
      <section 
        className="relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
        style={product.hero_image_url ? undefined : gradientStyle}
      >
        {/* Background image if provided */}
        {product.hero_image_url ? (
          <>
            <div 
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${product.hero_image_url})` }}
            />
            <div 
              className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, hsl(${product.gradient_start} / 0.85) 0%, hsl(${product.gradient_end} / 0.85) 100%)` }}
            />
          </>
        ) : (
          <div className="absolute inset-0 bg-black/10" />
        )}
        <div className="relative max-w-4xl mx-auto text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-6">
            <MainIcon className="h-8 w-8 sm:h-10 sm:w-10" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
            {product.name}
          </h1>
          
          {product.tagline && (
            <p className="text-lg sm:text-xl lg:text-2xl text-white/90 mb-6 max-w-2xl mx-auto">
              {product.tagline}
            </p>
          )}
          
          {product.tags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {product.tags.map((tag, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="bg-white/20 text-white border-white/30 hover:bg-white/30"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Snapshot Bento Grid */}
      <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold text-center mb-8">
            En un coup d'œil
          </h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Disponibilité */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-4 sm:p-6 text-center">
                <div 
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `hsl(${product.gradient_start} / 0.15)` }}
                >
                  <AvailabilityIcon 
                    className="h-6 w-6" 
                    style={{ color: `hsl(${product.gradient_start})` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Disponibilité</p>
                <p className="font-semibold text-foreground">{product.availability || '-'}</p>
              </CardContent>
            </Card>

            {/* Risque */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-4 sm:p-6 text-center">
                <div 
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `hsl(${product.gradient_start} / 0.15)` }}
                >
                  <Shield 
                    className="h-6 w-6" 
                    style={{ color: `hsl(${product.gradient_start})` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Niveau de risque</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        "w-4 h-4 rounded-full transition-colors",
                        level <= product.risk_level 
                          ? "bg-gradient-to-r" 
                          : "bg-muted"
                      )}
                      style={level <= product.risk_level ? gradientStyle : undefined}
                    />
                  ))}
                </div>
                {product.risk_label && (
                  <p className="text-xs text-muted-foreground mt-2">{product.risk_label}</p>
                )}
              </CardContent>
            </Card>

            {/* Plafond */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-4 sm:p-6 text-center">
                <div 
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `hsl(${product.gradient_start} / 0.15)` }}
                >
                  <Wallet 
                    className="h-6 w-6" 
                    style={{ color: `hsl(${product.gradient_start})` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mb-1">{product.max_amount_label}</p>
                <p className="font-semibold text-foreground">{product.max_amount || '-'}</p>
              </CardContent>
            </Card>

            {/* Rendement */}
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-4 sm:p-6 text-center">
                <div 
                  className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-3 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `hsl(${product.gradient_start} / 0.15)` }}
                >
                  <TrendingUp 
                    className="h-6 w-6" 
                    style={{ color: `hsl(${product.gradient_start})` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mb-1">{product.target_return_label}</p>
                <p className="font-semibold text-foreground">{product.target_return || '-'}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pourquoi pour moi ? */}
      {product.benefits.length > 0 && (
        <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-semibold text-center mb-8">
              Pourquoi ce produit est fait pour vous ?
            </h2>
            
            <div className="space-y-4">
              {product.benefits.map((benefit) => {
                const BenefitIcon = benefit.icon ? getIconByName(benefit.icon) : Check;
                return (
                  <div 
                    key={benefit.id}
                    className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div 
                      className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                      style={gradientStyle}
                    >
                      {BenefitIcon && <BenefitIcon className="h-4 w-4 text-white" />}
                    </div>
                    <p className="text-foreground leading-relaxed">{benefit.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Match Fiscal */}
      {product.fiscal_comparison_enabled && product.fiscal_before_value && product.fiscal_after_value && (
        <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl sm:text-2xl font-semibold text-center mb-3">
              Le Match Fiscal
            </h2>
            
            {product.fiscal_explanation && (
              <p className="text-sm text-muted-foreground text-center mb-8 max-w-xl mx-auto">
                {product.fiscal_explanation}
              </p>
            )}
            
            <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 items-center">
              {/* Avant */}
              <Card className="border-destructive/20 bg-destructive/5">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">{product.fiscal_before_label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-destructive">
                    {product.fiscal_before_value}
                  </p>
                </CardContent>
              </Card>

              {/* Flèche / VS */}
              <div className="hidden sm:flex items-center justify-center">
                <ArrowRight className="h-8 w-8 text-muted-foreground" />
              </div>

              {/* Après */}
              <Card className="border-green-500/20 bg-green-500/5">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">{product.fiscal_after_label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                    {product.fiscal_after_value}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Économie */}
            {product.fiscal_savings_value && (
              <div className="mt-6 text-center">
                <Card className="inline-block" style={gradientStyle}>
                  <CardContent className="px-8 py-4">
                    <p className="text-sm text-white/80">{product.fiscal_savings_label}</p>
                    <p className="text-3xl sm:text-4xl font-bold text-white">
                      {product.fiscal_savings_value}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Conseil Expert */}
      {product.expert_tip_content && (
        <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <Card className="border-2 overflow-hidden" style={{ borderColor: `hsl(${product.gradient_start} / 0.3)` }}>
              <div 
                className="h-1.5 w-full"
                style={gradientStyle}
              />
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div 
                    className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                    style={gradientStyle}
                  >
                    <ExpertIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{product.expert_tip_title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {product.expert_tip_content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Partenaires */}
      {partners.length > 0 && (
        <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-8">
              <Handshake className="h-6 w-6 text-muted-foreground" />
              <h2 className="text-xl sm:text-2xl font-semibold text-center">
                Nos Partenaires
              </h2>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-8">
              {partners.map((partner) => (
                <div key={partner.id} className="flex flex-col items-center gap-2">
                  {partner.logo_url ? (
                    <div className="w-24 h-24 rounded-xl bg-background border flex items-center justify-center p-3 shadow-sm">
                      <img
                        src={partner.logo_url}
                        alt={partner.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div
                      className="w-24 h-24 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `hsl(${product.gradient_start} / 0.15)` }}
                    >
                      <Handshake className="h-8 w-8" style={{ color: `hsl(${product.gradient_start})` }} />
                    </div>
                  )}
                  <p className="text-sm font-medium text-foreground text-center max-w-[120px]">
                    {partner.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl mx-auto text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {product.cta_url && (
              <Button 
                size="lg" 
                className="text-white"
                style={gradientStyle}
                asChild
              >
                <a href={product.cta_url} target="_blank" rel="noopener noreferrer">
                  {product.cta_text}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
            
            {product.cta_secondary_url && product.cta_secondary_text && (
              <Button variant="outline" size="lg" asChild>
                <a href={product.cta_secondary_url} target="_blank" rel="noopener noreferrer">
                  {product.cta_secondary_text}
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
