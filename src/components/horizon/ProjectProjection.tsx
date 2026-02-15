import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import type { HorizonProject } from "@/hooks/useHorizonProjects";

interface ProjectProjectionProps {
  project: HorizonProject;
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export function ProjectProjection({ project }: ProjectProjectionProps) {
  const data = useMemo(() => {
    const rate = Number(project.annual_return_rate || 0) / 100;
    const monthlyRate = rate / 12;
    const months = project.duration_months || 120;
    const apport = Number(project.apport);
    const monthly = Number(project.monthly_allocation);
    const target = Number(project.target_amount);

    const points: { month: number; label: string; value: number; target: number }[] = [];
    
    // Generate data points every 6 months
    for (let m = 0; m <= months; m += 6) {
      let value: number;
      if (monthlyRate > 0) {
        value = apport * Math.pow(1 + monthlyRate, m) +
          monthly * ((Math.pow(1 + monthlyRate, m) - 1) / monthlyRate);
      } else {
        value = apport + monthly * m;
      }

      const years = Math.floor(m / 12);
      const remMonths = m % 12;
      const label = years > 0 
        ? (remMonths > 0 ? `${years}a ${remMonths}m` : `${years} an${years > 1 ? 's' : ''}`)
        : `${m}m`;

      points.push({ month: m, label, value: Math.round(value), target });
    }

    // Ensure we include the final month
    if (months % 6 !== 0) {
      let value: number;
      if (monthlyRate > 0) {
        value = apport * Math.pow(1 + monthlyRate, months) +
          monthly * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
      } else {
        value = apport + monthly * months;
      }
      const years = Math.floor(months / 12);
      const remMonths = months % 12;
      const label = years > 0 
        ? (remMonths > 0 ? `${years}a ${remMonths}m` : `${years} ans`)
        : `${months}m`;
      points.push({ month: months, label, value: Math.round(value), target });
    }

    return points;
  }, [project]);

  const maxValue = Math.max(...data.map(d => Math.max(d.value, d.target)));

  return (
    <div className="space-y-2">
      <h5 className="text-sm font-medium text-foreground">Projection de capital</h5>
      <div className="h-48 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="label" 
              tick={{ fontSize: 10 }} 
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10 }}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              domain={[0, maxValue * 1.1]}
            />
            <Tooltip
              formatter={(value: number) => [fmt(value), ""]}
              labelFormatter={(label) => `À ${label}`}
              contentStyle={{ fontSize: 12 }}
            />
            <ReferenceLine
              y={Number(project.target_amount)}
              stroke="hsl(var(--destructive))"
              strokeDasharray="5 5"
              label={{ value: "Cible", position: "right", fontSize: 10, fill: "hsl(var(--destructive))" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              name="Capital projeté"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-muted-foreground text-center">
        Rendement estimé : {project.annual_return_rate}% / an · Durée : {Math.round((project.duration_months || 120) / 12)} ans
      </p>
    </div>
  );
}
