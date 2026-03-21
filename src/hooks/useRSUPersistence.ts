/**
 * Hook de persistance RSU — tables dédiées rsu_simulations / rsu_plans / rsu_vestings
 * Les résultats ne sont jamais persistés. Seuls les inputs sont sauvegardés.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RSUPlan, RSUCessionParams, VestingLine } from '@/types/rsu';

// ─── Types DB ───
interface DbSimulation {
  id: string;
  nom: string;
  mode: 'simple' | 'avance';
  tmi: number;
  prix_vente: number;
  taux_change_vente: number;
  date_cession_globale: string | null;
  created_at: string;
  updated_at: string;
}

interface DbPlan {
  id: string;
  simulation_id: string;
  nom: string;
  ticker: string | null;
  entreprise_nom: string | null;
  annee_attribution: number;
  regime: string;
  devise: string;
  date_fin_conservation: string | null;
  date_cession: string | null;
  gain_acquisition_total: number;
  created_at: string;
}

interface DbVesting {
  id: string;
  plan_id: string;
  date: string;
  nb_rsu: number;
  cours: number;
  taux_change: number;
  gain_eur: number;
}

export interface SavedRSUSimulation {
  id: string;
  nom: string;
  mode: 'simple' | 'avance';
  tmi: number;
  prix_vente: number;
  taux_change_vente: number;
  date_cession_globale: string | null;
  created_at: string;
  updated_at: string;
  plans: RSUPlan[];
  cessionParams: RSUCessionParams;
}

// ─── Load all plans (workspace + fallback to legacy simulations table) ───
export function useRSUPlans() {
  const [plans, setPlans] = useState<RSUPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }

      // 1. Try loading from new rsu_plans tables (workspace)
      const { data: workspace } = await supabase
        .from('rsu_simulations')
        .select('id')
        .eq('user_id', user.id)
        .eq('nom', '__workspace__')
        .maybeSingle();

      let loadedPlans: RSUPlan[] = [];

      if (workspace) {
        const { data: dbPlans } = await supabase
          .from('rsu_plans')
          .select('*')
          .eq('simulation_id', workspace.id);

        if (dbPlans && dbPlans.length > 0) {
          const planIds = dbPlans.map(p => p.id);
          const { data: dbVestings } = await supabase
            .from('rsu_vestings')
            .select('*')
            .in('plan_id', planIds);

          const vestingsByPlan = new Map<string, VestingLine[]>();
          for (const v of (dbVestings || [])) {
            const list = vestingsByPlan.get(v.plan_id) || [];
            list.push({
              id: v.id,
              date: v.date,
              nb_rsu: Number(v.nb_rsu),
              cours: Number(v.cours),
              taux_change: Number(v.taux_change),
              gain_eur: Number(v.gain_eur),
            });
            vestingsByPlan.set(v.plan_id, list);
          }

          loadedPlans = dbPlans.map(p => ({
            id: p.id,
            nom: p.nom,
            ticker: p.ticker || undefined,
            entreprise_nom: p.entreprise_nom || undefined,
            annee_attribution: p.annee_attribution,
            regime: p.regime as RSUPlan['regime'],
            devise: p.devise as RSUPlan['devise'],
            date_fin_conservation: p.date_fin_conservation || undefined,
            vestings: vestingsByPlan.get(p.id) || [],
            gain_acquisition_total: Number(p.gain_acquisition_total),
          }));
        }
      }

      // 2. Fallback: if no plans in new tables, load from legacy simulations table
      if (loadedPlans.length === 0) {
        const { data: legacySims } = await supabase
          .from('simulations')
          .select('id, name, type, data, created_at')
          .eq('user_id', user.id)
          .eq('type', 'rsu')
          .order('created_at', { ascending: false });

        if (legacySims && legacySims.length > 0) {
          for (const sim of legacySims) {
            const d = sim.data as any;
            if (!d || !Array.isArray(d.plans)) continue;
            for (const plan of d.plans) {
              const vestings: VestingLine[] = Array.isArray(plan.vestings)
                ? plan.vestings.map((v: any) => ({
                    id: v.id || crypto.randomUUID(),
                    date: v.date,
                    nb_rsu: Number(v.nb_rsu || 0),
                    cours: Number(v.cours || 0),
                    taux_change: Number(v.taux_change || 1),
                    gain_eur: Number(v.gain_eur || 0),
                  }))
                : [];
              loadedPlans.push({
                id: plan.id,
                nom: plan.nom || `RSU ${plan.annee_attribution || ''}`,
                ticker: plan.ticker || undefined,
                entreprise_nom: plan.entreprise_nom || undefined,
                annee_attribution: plan.annee_attribution || 2020,
                regime: (plan.regime || 'AGA_POST2018') as RSUPlan['regime'],
                devise: (plan.devise || 'USD') as RSUPlan['devise'],
                date_fin_conservation: plan.date_fin_conservation || undefined,
                vestings,
                gain_acquisition_total: Number(plan.gain_acquisition_total || 0),
              });
            }
          }

          // Deduplicate by plan id (same plan may exist in multiple saved simulations)
          const seen = new Set<string>();
          loadedPlans = loadedPlans.filter(p => {
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
          });

          // Auto-migrate to new tables in background
          if (loadedPlans.length > 0) {
            migrateToNewTables(user.id, loadedPlans).catch(e =>
              console.error('Migration failed:', e)
            );
          }
        }
      }

      setPlans(loadedPlans);
    } catch (e) {
      console.error('Failed to load RSU plans:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  return { plans, setPlans, isLoading, reload: loadPlans };
}

// ─── Auto-migrate legacy plans to new rsu_* tables ───
async function migrateToNewTables(userId: string, plans: RSUPlan[]) {
  // Find or create workspace
  let { data: existing } = await supabase
    .from('rsu_simulations')
    .select('id')
    .eq('user_id', userId)
    .eq('nom', '__workspace__')
    .maybeSingle();

  let simId: string;
  if (existing) {
    simId = existing.id;
  } else {
    const { data: created, error } = await supabase
      .from('rsu_simulations')
      .insert({ user_id: userId, nom: '__workspace__', mode: 'simple', tmi: 30, prix_vente: 0, taux_change_vente: 1 })
      .select('id')
      .single();
    if (error || !created) return;
    simId = created.id;
  }

  // Check if workspace already has plans (avoid double migration)
  const { data: existingPlans } = await supabase
    .from('rsu_plans')
    .select('id')
    .eq('simulation_id', simId);
  if (existingPlans && existingPlans.length > 0) return;

  for (const plan of plans) {
    const { error: planError } = await supabase
      .from('rsu_plans')
      .upsert({
        id: plan.id,
        simulation_id: simId,
        nom: plan.nom,
        ticker: plan.ticker || null,
        entreprise_nom: plan.entreprise_nom || null,
        annee_attribution: plan.annee_attribution,
        regime: plan.regime,
        devise: plan.devise,
        date_fin_conservation: plan.date_fin_conservation || null,
        date_cession: null,
        gain_acquisition_total: plan.gain_acquisition_total,
      }, { onConflict: 'id' });

    if (planError) { console.error('Migration plan error:', planError); continue; }

    if (plan.vestings.length > 0) {
      await supabase.from('rsu_vestings').delete().eq('plan_id', plan.id);
      const vestingRows = plan.vestings.map(v => ({
        id: v.id,
        plan_id: plan.id,
        date: v.date,
        nb_rsu: v.nb_rsu,
        cours: v.cours,
        taux_change: v.taux_change,
        gain_eur: v.gain_eur,
      }));
      await supabase.from('rsu_vestings').insert(vestingRows);
    }
  }
  console.log('RSU plans migrated to new tables');
}

// ─── Save a single plan (upsert into a default simulation) ───
export async function savePlanToDb(plan: RSUPlan): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Find or create a default "workspace" simulation for standalone plans
    let { data: existing } = await supabase
      .from('rsu_simulations')
      .select('id')
      .eq('user_id', user.id)
      .eq('nom', '__workspace__')
      .maybeSingle();

    let simId: string;
    if (existing) {
      simId = existing.id;
    } else {
      const { data: created, error } = await supabase
        .from('rsu_simulations')
        .insert({
          user_id: user.id,
          nom: '__workspace__',
          mode: 'simple',
          tmi: 30,
          prix_vente: 0,
          taux_change_vente: 1,
        })
        .select('id')
        .single();
      if (error || !created) return null;
      simId = created.id;
    }

    // Upsert the plan
    const { error: planError } = await supabase
      .from('rsu_plans')
      .upsert({
        id: plan.id,
        simulation_id: simId,
        nom: plan.nom,
        ticker: plan.ticker || null,
        entreprise_nom: plan.entreprise_nom || null,
        annee_attribution: plan.annee_attribution,
        regime: plan.regime,
        devise: plan.devise,
        date_fin_conservation: plan.date_fin_conservation || null,
        date_cession: null,
        gain_acquisition_total: plan.gain_acquisition_total,
      }, { onConflict: 'id' });

    if (planError) { console.error('Failed to save plan:', planError); return null; }

    // Delete old vestings and re-insert
    await supabase.from('rsu_vestings').delete().eq('plan_id', plan.id);

    if (plan.vestings.length > 0) {
      const vestingRows = plan.vestings.map(v => ({
        id: v.id,
        plan_id: plan.id,
        date: v.date,
        nb_rsu: v.nb_rsu,
        cours: v.cours,
        taux_change: v.taux_change,
        gain_eur: v.gain_eur,
      }));

      const { error: vError } = await supabase.from('rsu_vestings').insert(vestingRows);
      if (vError) console.error('Failed to save vestings:', vError);
    }

    return simId;
  } catch (e) {
    console.error('Failed to save plan:', e);
    return null;
  }
}

// ─── Delete a plan ───
export async function deletePlanFromDb(planId: string): Promise<boolean> {
  try {
    // Vestings are cascade-deleted
    const { error } = await supabase.from('rsu_plans').delete().eq('id', planId);
    if (error) { console.error('Failed to delete plan:', error); return false; }
    return true;
  } catch (e) {
    console.error('Failed to delete plan:', e);
    return false;
  }
}

// ─── Save a full simulation (cession params + plans) ───
export async function saveSimulationToDb(
  nom: string,
  plans: RSUPlan[],
  params: RSUCessionParams,
): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Create the simulation record
    const { data: sim, error: simError } = await supabase
      .from('rsu_simulations')
      .insert({
        user_id: user.id,
        nom,
        mode: params.mode,
        tmi: params.tmi,
        prix_vente: params.prix_vente,
        taux_change_vente: params.taux_change_vente,
        date_cession_globale: params.mode === 'simple' ? params.date_cession : null,
      })
      .select('id')
      .single();

    if (simError || !sim) { console.error('Failed to save simulation:', simError); return null; }

    // Insert plans
    for (const plan of plans) {
      const dateCession = params.mode === 'avance' && params.dates_cession_par_plan?.[plan.id]
        ? params.dates_cession_par_plan[plan.id]
        : null;

      const { data: savedPlan, error: planError } = await supabase
        .from('rsu_plans')
        .insert({
          simulation_id: sim.id,
          nom: plan.nom,
          ticker: plan.ticker || null,
          entreprise_nom: plan.entreprise_nom || null,
          annee_attribution: plan.annee_attribution,
          regime: plan.regime,
          devise: plan.devise,
          date_fin_conservation: plan.date_fin_conservation || null,
          date_cession: dateCession,
          gain_acquisition_total: plan.gain_acquisition_total,
        })
        .select('id')
        .single();

      if (planError || !savedPlan) { console.error('Failed to save plan:', planError); continue; }

      // Insert vestings
      if (plan.vestings.length > 0) {
        const vestingRows = plan.vestings.map(v => ({
          plan_id: savedPlan.id,
          date: v.date,
          nb_rsu: v.nb_rsu,
          cours: v.cours,
          taux_change: v.taux_change,
          gain_eur: v.gain_eur,
        }));
        await supabase.from('rsu_vestings').insert(vestingRows);
      }
    }

    return sim.id;
  } catch (e) {
    console.error('Failed to save simulation:', e);
    return null;
  }
}

// ─── Load saved simulations list ───
export async function loadSimulationsList(): Promise<SavedRSUSimulation[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: sims } = await supabase
      .from('rsu_simulations')
      .select('*')
      .eq('user_id', user.id)
      .neq('nom', '__workspace__')
      .order('created_at', { ascending: false });

    if (!sims || sims.length === 0) return [];

    const simIds = sims.map(s => s.id);

    const { data: dbPlans } = await supabase
      .from('rsu_plans')
      .select('*')
      .in('simulation_id', simIds);

    const planIds = (dbPlans || []).map(p => p.id);

    const { data: dbVestings } = await supabase
      .from('rsu_vestings')
      .select('*')
      .in('plan_id', planIds.length > 0 ? planIds : ['__none__']);

    const vestingsByPlan = new Map<string, VestingLine[]>();
    for (const v of (dbVestings || [])) {
      const list = vestingsByPlan.get(v.plan_id) || [];
      list.push({
        id: v.id,
        date: v.date,
        nb_rsu: Number(v.nb_rsu),
        cours: Number(v.cours),
        taux_change: Number(v.taux_change),
        gain_eur: Number(v.gain_eur),
      });
      vestingsByPlan.set(v.plan_id, list);
    }

    const plansBySim = new Map<string, RSUPlan[]>();
    for (const p of (dbPlans || [])) {
      const list = plansBySim.get(p.simulation_id) || [];
      list.push({
        id: p.id,
        nom: p.nom,
        ticker: p.ticker || undefined,
        entreprise_nom: p.entreprise_nom || undefined,
        annee_attribution: p.annee_attribution,
        regime: p.regime as RSUPlan['regime'],
        devise: p.devise as RSUPlan['devise'],
        date_fin_conservation: p.date_fin_conservation || undefined,
        vestings: vestingsByPlan.get(p.id) || [],
        gain_acquisition_total: Number(p.gain_acquisition_total),
      });
      plansBySim.set(p.simulation_id, list);
    }

    // Build dates_cession_par_plan for advanced mode
    const datesCessionBySim = new Map<string, Record<string, string>>();
    for (const p of (dbPlans || [])) {
      if (p.date_cession) {
        const dates = datesCessionBySim.get(p.simulation_id) || {};
        dates[p.id] = p.date_cession;
        datesCessionBySim.set(p.simulation_id, dates);
      }
    }

    return sims.map(s => ({
      id: s.id,
      nom: s.nom,
      mode: s.mode as 'simple' | 'avance',
      tmi: Number(s.tmi),
      prix_vente: Number(s.prix_vente),
      taux_change_vente: Number(s.taux_change_vente),
      date_cession_globale: s.date_cession_globale,
      created_at: s.created_at,
      updated_at: s.updated_at,
      plans: plansBySim.get(s.id) || [],
      cessionParams: {
        mode: s.mode as 'simple' | 'avance',
        tmi: Number(s.tmi),
        prix_vente: Number(s.prix_vente),
        taux_change_vente: Number(s.taux_change_vente),
        date_cession: s.date_cession_globale || new Date().toISOString().split('T')[0],
        dates_cession_par_plan: datesCessionBySim.get(s.id),
      },
    }));
  } catch (e) {
    console.error('Failed to load simulations:', e);
    return [];
  }
}

// ─── Delete a simulation ───
export async function deleteSimulationFromDb(simId: string): Promise<void> {
  try {
    // Plans and vestings are cascade-deleted
    await supabase.from('rsu_simulations').delete().eq('id', simId);
  } catch (e) {
    console.error('Failed to delete simulation:', e);
  }
}
