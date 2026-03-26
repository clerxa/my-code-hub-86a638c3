import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Grid3X3, Link2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const ADVISOR_CATEGORIES = [
  {
    key: "senior_category",
    label: "Managers, Experts & Seniors",
    shortLabel: "Managers / Experts / Seniors",
    description: "Conseillers expérimentés pour les profils prioritaires",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    members: ["Managers", "Experts", "Seniors"],
  },
  {
    key: "junior_category",
    label: "Juniors & Intermédiaires",
    shortLabel: "Juniors / Intermédiaires",
    description: "Conseillers pour les profils standards",
    color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    members: ["Juniors", "Intermédiaires"],
  },
] as const;

export type AdvisorCategoryKey = typeof ADVISOR_CATEGORIES[number]["key"];

const REVENUE_PROFILES = [
  { key: "RB_sup80", label: "> 80k€" },
  { key: "RB_50-80", label: "50-80k€" },
  { key: "RB_inf50", label: "< 50k€" },
  { key: "RB_NRP", label: "NRP" },
] as const;

const RANGS = [1, 2, 3, 4] as const;

export type MatrixConfig = Record<string, Record<string, AdvisorCategoryKey>>;
export type CategoryUrls = Record<AdvisorCategoryKey, string>;

interface Props {
  matrix: MatrixConfig;
  onMatrixChange: (matrix: MatrixConfig) => void;
  categoryUrls: CategoryUrls;
  onCategoryUrlsChange: (urls: CategoryUrls) => void;
}

const DEFAULT_MATRIX: MatrixConfig = {
  "1": { "RB_sup80": "senior_category", "RB_50-80": "senior_category", "RB_inf50": "senior_category", "RB_NRP": "senior_category" },
  "2": { "RB_sup80": "senior_category", "RB_50-80": "senior_category", "RB_inf50": "junior_category", "RB_NRP": "junior_category" },
  "3": { "RB_sup80": "senior_category", "RB_50-80": "junior_category", "RB_inf50": "junior_category", "RB_NRP": "junior_category" },
  "4": { "RB_sup80": "senior_category", "RB_50-80": "junior_category", "RB_inf50": "junior_category", "RB_NRP": "junior_category" },
};

export { DEFAULT_MATRIX };

function getCategoryBadge(key: AdvisorCategoryKey) {
  const cat = ADVISOR_CATEGORIES.find(c => c.key === key);
  if (!cat) return null;
  return (
    <Badge variant="outline" className={`${cat.color} text-xs font-medium`}>
      {cat.shortLabel}
    </Badge>
  );
}

export function RdvAssignmentMatrix({ matrix, onMatrixChange, categoryUrls, onCategoryUrlsChange }: Props) {
  const updateCell = (rang: number, revenue: string, value: AdvisorCategoryKey) => {
    const newMatrix = { ...matrix };
    if (!newMatrix[rang]) newMatrix[rang] = {};
    newMatrix[rang] = { ...newMatrix[rang], [revenue]: value };
    onMatrixChange(newMatrix);
  };

  const getCell = (rang: number, revenue: string): AdvisorCategoryKey => {
    return matrix?.[rang]?.[revenue] || DEFAULT_MATRIX[rang]?.[revenue] || "junior_category";
  };

  return (
    <div className="space-y-6">
      {/* URLs per category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Liens de réservation par catégorie
          </CardTitle>
          <CardDescription>
            Configurez l'URL de prise de rendez-vous pour chaque catégorie de conseillers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ADVISOR_CATEGORIES.map(({ key, label, description, color, members }) => (
            <div key={key} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <Label className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />
                    {label}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">{description}</p>
                </div>
                <Badge variant="outline" className={`${color} text-xs shrink-0`}>
                  {members.join(" · ")}
                </Badge>
              </div>
              <div className="flex gap-2">
                <Input
                  value={categoryUrls[key] || ""}
                  onChange={(e) => onCategoryUrlsChange({ ...categoryUrls, [key]: e.target.value })}
                  placeholder="https://meetings.hubspot.com/..."
                  className="flex-1 text-sm"
                />
                {categoryUrls[key] && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => window.open(categoryUrls[key], "_blank")}
                    title="Tester le lien"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
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
            Sélectionnez la catégorie de conseillers attribuée pour chaque combinaison rang d'entreprise / profil de revenu du salarié.
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
                    <th key={rp.key} className="p-3 text-center text-sm font-medium text-muted-foreground border-b min-w-[180px]">
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
                            onValueChange={(val) => updateCell(rang, rp.key, val as AdvisorCategoryKey)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue>
                                {getCategoryBadge(currentValue)}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {ADVISOR_CATEGORIES.map(cat => (
                                <SelectItem key={cat.key} value={cat.key}>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className={`${cat.color} text-xs`}>{cat.shortLabel}</Badge>
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
            <p className="text-xs font-medium text-muted-foreground mb-2">Légende :</p>
            <div className="flex flex-wrap gap-3">
              {ADVISOR_CATEGORIES.map(cat => (
                <div key={cat.key} className="flex items-center gap-2">
                  <Badge variant="outline" className={`${cat.color} text-xs`}>
                    {cat.shortLabel}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {categoryUrls[cat.key] ? "✓ lien configuré" : "✗ lien manquant"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
