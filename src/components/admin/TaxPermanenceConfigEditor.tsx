import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Calendar, Link, Video, Building2, MapPin } from "lucide-react";
import type { TaxPermanenceConfig, TaxPermanenceOption } from "@/types/tax-declaration";

interface TaxPermanenceConfigEditorProps {
  config: TaxPermanenceConfig | null;
  onChange: (config: TaxPermanenceConfig) => void;
}

const DEFAULT_OPTIONS: TaxPermanenceOption[] = [
  { id: "visio", label: "En visio", enabled: true, booking_url: null, dates: undefined },
  { id: "bureaux_perlib", label: "Dans les bureaux de Perlib", enabled: true, booking_url: null, dates: undefined },
  { id: "bureaux_entreprise", label: "Dans les locaux de l'entreprise", enabled: false, booking_url: null, dates: [] },
];

export const TaxPermanenceConfigEditor = ({ config, onChange }: TaxPermanenceConfigEditorProps) => {
  const [newDate, setNewDate] = useState("");
  
  // Initialize with default options if no config
  const options: TaxPermanenceOption[] = config?.options || DEFAULT_OPTIONS;
  const postSubmissionMessage = config?.post_submission_message || "";

  const updateOption = (optionId: string, updates: Partial<TaxPermanenceOption>) => {
    const newOptions = options.map(opt => 
      opt.id === optionId ? { ...opt, ...updates } : opt
    );
    onChange({
      options: newOptions,
      post_submission_message: postSubmissionMessage
    });
  };

  const updatePostSubmissionMessage = (message: string) => {
    onChange({
      options,
      post_submission_message: message || null
    });
  };

  const addDate = (optionId: string) => {
    if (!newDate) return;
    const option = options.find(opt => opt.id === optionId);
    if (!option) return;
    
    const currentDates = option.dates || [];
    if (!currentDates.includes(newDate)) {
      updateOption(optionId, { dates: [...currentDates, newDate] });
    }
    setNewDate("");
  };

  const removeDate = (optionId: string, dateToRemove: string) => {
    const option = options.find(opt => opt.id === optionId);
    if (!option) return;
    
    updateOption(optionId, { 
      dates: (option.dates || []).filter(d => d !== dateToRemove) 
    });
  };

  const getOptionIcon = (optionId: string) => {
    switch (optionId) {
      case "visio":
        return <Video className="h-4 w-4" />;
      case "bureaux_perlib":
        return <Building2 className="h-4 w-4" />;
      case "bureaux_entreprise":
        return <MapPin className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base font-medium">Types de permanences</Label>
        <p className="text-sm text-muted-foreground">
          Configurez les options de rendez-vous disponibles pour les collaborateurs.
        </p>
        
        {options.map((option) => (
          <Card key={option.id} className={option.enabled ? "border-primary/30" : "opacity-60"}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getOptionIcon(option.id)}
                  <CardTitle className="text-sm font-medium">{option.label}</CardTitle>
                  {option.enabled && (
                    <Badge variant="outline" className="text-xs">Actif</Badge>
                  )}
                </div>
                <Switch
                  checked={option.enabled}
                  onCheckedChange={(checked) => updateOption(option.id, { enabled: checked })}
                />
              </div>
            </CardHeader>
            
            {option.enabled && (
              <CardContent className="space-y-4 pt-0">
                {/* Booking URL */}
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <Link className="h-3 w-3" />
                    Lien de prise de rendez-vous
                  </Label>
                  <Input
                    value={option.booking_url || ""}
                    onChange={(e) => updateOption(option.id, { booking_url: e.target.value || null })}
                    placeholder="https://calendly.com/... ou https://meetings.hubspot.com/..."
                    className="text-sm"
                  />
                </div>
                
                {/* Dates for company offices */}
                {option.id === "bureaux_entreprise" && (
                  <div className="space-y-2">
                    <Label className="text-xs flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Dates de permanence disponibles
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="text-sm"
                      />
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={() => addDate(option.id)}
                        disabled={!newDate}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {option.dates && option.dates.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {option.dates.map((date) => (
                          <Badge 
                            key={date} 
                            variant="secondary" 
                            className="flex items-center gap-1"
                          >
                            {new Date(date).toLocaleDateString('fr-FR', { 
                              weekday: 'short',
                              day: 'numeric', 
                              month: 'short' 
                            })}
                            <button
                              type="button"
                              onClick={() => removeDate(option.id, date)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {(!option.dates || option.dates.length === 0) && (
                      <p className="text-xs text-muted-foreground italic">
                        Aucune date configurée
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
      
      {/* Post-submission message */}
      <div className="space-y-2 pt-4 border-t">
        <Label className="text-sm font-medium">Message post-soumission (optionnel)</Label>
        <p className="text-xs text-muted-foreground">
          Message personnalisé affiché après la soumission du formulaire
        </p>
        <Textarea
          value={postSubmissionMessage}
          onChange={(e) => updatePostSubmissionMessage(e.target.value)}
          placeholder="Ex: Notre équipe vous contactera dans les 48h pour confirmer votre rendez-vous..."
          rows={3}
          className="text-sm"
        />
      </div>
    </div>
  );
};
