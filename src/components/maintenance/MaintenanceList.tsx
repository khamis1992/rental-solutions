
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { formatDateToDisplay } from "@/lib/dateUtils";
import { Wrench, Clock, AlertTriangle, CheckCircle, XCircle, Car, Calendar, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreateJobDialog } from "./CreateJobDialog";
import { EditMaintenanceDialog } from "./EditMaintenanceDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VehicleTablePagination } from "@/components/vehicles/table/VehicleTablePagination";
import type { Maintenance } from "@/types/maintenance";

const ITEMS_PER_PAGE = 10;

interface MaintenanceRecord extends Maintenance {
  vehicles?: {
    make: string;
    model: string;
    license_plate: string;
  };
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'in_progress':
      return <Wrench className="h-4 w-4 text-blue-500 animate-spin-slow" />;
    case 'urgent':
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case 'cancelled':
      return <XCircle className="h-4 w-4 text-gray-500" />;
    default:
      return <Clock className="h-4 w-4 text-yellow-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
};

export const MaintenanceList = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);

  const { data: records = [], isLoading, error } = useQuery({
    queryKey: ["maintenance-and-accidents"],
    queryFn: async () => {
      const { data: maintenanceRecords, error: maintenanceError } = await supabase
        .from("maintenance")
        .select(`
          *,
          vehicles (
            make,
            model,
            license_plate
          )
        `)
        .not('status', 'in', '("completed","cancelled")')
        .order('scheduled_date', { ascending: false });

      if (maintenanceError) throw maintenanceError;

      const { data: accidentVehicles, error: vehiclesError } = await supabase
        .from("vehicles")
        .select(`
          id,
          make,
          model,
          license_plate
        `)
        .eq('status', 'accident');

      if (vehiclesError) throw vehiclesError;

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

  const handleStatusChange = async (recordId: string, newStatus: "scheduled" | "in_progress" | "completed" | "cancelled") => {
    try {
      const { error } = await supabase
        .from('maintenance')
        .update({ status: newStatus })
        .eq('id', recordId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['maintenance-and-accidents'] });
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('maintenance')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['maintenance-and-accidents'] });
      toast.success('Job card deleted successfully');
    } catch (error) {
      console.error('Error deleting job card:', error);
      toast.error('Failed to delete job card');
    }
  };

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
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
        <Card className="p-8 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 rounded-full bg-orange-100 border-2 border-orange-200">
              <Wrench className="h-12 w-12 text-primary" />
            </div>
            <p className="text-xl font-semibold text-gray-800">No maintenance records found</p>
            <p className="text-sm text-gray-600 max-w-md">
              Create a new maintenance job to start tracking vehicle maintenance and repairs
            </p>
            <CreateJobDialog />
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentRecords.map((record) => (
          <Card 
            key={record.id} 
            className={`group overflow-hidden hover:shadow-lg transition-shadow duration-200 animate-fade-in relative before:absolute before:left-0 before:top-0 before:h-full before:w-1 ${
              record.status === 'urgent' ? 'before:bg-red-500' :
              record.status === 'in_progress' ? 'before:bg-blue-500' :
              record.status === 'completed' ? 'before:bg-green-500' :
              record.status === 'cancelled' ? 'before:bg-gray-500' :
              'before:bg-yellow-500'
            }`}
          >
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex flex-col space-y-4">
                  <Select
                    value={record.status}
                    onValueChange={(value: "scheduled" | "in_progress" | "completed" | "cancelled") => 
                      handleStatusChange(record.id, value)
                    }
                  >
                    <SelectTrigger className={`w-[130px] ${getStatusColor(record.status)}`}>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Scheduled
                        </div>
                      </SelectItem>
                      <SelectItem value="in_progress">
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4" />
                          In Progress
                        </div>
                      </SelectItem>
                      <SelectItem value="completed">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          Completed
                        </div>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4" />
                          Cancelled
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <EditMaintenanceDialog record={record} />
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete(record.id)}
                    className="hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-center items-center space-x-2">
                <Car className="h-5 w-5 text-primary" />
                <div className="text-center">
                  <p className="text-lg font-medium">
                    {record.vehicles 
                      ? `${record.vehicles.make} ${record.vehicles.model}`
                      : "Vehicle details unavailable"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {record.vehicles?.license_plate || "N/A"}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <div className="flex items-center space-x-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  <p className="text-lg font-medium">{record.service_type}</p>
                </div>
                {record.description && (
                  <p className="text-base text-gray-600 leading-relaxed">{record.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">
                    {formatDateToDisplay(new Date(record.scheduled_date))}
                  </span>
                </div>
                {record.cost && (
                  <div className="px-3 py-1 bg-gray-100 rounded-full flex items-center space-x-1">
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
