import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { AlertItem } from "./AlertItem";
import { AlertDetailsDialog } from "./AlertDetailsDialog";
import { AlertDetails } from "./types/alert-types";

export function DashboardAlerts() {
  const [selectedAlert, setSelectedAlert] = useState<AlertDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: alerts } = useQuery({
    queryKey: ["dashboard-alerts"],
    queryFn: async () => {
      const [overdueVehicles, overduePayments, maintenanceAlerts] = await Promise.all([
        supabase
          .from("leases")
          .select(`
            id,
            vehicle:vehicle_id (
              id, make, model, year, license_plate
            ),
            customer:customer_id (
              full_name,
              phone_number
            )
          `)
          .gt("end_date", new Date().toISOString())
          .eq("status", "active"),

        supabase
          .from("payment_schedules")
          .select(`
            id,
            lease:lease_id (
              id,
              customer:customer_id (
                full_name,
                phone_number
              )
            )
          `)
          .lt("due_date", new Date().toISOString())
          .eq("status", "pending"),

        supabase
          .from("maintenance")
          .select(`
            id,
            vehicle:vehicle_id (
              id, make, model, year, license_plate
            )
          `)
          .eq("status", "scheduled")
          .lt("scheduled_date", new Date().toISOString()),
      ]);

      return {
        overdueVehicles: overdueVehicles.data || [],
        overduePayments: overduePayments.data || [],
        maintenanceAlerts: maintenanceAlerts.data || [],
      };
    },
  });

  const handleAlertClick = (alert: AlertDetails) => {
    setSelectedAlert(alert);
    setDialogOpen(true);
  };

  if (!alerts || 
      (!alerts.overdueVehicles?.length && 
       !alerts.overduePayments?.length && 
       !alerts.maintenanceAlerts?.length)) {
    return null;
  }

  const renderAlertGroup = (title: string, alertsArray: AlertDetails[]) => {
    if (!alertsArray.length) return null;
    
    const firstAlert = alertsArray[0];
    
    return (
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground mb-2 text-center">{title}</h3>
        <AlertItem
          key={firstAlert.id}
          alert={firstAlert}
          onClick={() => handleAlertClick(firstAlert)}
          count={alertsArray.length}
        />
      </div>
    );
  };

  return (
    <>
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-lg font-medium">Alerts & Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
              {renderAlertGroup("Vehicle Returns", alerts.overdueVehicles?.map(vehicle => ({
                type: 'vehicle',
                title: 'Overdue Vehicle Details',
                vehicle: vehicle.vehicle,
                customer: vehicle.customer,
                id: vehicle.id
              })) || [])}

              {renderAlertGroup("Payment Alerts", alerts.overduePayments?.map(payment => ({
                type: 'payment',
                title: 'Overdue Payment Details',
                customer: payment.lease?.customer,
                id: payment.id
              })) || [])}

              {renderAlertGroup("Maintenance Alerts", alerts.maintenanceAlerts?.map(maintenance => ({
                type: 'maintenance',
                title: 'Maintenance Alert Details',
                vehicle: maintenance.vehicle,
                id: maintenance.id
              })) || [])}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <AlertDetailsDialog
        alert={selectedAlert}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
