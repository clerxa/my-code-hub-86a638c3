import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { TaxDeclarationWizard } from "@/components/tax-declaration/TaxDeclarationWizard";

export default function TaxDeclarationHelp() {
  return (
    <EmployeeLayout activeSection="tax-declaration">
      <TaxDeclarationWizard />
    </EmployeeLayout>
  );
}
