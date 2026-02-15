import { DiagnosticRenderer } from "@/components/diagnostic/DiagnosticRenderer";
import { diagnosticConfig } from "@/data/diagnostic-config";

export default function Diagnostic() {
  return <DiagnosticRenderer config={diagnosticConfig} />;
}
