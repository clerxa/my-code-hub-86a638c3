import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Award } from "lucide-react";

interface Certification {
  id: string;
  name: string;
  logo_url: string | null;
}

interface Advisor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  bio: string | null;
  photo_url: string | null;
  certifications: Certification[];
}

interface DedicatedAdvisorsProps {
  companyRank: number | null;
}

export function DedicatedAdvisors({ companyRank }: DedicatedAdvisorsProps) {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyRank !== null) {
      fetchAdvisors();
    }
  }, [companyRank]);

  const fetchAdvisors = async () => {
    if (companyRank === null) return;

    setLoading(true);

    // Get advisor IDs for this rank
    const { data: rankData, error: rankError } = await supabase
      .from("advisor_ranks")
      .select("advisor_id")
      .eq("rank", companyRank);

    if (rankError || !rankData?.length) {
      setLoading(false);
      setAdvisors([]);
      return;
    }

    const advisorIds = rankData.map((r) => r.advisor_id);

    // Get advisors
    const { data: advisorsData, error: advisorsError } = await supabase
      .from("advisors")
      .select("*")
      .in("id", advisorIds)
      .eq("is_active", true);

    if (advisorsError) {
      setLoading(false);
      return;
    }

    // Get certifications for each advisor
    const advisorsWithCerts = await Promise.all(
      (advisorsData || []).map(async (advisor) => {
        const { data: certLinks } = await supabase
          .from("advisor_certifications")
          .select("certification_id")
          .eq("advisor_id", advisor.id);

        if (!certLinks?.length) {
          return { ...advisor, certifications: [] };
        }

        const certIds = certLinks.map((c) => c.certification_id);
        const { data: certs } = await supabase
          .from("certifications")
          .select("*")
          .in("id", certIds);

        return { ...advisor, certifications: certs || [] };
      })
    );

    setAdvisors(advisorsWithCerts);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (advisors.length === 0) {
    return (
      <div className="text-center py-12">
        <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Aucun conseiller dédié</h3>
        <p className="text-muted-foreground mt-2">
          Aucun conseiller n'est actuellement affecté à votre entreprise.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Vos conseillers dédiés</h2>
        <p className="text-muted-foreground mt-1">
          Notre équipe d'experts est à votre disposition pour vous accompagner.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {advisors.map((advisor) => (
          <Card key={advisor.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarImage src={advisor.photo_url || undefined} />
                  <AvatarFallback className="text-xl">
                    {advisor.first_name[0]}{advisor.last_name[0]}
                  </AvatarFallback>
                </Avatar>
                
                <h3 className="text-lg font-semibold">
                  {advisor.first_name} {advisor.last_name}
                </h3>
                
                <a 
                  href={`mailto:${advisor.email}`}
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
                >
                  <Mail className="h-3 w-3" />
                  {advisor.email}
                </a>

                {advisor.bio && (
                  <p className="text-sm text-muted-foreground mt-4 line-clamp-3">
                    {advisor.bio}
                  </p>
                )}

                {advisor.certifications.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {advisor.certifications.map((cert) => (
                      <Badge key={cert.id} variant="secondary" className="gap-1">
                        {cert.logo_url && (
                          <img 
                            src={cert.logo_url} 
                            alt="" 
                            className="h-3 w-3 object-contain" 
                          />
                        )}
                        {cert.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
