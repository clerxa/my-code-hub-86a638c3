import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SimulationSummary {
  type: string;
  label: string;
  id: string;
  nom_simulation: string;
  created_at: string;
  key_values: Record<string, string | number | null>;
  coherence_score: number; // lower = more coherent (distance to profile revenue)
}

export interface UserSynthesisData {
  // Profile de base
  profile: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    company_name: string | null;
    created_at: string | null;
    last_login: string | null;
    total_points: number;
    completed_modules: number[];
  } | null;

  // Profil financier
  financialProfile: {
    revenu_mensuel_net: number | null;
    revenu_fiscal_annuel: number | null;
    situation_familiale: string | null;
    nb_enfants: number | null;
    capacite_epargne_mensuelle: number | null;
    epargne_actuelle: number | null;
    apport_disponible: number | null;
    tmi: number | null;
    parts_fiscales: number | null;
    patrimoine_total: number | null;
    is_complete: boolean | null;
  } | null;

  // Profil de risque
  riskProfile: {
    profile_type: string | null;
    total_weighted_score: number | null;
  } | null;

  // Diagnostic (connaissance financière)
  diagnostic: {
    score_percent: number | null;
    status: string | null;
    completed_at: string | null;
  } | null;

  // Simulations sélectionnées (1 par type, la plus cohérente)
  simulations: SimulationSummary[];

  // Horizon
  horizon: {
    total_initial_capital: number | null;
    total_monthly_savings: number | null;
    projects_count: number;
    projects: Array<{
      name: string;
      target_amount: number | null;
      apport: number | null;
      monthly_allocation: number | null;
      status: string | null;
    }>;
  } | null;
}

function pickMostCoherent<T extends { user_id: string }>(
  simulations: T[],
  profileRevenue: number | null,
  revenueExtractor: (sim: T) => number | null
): T | null {
  if (simulations.length === 0) return null;
  if (simulations.length === 1) return simulations[0];
  if (profileRevenue == null) {
    // fallback: most recent (assuming last = most recent from order)
    return simulations[0];
  }

  let best: T = simulations[0];
  let bestDist = Infinity;

  for (const sim of simulations) {
    const rev = revenueExtractor(sim);
    if (rev == null) continue;
    const dist = Math.abs(rev - profileRevenue);
    if (dist < bestDist) {
      bestDist = dist;
      best = sim;
    }
  }
  return best;
}

export function useUserSynthesis(userId: string | null) {
  const [data, setData] = useState<UserSynthesisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all data in parallel
        const [
          profileRes,
          financialRes,
          riskRes,
          diagnosticRes,
          epargnePrecRes,
          capaciteEmpruntRes,
          optisFiscRes,
          perRes,
          pretImmoRes,
          impotsRes,
          lmnpRes,
          esppRes,
          horizonBudgetRes,
          horizonProjectsRes,
          genericSimsRes,
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("first_name, last_name, email, company_id, created_at, last_login, total_points, completed_modules, companies(name)")
            .eq("id", userId)
            .single(),
          supabase
            .from("user_financial_profiles")
            .select("revenu_mensuel_net, revenu_fiscal_annuel, situation_familiale, nb_enfants, capacite_epargne_mensuelle, epargne_actuelle, apport_disponible, tmi, parts_fiscales, is_complete, epargne_livrets, patrimoine_per, patrimoine_assurance_vie, patrimoine_scpi, patrimoine_pea, patrimoine_autres, patrimoine_immo_valeur, patrimoine_immo_credit_restant, revenus_locatifs, autres_revenus_mensuels, loyer_actuel, credits_immobilier, credits_consommation, credits_auto, pensions_alimentaires, charges_fixes_mensuelles, prelevement_source_mensuel, revenu_annuel_brut, revenu_annuel_brut_conjoint")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("risk_profile")
            .select("profile_type, total_weighted_score")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("diagnostic_results")
            .select("score_percent, status, completed_at")
            .eq("user_id", userId)
            .eq("status", "completed")
            .order("completed_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from("epargne_precaution_simulations")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
          supabase
            .from("capacite_emprunt_simulations")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
          supabase
            .from("optimisation_fiscale_simulations")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
          supabase
            .from("per_simulations")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
          supabase
            .from("pret_immobilier_simulations")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
          supabase
            .from("simulations_impots")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
          supabase
            .from("lmnp_simulations")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
          supabase
            .from("espp_plans")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
          supabase
            .from("horizon_budgets")
            .select("total_initial_capital, total_monthly_savings")
            .eq("user_id", userId)
            .maybeSingle(),
          supabase
            .from("horizon_projects")
            .select("name, target_amount, apport, monthly_allocation, status")
            .eq("user_id", userId),
          // Generic simulations table (PVI, gestion pilotée, intérêts composés, capacité épargne)
          supabase
            .from("simulations")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
        ]);

        const profileRow = profileRes.data;
        const fp = financialRes.data;
        const profileRevenue = fp?.revenu_mensuel_net ?? null;

        // Build patrimoine_total (immo net = valeur - crédit restant)
        let patrimoine_total: number | null = null;
        if (fp) {
          patrimoine_total =
            (fp.epargne_livrets || 0) +
            (fp.patrimoine_per || 0) +
            (fp.patrimoine_assurance_vie || 0) +
            (fp.patrimoine_scpi || 0) +
            (fp.patrimoine_pea || 0) +
            (fp.patrimoine_autres || 0) +
            ((fp.patrimoine_immo_valeur || 0) - (fp.patrimoine_immo_credit_restant || 0));
        }

        // Select most coherent simulation per type
        const simulations: SimulationSummary[] = [];

        // Épargne de précaution
        const epSim = pickMostCoherent(
          epargnePrecRes.data || [],
          profileRevenue,
          (s: any) => s.revenu_mensuel
        );
        if (epSim) {
          simulations.push({
            type: "epargne_precaution",
            label: "Épargne de précaution",
            id: epSim.id,
            nom_simulation: epSim.nom_simulation,
            created_at: epSim.created_at,
            coherence_score: profileRevenue ? Math.abs((epSim as any).revenu_mensuel - profileRevenue) : 0,
            key_values: {
              "Revenu mensuel": (epSim as any).revenu_mensuel,
              "Épargne recommandée": (epSim as any).epargne_recommandee,
              "Épargne actuelle": (epSim as any).epargne_actuelle,
              "Niveau sécurité": (epSim as any).niveau_securite,
              "Indice résilience": (epSim as any).indice_resilience,
            },
          });
        }

        // Capacité d'emprunt
        const ceSim = pickMostCoherent(
          capaciteEmpruntRes.data || [],
          profileRevenue ? profileRevenue * 12 : null,
          (s: any) => s.revenu_mensuel_net * 12
        );
        if (ceSim) {
          simulations.push({
            type: "capacite_emprunt",
            label: "Capacité d'emprunt",
            id: ceSim.id,
            nom_simulation: ceSim.nom_simulation,
            created_at: ceSim.created_at,
            coherence_score: 0,
            key_values: {
              "Revenu mensuel net": (ceSim as any).revenu_mensuel_net,
              "Capacité emprunt": (ceSim as any).capacite_emprunt,
              "Mensualité max": (ceSim as any).mensualite_maximale,
              "Taux endettement": `${(ceSim as any).taux_endettement_actuel}%`,
              "Montant projet max": (ceSim as any).montant_projet_max,
            },
          });
        }

        // Optimisation fiscale
        const ofSim = pickMostCoherent(
          optisFiscRes.data || [],
          fp?.revenu_fiscal_annuel ?? null,
          (s: any) => s.revenu_imposable
        );
        if (ofSim) {
          simulations.push({
            type: "optimisation_fiscale",
            label: "Optimisation fiscale",
            id: ofSim.id,
            nom_simulation: (ofSim as any).nom_simulation,
            created_at: (ofSim as any).created_at,
            coherence_score: 0,
            key_values: {
              "Revenu imposable": (ofSim as any).revenu_imposable,
              "TMI": `${(ofSim as any).tmi}%`,
              "Impôt avant": (ofSim as any).impot_avant,
              "Impôt après": (ofSim as any).impot_apres,
              "Économie totale": (ofSim as any).economie_totale,
            },
          });
        }

        // PER
        const perSim = pickMostCoherent(
          perRes.data || [],
          fp?.revenu_fiscal_annuel ?? null,
          (s: any) => s.revenu_fiscal
        );
        if (perSim) {
          simulations.push({
            type: "per",
            label: "PER",
            id: perSim.id,
            nom_simulation: (perSim as any).nom_simulation,
            created_at: (perSim as any).created_at,
            coherence_score: 0,
            key_values: {
              "Revenu fiscal": (perSim as any).revenu_fiscal,
              "Versements PER": (perSim as any).versements_per,
              "Économie impôts": (perSim as any).economie_impots,
              "Capital futur": (perSim as any).capital_futur,
              "Horizon (ans)": (perSim as any).horizon_annees,
            },
          });
        }

        // Prêt immobilier
        const piSim = pickMostCoherent(
          pretImmoRes.data || [],
          profileRevenue,
          (s: any) => s.revenu_mensuel
        );
        if (piSim) {
          simulations.push({
            type: "pret_immobilier",
            label: "Prêt immobilier",
            id: piSim.id,
            nom_simulation: (piSim as any).nom_simulation,
            created_at: (piSim as any).created_at,
            coherence_score: 0,
            key_values: {
              "Montant projet": (piSim as any).montant_projet,
              "Apport": (piSim as any).apport_personnel,
              "Mensualité": (piSim as any).mensualite_totale,
              "Taux endettement": `${(piSim as any).taux_endettement}%`,
              "Coût total crédit": (piSim as any).cout_global_credit,
            },
          });
        }

        // Impôts
        const impSim = pickMostCoherent(
          impotsRes.data || [],
          fp?.revenu_fiscal_annuel ?? null,
          (s: any) => s.revenu_imposable
        );
        if (impSim) {
          simulations.push({
            type: "impots",
            label: "Simulation d'impôts",
            id: impSim.id,
            nom_simulation: (impSim as any).nom_simulation,
            created_at: (impSim as any).created_at,
            coherence_score: 0,
            key_values: {
              "Revenu imposable": (impSim as any).revenu_imposable,
              "Parts": (impSim as any).parts,
              "TMI": `${(impSim as any).taux_marginal}%`,
              "Impôt net": (impSim as any).impot_net,
              "Taux moyen": `${(impSim as any).taux_moyen}%`,
            },
          });
        }

        // LMNP
        const lmnpSim = pickMostCoherent(
          lmnpRes.data || [],
          null,
          () => null
        );
        if (lmnpSim) {
          simulations.push({
            type: "lmnp",
            label: "LMNP",
            id: lmnpSim.id,
            nom_simulation: (lmnpSim as any).nom_simulation,
            created_at: (lmnpSim as any).created_at,
            coherence_score: 0,
            key_values: {
              "Recettes": (lmnpSim as any).recettes,
              "Meilleur régime": (lmnpSim as any).meilleur_regime,
              "Fiscalité réel": (lmnpSim as any).fiscalite_totale_reel,
              "Fiscalité micro": (lmnpSim as any).fiscalite_totale_micro,
            },
          });
        }

        // ESPP
        const esppSim = esppRes.data?.[0] ?? null;
        if (esppSim) {
          simulations.push({
            type: "espp",
            label: "ESPP",
            id: esppSim.id,
            nom_simulation: (esppSim as any).nom_plan,
            created_at: (esppSim as any).created_at,
            coherence_score: 0,
            key_values: {
              "Entreprise": (esppSim as any).entreprise,
              "Montant investi": (esppSim as any).montant_investi,
              "FMV début": (esppSim as any).fmv_debut,
              "FMV fin": (esppSim as any).fmv_fin,
            },
          });
        }

        // Generic simulations from the `simulations` table
        const genericSims = genericSimsRes.data || [];
        const genericTypes: Record<string, { label: string; keyExtractor: (d: any) => Record<string, any> }> = {
          pvi: {
            label: "Plus-value immobilière",
            keyExtractor: (d) => ({
              "Prix acquisition": d.prix_acquisition,
              "Prix cession": d.prix_cession,
              "Plus-value nette": d.plus_value_nette ?? d.plus_value_imposable,
              "Impôt PV": d.impot_plus_value ?? d.impot_ir,
              "Durée détention": d.duree_detention ? `${d.duree_detention} ans` : null,
            }),
          },
          gestion_pilotee: {
            label: "Gestion pilotée",
            keyExtractor: (d) => ({
              "Capital initial": d.capital_initial ?? d.montant_initial,
              "Versement mensuel": d.versement_mensuel,
              "Horizon": d.horizon ? `${d.horizon} ans` : null,
              "Profil": d.profil_risque ?? d.profil,
              "Capital estimé": d.capital_estime ?? d.capital_final,
            }),
          },
          interets_composes: {
            label: "Intérêts composés",
            keyExtractor: (d) => ({
              "Capital initial": d.capital_initial ?? d.montant_initial,
              "Versement mensuel": d.versement_mensuel,
              "Taux rendement": d.taux_rendement ? `${d.taux_rendement}%` : null,
              "Durée": d.duree ? `${d.duree} ans` : null,
              "Capital final": d.capital_final ?? d.montant_final,
            }),
          },
          capacite_epargne: {
            label: "Capacité d'épargne",
            keyExtractor: (d) => ({
              "Revenus": d.revenus ?? d.revenu_total,
              "Charges": d.charges ?? d.charges_totales,
              "Épargne possible": d.epargne ?? d.capacite_epargne,
              "Taux épargne": d.taux_epargne ? `${d.taux_epargne}%` : null,
            }),
          },
        };

        // Group generic simulations by type, pick most recent per type
        const seenGenericTypes = new Set<string>();
        for (const sim of genericSims) {
          const simType = (sim as any).type as string;
          if (seenGenericTypes.has(simType)) continue;
          seenGenericTypes.add(simType);

          const config = genericTypes[simType];
          if (!config) {
            // Unknown type — still show it with raw data
            const simData = typeof (sim as any).data === 'string' ? JSON.parse((sim as any).data) : ((sim as any).data || {});
            const keyValues: Record<string, any> = {};
            const importantKeys = Object.keys(simData).slice(0, 5);
            for (const k of importantKeys) {
              keyValues[k] = simData[k];
            }
            simulations.push({
              type: simType,
              label: simType.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
              id: sim.id,
              nom_simulation: (sim as any).name || simType,
              created_at: sim.created_at,
              coherence_score: 0,
              key_values: keyValues,
            });
            continue;
          }

          const simData = typeof (sim as any).data === 'string' ? JSON.parse((sim as any).data) : ((sim as any).data || {});
          simulations.push({
            type: simType,
            label: config.label,
            id: sim.id,
            nom_simulation: (sim as any).name || simType,
            created_at: sim.created_at,
            coherence_score: 0,
            key_values: config.keyExtractor(simData),
          });
        }

        const synthesis: UserSynthesisData = {
          profile: profileRow
            ? {
                first_name: profileRow.first_name,
                last_name: profileRow.last_name,
                email: profileRow.email,
                company_name: (profileRow as any).companies?.name ?? null,
                created_at: profileRow.created_at,
                last_login: profileRow.last_login,
                total_points: profileRow.total_points,
                completed_modules: profileRow.completed_modules || [],
              }
            : null,
          financialProfile: fp
            ? {
                revenu_mensuel_net: fp.revenu_mensuel_net,
                revenu_fiscal_annuel: fp.revenu_fiscal_annuel,
                situation_familiale: fp.situation_familiale,
                nb_enfants: fp.nb_enfants,
                capacite_epargne_mensuelle: fp.capacite_epargne_mensuelle,
                epargne_actuelle: fp.epargne_actuelle,
                apport_disponible: fp.apport_disponible,
                tmi: fp.tmi,
                parts_fiscales: fp.parts_fiscales,
                patrimoine_total,
                is_complete: fp.is_complete,
              }
            : null,
          riskProfile: riskRes.data ?? null,
          diagnostic: diagnosticRes.data ?? null,
          simulations,
          horizon: horizonBudgetRes.data
            ? {
                total_initial_capital: horizonBudgetRes.data.total_initial_capital,
                total_monthly_savings: horizonBudgetRes.data.total_monthly_savings,
                projects_count: horizonProjectsRes.data?.length ?? 0,
                projects:
                  horizonProjectsRes.data?.map((p: any) => ({
                    name: p.name,
                    target_amount: p.target_amount,
                    apport: p.apport,
                    monthly_allocation: p.monthly_allocation,
                    status: p.status,
                  })) ?? [],
              }
            : null,
        };

        setData(synthesis);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [userId]);

  return { data, loading, error };
}
