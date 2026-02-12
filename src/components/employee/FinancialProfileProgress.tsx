import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserFinancialProfile } from "@/hooks/useUserFinancialProfile";
import { User, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const FinancialProfileProgress = () => {
  const navigate = useNavigate();
  const { profile, isLoading, completeness, missingFields, isComplete } = useUserFinancialProfile();

  if (isLoading) {
    return (
      <Card className="border border-dashed border-muted">
        <CardContent className="py-6 text-center text-muted-foreground text-sm">
          Chargement du profil...
        </CardContent>
      </Card>
    );
  }

  // Don't show if profile is complete (use OR logic - either flag or calculated completeness)
  if (isComplete || completeness === 100) {
    return null;
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Complétez votre profil</h3>
          </div>
          <span className="text-sm font-bold text-primary">{completeness}%</span>
        </div>

        <Progress value={completeness} className="h-2" />

        {missingFields.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {missingFields.slice(0, 5).map((field, index) => (
              <Badge key={index} variant="outline" className="text-[11px] font-normal text-muted-foreground border-muted-foreground/20 py-0">
                {field}
              </Badge>
            ))}
            {missingFields.length > 5 && (
              <Badge variant="outline" className="text-[11px] font-normal text-primary border-primary/30 py-0">
                +{missingFields.length - 5}
              </Badge>
            )}
          </div>
        )}

        <Button 
          onClick={() => navigate('/employee/profile')} 
          size="sm"
          className="w-full gap-2 h-8 text-xs"
        >
          Compléter mon profil
          <ArrowRight className="h-3 w-3" />
        </Button>
      </CardContent>
    </Card>
  );
};
