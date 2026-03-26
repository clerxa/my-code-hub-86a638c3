import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  display_order: number | null;
}

interface CompanyFAQSectionProps {
  companyId: string;
  primaryColor?: string | null;
}

export const CompanyFAQSection = ({ companyId, primaryColor }: CompanyFAQSectionProps) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const color = primaryColor || 'hsl(var(--primary))';

  useEffect(() => {
    const fetchFAQs = async () => {
      // Fetch global FAQs (company_id is null) and company-specific FAQs
      const { data } = await supabase
        .from("company_faqs")
        .select("id, question, answer, category, display_order")
        .or(`company_id.is.null,company_id.eq.${companyId}`)
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      setFaqs(data || []);
      setLoading(false);
    };
    fetchFAQs();
  }, [companyId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (faqs.length === 0) {
    return (
      <Card className="overflow-hidden" style={{ borderTopColor: color, borderTopWidth: '3px' }}>
        <CardHeader style={{ backgroundColor: `color-mix(in srgb, ${color} 5%, transparent)` }}>
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}>
              <HelpCircle className="h-5 w-5" style={{ color }} />
            </div>
            Questions fréquentes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground py-8">
            Aucune question fréquente disponible pour le moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by category
  const categories = Array.from(new Set(faqs.map(f => f.category || "Général")));

  return (
    <Card className="overflow-hidden" style={{ borderTopColor: color, borderTopWidth: '3px' }}>
      <CardHeader style={{ backgroundColor: `color-mix(in srgb, ${color} 5%, transparent)` }}>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}>
            <HelpCircle className="h-5 w-5" style={{ color }} />
          </div>
          Questions fréquentes
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {categories.map(cat => {
          const catFaqs = faqs.filter(f => (f.category || "Général") === cat);
          return (
            <div key={cat}>
              {categories.length > 1 && (
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {cat}
                </h3>
              )}
              <Accordion type="single" collapsible className="space-y-2">
                {catFaqs.map(faq => (
                  <AccordionItem
                    key={faq.id}
                    value={faq.id}
                    className="border rounded-lg px-4"
                    style={{ borderColor: `color-mix(in srgb, ${color} 20%, hsl(var(--border)))` }}
                  >
                    <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div
                        className="text-sm text-muted-foreground prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: faq.answer }}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
