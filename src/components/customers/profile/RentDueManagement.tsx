import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { Calendar, AlertTriangle } from "lucide-react";

interface RentDueManagementProps {
  customerId: string;
}

export const RentDueManagement = ({ customerId }: RentDueManagementProps) => {
  const { data: activeAgreement, isLoading } = useQuery({
    queryKey: ["active-agreement", customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leases")
        .select(`
          id,
          rent_amount,
          rent_due_day,
          agreement_number,
          status
        `)
        .eq("customer_id", customerId)
        .eq("status", "active")
        .maybeSingle();  // Changed from .single() to .maybeSingle()

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ["rent-schedules", activeAgreement?.id],
    queryFn: async () => {
      if (!activeAgreement?.id) return [];

      const { data, error } = await supabase
        .from("payment_schedules")
        .select("*")
        .eq("lease_id", activeAgreement.id)
        .eq("status", "pending")
        .gte("due_date", new Date().toISOString())
        .order("due_date")
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: Boolean(activeAgreement?.id),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Loading...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (!activeAgreement) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Rent Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            No active agreement found for this customer
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Rent Payments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {schedules.map((schedule) => {
            const daysUntilDue = differenceInDays(
              new Date(schedule.due_date),
              new Date()
            );
            const isNearDue = daysUntilDue <= 7;

            return (
              <div
                key={schedule.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="font-medium">
                    Due: {format(new Date(schedule.due_date), "PP")}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {daysUntilDue === 0
                      ? "Due today"
                      : `Due in ${daysUntilDue} days`}
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div>{formatCurrency(schedule.amount)}</div>
                  {isNearDue && (
                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Payment due soon
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
          {(!schedules || schedules.length === 0) && (
            <div className="text-center text-muted-foreground">
              No upcoming rent payments scheduled
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};