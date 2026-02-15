import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Stethoscope, Clock, ArrowRight } from "lucide-react";

interface Props {
  config: { title: string; subtitle: string };
  onStart: () => void;
}

export function DiagnosticIntro({ config, onStart }: Props) {
  return (
    <Card className="text-center">
      <CardContent className="pt-10 pb-10 px-6 space-y-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Stethoscope className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
          <p className="text-muted-foreground">{config.subtitle}</p>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>~5 minutes • 25 questions</span>
        </div>
        <Button size="lg" onClick={onStart} className="gap-2">
          Commencer le diagnostic
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
