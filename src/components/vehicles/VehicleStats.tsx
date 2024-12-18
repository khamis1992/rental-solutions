import { Card, CardContent } from "@/components/ui/card";
import { Car, Wrench, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Vehicle {
  id: string;
  status: string;
}

interface VehicleStatsProps {
  vehicles: Vehicle[];
  isLoading: boolean;
}

export const VehicleStats = ({ vehicles, isLoading }: VehicleStatsProps) => {
  // Fetch vehicle counts directly from Supabase
  const { data: vehicleCounts, isLoading: isLoadingCounts } = useQuery({
    queryKey: ["vehicle-counts"],
    queryFn: async () => {
      const { data: vehicles, error } = await supabase
        .from("vehicles")
        .select("status");

      if (error) throw error;

      const counts = {
        available: vehicles.filter(v => v.status === 'available').length,
        maintenance: vehicles.filter(v => v.status === 'maintenance').length,
        needsAttention: vehicles.filter(v => v.status === 'accident').length,
      };

      return counts;
    },
  });

  const statCards = [
    {
      title: "Available Vehicles",
      value: vehicleCounts?.available || 0,
      icon: Car,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    {
      title: "In Maintenance",
      value: vehicleCounts?.maintenance || 0,
      icon: Wrench,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    {
      title: "Needs Attention",
      value: vehicleCounts?.needsAttention || 0,
      icon: AlertTriangle,
      color: "text-red-500",
      bgColor: "bg-red-50",
    },
  ];

  if (isLoadingCounts) {
    return (
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-3 mb-6">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};