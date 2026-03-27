import { useBetaMode } from "@/hooks/useBetaMode";
import { BetaTeasingPage } from "@/components/beta/BetaTeasingPage";

export function BetaGate({
  moduleKey,
  children,
}: {
  moduleKey: string;
  children: React.ReactNode;
}) {
  const { isModuleLocked, isLoading } = useBetaMode();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isModuleLocked(moduleKey)) {
    return <BetaTeasingPage moduleKey={moduleKey} />;
  }
  return <>{children}</>;
}
