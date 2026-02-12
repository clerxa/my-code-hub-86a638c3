// Types unifiés pour le Workflow Hub

export type WorkflowSystemType = 'onboarding' | 'recommendations' | 'simulator_ctas' | 'notifications';

export interface WorkflowSystem {
  id: WorkflowSystemType;
  label: string;
  description: string;
  icon: string;
  color: string;
  rulesCount: number;
  activeCount: number;
}

export interface WorkflowConnection {
  id: string;
  sourceSystem: WorkflowSystemType;
  sourceId: string;
  sourceName: string;
  targetSystem: WorkflowSystemType;
  targetId: string;
  targetName: string;
  connectionType: 'triggers' | 'leads_to' | 'assigns' | 'notifies';
}

export interface WorkflowNode {
  id: string;
  system: WorkflowSystemType;
  name: string;
  type: string;
  isActive: boolean;
  connections: {
    to: string[];
    from: string[];
  };
  metadata?: Record<string, any>;
}

export interface SystemStats {
  total: number;
  active: number;
  inactive: number;
  withConnections: number;
}

export const SYSTEM_CONFIG: Record<WorkflowSystemType, {
  label: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  onboarding: {
    label: 'Onboarding',
    description: 'Parcours d\'intégration des utilisateurs',
    icon: 'GitBranch',
    color: 'text-blue-600',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
  recommendations: {
    label: 'Recommandations',
    description: 'Suggestions personnalisées basées sur le profil',
    icon: 'Lightbulb',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
  },
  simulator_ctas: {
    label: 'CTAs Simulateurs',
    description: 'Actions contextuelles après simulations',
    icon: 'Calculator',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
  },
  notifications: {
    label: 'Notifications',
    description: 'Alertes et messages automatisés',
    icon: 'Bell',
    color: 'text-purple-600',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
  },
};

export const CONNECTION_TYPE_LABELS: Record<string, string> = {
  triggers: 'Déclenche',
  leads_to: 'Mène à',
  assigns: 'Assigne',
  notifies: 'Notifie',
};
