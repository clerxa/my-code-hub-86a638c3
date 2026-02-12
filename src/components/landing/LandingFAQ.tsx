import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  question: string;
  answer: string;
}

interface LandingFAQProps {
  items: FAQItem[];
}

export const LandingFAQ = ({ items }: LandingFAQProps) => {
  return (
    <section className="py-24 px-4 bg-card/30">
      <div className="container max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold">
            Questions fréquentes
          </h2>
        </div>
        
        <Accordion type="single" collapsible className="space-y-4">
          {items.map((item, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="bg-card border-2 rounded-lg px-6"
            >
              <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};