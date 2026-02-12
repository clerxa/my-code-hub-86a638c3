import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { WorkflowSystemType, WorkflowConnection, SystemStats, SYSTEM_CONFIG } from './types';

interface OnboardingScreen {
  id: string;
  title: string;
  type: string;
  status: string;
  options: any[];
  is_active: boolean;
}

interface RecommendationRule {
  id: string;
  rule_name: string;
  condition_type: string;
  is_active: boolean;
  cta_action_type?: string;
  cta_action_value?: string;
}

interface SimulatorCTA {
  id: string;
  simulator_type: string;
  title: string;
  action_type: string;
  action_value: string;
  active: boolean;
}

interface NotificationRule {
  id: string;
  rule_name: string;
  trigger_condition: string;
  active: boolean;
  cta_url?: string;
}

interface Parcours {
  id: string;
  title: string;
}

export function useWorkflowData() {
  const [loading, setLoading] = useState(true);
  const [onboardingScreens, setOnboardingScreens] = useState<OnboardingScreen[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationRule[]>([]);
  const [simulatorCTAs, setSimulatorCTAs] = useState<SimulatorCTA[]>([]);
  const [notifications, setNotifications] = useState<NotificationRule[]>([]);
  const [parcours, setParcours] = useState<Parcours[]>([]);
  const [connections, setConnections] = useState<WorkflowConnection[]>([]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: screensData },
        { data: recsData },
        { data: ctasData },
        { data: notifsData },
        { data: parcoursData },
      ] = await Promise.all([
        supabase.from('onboarding_screens').select('*').order('order_num'),
        supabase.from('recommendation_rules').select('*').order('priority'),
        supabase.from('simulator_ctas').select('*').order('order_num'),
        supabase.from('notification_rules').select('*').order('created_at'),
        supabase.from('parcours').select('id, title'),
      ]);

      const screens = (screensData || []).map(s => ({
        ...s,
        options: typeof s.options === 'string' ? JSON.parse(s.options) : s.options || [],
      }));
      
      setOnboardingScreens(screens);
      setRecommendations(recsData || []);
      setSimulatorCTAs(ctasData || []);
      setNotifications(notifsData || []);
      setParcours(parcoursData || []);

      // Build connections
      const conns: WorkflowConnection[] = [];
      
      // 1. Onboarding → Parcours connections
      screens.forEach(screen => {
        (screen.options || []).forEach((opt: any) => {
          if (opt.parcoursId) {
            const targetParcours = parcoursData?.find(p => p.id === opt.parcoursId);
            conns.push({
              id: `onb-${screen.id}-parc-${opt.parcoursId}`,
              sourceSystem: 'onboarding',
              sourceId: screen.id,
              sourceName: `${screen.title} → ${opt.label}`,
              targetSystem: 'onboarding', // Parcours is part of onboarding flow
              targetId: opt.parcoursId,
              targetName: targetParcours?.title || 'Parcours inconnu',
              connectionType: 'assigns',
            });
          }
        });
      });

      // 2. Recommendations → Navigation (internal links that may trigger other systems)
      (recsData || []).forEach(rec => {
        if (rec.cta_action_type === 'navigate' && rec.cta_action_value) {
          const path = rec.cta_action_value;
          // Check if links to simulators
          if (path.includes('simulateur')) {
            conns.push({
              id: `rec-${rec.id}-sim`,
              sourceSystem: 'recommendations',
              sourceId: rec.id,
              sourceName: rec.rule_name,
              targetSystem: 'simulator_ctas',
              targetId: path,
              targetName: `Simulateur: ${path}`,
              connectionType: 'leads_to',
            });
          }
        }
      });

      // 3. Simulator CTAs → External/Internal actions
      (ctasData || []).forEach(cta => {
        if (cta.action_type === 'internal_link' && cta.action_value) {
          const path = cta.action_value;
          // Check if links to relevant pages
          if (path.includes('parcours') || path.includes('formations')) {
            conns.push({
              id: `cta-${cta.id}-${path}`,
              sourceSystem: 'simulator_ctas',
              sourceId: cta.id,
              sourceName: `${cta.simulator_type}: ${cta.title}`,
              targetSystem: 'onboarding',
              targetId: path,
              targetName: `Page: ${path}`,
              connectionType: 'leads_to',
            });
          }
        }
      });

      // 4. Notifications → CTA links
      (notifsData || []).forEach(notif => {
        if (notif.cta_url) {
          const path = notif.cta_url;
          if (path.includes('simulateur')) {
            conns.push({
              id: `notif-${notif.id}-sim`,
              sourceSystem: 'notifications',
              sourceId: notif.id,
              sourceName: notif.rule_name,
              targetSystem: 'simulator_ctas',
              targetId: path,
              targetName: `Simulateur: ${path}`,
              connectionType: 'leads_to',
            });
          } else if (path.includes('parcours') || path.includes('formations')) {
            conns.push({
              id: `notif-${notif.id}-onb`,
              sourceSystem: 'notifications',
              sourceId: notif.id,
              sourceName: notif.rule_name,
              targetSystem: 'onboarding',
              targetId: path,
              targetName: `Page: ${path}`,
              connectionType: 'leads_to',
            });
          }
        }
      });

      setConnections(conns);
    } catch (error) {
      console.error('Error fetching workflow data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const getSystemStats = useCallback((system: WorkflowSystemType): SystemStats => {
    switch (system) {
      case 'onboarding':
        return {
          total: onboardingScreens.length,
          active: onboardingScreens.filter(s => s.status === 'active').length,
          inactive: onboardingScreens.filter(s => s.status !== 'active').length,
          withConnections: connections.filter(c => c.sourceSystem === 'onboarding').length,
        };
      case 'recommendations':
        return {
          total: recommendations.length,
          active: recommendations.filter(r => r.is_active).length,
          inactive: recommendations.filter(r => !r.is_active).length,
          withConnections: connections.filter(c => c.sourceSystem === 'recommendations').length,
        };
      case 'simulator_ctas':
        return {
          total: simulatorCTAs.length,
          active: simulatorCTAs.filter(c => c.active).length,
          inactive: simulatorCTAs.filter(c => !c.active).length,
          withConnections: connections.filter(c => c.sourceSystem === 'simulator_ctas').length,
        };
      case 'notifications':
        return {
          total: notifications.length,
          active: notifications.filter(n => n.active).length,
          inactive: notifications.filter(n => !n.active).length,
          withConnections: connections.filter(c => c.sourceSystem === 'notifications').length,
        };
    }
  }, [onboardingScreens, recommendations, simulatorCTAs, notifications, connections]);

  return {
    loading,
    onboardingScreens,
    recommendations,
    simulatorCTAs,
    notifications,
    parcours,
    connections,
    getSystemStats,
    refetch: fetchAllData,
  };
}
