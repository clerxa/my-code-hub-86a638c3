import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, TrendingUp, AlertCircle, Target, Save } from "lucide-react";

interface ProfileTexts {
  description: string;
  characteristics: string[];
  recommendations: string[];
  warning: string;
}

export const RiskProfileResultsEditor = () => {
  const [texts, setTexts] = useState<Record<string, ProfileTexts>>({
    'Prudent': {
      description: "Vous privilégiez la sécurité et la préservation de votre capital",
      characteristics: [
        "Vous préférez minimiser les risques de perte",
        "La stabilité de vos placements est votre priorité",
        "Vous acceptez des rendements modérés pour plus de sécurité",
        "Les variations de marché vous rendent inconfortable"
      ],
      recommendations: [
        "Privilégiez les fonds euros, livrets réglementés",
        "Optez pour des obligations de qualité (investment grade)",
        "Limitez l'exposition aux actions (max 20-30%)",
        "Diversifiez sur différents supports sécurisés"
      ],
      warning: "Attention : Un profil trop prudent peut exposer à l'inflation et limiter le potentiel de croissance à long terme."
    },
    'Équilibré': {
      description: "Vous recherchez un équilibre entre sécurité et performance",
      characteristics: [
        "Vous acceptez une volatilité modérée",
        "Vous visez une croissance régulière de votre patrimoine",
        "Vous pouvez supporter des fluctuations temporaires",
        "Vous recherchez un compromis risque/rendement"
      ],
      recommendations: [
        "Mixez placements sécurisés (50-60%) et dynamiques (40-50%)",
        "Diversifiez entre actions, obligations et immobilier",
        "Investissez sur un horizon moyen terme (5-8 ans)",
        "Utilisez l'allocation d'actifs pour lisser la volatilité"
      ],
      warning: "Important : Maintenez une discipline d'investissement même en période de turbulence."
    },
    'Dynamique': {
      description: "Vous visez la performance et acceptez les fluctuations du marché",
      characteristics: [
        "Vous recherchez activement la croissance de votre capital",
        "Vous tolérez des variations importantes à court terme",
        "Vous investissez sur un horizon long terme (8+ ans)",
        "Vous comprenez et acceptez le risque de marché"
      ],
      recommendations: [
        "Favorisez les actions et fonds actions (60-80%)",
        "Diversifiez géographiquement et sectoriellement",
        "Profitez des baisses de marché pour renforcer",
        "Conservez une poche de sécurité (20-40%)"
      ],
      warning: "Attention : Assurez-vous d'avoir une épargne de précaution avant d'investir massivement."
    },
    'Audacieux': {
      description: "Vous recherchez la performance maximale et acceptez une forte volatilité",
      characteristics: [
        "Vous visez les opportunités de forte croissance",
        "Les fluctuations importantes ne vous déstabilisent pas",
        "Vous avez une excellente connaissance des marchés",
        "Votre horizon d'investissement est très long terme"
      ],
      recommendations: [
        "Investissez majoritairement en actions (80%+)",
        "Considérez les marchés émergents et secteurs innovants",
        "Utilisez potentiellement des produits structurés",
        "Maintenez une allocation diversifiée malgré l'audace"
      ],
      warning: "Critique : Ce profil n'est adapté qu'aux investisseurs expérimentés avec une capacité financière solide et un horizon très long terme."
    }
  });

  const [saving, setSaving] = useState(false);
  const [activeProfile, setActiveProfile] = useState('Prudent');

  useEffect(() => {
    loadTexts();
  }, []);

  const loadTexts = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'risk_profile_texts')
        .maybeSingle();

      if (data?.value) {
        setTexts(JSON.parse(data.value));
      }
    } catch (error) {
      console.error('Error loading texts:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'risk_profile_texts',
          value: JSON.stringify(texts),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success("Textes enregistrés avec succès");
    } catch (error) {
      console.error('Error saving texts:', error);
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const updateText = (profile: string, field: keyof ProfileTexts, value: any) => {
    setTexts(prev => ({
      ...prev,
      [profile]: {
        ...prev[profile],
        [field]: value
      }
    }));
  };

  const addCharacteristic = (profile: string) => {
    setTexts(prev => ({
      ...prev,
      [profile]: {
        ...prev[profile],
        characteristics: [...prev[profile].characteristics, ""]
      }
    }));
  };

  const updateCharacteristic = (profile: string, index: number, value: string) => {
    setTexts(prev => ({
      ...prev,
      [profile]: {
        ...prev[profile],
        characteristics: prev[profile].characteristics.map((c, i) => i === index ? value : c)
      }
    }));
  };

  const removeCharacteristic = (profile: string, index: number) => {
    setTexts(prev => ({
      ...prev,
      [profile]: {
        ...prev[profile],
        characteristics: prev[profile].characteristics.filter((_, i) => i !== index)
      }
    }));
  };

  const addRecommendation = (profile: string) => {
    setTexts(prev => ({
      ...prev,
      [profile]: {
        ...prev[profile],
        recommendations: [...prev[profile].recommendations, ""]
      }
    }));
  };

  const updateRecommendation = (profile: string, index: number, value: string) => {
    setTexts(prev => ({
      ...prev,
      [profile]: {
        ...prev[profile],
        recommendations: prev[profile].recommendations.map((r, i) => i === index ? value : r)
      }
    }));
  };

  const removeRecommendation = (profile: string, index: number) => {
    setTexts(prev => ({
      ...prev,
      [profile]: {
        ...prev[profile],
        recommendations: prev[profile].recommendations.filter((_, i) => i !== index)
      }
    }));
  };

  const profileIcons: Record<string, any> = {
    'Prudent': Shield,
    'Équilibré': Target,
    'Dynamique': TrendingUp,
    'Audacieux': AlertCircle
  };

  const profileColors: Record<string, string> = {
    'Prudent': 'text-blue-600',
    'Équilibré': 'text-green-600',
    'Dynamique': 'text-orange-600',
    'Audacieux': 'text-red-600'
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Textes des Résultats
            </CardTitle>
            <CardDescription>
              Personnalisez les descriptions et recommandations pour chaque profil
            </CardDescription>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeProfile} onValueChange={setActiveProfile}>
          <TabsList className="grid w-full grid-cols-4">
            {Object.keys(texts).map((profile) => {
              const Icon = profileIcons[profile];
              return (
                <TabsTrigger key={profile} value={profile} className="gap-2">
                  <Icon className={`h-4 w-4 ${profileColors[profile]}`} />
                  {profile}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(texts).map(([profile, data]) => (
            <TabsContent key={profile} value={profile} className="space-y-6 mt-6">
              {/* Description */}
              <div className="space-y-2">
                <Label>Description principale</Label>
                <Textarea
                  value={data.description}
                  onChange={(e) => updateText(profile, 'description', e.target.value)}
                  placeholder="Description du profil..."
                  rows={3}
                />
              </div>

              {/* Characteristics */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Caractéristiques</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addCharacteristic(profile)}
                  >
                    Ajouter
                  </Button>
                </div>
                {data.characteristics.map((char, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={char}
                      onChange={(e) => updateCharacteristic(profile, index, e.target.value)}
                      placeholder="Caractéristique..."
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeCharacteristic(profile, index)}
                    >
                      Supprimer
                    </Button>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Recommandations</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addRecommendation(profile)}
                  >
                    Ajouter
                  </Button>
                </div>
                {data.recommendations.map((rec, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={rec}
                      onChange={(e) => updateRecommendation(profile, index, e.target.value)}
                      placeholder="Recommandation..."
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeRecommendation(profile, index)}
                    >
                      Supprimer
                    </Button>
                  </div>
                ))}
              </div>

              {/* Warning */}
              <div className="space-y-2">
                <Label>Avertissement</Label>
                <Textarea
                  value={data.warning}
                  onChange={(e) => updateText(profile, 'warning', e.target.value)}
                  placeholder="Message d'avertissement..."
                  rows={2}
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};