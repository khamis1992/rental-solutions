import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardAlerts } from "@/components/dashboard/DashboardAlerts";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { SystemChatbot } from "@/components/chat/SystemChatbot";

interface DashboardData {
  total_vehicles: number;
  available_vehicles: number;
  rented_vehicles: number;
  maintenance_vehicles: number;
  total_customers: number;
  active_rentals: number;
  monthly_revenue: number;
}

const Dashboard = () => {
  const { data: stats } = useQuery<DashboardData>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_dashboard_stats");
      
      if (error) throw error;
      
      return data as DashboardData;
    },
    staleTime: 30000,
  });

  return (
    <div className="pt-[calc(var(--header-height,56px)+2rem)] max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      <div className="flex justify-between items-center bg-secondary rounded-lg p-6 text-white">
        <div>
          <WelcomeHeader />
        </div>
      </div>

      <div className="grid gap-8">
        <DashboardStats />
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <RecentActivity />
        </div>
        <div className="lg:col-span-3">
          <SystemChatbot />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;