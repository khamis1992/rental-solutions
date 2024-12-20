import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { UpcomingRentals } from "@/components/dashboard/UpcomingRentals";
import { DashboardAlerts } from "@/components/dashboard/DashboardAlerts";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { WelcomeHeader } from "@/components/dashboard/WelcomeHeader";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { IntelligentScheduling } from "@/components/dashboard/IntelligentScheduling";
import { usePerformanceMonitoring } from "@/hooks/use-performance-monitoring";
import { useDashboardSubscriptions } from "@/hooks/use-dashboard-subscriptions";

const Index = () => {
  // Initialize performance monitoring
  usePerformanceMonitoring();
  
  // Initialize real-time subscriptions
  useDashboardSubscriptions();

  return (
    <DashboardLayout>
      <div className="space-y-8 px-4 py-6">
        <WelcomeHeader />
        
        <div className="grid gap-6">
          <DashboardStats />
          <QuickActions />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <UpcomingRentals />
          </div>
          <div className="lg:col-span-3">
            <DashboardAlerts />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <RecentActivity />
          </div>
          <div className="lg:col-span-3">
            <IntelligentScheduling />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;