import { useIntentionScore } from "@/hooks/useIntentionScore";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Flame, Thermometer, Snowflake } from "lucide-react";

const LEVEL_CONFIG = {
  brûlant: { color: "bg-red-500 text-white", icon: Flame, label: "🔥 Brûlant" },
  chaud: { color: "bg-orange-500 text-white", icon: Flame, label: "🟠 Chaud" },
  tiède: { color: "bg-yellow-500 text-black", icon: Thermometer, label: "🟡 Tiède" },
  froid: { color: "bg-blue-200 text-blue-800", icon: Snowflake, label: "🔵 Froid" },
} as const;

interface IntentionScoreBadgeProps {
  userId: string;
  compact?: boolean;
}

export function IntentionScoreBadge({ userId, compact = false }: IntentionScoreBadgeProps) {
  const { total_score, percentage, level, loading, signals } = useIntentionScore(userId);

  if (loading) {
    return <span className="text-xs text-muted-foreground">…</span>;
  }

  const config = LEVEL_CONFIG[level];

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`${config.color} text-xs cursor-default`}>
              {percentage}%
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold">{config.label} — {total_score} pts ({percentage}%)</p>
              {signals.filter(s => s.earned_points > 0).map(s => (
                <p key={s.signal_key} className="text-xs">
                  {s.signal_label}: {s.raw_count} × {s.points_per_unit} = {s.earned_points} pts
                </p>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${config.color}`}>
        {config.label}
      </Badge>
      <span className="text-sm text-muted-foreground">{total_score} pts ({percentage}%)</span>
    </div>
  );
}
