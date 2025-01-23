import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Bell, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface Anomaly {
  id: string;
  detection_type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  detected_at: string;
  resolved_at: string | null;
}

export const AnomalyMonitoring = () => {
  const [realtimeAnomalies, setRealtimeAnomalies] = useState<Anomaly[]>([]);

  const { data: initialAnomalies } = useQuery({
    queryKey: ["operational-anomalies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("operational_anomalies")
        .select("*")
        .is("resolved_at", null)
        .order("detected_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as Anomaly[];
    },
  });

  useEffect(() => {
    if (initialAnomalies) {
      setRealtimeAnomalies(initialAnomalies);
    }
  }, [initialAnomalies]);

  useEffect(() => {
    const channel = supabase
      .channel('anomalies-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'operational_anomalies'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRealtimeAnomalies(prev => [payload.new as Anomaly, ...prev].slice(0, 5));
            toast.warning(`New anomaly detected: ${(payload.new as Anomaly).description}`);
          } else if (payload.eventType === 'UPDATE') {
            setRealtimeAnomalies(prev => 
              prev.map(anomaly => 
                anomaly.id === payload.new.id ? payload.new as Anomaly : anomaly
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Real-time Anomaly Monitoring
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {realtimeAnomalies?.map((anomaly) => (
            <div
              key={anomaly.id}
              className="flex items-start justify-between p-4 border rounded-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      anomaly.severity === "high"
                        ? "destructive"
                        : anomaly.severity === "medium"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {anomaly.detection_type}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(anomaly.detected_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{anomaly.description}</p>
              </div>
              {anomaly.severity === "high" ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : (
                <Bell className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          ))}
          {(!realtimeAnomalies || realtimeAnomalies.length === 0) && (
            <div className="text-center text-muted-foreground p-4">
              No active anomalies detected
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};