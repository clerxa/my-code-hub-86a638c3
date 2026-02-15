import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFiscalRules } from "@/contexts/GlobalSettingsContext";

// Couleurs par index de tranche
const BRACKET_COLORS = [
  "hsl(var(--muted))",
  "hsl(210 100% 50%)",
  "hsl(30 100% 50%)",
  "hsl(0 80% 55%)",
  "hsl(0 90% 40%)",
  "hsl(280 80% 50%)",
];

interface TaxBracketChartProps {
  revenuImposable: number;
  parts: number;
}

interface ChartDataItem {
  name: string;
  montant: number;
  impot: number;
  color: string;
  taux: number;
}

export function TaxBracketChart({ revenuImposable, parts }: TaxBracketChartProps) {
  const { tax_brackets, isLoading } = useFiscalRules();

  // Construire le barème à partir des global_settings
  const bareme = useMemo(() => {
    if (!tax_brackets || tax_brackets.length === 0) return [];
    const sorted = [...tax_brackets].sort((a, b) => a.seuil - b.seuil);
    return sorted.map((bracket, index) => ({
      min: bracket.seuil,
      max: index < sorted.length - 1 ? sorted[index + 1].seuil : Infinity,
      taux: bracket.taux / 100, // stored as percentage (e.g. 30 → 0.30)
      label: `${bracket.taux}%`,
      color: BRACKET_COLORS[index] || BRACKET_COLORS[BRACKET_COLORS.length - 1],
    }));
  }, [tax_brackets]);

  const chartData = useMemo(() => {
    if (bareme.length === 0) return [];
    const quotientFamilial = revenuImposable / parts;
    const data: ChartDataItem[] = [];
    let revenuRestant = quotientFamilial;

    for (const tranche of bareme) {
      if (revenuRestant <= 0) break;

      const montantTranche = tranche.max === Infinity 
        ? revenuRestant 
        : Math.min(tranche.max - tranche.min, revenuRestant);
      
      if (montantTranche > 0) {
        const impotTranche = montantTranche * tranche.taux * parts;
        data.push({
          name: tranche.label,
          montant: Math.round(montantTranche * parts),
          impot: Math.round(impotTranche),
          color: tranche.color,
          taux: tranche.taux * 100,
        });
      }

      revenuRestant -= montantTranche;
    }

    return data;
  }, [revenuImposable, parts]);

  const formatEuro = (value: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ChartDataItem }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-foreground">Tranche à {data.name}</p>
          <p className="text-sm text-muted-foreground">
            Revenu dans cette tranche : {formatEuro(data.montant)}
          </p>
          <p className="text-sm font-medium text-primary">
            Impôt : {formatEuro(data.impot)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            📊 Répartition par tranches d'imposition
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Visualisez comment votre revenu est taxé à chaque niveau
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
              >
                <XAxis 
                  type="number" 
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k€`}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 13, fontWeight: 500 }}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="montant" 
                  radius={[0, 6, 6, 0]}
                  maxBarSize={40}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Légende détaillée */}
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            {chartData.map((item, index) => (
              <motion.div 
                key={item.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center justify-between p-2 rounded-md bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-muted-foreground">Tranche {item.name}</span>
                </div>
                <span className="font-medium">{formatEuro(item.impot)}</span>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
