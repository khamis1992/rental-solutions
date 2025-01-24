import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";

export const CashFlowMonitoring = () => {
  const { data: alerts } = useQuery({
    queryKey: ["cash-flow-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_flow_alerts")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="h-5 w-5" />;
      case "medium":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <CheckCircle className="h-5 w-5" />;
    }
  };

  const getAlertVariant = (severity: string) => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {alerts?.map((alert) => (
            <Alert
              key={alert.id}
              variant={getAlertVariant(alert.severity)}
            >
              <div className="flex items-start gap-4">
                {getAlertIcon(alert.severity)}
                <div>
                  <AlertTitle>{alert.alert_type}</AlertTitle>
                  <AlertDescription>
                    {alert.message}
                    <div className="mt-2 font-semibold">
                      Current: {formatCurrency(alert.current_amount)} / Threshold: {formatCurrency(alert.threshold_amount)}
                    </div>
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
          {!alerts?.length && (
            <p className="text-muted-foreground text-center py-4">
              No active cash flow alerts
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};