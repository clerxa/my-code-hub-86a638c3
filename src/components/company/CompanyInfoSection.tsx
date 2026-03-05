import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, TrendingUp, TrendingDown, Minus, Users, Briefcase, Handshake, FileText, Globe, MapPin, Laptop } from "lucide-react";
import { fetchStockPrice } from "@/hooks/useStockData";
import type { Company } from "@/types/database";

interface CompanyInfoSectionProps {
  company: Company & { cover_url?: string; ticker?: string; company_description?: string; is_beta?: boolean; signup_slug?: string; banner_url?: string; forum_access_all_discussions?: boolean; max_tax_declarations?: number; tax_declaration_help_enabled?: boolean; tax_permanence_config?: any; canal_communication_autre?: string; niveau_maturite_financiere?: string };
  primaryColor?: string;
}

interface StockData {
  price: number | null;
  previousClose: number | null;
  change: number | null;
  changePercent: number | null;
  loading: boolean;
  error?: string;
}

export const CompanyInfoSection = ({ company, primaryColor }: CompanyInfoSectionProps) => {
  const color = primaryColor || 'hsl(var(--primary))';
  const [stockData, setStockData] = useState<StockData>({ price: null, previousClose: null, change: null, changePercent: null, loading: false });

  useEffect(() => {
    if (!company.ticker) return;
    
    const fetchPrice = async () => {
      setStockData(prev => ({ ...prev, loading: true }));
      
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Fetch today's price
      const result = await fetchStockPrice(company.ticker!, todayStr);
      
      // Fetch yesterday for comparison
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const prevResult = await fetchStockPrice(company.ticker!, yesterdayStr);
      
      const currentPrice = result.price;
      const prevPrice = prevResult.price;
      const change = currentPrice && prevPrice ? currentPrice - prevPrice : null;
      const changePercent = change && prevPrice ? (change / prevPrice) * 100 : null;
      
      setStockData({
        price: currentPrice,
        previousClose: prevPrice,
        change,
        changePercent,
        loading: false,
        error: result.error
      });
    };
    
    fetchPrice();
  }, [company.ticker]);

  const partnershipLabels: Record<string, string> = {
    "CSE": "Comité Social et Économique",
    "Département RH": "Département des Ressources Humaines",
    "Département Communication": "Département Communication",
    "Département RSE": "Département RSE",
    "Département Financier": "Département Financier",
    "Autre": "Autre",
    "Aucun": "Aucun partenariat"
  };

  const workModeLabels: Record<string, string> = {
    "presentiel": "Présentiel",
    "hybride": "Hybride",
    "full_remote": "Full Remote"
  };

  const compensationDevices = company.compensation_devices as any;
  const activeDevices: string[] = [];
  if (compensationDevices) {
    if (compensationDevices.rsu?.enabled) activeDevices.push("RSU");
    if (compensationDevices.espp) activeDevices.push("ESPP");
    if (compensationDevices.stock_options) activeDevices.push("Stock Options");
    if (compensationDevices.bspce) activeDevices.push("BSPCE");
    if (compensationDevices.pee) activeDevices.push("PEE");
    if (compensationDevices.perco) activeDevices.push("PERCO");
    if (compensationDevices.pero) activeDevices.push("PERO");
  }

  return (
    <div className="space-y-6">
      {/* Stock Price Card */}
      {company.ticker && (
        <Card className="overflow-hidden" style={{ borderTopColor: color, borderTopWidth: '3px' }}>
          <CardHeader style={{ backgroundColor: `color-mix(in srgb, ${color} 5%, transparent)` }}>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                <TrendingUp className="h-5 w-5" style={{ color }} />
              </div>
              Cours de bourse
              <Badge variant="outline" className="ml-auto font-mono text-xs">
                {company.ticker}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {stockData.loading ? (
              <div className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-32 bg-muted rounded" />
                <div className="h-6 w-24 bg-muted rounded" />
              </div>
            ) : stockData.price ? (
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-4xl font-bold" style={{ color }}>
                  ${stockData.price.toFixed(2)}
                </span>
                {stockData.change !== null && stockData.changePercent !== null && (
                  <div className={`flex items-center gap-1 text-lg font-medium ${stockData.change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {stockData.change >= 0 ? <TrendingUp className="h-5 w-5" /> : stockData.change < 0 ? <TrendingDown className="h-5 w-5" /> : <Minus className="h-5 w-5" />}
                    <span>{stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)}</span>
                    <span className="text-sm">({stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%)</span>
                  </div>
                )}
                <span className="text-sm text-muted-foreground ml-auto">
                  Dernière mise à jour
                </span>
              </div>
            ) : (
              <p className="text-muted-foreground">
                {stockData.error || "Cours non disponible pour le moment"}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* General Info Card */}
      <Card className="overflow-hidden" style={{ borderTopColor: color, borderTopWidth: '3px' }}>
        <CardHeader style={{ backgroundColor: `color-mix(in srgb, ${color} 5%, transparent)` }}>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}>
              <Building2 className="h-5 w-5" style={{ color }} />
            </div>
            Informations générales
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {company.company_size && (
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Effectif</p>
                  <p className="font-semibold">{company.company_size.toLocaleString()} collaborateurs</p>
                </div>
              </div>
            )}
            {company.employee_locations && company.employee_locations.length > 0 && (
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Localisation</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {company.employee_locations.map((loc, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{loc}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {company.work_mode && (
              <div className="flex items-start gap-3">
                <Laptop className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mode de travail</p>
                  <p className="font-semibold">{workModeLabels[company.work_mode] || company.work_mode}</p>
                </div>
              </div>
            )}
            {company.has_foreign_employees && (
              <div className="flex items-start gap-3">
                <Globe className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">International</p>
                  <p className="font-semibold">Présence de salariés étrangers</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Partnership Details */}
      {company.partnership_type && company.partnership_type !== "Aucun" && (
        <Card className="overflow-hidden" style={{ borderTopColor: color, borderTopWidth: '3px' }}>
          <CardHeader style={{ backgroundColor: `color-mix(in srgb, ${color} 5%, transparent)` }}>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                <Handshake className="h-5 w-5" style={{ color }} />
              </div>
              Détail du partenariat
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Entité partenaire :</span>
                <Badge style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>{partnershipLabels[company.partnership_type] || company.partnership_type}</Badge>
              </div>
              {company.rang && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Niveau de partenariat :</span>
                  <Badge variant="outline">Rang {company.rang}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* HR Devices */}
      {activeDevices.length > 0 && (
        <Card className="overflow-hidden" style={{ borderTopColor: color, borderTopWidth: '3px' }}>
          <CardHeader style={{ backgroundColor: `color-mix(in srgb, ${color} 5%, transparent)` }}>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                <Briefcase className="h-5 w-5" style={{ color }} />
              </div>
              Dispositifs de rémunération
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {activeDevices.map(device => (
                <Badge key={device} variant="secondary" className="text-sm py-1 px-3">{device}</Badge>
              ))}
            </div>
            {compensationDevices?.variable_compensation && (
              <p className="mt-3 text-sm text-muted-foreground">
                Rémunération variable : {compensationDevices.variable_compensation}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Free Description */}
      {(company as any).company_description && (
        <Card className="overflow-hidden" style={{ borderTopColor: color, borderTopWidth: '3px' }}>
          <CardHeader style={{ backgroundColor: `color-mix(in srgb, ${color} 5%, transparent)` }}>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                <FileText className="h-5 w-5" style={{ color }} />
              </div>
              À propos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-muted-foreground whitespace-pre-line">{(company as any).company_description}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
