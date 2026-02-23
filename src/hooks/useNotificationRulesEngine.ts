import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { NotificationRule, FrequencyLimit } from "@/types/notifications";
import { ConditionOperator } from "@/types/evaluation-keys";

interface UserContext {
  id: string;
  lastLogin: string | null;
  completedModules: number[];
  totalPoints: number;
  companyId: string | null;
  riskProfileId: string | null;
  financialProfileCompleteness: number;
  onboardingCompleted: boolean;
}

interface ModuleProgress {
  moduleId: number;
  moduleTitle: string;
  startedAt: string;
  completed: boolean;
}

interface WebinarContext {
  id: number;
  title: string;
  scheduledAt: string;
  registeredAt: string;
}

// Contexte d'évaluation pour les conditions unifiées
interface EvaluationContext {
  [key: string]: number | boolean | string | null;
}

export function useNotificationRulesEngine() {
  const { user } = useAuth();
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const evaluationInProgress = useRef(false);
  const lastEvaluationTime = useRef<number>(0);

  // Fetch active notification rules
  useEffect(() => {
    const fetchRules = async () => {
      const { data } = await supabase
        .from("notification_rules")
        .select("*")
        .eq("active", true);
      
      if (data) {
        setRules(data as NotificationRule[]);
      }
      setLoading(false);
    };

    fetchRules();
  }, []);

  // Check if notification was already sent based on frequency limit
  const checkFrequencyLimit = async (
    userId: string,
    ruleId: string,
    frequencyLimit: FrequencyLimit | undefined
  ): Promise<boolean> => {
    if (!frequencyLimit || frequencyLimit === "immediate") {
      return true; // Always allow immediate notifications
    }

    // For milestone/quiz/webinar/journey limits, check if ever triggered
    if (["1_per_milestone", "1_per_quiz", "1_per_webinar", "1_per_journey"].includes(frequencyLimit)) {
      const { count } = await supabase
        .from("notification_logs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("rule_id", ruleId);

      return (count || 0) === 0;
    }

    // Calculate the time window based on frequency
    let intervalMs: number;
    switch (frequencyLimit) {
      case "1_per_day":
        intervalMs = 24 * 60 * 60 * 1000;
        break;
      case "1_per_week":
        intervalMs = 7 * 24 * 60 * 60 * 1000;
        break;
      case "1_per_month":
        intervalMs = 30 * 24 * 60 * 60 * 1000;
        break;
      default:
        return true;
    }

    const sinceDate = new Date(Date.now() - intervalMs).toISOString();

    const { count } = await supabase
      .from("notification_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("rule_id", ruleId)
      .gte("triggered_at", sinceDate);

    return (count || 0) === 0;
  };

  // Create and send notification
  const sendNotification = async (
    rule: NotificationRule,
    userId: string,
    templateVars: Record<string, string> = {}
  ) => {
    // Replace template variables
    let title = rule.title_template;
    let message = rule.message_template;

    Object.entries(templateVars).forEach(([key, value]) => {
      title = title.replace(`{{${key}}}`, value);
      message = message.replace(`{{${key}}}`, value);
    });

    // Create the notification
    const { data: notification, error: notifError } = await supabase
      .from("notifications")
      .insert({
        title,
        message,
        display_type: rule.display_type,
        trigger_type: "auto",
        url_action: rule.cta_url || null,
        button_text: rule.cta_text || "Voir plus",
      })
      .select()
      .single();

    if (notifError || !notification) {
      console.error("Failed to create notification:", notifError);
      return;
    }

    // Create user_notification entry
    await supabase.from("user_notifications").insert({
      user_id: userId,
      notification_id: notification.id,
    });

    // Log the notification trigger
    await supabase.from("notification_logs").insert({
      user_id: userId,
      rule_id: rule.id,
      notification_id: notification.id,
    });

    console.log(`[Notifications] ✅ Sent: ${rule.rule_name} for user ${userId}`);
  };

  // Évaluer une condition avec opérateur
  const evaluateConditionOperator = (
    actualValue: number | boolean | string | null | undefined,
    operator: ConditionOperator,
    conditionValue: number | string | boolean,
    conditionValue2?: number | string
  ): boolean => {
    // Handle null/undefined values
    if (actualValue === null || actualValue === undefined) {
      if (operator === 'not_exists') return true;
      if (operator === 'exists') return false;
      return false;
    }

    if (operator === 'exists') return true;

    // Convert to numbers for comparison if applicable
    const numActual = typeof actualValue === 'number' ? actualValue : parseFloat(String(actualValue));
    const numCondition = typeof conditionValue === 'number' ? conditionValue : parseFloat(String(conditionValue));

    switch (operator) {
      case '>':
        return numActual > numCondition;
      case '<':
        return numActual < numCondition;
      case '>=':
        return numActual >= numCondition;
      case '<=':
        return numActual <= numCondition;
      case '=':
        if (typeof actualValue === 'boolean') {
          return actualValue === (conditionValue === 'true' || conditionValue === true);
        }
        return String(actualValue) === String(conditionValue);
      case '!=':
        if (typeof actualValue === 'boolean') {
          return actualValue !== (conditionValue === 'true' || conditionValue === true);
        }
        return String(actualValue) !== String(conditionValue);
      case 'between':
        const numValue2 = typeof conditionValue2 === 'number' ? conditionValue2 : parseFloat(String(conditionValue2));
        return numActual >= numCondition && numActual <= numValue2;
      default:
        return false;
    }
  };

  // Évaluer les conditions unifiées
  const evaluateUnifiedConditions = (
    thresholdValue: any,
    evaluationContext: EvaluationContext
  ): boolean => {
    const conditionType = thresholdValue?.type;
    const conditions = thresholdValue?.conditions || [];
    const logic = thresholdValue?.logic || 'AND';

    // Type 'always' = toujours déclencher
    if (conditionType === 'always') {
      return true;
    }

    if (!conditions || conditions.length === 0) {
      console.log('[Notifications] No conditions defined, skipping');
      return false;
    }

    const results = conditions.map((cond: any) => {
      const actualValue = evaluationContext[cond.key];
      const result = evaluateConditionOperator(
        actualValue,
        cond.operator as ConditionOperator,
        cond.value,
        cond.value2
      );
      console.log(`[Notifications] Condition: ${cond.key} ${cond.operator} ${cond.value} | actual=${actualValue} | result=${result}`);
      return result;
    });

    const finalResult = logic === 'AND' 
      ? results.every(Boolean) 
      : results.some(Boolean);
    
    console.log(`[Notifications] Logic: ${logic} | Results: ${JSON.stringify(results)} | Final: ${finalResult}`);
    return finalResult;
  };

  // Evaluate a single rule against user context (legacy + unified)
  const evaluateRule = async (
    rule: NotificationRule,
    userContext: UserContext,
    moduleProgress: ModuleProgress[],
    webinars: WebinarContext[],
    userProgress: number,
    evaluationContext: EvaluationContext
  ): Promise<{ shouldTrigger: boolean; templateVars: Record<string, string> }> => {
    const thresholdValue = rule.threshold_value as Record<string, any> || {};
    let shouldTrigger = false;
    const templateVars: Record<string, string> = {};

    // Check for unified/advanced conditions
    if (rule.trigger_condition === 'advanced_conditions' || thresholdValue?.type) {
      console.log(`[Notifications] Evaluating unified conditions for rule: ${rule.rule_name}`);
      shouldTrigger = evaluateUnifiedConditions(thresholdValue, evaluationContext);
      
      // Add user_name template var if available
      templateVars.user_name = evaluationContext.user_name as string || 'Utilisateur';
      templateVars.progress = String(userProgress);
      
      return { shouldTrigger, templateVars };
    }

    // Legacy trigger conditions
    switch (rule.trigger_condition) {
      case "last_login_days_ago": {
        if (!userContext.lastLogin) {
          shouldTrigger = true;
          templateVars.days = thresholdValue.days?.toString() || "7";
        } else {
          const daysSinceLogin = Math.floor(
            (Date.now() - new Date(userContext.lastLogin).getTime()) / (1000 * 60 * 60 * 24)
          );
          shouldTrigger = daysSinceLogin >= (thresholdValue.days || 7);
          templateVars.days = daysSinceLogin.toString();
        }
        break;
      }

      case "module_started_not_completed": {
        const daysThreshold = thresholdValue.days || 3;
        const incompleteModule = moduleProgress.find((m) => {
          if (m.completed) return false;
          const daysSinceStart = Math.floor(
            (Date.now() - new Date(m.startedAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          return daysSinceStart >= daysThreshold;
        });

        if (incompleteModule) {
          shouldTrigger = true;
          templateVars.module_title = incompleteModule.moduleTitle;
        }
        break;
      }

      case "progress_below_threshold": {
        const percentage = thresholdValue.percentage || 20;
        shouldTrigger = userProgress < percentage;
        templateVars.progress = userProgress.toString();
        break;
      }

      case "progress_reached": {
        const percentage = thresholdValue.percentage || 20;
        shouldTrigger = userProgress >= percentage;
        templateVars.progress = userProgress.toString();
        break;
      }

      case "quiz_score_below": {
        shouldTrigger = false;
        break;
      }

      case "module_added_to_path": {
        shouldTrigger = false;
        break;
      }

      case "webinar_in_days": {
        const daysThreshold = thresholdValue.days || 7;
        const upcomingWebinar = webinars.find((w) => {
          const daysUntil = Math.floor(
            (new Date(w.scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          return daysUntil <= daysThreshold && daysUntil >= 0;
        });

        if (upcomingWebinar) {
          shouldTrigger = true;
          templateVars.webinar_title = upcomingWebinar.title;
        }
        break;
      }

      case "webinar_in_hours": {
        const hoursThreshold = thresholdValue.hours || 1;
        const upcomingWebinar = webinars.find((w) => {
          const hoursUntil = Math.floor(
            (new Date(w.scheduledAt).getTime() - Date.now()) / (1000 * 60 * 60)
          );
          return hoursUntil <= hoursThreshold && hoursUntil >= 0;
        });

        if (upcomingWebinar) {
          shouldTrigger = true;
          templateVars.webinar_title = upcomingWebinar.title;
        }
        break;
      }

      case "never_invited_colleague":
      case "never_referred": {
        const daysSinceSignup = thresholdValue.days_since_signup || 21;
        const userCreatedAt = new Date(userContext.lastLogin || Date.now());
        const daysSinceCreation = Math.floor(
          (Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        
        const { count } = await supabase
          .from("colleague_invitations")
          .select("*", { count: "exact", head: true })
          .eq("inviter_id", userContext.id);

        shouldTrigger = daysSinceCreation >= daysSinceSignup && (count || 0) === 0;
        break;
      }

      default:
        console.log(`[Notifications] Unknown trigger condition: ${rule.trigger_condition}`);
        shouldTrigger = false;
    }

    return { shouldTrigger, templateVars };
  };

  // Build the full evaluation context
  const buildEvaluationContext = async (userId: string, profile: any): Promise<EvaluationContext> => {
    const context: EvaluationContext = {};

    // Basic profile data
    context.user_name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Utilisateur';
    context.total_points = profile.total_points || 0;
    context.modules_valides_count = profile.completed_modules?.length || 0;
    context.has_completed_onboarding = profile.employee_onboarding_completed || false;
    
    // Fetch financial profile
    const { data: financialProfile } = await supabase
      .from('user_financial_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (financialProfile) {
      context.tmi = financialProfile.tmi;
      context.revenu_mensuel_net = financialProfile.revenu_mensuel_net;
      context.epargne_livrets = financialProfile.epargne_livrets;
      context.patrimoine_pea = financialProfile.patrimoine_pea;
      context.patrimoine_assurance_vie = financialProfile.patrimoine_assurance_vie;
      context.age = financialProfile.age;
      context.projet_residence_principale = financialProfile.projet_residence_principale;
      context.projet_investissement_locatif = financialProfile.projet_investissement_locatif;
      context.has_epargne_autres = financialProfile.has_epargne_autres;
      context.capacite_epargne_mensuelle = financialProfile.capacite_epargne_mensuelle;
      context.charges_fixes_mensuelles = financialProfile.charges_fixes_mensuelles;
      context.situation_familiale = financialProfile.situation_familiale;
      context.nb_enfants = financialProfile.nb_enfants;
      context.loyer_actuel = financialProfile.loyer_actuel;
      context.is_complete = financialProfile.is_complete;
      
      // Calculate profile completeness (0 = not filled for numeric fields, except nb_enfants)
      const fields = [
        financialProfile.tmi,
        financialProfile.revenu_mensuel_net,
        financialProfile.epargne_livrets,
        financialProfile.age
      ];
      const filledFields = fields.filter(f => f !== null && f !== undefined && f !== 0).length;
      context.financial_profile_completeness = Math.round((filledFields / fields.length) * 100);
    } else {
      context.financial_profile_completeness = 0;
    }

    // Fetch risk profile
    const { data: riskProfile } = await supabase
      .from('risk_profile')
      .select('id, profile_type, total_weighted_score')
      .eq('user_id', userId)
      .maybeSingle();

    context.has_risk_profile = !!riskProfile;
    context.risk_score = riskProfile?.total_weighted_score || null;
    context.profile_type = riskProfile?.profile_type || null;

    // Count simulations
    const { count: simCount } = await supabase
      .from('simulations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    context.simulations_count = simCount || 0;
    context.has_simulation = (simCount || 0) > 0;

    // Count appointments
    const { count: appointmentCount } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    context.appointments_count = appointmentCount || 0;
    context.has_appointment = (appointmentCount || 0) > 0;

    console.log('[Notifications] Evaluation context:', context);
    return context;
  };

  // Main evaluation function
  const evaluateAndTrigger = useCallback(async () => {
    if (!user || loading || evaluationInProgress.current) return;
    
    // Throttle evaluations to once per 5 minutes
    const now = Date.now();
    if (now - lastEvaluationTime.current < 5 * 60 * 1000) {
      console.log('[Notifications] Throttled, skipping evaluation');
      return;
    }

    evaluationInProgress.current = true;
    lastEvaluationTime.current = now;

    console.log(`[Notifications] Starting evaluation for ${rules.length} rules`);

    try {
      // Fetch user context
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (!profile) {
        console.log('[Notifications] No profile found');
        return;
      }

      // Build unified evaluation context
      const evaluationContext = await buildEvaluationContext(user.id, profile);

      // Fetch risk profile
      const { data: riskProfile } = await supabase
        .from("risk_profile")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      // Fetch module progress
      const { data: moduleValidations } = await supabase
        .from("module_validations")
        .select("module_id, validated_at")
        .eq("user_id", user.id);

      const { data: videoProgress } = await supabase
        .from("video_progress")
        .select("module_id, updated_at")
        .eq("user_id", user.id)
        .lt("progress_percentage", 100);

      const moduleIds = (videoProgress || []).map((vp: any) => vp.module_id);
      const { data: moduleTitles } = await supabase
        .from("modules")
        .select("id, title")
        .in("id", moduleIds.length > 0 ? moduleIds : [0]);

      const moduleTitleMap = new Map((moduleTitles || []).map((m: any) => [m.id, m.title]));

      const moduleProgress: ModuleProgress[] = (videoProgress || []).map((vp: any) => ({
        moduleId: vp.module_id,
        moduleTitle: moduleTitleMap.get(vp.module_id) || "Module",
        startedAt: vp.updated_at,
        completed: (moduleValidations || []).some((mv: any) => mv.module_id === vp.module_id),
      }));

      // Fetch upcoming webinars
      const { data: webinarRegs } = await supabase
        .from("webinar_registrations")
        .select("module_id, registered_at")
        .eq("user_id", user.id)
        .is("joined_at", null);

      const webinarModuleIds = (webinarRegs || []).map((wr: any) => wr.module_id);
      const { data: webinarModules } = await supabase
        .from("modules")
        .select("id, title, webinar_date")
        .in("id", webinarModuleIds.length > 0 ? webinarModuleIds : [0]);

      const webinarModuleMap = new Map((webinarModules || []).map((m: any) => [m.id, m]));

      const webinars: WebinarContext[] = (webinarRegs || [])
        .filter((wr: any) => webinarModuleMap.get(wr.module_id)?.webinar_date)
        .map((wr: any) => {
          const mod = webinarModuleMap.get(wr.module_id);
          return {
            id: wr.module_id,
            title: mod?.title || "Webinar",
            scheduledAt: mod?.webinar_date || "",
            registeredAt: wr.registered_at,
          };
        });

      // Calculate user progress
      const { data: userParcours } = await supabase
        .from("user_parcours")
        .select("parcours_id")
        .eq("user_id", user.id);

      let userProgress = 0;
      if (userParcours && userParcours.length > 0) {
        const { data: parcoursModules } = await supabase
          .from("parcours_modules")
          .select("module_id")
          .in("parcours_id", userParcours.map((up) => up.parcours_id));

        const totalModules = parcoursModules?.length || 0;
        const completedModules = profile.completed_modules?.length || 0;
        userProgress = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
      }

      const userContext: UserContext = {
        id: user.id,
        lastLogin: profile.last_login,
        completedModules: profile.completed_modules || [],
        totalPoints: profile.total_points || 0,
        companyId: profile.company_id,
        riskProfileId: riskProfile?.id || null,
        financialProfileCompleteness: evaluationContext.financial_profile_completeness as number || 0,
        onboardingCompleted: profile.employee_onboarding_completed || false,
      };

      // Evaluate each rule
      for (const rule of rules) {
        console.log(`[Notifications] Checking rule: ${rule.rule_name}`);
        
        // Check frequency limit first - this prevents duplicates
        const canSend = await checkFrequencyLimit(user.id, rule.id, rule.frequency_limit as FrequencyLimit);
        if (!canSend) {
          console.log(`[Notifications] ⏭️ Skipping ${rule.rule_name} - frequency limit reached`);
          continue;
        }

        const { shouldTrigger, templateVars } = await evaluateRule(
          rule,
          userContext,
          moduleProgress,
          webinars,
          userProgress,
          evaluationContext
        );

        if (shouldTrigger) {
          console.log(`[Notifications] 🔔 Rule triggered: ${rule.rule_name}`);
          await sendNotification(rule, user.id, templateVars);
        } else {
          console.log(`[Notifications] ❌ Rule not triggered: ${rule.rule_name}`);
        }
      }
    } catch (error) {
      console.error("[Notifications] Error evaluating rules:", error);
    } finally {
      evaluationInProgress.current = false;
    }
  }, [user, loading, rules]);

  return {
    evaluateAndTrigger,
    loading,
    rulesCount: rules.length,
  };
}
