import { useEffect, useState } from "react";
import { Vehicle } from "@/types/database/vehicle.types";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VehicleGridProps {
  vehicles: Vehicle[];
  onVehicleClick?: (vehicleId: string) => void;
}

export const VehicleGrid = ({ vehicles, onVehicleClick }: VehicleGridProps) => {
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [locationValue, setLocationValue] = useState("");

  useEffect(() => {
    const channel = supabase
      .channel('vehicle-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'vehicles',
          filter: 'location=neq.null'
        },
        (payload: any) => {
          const updatedVehicle = payload.new;
          if (updatedVehicle.location) {
            toast(`${updatedVehicle.make} ${updatedVehicle.model} location updated to ${updatedVehicle.location}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleLocationClick = (e: React.MouseEvent, vehicleId: string, currentLocation: string) => {
    e.stopPropagation();
    setEditingLocation(vehicleId);
    setLocationValue(currentLocation || "");
  };

  const handleLocationKeyPress = async (e: React.KeyboardEvent, vehicleId: string) => {
    if (e.key === 'Enter') {
      await handleLocationUpdate(vehicleId);
    } else if (e.key === 'Escape') {
      setEditingLocation(null);
    }
  };

  const handleLocationUpdate = async (vehicleId: string) => {
    if (!locationValue.trim()) return;

    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ location: locationValue })
        .eq('id', vehicleId);

      if (error) throw error;

      toast("Location updated successfully");
      setEditingLocation(null);
    } catch (error) {
      console.error('Error updating location:', error);
      toast("Failed to update location");
    }
  };

  return (
    <>
      {vehicles.map((vehicle) => (
        <Card
          key={vehicle.id}
          className="flex flex-col h-[320px] cursor-pointer hover:shadow-md transition-shadow bg-white"
          onClick={() => onVehicleClick?.(vehicle.id)}
        >
          {vehicle.image_url ? (
            <div className="relative w-full h-48">
              <img
                src={vehicle.image_url}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400">No image available</span>
            </div>
          )}
          <div className="p-4 flex flex-col flex-grow">
            <h3 className="text-lg font-medium truncate">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-sm text-muted-foreground mb-2">
              License Plate: {vehicle.license_plate}
            </p>
            <div 
              className="flex items-center text-sm cursor-pointer hover:bg-gray-100 p-2 rounded mt-auto"
              onClick={(e) => handleLocationClick(e, vehicle.id, vehicle.location || "")}
            >
              {editingLocation === vehicle.id ? (
                <Input
                  value={locationValue}
                  onChange={(e) => setLocationValue(e.target.value)}
                  onKeyDown={(e) => handleLocationKeyPress(e, vehicle.id)}
                  onBlur={() => handleLocationUpdate(vehicle.id)}
                  autoFocus
                  className="w-full"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <MapPin className="h-4 w-4 mr-1" />
                  {vehicle.location || "Not available"}
                </>
              )}
            </div>
          </div>
        </Card>
      ))}
    </>
  );
};