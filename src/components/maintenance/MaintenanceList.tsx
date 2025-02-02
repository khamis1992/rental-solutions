import { Table, TableBody } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { MaintenanceTableHeader } from "./table/MaintenanceTableHeader";
import { MaintenanceTableRow } from "./table/MaintenanceTableRow";
import { VehicleTablePagination } from "../vehicles/table/VehicleTablePagination";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Car, Calendar, Clock, Wrench, Edit2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreateJobDialog } from "./CreateJobDialog";
import { EditMaintenanceDialog } from "./EditMaintenanceDialog";
import type { Maintenance } from "@/types/maintenance";

const ITEMS_PER_PAGE = 10;

interface Vehicle {
  make: string;
  model: string;
  year: number;
  license_plate: string;
}

interface MaintenanceRecord extends Maintenance {
  vehicles?: Vehicle;
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-50 text-blue-800 border-blue-100';
    case 'in_progress':
      return 'bg-yellow-50 text-yellow-800 border-yellow-100';
    case 'completed':
      return 'bg-green-50 text-green-800 border-green-100';
    case 'accident':
      return 'bg-red-50 text-red-800 border-red-100';
    case 'cancelled':
      return 'bg-gray-50 text-gray-800 border-gray-100';
    default:
      return 'bg-gray-50 text-gray-800 border-gray-100';
  }
};

export const MaintenanceList = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Subscribe to both maintenance and vehicle status changes
    const maintenanceChannel = supabase
      .channel('maintenance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance'
        },
        async (payload) => {
          console.log('Maintenance update received:', payload);
          await queryClient.invalidateQueries({ queryKey: ['maintenance-and-accidents'] });
          
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

    const vehicleChannel = supabase
      .channel('vehicle-status-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vehicles',
          filter: 'status=in.(maintenance,accident)'
        },
        async (payload) => {
          console.log('Vehicle status changed:', payload);
          await queryClient.invalidateQueries({ queryKey: ['maintenance-and-accidents'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(maintenanceChannel);
      supabase.removeChannel(vehicleChannel);
    };
  }, [queryClient]);

  const { data: records = [], isLoading, error } = useQuery({
    queryKey: ["maintenance-and-accidents"],
    queryFn: async () => {
      // First get maintenance records
      const { data: maintenanceRecords, error: maintenanceError } = await supabase
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
        .not('status', 'in', '("completed","cancelled")')
        .order('scheduled_date', { ascending: false });

      if (maintenanceError) throw maintenanceError;

      // Then get accident vehicles
      const { data: accidentVehicles, error: vehiclesError } = await supabase
        .from("vehicles")
        .select(`
          id,
          make,
          model,
          year,
          license_plate
        `)
        .eq('status', 'accident');

      if (vehiclesError) throw vehiclesError;

      // Create maintenance records for accident vehicles
      const accidentRecords: MaintenanceRecord[] = accidentVehicles.map(vehicle => ({
        id: `accident-${vehicle.id}`,
        vehicle_id: vehicle.id,
        service_type: 'Accident Repair',
        status: 'scheduled',
        scheduled_date: new Date().toISOString(),
        cost: null,
        description: 'Vehicle reported in accident status',
        vehicles: vehicle,
        completed_date: null,
        performed_by: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category_id: null
      }));

      return [...maintenanceRecords, ...accidentRecords].sort((a, b) => 
        new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()
      );
    },
  });

  const totalPages = Math.ceil(records.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentRecords = records.slice(startIndex, endIndex);

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load maintenance records. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 space-y-4">
            <div className="animate-pulse space-y-3">
              <Skeleton className="h-6 w-[70%]" />
              <Skeleton className="h-4 w-[100%]" />
              <Skeleton className="h-4 w-[60%]" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <CreateJobDialog />
        </div>
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <Wrench className="h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">No maintenance records found</p>
            <p className="text-sm text-muted-foreground">
              Create a new maintenance job to get started
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <CreateJobDialog />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {currentRecords.map((record) => (
          <Card 
            key={record.id} 
            className={`overflow-hidden hover:shadow-lg transition-shadow duration-200 border-l-4 ${getStatusStyles(record.status)}`}
          >
            <div className="p-6 space-y-6">
              {/* Vehicle Info */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <Car className={`h-6 w-6 ${
                    record.status === 'accident' ? 'text-red-500' :
                    record.status === 'in_progress' ? 'text-yellow-500' :
                    'text-primary'
                  }`} />
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {record.vehicles 
                        ? `${record.vehicles.year} ${record.vehicles.make} ${record.vehicles.model}`
                        : "Vehicle details unavailable"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {record.vehicles?.license_plate || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles(record.status)}`}>
                    {record.status}
                  </div>
                  <EditMaintenanceDialog record={record} />
                </div>
              </div>

              {/* Service Info */}
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5 text-gray-500" />
                  <p className="text-lg font-medium text-gray-900">{record.service_type}</p>
                </div>
                {record.description && (
                  <p className="text-base text-gray-600 leading-relaxed">{record.description}</p>
                )}
              </div>

              {/* Date & Cost */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    {new Date(record.scheduled_date).toLocaleDateString()}
                  </span>
                </div>
                {record.cost && (
                  <div className="flex items-center space-x-1 bg-gray-50 px-3 py-1 rounded-full">
                    <span className="font-medium text-primary">{record.cost}</span>
                    <span className="text-sm text-gray-500">QAR</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-center mt-6">
        <VehicleTablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};