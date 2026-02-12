/**
 * ===========================================================
 * 📄 File: ContributionLevelBadge.tsx
 * 📌 Rôle : Badge affichant le niveau de contribution ou Modérateur
 * ===========================================================
 */

import { Badge } from "@/components/ui/badge";
import { Shield, Compass, Zap, Award, Star, Crown } from "lucide-react";

interface ContributionLevel {
  name: string;
  min_score: number;
  icon: string;
  color: string;
}

interface ContributionLevelBadgeProps {
  contributionScore: number;
  userRole?: string | null;
  levels: ContributionLevel[];
  compact?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Compass,
  Zap,
  Award,
  Star,
  Crown,
  Shield,
};

export function ContributionLevelBadge({ 
  contributionScore, 
  userRole, 
  levels,
  compact = false 
}: ContributionLevelBadgeProps) {
  // Admin and contact_entreprise always show "Modérateur"
  if (userRole === "admin" || userRole === "contact_entreprise") {
    const IconComponent = Shield;
    return (
      <Badge 
        variant="outline" 
        className={`gap-1 border-purple-500/50 bg-purple-500/10 text-purple-600 dark:text-purple-400 ${compact ? "text-[10px] px-1.5 py-0" : "text-xs"}`}
      >
        <IconComponent className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
        {!compact && "Modérateur"}
        {compact && "Mod"}
      </Badge>
    );
  }

  // Find the appropriate level based on contribution score
  if (!levels || levels.length === 0) return null;

  // Sort levels by min_score descending to find the highest matching level
  const sortedLevels = [...levels].sort((a, b) => b.min_score - a.min_score);
  const currentLevel = sortedLevels.find(level => contributionScore >= level.min_score) || levels[0];

  if (!currentLevel) return null;

  const IconComponent = iconMap[currentLevel.icon] || Compass;

  // Extract short name for compact mode (e.g., "Contributeur Expert" -> "Expert")
  const shortName = currentLevel.name.replace("Contributeur ", "");

  return (
    <Badge 
      variant="outline" 
      className={`gap-1 ${compact ? "text-[10px] px-1.5 py-0" : "text-xs"}`}
      style={{
        borderColor: `${currentLevel.color}50`,
        backgroundColor: `${currentLevel.color}10`,
        color: currentLevel.color,
      }}
    >
      <IconComponent className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {compact ? shortName : currentLevel.name}
    </Badge>
  );
}
