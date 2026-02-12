import { ReactNode } from "react";
import { Header } from "@/components/Header";

interface SimulatorLayoutProps {
  /**
   * Contenu principal du simulateur
   */
  children: ReactNode;
  
  /**
   * Classes CSS additionnelles pour le conteneur
   */
  className?: string;
  
  /**
   * Afficher le header (défaut: true)
   */
  showHeader?: boolean;
  
  /**
   * Padding du conteneur (défaut: true)
   */
  withPadding?: boolean;
}

/**
 * Layout wrapper pour les simulateurs avec structure cohérente
 * 
 * @example
 * ```tsx
 * <SimulatorLayout>
 *   <SimulatorHeader title="Simulateur PER" onBack={() => navigate(-1)} />
 *   <div className="grid gap-6">
 *     // Form content
 *   </div>
 * </SimulatorLayout>
 * ```
 */
export function SimulatorLayout({
  children,
  className = "",
  showHeader = true,
  withPadding = true,
}: SimulatorLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showHeader && <Header />}
      <main className={`${withPadding ? "container mx-auto px-4 py-8" : ""} ${className}`}>
        {children}
      </main>
    </div>
  );
}
