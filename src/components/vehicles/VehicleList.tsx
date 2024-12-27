import { useState } from "react";
import { VehicleGrid } from "./VehicleGrid";
import { VehicleListView } from "./table/VehicleListView";
import { AdvancedVehicleFilters, VehicleFilters } from "./filters/AdvancedVehicleFilters";
import { Vehicle } from "@/types/database/vehicle.types";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface VehicleListProps {
  vehicles: Vehicle[];
  isLoading: boolean;
}

export const VehicleList = ({ vehicles, isLoading }: VehicleListProps) => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<VehicleFilters>({
    search: "",
    status: "all",
    location: "",
    makeModel: "",
    yearRange: {
      from: null,
      to: null,
    },
  });

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const handleVehicleClick = (vehicleId: string) => {
    console.log("Navigating to vehicle:", vehicleId); // Debug log
    navigate(`/vehicles/${vehicleId}`);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading vehicles...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <AdvancedVehicleFilters onFilterChange={setFilters} />
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('grid')}
            title="Grid View"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setViewMode('list')}
            title="List View"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {viewMode === 'grid' ? (
        <VehicleGrid 
          vehicles={vehicles || []} 
          onVehicleClick={handleVehicleClick}
        />
      ) : (
        <VehicleListView 
          vehicles={vehicles || []} 
          onVehicleClick={handleVehicleClick}
        />
      )}
    </div>
  );
};