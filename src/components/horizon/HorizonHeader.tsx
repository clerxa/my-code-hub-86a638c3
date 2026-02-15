import { Compass } from "lucide-react";

export function HorizonHeader() {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/10">
          <Compass className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Horizon</h1>
          <p className="text-sm text-muted-foreground">
            Votre simulateur de pilotage patrimonial — planifiez et suivez vos projets financiers
          </p>
        </div>
      </div>
    </div>
  );
}
