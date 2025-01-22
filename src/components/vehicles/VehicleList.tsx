import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";
import { DeleteVehicleDialog } from "./DeleteVehicleDialog";
import { VehicleStats } from "./VehicleStats";
import { VehicleListView } from "./table/VehicleListView";
import { AdvancedVehicleFilters } from "./filters/AdvancedVehicleFilters";
import { BulkActionsMenu } from "./components/BulkActionsMenu";
import { VehicleTablePagination } from "./table/VehicleTablePagination";
import { Vehicle } from "@/types/vehicle";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface VehicleListProps {
  vehicles: Vehicle[];
  isLoading: boolean;
}

export const VehicleList = ({ vehicles, isLoading }: VehicleListProps) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Vehicle['status'] | "all">("available");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleUpdateStatus = async (status: Vehicle['status']) => {
    try {
      const { error } = await supabase
        .from("vehicles")
        .update({ status })
        .in("id", selectedVehicles);

      if (error) throw error;
      toast.success("Vehicles status updated successfully");
      setSelectedVehicles([]);
    } catch (error) {
      console.error("Error updating vehicles status:", error);
      toast.error("Failed to update vehicles status");
    }
  };

  const handleScheduleMaintenance = () => {
    toast.info("Maintenance scheduling coming soon");
  };

  const handleExport = () => {
    toast.info("Export functionality coming soon");
  };

  const handleArchive = () => {
    toast.info("Archive functionality coming soon");
  };

  const handleDeleteComplete = () => {
    setSelectedVehicles([]);
    setShowDeleteDialog(false);
  };

  // Calculate pagination
  const totalPages = Math.ceil(vehicles.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVehicles = vehicles.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vehicles</h1>
      </div>

      <VehicleStats vehicles={vehicles} isLoading={isLoading} />

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <AdvancedVehicleFilters 
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            onSearchChange={setSearchQuery}
            onStatusChange={setStatusFilter}
          />
          {selectedVehicles.length > 0 && (
            <BulkActionsMenu
              selectedCount={selectedVehicles.length}
              onUpdateStatus={handleUpdateStatus}
              onScheduleMaintenance={handleScheduleMaintenance}
              onExport={handleExport}
              onArchive={handleArchive}
            />
          )}
        </div>

        <VehicleListView
          vehicles={paginatedVehicles}
          isLoading={isLoading}
          selectedVehicles={selectedVehicles}
          onSelectionChange={setSelectedVehicles}
        />

        <VehicleTablePagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      <DeleteVehicleDialog
        vehicleId={selectedVehicles[0]}
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onDeleteComplete={handleDeleteComplete}
      />
    </div>
  );
};