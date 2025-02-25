
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { Card } from "@/components/ui/card";
import { SmartNotifications } from "@/components/dashboard/SmartNotifications";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { VehicleStatusChartV2 } from "@/components/dashboard/enhanced/VehicleStatusChartV2";

interface DashboardStats {
  total_vehicles: number;
  available_vehicles: number;
  rented_vehicles: number;
  maintenance_vehicles: number;
  total_customers: number;
  active_rentals: number;
  monthly_revenue: number;
}

const Dashboard = () => {
  const { data: statsData, error, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // First, let's log the query execution
      console.log("Fetching dashboard stats...");

      const { data, error } = await supabase.rpc('get_dashboard_stats');
      
      if (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error;
      }

      if (!data) {
        console.error("No data returned from dashboard stats");
        throw new Error("No data returned from dashboard stats");
      }

      console.log("Received dashboard stats:", data);

      // Convert the data to the correct format with default values
      const statsData: DashboardStats = {
        total_vehicles: Number(data.total_vehicles || 0),
        available_vehicles: Number(data.available_vehicles || 0),
        rented_vehicles: Number(data.rented_vehicles || 0),
        maintenance_vehicles: Number(data.maintenance_vehicles || 0),
        total_customers: Number(data.total_customers || 0),
        active_rentals: Number(data.active_rentals || 0),
        monthly_revenue: Number(data.monthly_revenue || 0)
      };

      return statsData;
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    meta: {
      onError: (err: Error) => {
        console.error("Dashboard stats error:", err);
        toast.error("Failed to load dashboard stats: " + err.message);
      }
    }
  });

  // If there's an error, show it
  if (error) {
    console.error("Dashboard query error:", error);
    toast.error("Error loading dashboard data");
  }

  // Log the current stats data for debugging
  console.log("Current stats data:", statsData);

  return (
    <div className="space-y-6 mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-[1400px] animate-fade-in">
      <Card className="bg-gradient-to-r from-purple-50/90 to-blue-50/90 dark:from-purple-900/20 dark:to-blue-900/20 border-none shadow-lg">
        <div className="p-6">
          <WelcomeHeader />
        </div>
      </Card>

      <div className="grid gap-6">
        <DashboardStats stats={statsData} />
      </div>

      <VehicleStatusChartV2 />

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        <Card className="bg-white/50 backdrop-blur-sm border-gray-200/50 hover:border-gray-300 transition-all duration-300 h-[400px]">
          <ScrollArea className="h-full">
            <SmartNotifications />
          </ScrollArea>
        </Card>
        
        <Card className="bg-white/50 backdrop-blur-sm border-gray-200/50 hover:border-gray-300 transition-all duration-300 h-[400px]">
          <ScrollArea className="h-full">
            <RecentActivity />
          </ScrollArea>
        </Card>
      </div>

      <div className="w-full">
        <QuickActions />
      </div>
    </div>
  );
};

export default Dashboard;
