/**
 * Bloc d'avertissement conformité — affiché en haut des résultats RSU
 * Checklist interactive (non persistée) + alertes contextuelles par régime
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import type { RSUPlanResult } from '@/types/rsu';

// Jours fériés français fixes + mobiles approximés pour l'année courante
const JOURS_FERIES_FIXES = [
  '01-01', '05-01', '05-08', '07-14', '08-15', '11-01', '11-11', '12-25',
];

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isJourFerie(date: Date): boolean {
  const mmdd = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return JOURS_FERIES_FIXES.includes(mmdd);
}

function formatDateFR(date: Date): string {
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function diffDays(a: Date, b: Date): number {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

interface RSUComplianceWarningProps {
  plans: RSUPlanResult[];
  /** Date de cession globale (mode simple) ou dates par plan (mode avancé) */
  dateCessionGlobale?: string;
  datesCessionParPlan?: Record<string, string>;
  /** Plans source avec date_fin_conservation */
  plansSource: Array<{ id: string; regime: string; date_fin_conservation?: string }>;
}

export function RSUComplianceWarning({
  plans,
  dateCessionGlobale,
  datesCessionParPlan,
  plansSource,
}: RSUComplianceWarningProps) {
  const [checks, setChecks] = useState({ trading: false, blackout: false, mnpi: false });

  const toggle = (key: keyof typeof checks) =>
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));

  // Collect all cession dates
  const cessionDates: Date[] = [];
  if (datesCessionParPlan) {
    Object.values(datesCessionParPlan).forEach(d => {
      if (d) cessionDates.push(new Date(d));
    });
  }
  if (dateCessionGlobale) {
    cessionDates.push(new Date(dateCessionGlobale));
  }
  if (cessionDates.length === 0) cessionDates.push(new Date());

  // Weekend / jour férié check
  const weekendDates = cessionDates.filter(d => isWeekend(d) || isJourFerie(d));

  // Non-qualifié plans
  const hasNonQualifie = plans.some(p => p.regime === 'NON_QUALIFIE');

  // Conservation warnings for AGA_2017 / AGA_POST2018
  const conservationWarnings: Array<{ planNom: string; dateFinConservation: Date; dateCession: Date; joursRestants: number }> = [];
  for (const plan of plans) {
    if (plan.regime !== 'AGA_2017' && plan.regime !== 'AGA_POST2018') continue;
    const source = plansSource.find(s => s.id === plan.plan_id);
    if (!source?.date_fin_conservation) continue;
    const finConservation = new Date(source.date_fin_conservation);
    const dateCession = datesCessionParPlan?.[plan.plan_id]
      ? new Date(datesCessionParPlan[plan.plan_id])
      : dateCessionGlobale
        ? new Date(dateCessionGlobale)
        : new Date();
    if (dateCession < finConservation) {
      conservationWarnings.push({
        planNom: plan.plan_nom,
        dateFinConservation: finConservation,
        dateCession,
        joursRestants: diffDays(dateCession, finConservation),
      });
    }
  }

  const checkboxItems = [
    {
      id: 'trading' as const,
      title: 'Trading windows',
      description: 'Votre entreprise autorise-t-elle les ventes à cette date ? Les fenêtres de trading sont généralement ouvertes quelques jours après la publication des résultats trimestriels.',
    },
    {
      id: 'blackout' as const,
      title: 'Blackout periods',
      description: 'Vérifiez qu\'aucune période de blocage n\'est active à la date de cession simulée. Les blackout periods précèdent typiquement les annonces financières et peuvent durer 4 à 6 semaines.',
    },
    {
      id: 'mnpi' as const,
      title: 'MNPI / Insider trading',
      description: 'Êtes-vous en possession d\'informations matérielles non publiques (MNPI) sur votre entreprise ? Vendre en possession de telles informations constitue un délit d\'initié passible de sanctions pénales, indépendamment du régime fiscal de vos actions.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <Card className="border-amber-300/60 dark:border-amber-700/50 bg-amber-50/60 dark:bg-amber-950/20">
        <CardContent className="py-5 px-5 space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <ShieldAlert className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-amber-900 dark:text-amber-100">
                Avant de vendre — Vérifiez vos conditions de cession
              </h3>
              <p className="text-xs text-amber-800/80 dark:text-amber-300/70 mt-0.5 leading-relaxed">
                Les plans RSU sont soumis à des restrictions de vente que cette simulation ne peut pas vérifier automatiquement. Avant toute cession, assurez-vous de respecter les points suivants :
              </p>
            </div>
          </div>

          {/* Checklist */}
          <div className="space-y-3 pl-11">
            {checkboxItems.map(item => (
              <label
                key={item.id}
                className="flex items-start gap-3 cursor-pointer group"
                onClick={() => toggle(item.id)}
              >
                <Checkbox
                  checked={checks[item.id]}
                  onCheckedChange={() => toggle(item.id)}
                  className="mt-0.5 border-amber-400 dark:border-amber-600 data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                />
                <div>
                  <p className={`text-sm font-medium transition-colors ${checks[item.id] ? 'text-amber-600/60 dark:text-amber-400/50 line-through' : 'text-amber-900 dark:text-amber-100'}`}>
                    {item.title}
                  </p>
                  <p className={`text-xs leading-relaxed mt-0.5 transition-colors ${checks[item.id] ? 'text-amber-700/40 dark:text-amber-400/30' : 'text-amber-800/70 dark:text-amber-300/60'}`}>
                    {item.description}
                  </p>
                </div>
              </label>
            ))}
          </div>

          {/* Weekend / jour férié warning */}
          {weekendDates.length > 0 && (
            <div className="ml-11 flex items-start gap-2 p-3 rounded-lg bg-amber-100/80 dark:bg-amber-900/30">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                La date de cession simulée ({formatDateFR(weekendDates[0])}) tombe un week-end ou un jour férié. Les marchés sont fermés — vérifiez la date effective de règlement-livraison.
              </p>
            </div>
          )}

          {/* Conservation warnings — AGA_2017 / AGA_POST2018 */}
          {conservationWarnings.map((w, i) => (
            <div key={i} className="ml-11 flex items-start gap-2 p-3 rounded-lg bg-red-50/80 dark:bg-red-950/20 border border-red-200/60 dark:border-red-800/40">
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-800 dark:text-red-200 leading-relaxed">
                <strong>{w.planNom}</strong> : votre plan est soumis à une période de conservation légale se terminant le <strong>{formatDateFR(w.dateFinConservation)}</strong>. La date de cession simulée est antérieure de <strong>{w.joursRestants} jours</strong>. Toute vente avant cette date ferait perdre le bénéfice du régime AGA et entraînerait une requalification fiscale en salaires.
              </p>
            </div>
          ))}

          {/* Non-qualifié — SEC reminder */}
          {hasNonQualifie && (
            <div className="ml-11 flex items-start gap-2 p-3 rounded-lg bg-blue-50/80 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-800/40">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                Pour les plans de sociétés américaines cotées, les trading windows et blackout periods sont définies par le Rule 10b5-1 (SEC). Consultez le Insider Trading Policy de votre employeur disponible sur votre portail RH ou equity (Fidelity, E*Trade, Morgan Stanley Shareworks).
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="ml-11 flex items-start gap-2 mt-1">
            <Info className="h-3.5 w-3.5 text-amber-500 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-700/70 dark:text-amber-400/60 leading-relaxed">
              Ces restrictions sont définies dans votre Grant Agreement et dans la politique de trading de votre entreprise. En cas de doute, contactez votre service juridique ou votre compliance officer avant d'exécuter la vente.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
