import { Card, CardContent } from "@/components/ui/card";
import { X, Check } from "lucide-react";

interface ComparisonRow {
  without: string;
  with: string;
  highlight?: boolean;
}

interface LandingComparisonProps {
  title: string;
  enabled: boolean;
  rows: ComparisonRow[];
}

export const LandingComparison = ({ title, enabled, rows }: LandingComparisonProps) => {
  if (!enabled) return null;
  
  return (
    <section className="py-24 px-4">
      <div className="container max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold">
            <span className="hero-gradient">{title}</span>
          </h2>
        </div>
        
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="grid grid-cols-2">
              {/* Header */}
              <div className="bg-destructive/10 p-6 border-r border-border">
                <h3 className="text-xl font-bold text-center">Sans FinCare</h3>
              </div>
              <div className="bg-success/10 p-6">
                <h3 className="text-xl font-bold text-center">Avec FinCare</h3>
              </div>
              
              {/* Rows */}
              {rows.map((row, index) => (
                <>
                  <div 
                    key={`without-${index}`}
                    className={`p-6 border-r border-t border-border flex items-center gap-4 ${
                      row.highlight ? 'bg-destructive/5' : ''
                    }`}
                  >
                    <X className="h-5 w-5 text-destructive flex-shrink-0" />
                    <p className="text-sm">{row.without}</p>
                  </div>
                  <div 
                    key={`with-${index}`}
                    className={`p-6 border-t border-border flex items-center gap-4 ${
                      row.highlight ? 'bg-success/5' : ''
                    }`}
                  >
                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                    <p className="text-sm font-medium">{row.with}</p>
                  </div>
                </>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};