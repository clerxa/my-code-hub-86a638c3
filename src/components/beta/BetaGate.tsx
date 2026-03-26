import { useBetaMode } from "@/hooks/useBetaMode";
import { BetaTeasingPage } from "@/components/beta/BetaTeasingPage";

export function BetaGate({
  moduleKey,
  children,
}: {
  moduleKey: string;
  children: React.ReactNode;
}) {
  const { isModuleLocked } = useBetaMode();
  if (isModuleLocked(moduleKey)) {
    return <BetaTeasingPage moduleKey={moduleKey} />;
  }
  return <>{children}</>;
}
