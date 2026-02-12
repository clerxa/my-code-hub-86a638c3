# 📚 Hooks et Composants pour Simulateurs

Ce guide explique comment utiliser les hooks et composants partagés pour créer ou modifier des simulateurs de manière cohérente et maintenable.

## 🎯 Philosophie

Les simulateurs partagent des patterns communs :
- **Gestion de formulaire** avec chargement depuis profil utilisateur
- **Calculs** via hooks métier spécialisés
- **Affichage des résultats** avec cartes et graphiques
- **Sauvegarde** des simulations avec dialog
- **CTA intelligents** via rules engine

Cette architecture permet de :
✅ Réduire la duplication de code  
✅ Standardiser l'expérience utilisateur  
✅ Faciliter la maintenance  
✅ Accélérer le développement de nouveaux simulateurs  

---

## 🔧 Hooks Disponibles

### `useSimulationForm<T>`

Gère l'état d'un formulaire avec chargement automatique depuis le profil ou une simulation existante.

#### Paramètres
```typescript
{
  simulatorName: string;           // Nom pour le logging
  defaultValues: T;                // Valeurs par défaut
  loadFromProfile?: () => Promise<Partial<T>>;  // Charger depuis profil
  loadFromSimulation?: (sim: any) => Partial<T>; // Charger depuis simulation
}
```

#### Exemple
```typescript
import { useSimulationForm } from '@/hooks/useSimulationForm';

const { values, setValue, loading } = useSimulationForm({
  simulatorName: 'PER',
  defaultValues: {
    revenuFiscal: 50000,
    age: 35,
    versementsPER: 0,
  },
  loadFromProfile: async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('net_taxable_income, birth_date')
      .single();
    
    return {
      revenuFiscal: profile?.net_taxable_income || 50000,
      age: calculateAge(profile?.birth_date),
    };
  },
  loadFromSimulation: (sim) => ({
    revenuFiscal: sim.revenu_fiscal,
    age: sim.age_actuel,
    versementsPER: sim.versements_per,
  }),
});

// Utilisation
<Input value={values.revenuFiscal} onChange={(e) => setValue('revenuFiscal', +e.target.value)} />
```

---

### `useSimulationSave`

Gère la sauvegarde d'une simulation avec dialog et invalidation du cache.

#### Paramètres
```typescript
{
  tableName: string;                  // Table Supabase
  queryCacheKey?: string | string[];  // Clés de cache à invalider
  onSuccess?: () => void;             // Callback après succès
}
```

#### Exemple
```typescript
import { useSimulationSave } from '@/hooks/useSimulationSave';

const {
  showSaveDialog,
  openSaveDialog,
  closeSaveDialog,
  simulationName,
  setSimulationName,
  saveSimulation,
  isSaving,
} = useSimulationSave({
  tableName: 'per_simulations',
  queryCacheKey: 'per-simulations',
  onSuccess: () => {
    toast({ title: 'Simulation sauvegardée !' });
  },
});

// Bouton de sauvegarde
<Button onClick={openSaveDialog}>
  <Save className="h-4 w-4 mr-2" />
  Sauvegarder
</Button>

// Dialog
<Dialog open={showSaveDialog} onOpenChange={closeSaveDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Sauvegarder la simulation</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <div>
        <Label>Nom de la simulation</Label>
        <Input 
          value={simulationName} 
          onChange={(e) => setSimulationName(e.target.value)} 
          placeholder="Ex: Simulation PER 2024"
        />
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={closeSaveDialog}>Annuler</Button>
      <Button onClick={() => saveSimulation(results)} disabled={isSaving}>
        {isSaving ? 'Sauvegarde...' : 'Confirmer'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## 🎨 Composants Disponibles

### `SimulationCard`

Carte standardisée pour afficher un résultat de simulation.

#### Props
```typescript
{
  title: string;                    // Titre
  description?: string;              // Description
  icon?: LucideIcon;                // Icône
  iconColor?: string;               // Couleur de l'icône
  badge?: { text: string; variant?: ... }; // Badge
  tooltip?: string;                 // Tooltip d'aide
  value?: string | number;          // Valeur principale
  valueLabel?: string;              // Label de la valeur
  children?: ReactNode;             // Contenu custom
  variant?: 'default' | 'success' | 'warning' | 'danger';
}
```

#### Exemples
```tsx
// Carte simple avec valeur
<SimulationCard
  title="Économie d'impôts"
  icon={TrendingUp}
  iconColor="text-green-500"
  tooltip="Montant total économisé grâce au PER"
  value="5 420 €"
  valueLabel="Économie annuelle"
  variant="success"
/>

// Carte avec contenu custom
<SimulationCard
  title="Répartition"
  icon={PieChart}
  badge={{ text: "Détail", variant: "secondary" }}
>
  <div className="space-y-2">
    <div className="flex justify-between">
      <span>Versements PER</span>
      <span className="font-bold">12 000 €</span>
    </div>
    <div className="flex justify-between">
      <span>Économie</span>
      <span className="font-bold text-green-600">3 600 €</span>
    </div>
  </div>
</SimulationCard>
```

---

### `ResultsChart`

Graphique pour comparaisons et progressions.

#### Props
```typescript
{
  title: string;
  description?: string;
  icon?: LucideIcon;
  data: ChartDataItem[];           // Données
  type?: 'bar' | 'comparison' | 'progress';
  tooltip?: string;
  badge?: { text: string; variant?: ... };
  showPercentage?: boolean;
  formatValue?: (value: number) => string;
}
```

#### Exemples
```tsx
// Graphique de comparaison
<ResultsChart
  title="Avant / Après"
  icon={TrendingUp}
  type="comparison"
  data={[
    { label: "Impôt sans PER", value: 15000 },
    { label: "Impôt avec PER", value: 12000 }
  ]}
  formatValue={(v) => `${v.toLocaleString()} €`}
/>

// Barres de progression
<ResultsChart
  title="Répartition des économies"
  type="bar"
  data={[
    { label: "Réduction PER", value: 3600, color: "bg-blue-500" },
    { label: "Crédit d'impôt", value: 1200, color: "bg-green-500" },
    { label: "Dons", value: 400, color: "bg-purple-500" }
  ]}
  showPercentage
  formatValue={(v) => `${v.toLocaleString()} €`}
/>
```

---

### `SimulationFormField`

Champ de formulaire avec label, tooltip et différents types d'input.

#### Props
```typescript
{
  label: string;
  tooltip?: string;
  type?: 'number' | 'slider' | 'custom';
  value?: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  placeholder?: string;
  children?: ReactNode;
  formatValue?: (value: number) => string;
}
```

#### Exemples
```tsx
// Input numérique
<SimulationFormField
  label="Revenu annuel"
  tooltip="Votre revenu imposable total"
  type="number"
  value={values.revenu}
  onChange={(v) => setValue('revenu', v)}
  unit="€"
  min={0}
  max={1000000}
/>

// Slider
<SimulationFormField
  label="Âge"
  tooltip="Votre âge actuel"
  type="slider"
  value={values.age}
  onChange={(v) => setValue('age', v)}
  min={18}
  max={75}
  step={1}
/>

// Contenu personnalisé
<SimulationFormField
  label="Situation familiale"
  tooltip="Votre statut marital"
  type="custom"
>
  <RadioGroup value={values.situation} onValueChange={(v) => setValue('situation', v)}>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="celibataire" id="celibataire" />
      <Label htmlFor="celibataire">Célibataire</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="marie" id="marie" />
      <Label htmlFor="marie">Marié(e)</Label>
    </div>
  </RadioGroup>
</SimulationFormField>
```

---

## 📋 Template Complet

Voici un exemple complet d'un simulateur utilisant tous ces outils :

```tsx
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, List } from 'lucide-react';
import { useSimulationForm } from '@/hooks/useSimulationForm';
import { useSimulationSave } from '@/hooks/useSimulationSave';
import { SimulationCard } from '@/components/simulators/SimulationCard';
import { ResultsChart } from '@/components/simulators/ResultsChart';
import { SimulationFormField } from '@/components/simulators/SimulationFormField';
import { useCTARulesEngine } from '@/hooks/useCTARulesEngine';
import { SimulationCTASection } from '@/components/simulators/SimulationCTASection';
import { useMySimulatorCalculations } from '@/hooks/useMySimulatorCalculations';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MySimulator() {
  const navigate = useNavigate();
  
  // Formulaire
  const { values, setValue, loading } = useSimulationForm({
    simulatorName: 'MySimulator',
    defaultValues: { revenu: 50000, age: 35 },
    loadFromProfile: async () => {
      // Charger depuis profil
      return { revenu: profile.income };
    },
  });

  // Calculs
  const { calculateResults } = useMySimulatorCalculations();
  const results = useMemo(() => calculateResults(values), [values, calculateResults]);

  // CTA intelligents
  const { ctas } = useCTARulesEngine('my_simulator', results);

  // Sauvegarde
  const {
    showSaveDialog,
    openSaveDialog,
    closeSaveDialog,
    simulationName,
    setSimulationName,
    saveSimulation,
    isSaving,
  } = useSimulationSave({
    tableName: 'my_simulations',
    queryCacheKey: 'my-simulations',
  });

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/employee/simulations')}>
              <List className="h-4 w-4 mr-2" />
              Mes simulations
            </Button>
            <Button onClick={openSaveDialog}>
              <Save className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </div>

        {/* Formulaire */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <SimulationFormField
            label="Revenu annuel"
            tooltip="Votre revenu imposable"
            type="number"
            value={values.revenu}
            onChange={(v) => setValue('revenu', v)}
            unit="€"
          />
          
          <SimulationFormField
            label="Âge"
            type="slider"
            value={values.age}
            onChange={(v) => setValue('age', v)}
            min={18}
            max={75}
          />
        </div>

        {/* Résultats */}
        {results && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <SimulationCard
                title="Résultat 1"
                value={results.value1}
                valueLabel="Description"
                variant="success"
              />
              <SimulationCard
                title="Résultat 2"
                value={results.value2}
                valueLabel="Description"
              />
              <SimulationCard
                title="Résultat 3"
                value={results.value3}
                valueLabel="Description"
              />
            </div>

            <ResultsChart
              title="Comparaison"
              type="comparison"
              data={[
                { label: "Avant", value: results.before },
                { label: "Après", value: results.after }
              ]}
              formatValue={(v) => `${v.toLocaleString()} €`}
            />

            <SimulationCTASection ctas={ctas} />
          </div>
        )}

        {/* Dialog de sauvegarde */}
        <Dialog open={showSaveDialog} onOpenChange={closeSaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sauvegarder la simulation</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nom de la simulation</Label>
                <Input 
                  value={simulationName} 
                  onChange={(e) => setSimulationName(e.target.value)} 
                  placeholder="Ex: Ma simulation 2024"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeSaveDialog}>Annuler</Button>
              <Button onClick={() => saveSimulation(results)} disabled={isSaving}>
                {isSaving ? 'Sauvegarde...' : 'Confirmer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
```

---

## ✅ Checklist pour Nouveau Simulateur

- [ ] Créer le hook de calcul spécifique (`useMySimulatorCalculations`)
- [ ] Utiliser `useSimulationForm` pour la gestion du formulaire
- [ ] Utiliser `useSimulationSave` pour la sauvegarde
- [ ] Utiliser `SimulationFormField` pour tous les champs
- [ ] Utiliser `SimulationCard` et `ResultsChart` pour les résultats
- [ ] Intégrer `useCTARulesEngine` et `SimulationCTASection`
- [ ] Créer la table Supabase avec RLS policies
- [ ] Ajouter le simulateur dans `/employee/simulations`
- [ ] Tester le chargement depuis profil
- [ ] Tester la sauvegarde et le rechargement
- [ ] Vérifier la responsivité (mobile, tablette, desktop)

---

## 🔍 Où Trouver des Exemples ?

Les simulateurs existants utilisent déjà certains de ces patterns :
- `SimulateurPER.tsx` : Exemple complet
- `SimulateurEpargnePrecaution.tsx` : Gestion de formulaire complexe
- `OptimisationFiscale.tsx` : Multi-steps
