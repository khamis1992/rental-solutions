import { Table, TableBody } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { toast } from "sonner";
import { MaintenanceTableHeader } from "./table/MaintenanceTableHeader";
import { MaintenanceTableRow } from "./table/MaintenanceTableRow";

export type MaintenanceStatus = "scheduled" | "in_progress" | "completed" | "cancelled" | "urgent";
export type VehicleStatus = "maintenance" | "available" | "rented" | "retired" | "police_station" | "accident" | "reserve" | "stolen";

interface MaintenanceRecord {
  id: string;
  vehicle_id: string;
  service_type: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  scheduled_date: string;
  cost: number | null;
  vehicles: {
    make: string;
    model: string;
    year: number;
    license_plate: string;
  };
}

interface AccidentMaintenanceRecord {
  id: string;
  vehicle_id: string;
  service_type: string;
  status: "urgent";
  scheduled_date: string;
  cost: number | null;
  vehicles: {
    make: string;
    model: string;
    year: number;
    license_plate: string;
  };
}

type CombinedMaintenanceRecord = MaintenanceRecord | AccidentMaintenanceRecord;

export const MaintenanceList = () => {
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('maintenance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance'
        },
        async (payload) => {
          console.log('Real-time update received:', payload);
          
          // Invalidate and refetch queries
          await queryClient.invalidateQueries({ queryKey: ['maintenance'] });
          await queryClient.invalidateQueries({ queryKey: ['vehicles'] });
          
          const eventType = payload.eventType;
          const message = eventType === 'INSERT' 
            ? 'New maintenance record created'
            : eventType === 'UPDATE'
            ? 'Maintenance record updated'
            : 'Maintenance record deleted';
          
          toast.info(message);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Query to get vehicles in accident status
  const { data: accidentVehicles = [], isLoading: isLoadingAccidents } = useQuery({
    queryKey: ["accident-vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, make, model, year, license_plate, status")
        .eq("status", "accident");

      if (error) throw error;
      
      return data.map(vehicle => ({
        id: vehicle.id,
        vehicle_id: vehicle.id,
        service_type: "Accident Repair",
        status: "urgent" as const,
        scheduled_date: new Date().toISOString(),
        cost: null,
        vehicles: {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          license_plate: vehicle.license_plate
        }
      }));
    }
  });

  // Query to get maintenance records
  const { data: maintenanceRecords = [], isLoading: isLoadingMaintenance } = useQuery({
    queryKey: ["maintenance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance")
        .select(`
          *,
          vehicles (
            make,
            model,
            year,
            license_plate
          )
        `)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;
      return data as MaintenanceRecord[];
    },
  });

  // Combine regular maintenance records with accident vehicles
  const allRecords: CombinedMaintenanceRecord[] = [...maintenanceRecords, ...accidentVehicles];

  if (isLoadingMaintenance || isLoadingAccidents) {
    return (
      <div className="rounded-md border">
        <Table>
          <MaintenanceTableHeader />
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td><Skeleton className="h-4 w-[120px]" /></td>
                <td><Skeleton className="h-4 w-[200px]" /></td>
                <td><Skeleton className="h-4 w-[100px]" /></td>
                <td><Skeleton className="h-4 w-[100px]" /></td>
                <td><Skeleton className="h-4 w-[150px]" /></td>
                <td><Skeleton className="h-4 w-[100px]" /></td>
              </tr>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <MaintenanceTableHeader />
        <TableBody>
          {allRecords.map((record) => (
            <MaintenanceTableRow key={record.id} record={record} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};