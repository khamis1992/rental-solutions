
import { useState, useEffect } from "react";
import { DeleteVehicleDialog } from "./DeleteVehicleDialog";
import { VehicleListView } from "./table/VehicleListView";
import { VehicleGrid } from "./VehicleGrid";
import { BulkActionsMenu } from "./components/BulkActionsMenu";
import { Vehicle } from "@/types/vehicle";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface VehicleListProps {
  vehicles: Vehicle[];
  isLoading: boolean;
  viewMode?: "list" | "grid";
}

export const VehicleList = ({ vehicles, isLoading, viewMode = "list" }: VehicleListProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();

  // Set up real-time subscription for vehicle status changes
  useEffect(() => {
    const channel = supabase
      .channel('vehicle-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicles'
        },
        async (payload) => {
          console.log('Vehicle status changed:', payload);
          
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["vehicles"] }),
            queryClient.invalidateQueries({ queryKey: ["vehicle-status-counts"] })
          ]);

          if (payload.eventType === 'UPDATE' && payload.new.status !== payload.old.status) {
            const vehicleInfo = `${payload.new.make} ${payload.new.model} (${payload.new.license_plate})`;
            toast.info(`Vehicle ${vehicleInfo} status updated to ${payload.new.status}`);
          }
        }
      )
      .subscribe();   

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleDeleteVehicle = async () => {
    try {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .in('id', selectedVehicles);

      if (error) throw error;

      toast.success(`${selectedVehicles.length} vehicle(s) deleted successfully`);
      setShowDeleteDialog(false);
      setSelectedVehicles([]);
    } catch (error) {
      console.error('Error deleting vehicles:', error);
      toast.error('Failed to delete vehicles');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVehicles = vehicles.slice(startIndex, endIndex);
  const totalPages = Math.ceil(vehicles.length / itemsPerPage);

  if (viewMode === "grid") {
    return (
      <div className="space-y-4">
        {selectedVehicles.length > 0 && (
          <BulkActionsMenu
            selectedCount={selectedVehicles.length}
            onDelete={() => setShowDeleteDialog(true)}
          />
        )}
        <VehicleGrid vehicles={currentVehicles} />
        <DeleteVehicleDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onDelete={handleDeleteVehicle}
          count={selectedVehicles.length}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedVehicles.length > 0 && (
        <BulkActionsMenu
          selectedCount={selectedVehicles.length}
          onDelete={() => setShowDeleteDialog(true)}
        />
      )}

      <VehicleListView
        vehicles={currentVehicles}
        isLoading={isLoading}
        selectedVehicles={selectedVehicles}
        onSelectionChange={setSelectedVehicles}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      <DeleteVehicleDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDelete={handleDeleteVehicle}
        count={selectedVehicles.length}
      />
    </div>
  );
};
