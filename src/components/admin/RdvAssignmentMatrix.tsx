import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Grid3X3, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const ADVISOR_TYPES = [
  { key: "managers", label: "Managers", color: "bg-purple-500/20 text-purple-300 border-purple-500/30" },
  { key: "experts", label: "Experts", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  { key: "seniors_plus", label: "Seniors +", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
  { key: "seniors", label: "Seniors", color: "bg-teal-500/20 text-teal-300 border-teal-500/30" },
  { key: "intermediaires", label: "Intermédiaires", color: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  { key: "juniors", label: "Juniors", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
] as const;

export type AdvisorTypeKey = typeof ADVISOR_TYPES[number]["key"];

const REVENUE_PROFILES = [
  { key: "RB_sup80", label: "> 80k€" },
  { key: "RB_50-80", label: "50-80k€" },
  { key: "RB_inf50", label: "< 50k€" },
  { key: "RB_NRP", label: "NRP" },
] as const;

const RANGS = [1, 2, 3, 4] as const;

export type MatrixConfig = Record<string, Record<string, AdvisorTypeKey>>;
export type AdvisorUrls = Record<AdvisorTypeKey, string>;

interface Props {
  matrix: MatrixConfig;
  onMatrixChange: (matrix: MatrixConfig) => void;
  advisorUrls: AdvisorUrls;
  onAdvisorUrlsChange: (urls: AdvisorUrls) => void;
}

const DEFAULT_MATRIX: MatrixConfig = {
  "1": { "RB_sup80": "experts", "RB_50-80": "experts", "RB_inf50": "experts", "RB_NRP": "experts" },
  "2": { "RB_sup80": "experts", "RB_50-80": "seniors", "RB_inf50": "seniors", "RB_NRP": "seniors" },
  "3": { "RB_sup80": "experts", "RB_50-80": "seniors", "RB_inf50": "juniors", "RB_NRP": "juniors" },
  "4": { "RB_sup80": "seniors", "RB_50-80": "juniors", "RB_inf50": "juniors", "RB_NRP": "juniors" },
};

export { DEFAULT_MATRIX };

function getAdvisorBadge(key: AdvisorTypeKey) {
  const type = ADVISOR_TYPES.find(t => t.key === key);
  if (!type) return null;
  return (
    <Badge variant="outline" className={`${type.color} text-xs font-medium`}>
      {type.label}
    </Badge>
  );
}

export function RdvAssignmentMatrix({ matrix, onMatrixChange, advisorUrls, onAdvisorUrlsChange }: Props) {
  const updateCell = (rang: number, revenue: string, value: AdvisorTypeKey) => {
    const newMatrix = { ...matrix };
    if (!newMatrix[rang]) newMatrix[rang] = {};
    newMatrix[rang] = { ...newMatrix[rang], [revenue]: value };
    onMatrixChange(newMatrix);
  };

  const getCell = (rang: number, revenue: string): AdvisorTypeKey => {
    return matrix?.[rang]?.[revenue] || DEFAULT_MATRIX[rang]?.[revenue] || "juniors";
  };

  return (
    <div className="space-y-6">
      {/* URLs per advisor type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Liens de réservation par type de conseiller
          </CardTitle>
          <CardDescription>
            Configurez l'URL de prise de rendez-vous pour chaque type de conseiller.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {ADVISOR_TYPES.map(({ key, label, color }) => (
              <div key={key} className="border rounded-lg p-3 space-y-2">
                <Label className="flex items-center gap-2">
                  <Badge variant="outline" className={`${color} text-xs`}>{label}</Badge>
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={advisorUrls[key] || ""}
                    onChange={(e) => onAdvisorUrlsChange({ ...advisorUrls, [key]: e.target.value })}
                    placeholder="https://meetings.hubspot.com/..."
                    className="flex-1 text-sm"
                  />
                  {advisorUrls[key] && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={() => window.open(advisorUrls[key], "_blank")}
                      title="Tester le lien"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Visual Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Grid3X3 className="h-5 w-5" />
            Matrice d'affectation Rang × Revenu
          </CardTitle>
          <CardDescription>
            Sélectionnez le type de conseiller attribué pour chaque combinaison rang d'entreprise / profil de revenu du salarié.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-3 text-left text-sm font-medium text-muted-foreground border-b">
                    Rang \ Revenu
                  </th>
                  {REVENUE_PROFILES.map(rp => (
                    <th key={rp.key} className="p-3 text-center text-sm font-medium text-muted-foreground border-b min-w-[150px]">
                      {rp.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RANGS.map(rang => (
                  <tr key={rang} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {rang}
                        </span>
                        <span className="text-sm font-medium">Rang {rang}</span>
                      </div>
                    </td>
                    {REVENUE_PROFILES.map(rp => {
                      const currentValue = getCell(rang, rp.key);
                      return (
                        <td key={rp.key} className="p-2 text-center">
                          <Select
                            value={currentValue}
                            onValueChange={(val) => updateCell(rang, rp.key, val as AdvisorTypeKey)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue>
                                {getAdvisorBadge(currentValue)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {ADVISOR_TYPES.map(at => (
                                <SelectItem key={at.key} value={at.key}>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={`${at.color} text-xs`}>{at.label}</Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-2">Légende des types de conseillers :</p>
            <div className="flex flex-wrap gap-2">
              {ADVISOR_TYPES.map(at => (
                <Badge key={at.key} variant="outline" className={`${at.color} text-xs`}>
                  {at.label}
                  {advisorUrls[at.key] ? " ✓" : " ✗"}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ✓ = lien configuré · ✗ = lien manquant (le lien par défaut sera utilisé)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
