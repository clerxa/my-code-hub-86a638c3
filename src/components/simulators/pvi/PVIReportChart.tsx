/**
 * Graphique de répartition de la plus-value (Stacked Bar Chart)
 * Visualise la décomposition de la PV en part exonérée et impôts
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { PieChart } from 'lucide-react';
import type { PVICalculationResult } from '@/types/pvi';

interface PVIReportChartProps {
  result: PVICalculationResult;
}

export const PVIReportChart: React.FC<PVIReportChartProps> = ({ result }) => {
  
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M €`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k €`;
    }
    return `${value.toFixed(0)} €`;
  };
  
  // Données pour le graphique à barres empilées
  const chartData = [
    {
      name: 'Plus-Value Brute',
      partExoneree: result.repartition.part_exoneree,
      impotRevenu: result.repartition.impot_revenu,
      prelevementsSociaux: result.repartition.prelevements_sociaux,
      surtaxe: result.repartition.surtaxe,
    }
  ];
  
  // Légende
  const legendItems = [
    { label: 'Part exonérée (abattements)', color: 'hsl(142, 76%, 36%)', value: result.repartition.part_exoneree },
    { label: 'Impôt sur le Revenu (19%)', color: 'hsl(221, 83%, 53%)', value: result.repartition.impot_revenu },
    { label: 'Prélèvements Sociaux (17.2%)', color: 'hsl(262, 83%, 58%)', value: result.repartition.prelevements_sociaux },
  ];
  
  if (result.surtaxe_applicable) {
    legendItems.push({
      label: `Surtaxe (${result.surtaxe_taux}%)`,
      color: 'hsl(45, 93%, 47%)',
      value: result.repartition.surtaxe
    });
  }
  
  // Données pour un graphique horizontal simple
  const horizontalData = legendItems
    .filter(item => item.value > 0)
    .map(item => ({
      name: item.label.split('(')[0].trim(),
      value: item.value,
      fill: item.color,
      percentage: ((item.value / result.plus_value_brute) * 100).toFixed(1)
    }));
  
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-sm">{data.name}</p>
          <p className="text-lg font-bold" style={{ color: data.fill }}>
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(data.value)}
          </p>
          <p className="text-xs text-muted-foreground">{data.percentage}% de la plus-value</p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Répartition de la Plus-Value
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Décomposition de votre plus-value de {formatCurrency(result.plus_value_brute)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={horizontalData} 
                layout="vertical"
                margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
              >
                <XAxis 
                  type="number" 
                  tickFormatter={formatCurrency}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={100}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="value" 
                  radius={[0, 4, 4, 0]}
                  barSize={32}
                >
                  {horizontalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                  <LabelList
                    dataKey="percentage"
                    position="right"
                    formatter={(value: string) => `${value}%`}
                    fill="currentColor"
                    className="text-muted-foreground text-xs"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Légende */}
          <div className="mt-4 flex flex-wrap gap-3">
            {legendItems.filter(item => item.value > 0).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
          
          {/* Message explicatif */}
          {result.abattement_ir_pct > 0 && (
            <div className="mt-4 bg-green-50 dark:bg-green-900/10 rounded-lg p-3 text-sm text-green-700 dark:text-green-300">
              <strong>Effet de la durée de détention :</strong> Sur {formatCurrency(result.plus_value_brute)} de plus-value,{' '}
              {formatCurrency(result.repartition.part_exoneree)} ({result.abattement_ir_pct.toFixed(0)}%) sont exonérés grâce aux abattements.
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};
