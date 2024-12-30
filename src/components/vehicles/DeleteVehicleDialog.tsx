import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface DeleteVehicleDialogProps {
  vehicleId: string;
  vehicleName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteVehicleDialog = ({
  vehicleId,
  vehicleName,
  open,
  onOpenChange,
}: DeleteVehicleDialogProps) => {
  const queryClient = useQueryClient();

  const deleteVehicle = useMutation({
    mutationFn: async () => {
      console.log("Starting force deletion process for vehicle:", vehicleId);
      
      // 1. Delete vehicle sensor data
      const { error: sensorError } = await supabase
        .from('vehicle_sensor_data')
        .delete()
        .eq('vehicle_id', vehicleId);
      
      if (sensorError) {
        console.error("Error deleting sensor data:", sensorError);
      }

      // 2. Delete fleet optimization recommendations
      const { error: fleetOptError } = await supabase
        .from('fleet_optimization_recommendations')
        .delete()
        .eq('vehicle_id', vehicleId);

      if (fleetOptError) {
        console.error("Error deleting fleet optimization records:", fleetOptError);
      }

      // 3. Delete maintenance predictions
      const { error: maintenancePredError } = await supabase
        .from('maintenance_predictions')
        .delete()
        .eq('vehicle_id', vehicleId);

      if (maintenancePredError) {
        console.error("Error deleting maintenance predictions:", maintenancePredError);
      }

      // 4. Delete vehicle inspections
      const { error: inspectionError } = await supabase
        .from('vehicle_inspections')
        .delete()
        .eq('vehicle_id', vehicleId);

      if (inspectionError) {
        console.error("Error deleting inspections:", inspectionError);
      }

      // 5. Delete maintenance records
      const { error: maintenanceError } = await supabase
        .from('maintenance')
        .delete()
        .eq('vehicle_id', vehicleId);

      if (maintenanceError) {
        console.error("Error deleting maintenance records:", maintenanceError);
      }

      // 6. Delete traffic fines
      const { error: finesError } = await supabase
        .from('traffic_fines')
        .delete()
        .eq('vehicle_id', vehicleId);

      if (finesError) {
        console.error("Error deleting traffic fines:", finesError);
      }

      // 7. Delete agreement documents
      const { error: docsError } = await supabase
        .from('agreement_documents')
        .delete()
        .eq('vehicle_id', vehicleId);

      if (docsError) {
        console.error("Error deleting agreement documents:", docsError);
      }

      // 8. Delete vehicle schedules
      const { error: scheduleError } = await supabase
        .from('vehicle_schedules')
        .delete()
        .eq('vehicle_id', vehicleId);

      if (scheduleError) {
        console.error("Error deleting vehicle schedules:", scheduleError);
      }

      // 9. Delete optimized routes
      const { error: routesError } = await supabase
        .from('optimized_routes')
        .delete()
        .eq('vehicle_id', vehicleId);

      if (routesError) {
        console.error("Error deleting optimized routes:", routesError);
      }

      // 10. Delete leases
      const { error: leaseError } = await supabase
        .from('leases')
        .delete()
        .eq('vehicle_id', vehicleId);

      if (leaseError) {
        console.error("Error deleting leases:", leaseError);
      }

      // Finally, delete the vehicle
      console.log("Attempting to delete vehicle:", vehicleId);
      const { error: deleteVehicleError } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (deleteVehicleError) {
        console.error("Error deleting vehicle:", deleteVehicleError);
        throw deleteVehicleError;
      }

      console.log("Vehicle deletion completed successfully");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success("Vehicle deleted successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Error in delete mutation:', error);
      toast.error("Failed to delete vehicle. Please try again or contact support.");
    },
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {vehicleName} and all related records. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => deleteVehicle.mutate()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};