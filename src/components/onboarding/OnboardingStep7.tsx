import { OnboardingData, DISPOSITIFS_OPTIONS, CANAUX_OPTIONS } from '@/types/onboarding';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Users, TrendingUp, MessageSquare, Briefcase, Globe } from 'lucide-react';

interface OnboardingStep7Props {
  formData: OnboardingData;
}

export const OnboardingStep7 = ({ formData }: OnboardingStep7Props) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Synthèse & Validation
        </h2>
        <p className="text-muted-foreground">
          Vérifiez les informations avant de terminer
        </p>
      </div>

      <div className="space-y-4">
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <Building2 className="h-5 w-5 text-primary mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">Entreprise</h3>
              <p className="text-foreground">{formData.nomEntreprise}</p>
              <p className="text-sm text-muted-foreground">{formData.domaineEmail}</p>
              <p className="text-sm text-muted-foreground">{formData.effectif} salariés</p>
              {formData.partnershipType && (
                <Badge variant="outline" className="mt-2">
                  {formData.partnershipType}
                </Badge>
              )}
              {formData.workMode && (
                <Badge variant="outline" className="mt-2 ml-2">
                  {formData.workMode}
                </Badge>
              )}
            </div>
          </div>
        </Card>

        {(formData.employeeLocations && formData.employeeLocations.length > 0) && (
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <Globe className="h-5 w-5 text-primary mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Localisation</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.employeeLocations.map(location => (
                    <Badge key={location} variant="secondary">
                      {location}
                    </Badge>
                  ))}
                </div>
                {formData.hasForeignEmployees && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Inclut des salariés à l'étranger
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        <Card className="p-6">
          <div className="flex items-start gap-3">
            <Users className="h-5 w-5 text-primary mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">
                Contacts référents ({formData.contacts.length})
              </h3>
              <div className="space-y-2">
                {formData.contacts.map((contact, index) => (
                  <div key={index} className="text-sm">
                    <p className="text-foreground font-medium">{contact.nom}</p>
                    <p className="text-muted-foreground">{contact.email} - {contact.role_contact}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 text-primary mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">Dispositifs</h3>
              <div className="flex flex-wrap gap-2">
                {formData.dispositifsRemuneration.map(dispositif => {
                  const option = DISPOSITIFS_OPTIONS.find(o => o.value === dispositif);
                  return (
                    <Badge key={dispositif} variant="secondary">
                      {option?.label || dispositif}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-primary mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">Maturité financière</h3>
              <Badge variant="outline">
                {formData.niveauMaturiteFinanciere === 'faible' && 'Faible'}
                {formData.niveauMaturiteFinanciere === 'moyen' && 'Moyen'}
                {formData.niveauMaturiteFinanciere === 'eleve' && 'Élevé'}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start gap-3">
            <MessageSquare className="h-5 w-5 text-primary mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">Canaux de communication</h3>
              <div className="flex flex-wrap gap-2">
                {formData.canauxCommunication.map(canal => {
                  const option = CANAUX_OPTIONS.find(o => o.value === canal);
                  return (
                    <Badge key={canal} variant="secondary">
                      {option?.label || canal}
                    </Badge>
                  );
                })}
              </div>
              {formData.canalCommunicationAutre && (
                <p className="text-sm text-muted-foreground mt-2">
                  Autre: {formData.canalCommunicationAutre}
                </p>
              )}
            </div>
          </div>
        </Card>

        {(formData.hrChallenges || formData.internalInitiatives) && (
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <Briefcase className="h-5 w-5 text-primary mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">RH & Initiatives</h3>
                {formData.hrChallenges && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-foreground">Défis identifiés:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.hrChallenges.financial_anxiety && <Badge variant="outline">Anxiété financière</Badge>}
                      {formData.hrChallenges.understanding_gaps && <Badge variant="outline">Lacunes de compréhension</Badge>}
                      {formData.hrChallenges.tax_optimization_interest && <Badge variant="outline">Optimisation fiscale</Badge>}
                      {formData.hrChallenges.recurring_declaration_errors && <Badge variant="outline">Erreurs déclarations</Badge>}
                    </div>
                  </div>
                )}
                {formData.internalInitiatives && (
                  <div>
                    <p className="text-sm font-medium text-foreground">Initiatives en place:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {formData.internalInitiatives.financial_education_service && <Badge variant="secondary">Formation financière</Badge>}
                      {formData.internalInitiatives.internal_webinars && <Badge variant="secondary">Webinaires</Badge>}
                      {formData.internalInitiatives.pee_perco_rsu_program && <Badge variant="secondary">Programme PEE/PERCO/RSU</Badge>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
