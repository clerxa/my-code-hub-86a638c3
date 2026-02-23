import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { HorizonDashboard } from "@/components/horizon/HorizonDashboard";

export default function Horizon() {
  return (
    <EmployeeLayout activeSection="horizon">
      <HorizonDashboard />
    </EmployeeLayout>
  );
}
