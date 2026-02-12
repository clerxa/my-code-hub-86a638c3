import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Quote } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

interface Company {
  name: string;
  logo?: string;
}

interface Testimonial {
  name: string;
  role: string;
  content: string;
  avatar?: string;
}

interface Stat {
  value: string;
  label: string;
}

interface LandingSocialProofProps {
  title: string;
  companies: (string | Company)[];
  testimonials: Testimonial[];
  stats: Stat[];
}

export const LandingSocialProof = ({ 
  title, 
  companies, 
  testimonials, 
  stats 
}: LandingSocialProofProps) => {
  const { ref, isVisible } = useScrollAnimation();
  
  return (
    <section ref={ref as any} className="py-24 px-4 bg-card/30">
      <div className="container max-w-7xl">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-8">{title}</h2>
          
          {/* Company logos - Marquee */}
          <div className="relative overflow-hidden mb-16">
            <div className="flex animate-marquee gap-8 items-center opacity-60">
              {/* Double the logos for seamless loop */}
              {[...companies, ...companies].map((company, index) => {
                const companyData = typeof company === 'string' 
                  ? { name: company, logo: undefined }
                  : company;
                
                return (
                  <div key={index} className="flex-shrink-0 flex items-center justify-center">
                    {companyData.logo ? (
                      <div className="w-40 h-40 md:w-60 md:h-60 rounded-xl overflow-hidden bg-white dark:bg-white/95 flex items-center justify-center shadow-md">
                        <img 
                          src={companyData.logo} 
                          alt={companyData.name}
                          className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all"
                        />
                      </div>
                    ) : (
                      <div className="w-40 h-40 md:w-60 md:h-60 rounded-xl bg-white dark:bg-white/95 flex items-center justify-center text-xl md:text-2xl font-bold text-gray-800 shadow-md">
                        {companyData.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Testimonials */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className={`relative overflow-hidden transition-all duration-700 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
              }`}
              style={{ transitionDelay: `${index * 200}ms` }}
            >
              <CardContent className="p-8 space-y-6">
                <Quote className="h-10 w-10 text-primary/20" />
                
                <p className="text-lg leading-relaxed italic">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    {testimonial.avatar && <AvatarImage src={testimonial.avatar} />}
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {testimonial.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center space-y-2">
              <p className="text-5xl font-bold hero-gradient">{stat.value}</p>
              <p className="text-lg text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};