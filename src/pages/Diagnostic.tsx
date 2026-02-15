import { useState, useEffect } from "react";
import { DiagnosticRenderer } from "@/components/diagnostic/DiagnosticRenderer";
import { diagnosticConfig as defaultConfig, type DiagnosticConfig } from "@/data/diagnostic-config";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw } from "lucide-react";

export default function Diagnostic() {
  const [config, setConfig] = useState<DiagnosticConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase
          .from("diagnostic_configs")
          .select("config")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setConfig(data ? (data.config as unknown as DiagnosticConfig) : defaultConfig);
      } catch {
        setConfig(defaultConfig);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  if (loading || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <DiagnosticRenderer config={config} />;
}
