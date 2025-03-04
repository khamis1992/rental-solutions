
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Vehicle, VehicleStatus } from "@/types/vehicle";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VehicleStatusCell } from "@/components/vehicles/table/VehicleStatusCell";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Car } from "lucide-react";
import { STATUS_CONFIG } from "./VehicleStatusChartV2";
import { Link, useNavigate } from "react-router-dom";

interface VehicleStatusDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  status: VehicleStatus;
  vehicles: Vehicle[];
  isLoading: boolean;
}

export const VehicleStatusDetailsDialog = ({
  isOpen,
  onClose,
  status,
  vehicles,
  isLoading,
}: VehicleStatusDetailsDialogProps) => {
  const navigate = useNavigate();
  const statusConfig = STATUS_CONFIG[status];

  const handleVehicleClick = (vehicleId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
    setTimeout(() => {
      navigate(`/vehicles/${vehicleId}`);
    }, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div 
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${statusConfig?.color}15` }}
            >
              <Car className="h-5 w-5" style={{ color: statusConfig?.color }} />
            </div>
            {statusConfig?.label || status} Vehicles
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Car className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No vehicles found</h3>
            <p className="text-muted-foreground">
              There are no vehicles currently with the status: {statusConfig?.label || status}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Plate</TableHead>
                <TableHead>Make</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Location</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id} className="group">
                  <TableCell>
                    <Link 
                      to={`/vehicles/${vehicle.id}`}
                      onClick={(e) => handleVehicleClick(vehicle.id, e)}
                      className="font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                    >
                      {vehicle.license_plate}
                    </Link>
                  </TableCell>
                  <TableCell>{vehicle.make}</TableCell>
                  <TableCell>{vehicle.model}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {vehicle.year}
                    </Badge>
                  </TableCell>
                  <TableCell>{vehicle.location || "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
};
