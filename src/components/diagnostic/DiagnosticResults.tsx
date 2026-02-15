import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RotateCcw, Clock, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DiagnosticConfig } from "@/data/diagnostic-config";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/AuthProvider";
import { useExpertBookingUrl } from "@/hooks/useExpertBookingUrl";
import { supabase } from "@/integrations/supabase/client";

interface SectionScore {
  id: string;
  title: string;
  score: number;
  earned: number;
  maxPoints: number;
}

interface Props {
  config: DiagnosticConfig;
  sectionScores: SectionScore[];
  scorePercent: number;
  totalScore: number;
  totalMax: number;
  elapsed: number;
  onRestart: () => void;
}

const LEVEL_STYLES = {
  critical: "text-destructive",
  warning: "text-accent",
  good: "text-success",
  excellent: "text-primary",
} as const;

export function DiagnosticResults({ config, sectionScores, scorePercent, totalScore, totalMax, elapsed, onRestart }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch company_id from profile
  const [companyId, setCompanyId] = useState<string | null>(null);
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setCompanyId(data?.company_id || null));
  }, [user]);

  // Get expert booking URL respecting rank logic
  const { bookingUrl } = useExpertBookingUrl(companyId);

  const result = useMemo(() => {
    return config.results.find((r) => scorePercent >= r.min && scorePercent <= r.max) || config.results[0];
  }, [config.results, scorePercent]);

  const radarData = sectionScores.map((s) => ({
    subject: s.title,
    score: s.score,
    fullMark: 100,
  }));

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m} min ${sec}s`;
  };

  return (
    <div className="space-y-6">
      {/* Main result */}
      <Card>
        <CardContent className="pt-8 pb-8 px-6 text-center space-y-4">
          <div className="text-5xl">{result.emoji}</div>
          <div className="space-y-1">
            <h2 className={cn("text-2xl font-bold", LEVEL_STYLES[result.level])}>
              {result.title}
            </h2>
            <p className="text-3xl font-bold text-foreground">
              {scorePercent}
              <span className="text-lg text-muted-foreground font-normal">/100</span>
            </p>
          </div>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">{result.description}</p>
          {result.ctaText && result.ctaUrl && (
            <Button
              className="mt-2 gap-2"
              onClick={() => {
                const isBookingRoute = result.ctaUrl === "/employee/rdv" || result.ctaUrl === "/expert-booking";
                const targetUrl = isBookingRoute && bookingUrl ? bookingUrl : result.ctaUrl!;
                
                if (targetUrl.startsWith("http")) {
                  window.open(targetUrl, "_blank");
                } else {
                  navigate(targetUrl);
                }
              }}
            >
              {result.ctaText}
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Complété en {formatTime(elapsed)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Radar chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Votre profil par axe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Section breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Détail par section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sectionScores.map((sec) => (
            <div key={sec.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{sec.title}</span>
                <span className="text-muted-foreground">
                  {sec.earned}/{sec.maxPoints} pts ({sec.score}%)
                </span>
              </div>
              <Progress value={sec.score} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Restart */}
      <div className="text-center pb-8">
        <Button variant="outline" onClick={onRestart} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Refaire le diagnostic
        </Button>
      </div>
    </div>
  );
}
