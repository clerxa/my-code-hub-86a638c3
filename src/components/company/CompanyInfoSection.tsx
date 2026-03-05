import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, TrendingDown, Users, Briefcase, Handshake, FileText, Globe, MapPin, Laptop, BarChart3, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { fetchStockSummary, type StockSummary } from "@/hooks/useStockData";
import type { Company } from "@/types/database";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface InfoSectionsConfig {
  stock_price?: boolean;
  general_info?: boolean;
  partnership?: boolean;
  hr_devices?: boolean;
  description?: boolean;
}

interface CompanyInfoSectionProps {
  company: Company & { cover_url?: string; ticker?: string; company_description?: string; info_sections_config?: InfoSectionsConfig; [key: string]: any };
  primaryColor?: string;
}

const defaultConfig: InfoSectionsConfig = {
  stock_price: true, general_info: true, partnership: true, hr_devices: true, description: true,
};

function formatLargeNumber(num: number): string {
  if (num >= 1e12) return (num / 1e12).toFixed(2) + ' T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + ' Md';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + ' M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + ' k';
  return num.toLocaleString('fr-FR');
}

export const CompanyInfoSection = ({ company, primaryColor }: CompanyInfoSectionProps) => {
  const color = primaryColor || 'hsl(var(--primary))';
  const config: InfoSectionsConfig = { ...defaultConfig, ...(company as any).info_sections_config };
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const showStockPrice = config.stock_price !== false && !!company.ticker;
  const showGeneralInfo = config.general_info !== false;
  const showPartnership = config.partnership !== false;
  const showHrDevices = config.hr_devices !== false;
  const showDescription = config.description !== false;

  useEffect(() => {
    if (!company.ticker || !showStockPrice) return;
    setLoading(true);
    fetchStockSummary(company.ticker!).then(data => {
      setSummary(data);
      setLoading(false);
    });
  }, [company.ticker, showStockPrice]);

  const workModeLabels: Record<string, string> = {
    "presentiel": "Présentiel", "hybride": "Hybride", "full_remote": "Full Remote"
  };
  const partnershipLabels: Record<string, string> = {
    "CSE": "Comité Social et Économique", "Département RH": "Département des Ressources Humaines",
    "Département Communication": "Département Communication", "Département RSE": "Département RSE",
    "Département Financier": "Département Financier", "Autre": "Autre", "Aucun": "Aucun partenariat"
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

  const hasGeneralInfo = company.company_size || (company.employee_locations?.length ?? 0) > 0 || company.work_mode || company.has_foreign_employees;
  const hasPartnership = company.partnership_type && company.partnership_type !== "Aucun";
  const hasHrDevices = activeDevices.length > 0;
  const hasDescription = !!(company as any).company_description;

  const isPositive = (summary?.change ?? 0) >= 0;
  const currencySymbol = summary?.currency === 'EUR' ? '€' : summary?.currency === 'GBP' ? '£' : '$';

  // 52-week progress
  const weekRange = summary?.fiftyTwoWeekHigh && summary?.fiftyTwoWeekLow && summary?.currentPrice
    ? ((summary.currentPrice - summary.fiftyTwoWeekLow) / (summary.fiftyTwoWeekHigh - summary.fiftyTwoWeekLow)) * 100
    : null;

  return (
    <div className="space-y-6">
      {/* Stock Price Card */}
      {showStockPrice && (
        <Card className="overflow-hidden" style={{ borderTopColor: color, borderTopWidth: '3px' }}>
          <CardHeader style={{ backgroundColor: `color-mix(in srgb, ${color} 5%, transparent)` }}>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}>
                <TrendingUp className="h-5 w-5" style={{ color }} />
              </div>
              <div className="flex flex-col">
                <span>Cours de bourse</span>
                {summary?.shortName && summary.shortName !== company.ticker && (
                  <span className="text-xs font-normal text-muted-foreground">{summary.shortName}</span>
                )}
              </div>
              <div className="ml-auto flex items-center gap-2">
                {summary?.exchangeName && (
                  <Badge variant="secondary" className="text-xs">{summary.exchangeName}</Badge>
                )}
                <Badge variant="outline" className="font-mono text-xs">{company.ticker}</Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-5">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-36 bg-muted rounded" />
                  <div className="h-8 w-28 bg-muted rounded" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[1,2,3,4].map(i => <div key={i} className="h-16 bg-muted rounded-lg" />)}
                </div>
              </div>
            ) : summary?.currentPrice ? (
              <>
                {/* Price + Change */}
                <div className="flex items-baseline gap-4 flex-wrap">
                  <span className="text-4xl font-bold tracking-tight" style={{ color }}>
                    {currencySymbol}{summary.currentPrice.toFixed(2)}
                  </span>
                  {summary.change !== null && summary.changePercent !== null && (
                    <div className={`flex items-center gap-1.5 text-lg font-semibold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                      {isPositive ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                      <span>{isPositive ? '+' : ''}{summary.change.toFixed(2)}</span>
                      <span className="text-sm font-medium opacity-80">({isPositive ? '+' : ''}{summary.changePercent.toFixed(2)}%)</span>
                    </div>
                  )}
                </div>

                {/* Date */}
                {summary.latestDate && (
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      Clôture du {format(new Date(summary.latestDate), "d MMMM yyyy", { locale: fr })}
                    </span>
                  </div>
                )}

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {summary.dayHigh !== null && summary.dayLow !== null && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Fourchette du jour</p>
                      <p className="font-semibold text-sm">
                        {currencySymbol}{summary.dayLow.toFixed(2)} – {currencySymbol}{summary.dayHigh.toFixed(2)}
                      </p>
                    </div>
                  )}
                  {summary.volume !== null && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Volume</p>
                      <p className="font-semibold text-sm flex items-center gap-1">
                        <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatLargeNumber(summary.volume)}
                      </p>
                    </div>
                  )}
                  {summary.previousClose !== null && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">Clôture précédente</p>
                      <p className="font-semibold text-sm">{currencySymbol}{summary.previousClose.toFixed(2)}</p>
                    </div>
                  )}
                  {summary.fiftyTwoWeekHigh !== null && summary.fiftyTwoWeekLow !== null && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground mb-1">52 semaines</p>
                      <p className="font-semibold text-sm">
                        {currencySymbol}{summary.fiftyTwoWeekLow.toFixed(2)} – {currencySymbol}{summary.fiftyTwoWeekHigh.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>

                {/* 52-week progress bar */}
                {weekRange !== null && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Plus bas 52s</span>
                      <span>Plus haut 52s</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden relative">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, Math.max(0, weekRange))}%`,
                          background: `linear-gradient(90deg, ${isPositive ? '#16a34a' : '#ef4444'}, ${color})`
                        }}
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-muted-foreground">
                {summary?.error || "Cours non disponible pour le moment"}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* General Info Card */}
      {showGeneralInfo && hasGeneralInfo && (
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
      )}

      {/* Partnership Details */}
      {showPartnership && hasPartnership && (
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
                <Badge style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`, color }}>{partnershipLabels[company.partnership_type!] || company.partnership_type}</Badge>
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
      {showHrDevices && hasHrDevices && (
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
      {showDescription && hasDescription && (
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

      {/* Empty state */}
      {!showStockPrice && !(showGeneralInfo && hasGeneralInfo) && !(showPartnership && hasPartnership) && !(showHrDevices && hasHrDevices) && !(showDescription && hasDescription) && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Aucune information disponible pour le moment</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
