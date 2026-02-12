/**
 * ===========================================================
 * 📄 File: useContributionLevels.ts
 * 📌 Rôle : Hook pour récupérer la config des niveaux de contribution
 * ===========================================================
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ContributionLevel {
  name: string;
  min_score: number;
  icon: string;
  color: string;
}

interface ContributionConfig {
  levels: ContributionLevel[];
  points_per_post: number;
  points_per_comment: number;
  points_per_like_received: number;
}

const defaultLevels: ContributionLevel[] = [
  { name: "Contributeur Explorateur", min_score: 0, icon: "Compass", color: "#6B7280" },
  { name: "Contributeur Actif", min_score: 10, icon: "Zap", color: "#3B82F6" },
  { name: "Contributeur Référent", min_score: 50, icon: "Award", color: "#8B5CF6" },
  { name: "Contributeur Expert", min_score: 150, icon: "Star", color: "#F59E0B" },
  { name: "Contributeur Leader", min_score: 300, icon: "Crown", color: "#EF4444" },
];

export function useContributionLevels() {
  const [levels, setLevels] = useState<ContributionLevel[]>(defaultLevels);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLevels = async () => {
      try {
        const { data, error } = await supabase
          .from("forum_settings")
          .select("value")
          .eq("key", "contribution_levels")
          .maybeSingle();

        if (!error && data?.value) {
          const config = data.value as unknown as ContributionConfig;
          if (config.levels && Array.isArray(config.levels)) {
            setLevels(config.levels);
          }
        }
      } catch (error) {
        console.error("Error fetching contribution levels:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLevels();
  }, []);

  return { levels, loading };
}
