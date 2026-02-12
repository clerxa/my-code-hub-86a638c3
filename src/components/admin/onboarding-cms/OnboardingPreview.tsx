import { useState } from "react";
import { OnboardingScreen } from "@/types/onboarding-cms";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Smartphone, Monitor, Tablet, RotateCcw } from "lucide-react";

interface OnboardingPreviewProps {
  screens: OnboardingScreen[];
}

type DeviceType = "mobile" | "tablet" | "desktop";

const DEVICE_CONFIG: Record<DeviceType, { width: number; height: number; label: string; icon: typeof Smartphone }> = {
  mobile: { width: 375, height: 667, label: "Mobile", icon: Smartphone },
  tablet: { width: 768, height: 1024, label: "Tablette", icon: Tablet },
  desktop: { width: 1280, height: 800, label: "Desktop", icon: Monitor },
};

export function OnboardingPreview({ screens }: OnboardingPreviewProps) {
  const [device, setDevice] = useState<DeviceType>("mobile");
  const [iframeKey, setIframeKey] = useState(0);

  const config = DEVICE_CONFIG[device];
  const activeScreens = screens.filter((s) => s.is_active);

  const handleRestart = () => setIframeKey((k) => k + 1);

  // Scale to fit in the container
  const getScale = () => {
    if (device === "mobile") return 1;
    if (device === "tablet") return 0.7;
    return 0.55;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Device Selector */}
      <div className="flex items-center justify-between pb-4 border-b mb-4">
        <div className="flex items-center gap-2">
          {(Object.keys(DEVICE_CONFIG) as DeviceType[]).map((key) => {
            const { icon: Icon, label } = DEVICE_CONFIG[key];
            const isActive = device === key;
            return (
              <Button
                key={key}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => setDevice(key)}
                className={cn("gap-2 transition-all", isActive && "shadow-md")}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Button>
            );
          })}
        </div>

        <Button variant="outline" size="sm" onClick={handleRestart} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">Recommencer</span>
        </Button>
      </div>

      {/* Iframe Preview */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/60 rounded-xl p-4 overflow-hidden">
        <div
          className="relative bg-background rounded-xl shadow-2xl border overflow-hidden transition-all duration-300"
          style={{
            width: config.width,
            height: config.height,
            transform: `scale(${getScale()})`,
            transformOrigin: "center center",
          }}
        >
          <iframe
            key={iframeKey}
            src="/onboarding?preview=true"
            title="Onboarding Preview"
            className="w-full h-full border-0"
            style={{ pointerEvents: "auto" }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {activeScreens.length} écran{activeScreens.length > 1 ? "s" : ""} actif
            {activeScreens.length > 1 ? "s" : ""}
          </span>
          <span>
            {config.width} × {config.height}px
          </span>
        </div>
      </div>
    </div>
  );
}
