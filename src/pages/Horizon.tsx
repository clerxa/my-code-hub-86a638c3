import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmployeeLayout } from "@/components/employee/EmployeeLayout";
import { HorizonDashboard } from "@/components/horizon/HorizonDashboard";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export default function Horizon() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.role !== "admin") {
          navigate("/employee", { replace: true });
        } else {
          setChecking(false);
        }
      });
  }, [user?.id, navigate]);

  if (checking) {
    return (
      <EmployeeLayout activeSection="horizon">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-40 w-full" />
        </div>
      </EmployeeLayout>
    );
  }

  return (
    <EmployeeLayout activeSection="horizon">
      <HorizonDashboard />
    </EmployeeLayout>
  );
}
