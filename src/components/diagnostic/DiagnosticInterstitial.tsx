import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, ArrowRight } from "lucide-react";

interface Props {
  message: string;
  nextSectionTitle: string;
  onContinue: () => void;
}

export function DiagnosticInterstitial({ message, nextSectionTitle, onContinue }: Props) {
  return (
    <Card className="text-center">
      <CardContent className="pt-10 pb-10 px-6 space-y-6">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
          <Sparkles className="h-7 w-7 text-success" />
        </div>
        <p className="text-lg font-medium text-foreground">{message}</p>
        <p className="text-sm text-muted-foreground">
          Prochaine section : <span className="font-semibold text-foreground">{nextSectionTitle}</span>
        </p>
        <Button onClick={onContinue} className="gap-2">
          Continuer
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
