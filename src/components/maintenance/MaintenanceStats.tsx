import { Card, CardContent } from "@/components/ui/card";
import { Wrench, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MaintenanceRecord {
  id: string;
  status: string;
}

interface MaintenanceStatsProps {
  records: MaintenanceRecord[];
  isLoading: boolean;
}

export const MaintenanceStats = ({ records, isLoading }: MaintenanceStatsProps) => {
  const stats = {
    active: records.filter((r) => r.status === "in_progress").length,
    urgent: records.filter((r) => r.status === "urgent").length,
    scheduled: records.filter((r) => r.status === "scheduled").length,
    completed: records.filter((r) => r.status === "completed").length,
  };

  const statCards = [
    {
      title: "Active Jobs",
      value: stats.active,
      description: "+2 from yesterday",
      icon: Wrench,
      color: "text-blue-500",
    },
    {
      title: "Urgent Repairs",
      value: stats.urgent,
      description: "Requires immediate attention",
      icon: AlertTriangle,
      color: "text-red-500",
    },
    {
      title: "Scheduled",
      value: stats.scheduled,
      description: "Next 7 days",
      icon: Clock,
      color: "text-gray-500",
    },
    {
      title: "Completed",
      value: stats.completed,
      description: "This month",
      icon: CheckCircle,
      color: "text-green-500",
    },
  ];

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
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
    <div className="grid gap-4 md:grid-cols-4 mb-6">
      {statCards.map((stat) => (
        <Card key={stat.title} className="relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </h3>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">
                {stat.description}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};