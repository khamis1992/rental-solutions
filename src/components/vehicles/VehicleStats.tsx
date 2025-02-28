
import { Card, CardContent } from "@/components/ui/card";
import { Car, Wrench, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Vehicle {
  id: string;
  status: string;
}

interface VehicleStatsProps {
  vehicles: Vehicle[];
  isLoading: boolean;
}

export const VehicleStats = ({ vehicles, isLoading }: VehicleStatsProps) => {
  const isMobile = useIsMobile();
  
  const { data: vehicleCounts, isLoading: isLoadingCounts } = useQuery({
    queryKey: ["vehicle-counts"],
    queryFn: async () => {
      console.log("Fetching vehicle counts...");
      const { data: vehicles, error } = await supabase
        .from("vehicles")
        .select("status");

      if (error) {
        console.error("Error fetching vehicles:", error);
        throw error;
      }

      console.log("Retrieved vehicles:", vehicles);

      const counts = {
        available: vehicles.filter(v => v.status === 'available').length,
        maintenance: vehicles.filter(v => v.status === 'maintenance').length,
        needsAttention: vehicles.filter(v => ['accident', 'police_station'].includes(v.status)).length,
      };

      // Calculate trends (mock data for demonstration)
      const trends = {
        available: 0.05, // 5% increase
        maintenance: -0.02, // 2% decrease
        needsAttention: 0.01 // 1% increase
      };

      console.log("Calculated counts:", counts);
      return { counts, trends };
    },
  });

  const mainStats = [
    {
      title: "Available Vehicles",
      value: vehicleCounts?.counts?.available || 0,
      trend: vehicleCounts?.trends?.available || 0,
      icon: Car,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      ringColor: "ring-emerald-500/20",
      description: "Ready for use",
      trendDescription: "from last month"
    },
    {
      title: "In Maintenance",
      value: vehicleCounts?.counts?.maintenance || 0,
      trend: vehicleCounts?.trends?.maintenance || 0,
      icon: Wrench,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      ringColor: "ring-amber-500/20",
      description: "Under service",
      trendDescription: "from last month"
    },
    {
      title: "Needs Attention",
      value: vehicleCounts?.counts?.needsAttention || 0,
      trend: vehicleCounts?.trends?.needsAttention || 0,
      icon: AlertTriangle,
      color: "text-rose-500",
      bgColor: "bg-rose-500/10",
      ringColor: "ring-rose-500/20",
      description: "Requires immediate action",
      trendDescription: "from last month"
    },
  ];

  if (isLoadingCounts) {
    return (
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-3'}`}>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2 mx-auto" />
              <Skeleton className="h-8 w-16 mx-auto" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-3'}`}>
      {mainStats.map((stat) => (
        <Card 
          key={stat.title}
          className={cn(
            "group hover:shadow-lg transition-all duration-300 touch-target",
            "bg-gradient-to-br from-white/50 to-white/30 dark:from-gray-800/50 dark:to-gray-800/30",
            "backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50",
            "hover:border-gray-300 dark:hover:border-gray-600",
            isMobile ? "" : "hover:translate-y-[-2px]"
          )}
        >
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-between space-y-4 animate-fade-in">
              <div className={cn(
                "p-3 rounded-full transition-all duration-300 group-hover:scale-110",
                stat.bgColor,
                stat.ringColor,
                "ring-1 shadow-sm group-hover:shadow-md"
              )}>
                <stat.icon className={cn("h-6 w-6", stat.color)} />
              </div>
              <div className="text-center space-y-2">
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                  {stat.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <div className={cn(
                  "flex items-center justify-center gap-1 text-xs",
                  stat.trend > 0 ? "text-emerald-500" : "text-rose-500"
                )}>
                  {stat.trend > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{Math.abs(stat.trend * 100)}% {stat.trendDescription}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
