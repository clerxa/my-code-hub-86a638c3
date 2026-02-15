import {
  Home, Car, Shield, Sunset, Plane, GraduationCap, Star, Target, 
  Heart, Wallet, Building2, Baby, Briefcase, Gift,
  type LucideIcon
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  Home, Car, Shield, Sunset, Plane, GraduationCap, Star, Target,
  Heart, Wallet, Building2, Baby, Briefcase, Gift,
};

export const getProjectIcon = (iconName: string): LucideIcon => {
  return ICON_MAP[iconName] || Target;
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);
