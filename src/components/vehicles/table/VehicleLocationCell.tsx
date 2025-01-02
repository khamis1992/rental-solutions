import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VehicleLocationCellProps {
  vehicleId: string;
  isEditing: boolean;
  location: string | null;
  locationValue: string;
  onLocationChange: (value: string) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
  onBlur: () => void;
  onClick: (e: React.MouseEvent) => void;
}

export const VehicleLocationCell = ({
  vehicleId,
  isEditing,
  location,
  locationValue,
  onLocationChange,
  onKeyPress,
  onBlur,
  onClick,
}: VehicleLocationCellProps) => {
  const [updating, setUpdating] = useState(false);

  const handleLocationUpdate = async () => {
    if (!locationValue.trim()) return;
    
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('vehicles')
        .update({ location: locationValue })
        .eq('id', vehicleId);

      if (error) throw error;

      toast("Location updated successfully");
    } catch (error) {
      console.error('Error updating location:', error);
      toast("Failed to update location");
    } finally {
      setUpdating(false);
    }
  };

  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      await handleLocationUpdate();
      onBlur();
    } else if (e.key === 'Escape') {
      onBlur();
    }
    onKeyPress(e);
  };

  const handleBlur = async () => {
    await handleLocationUpdate();
    onBlur();
  };

  if (isEditing) {
    return (
      <div className="flex items-center" onClick={e => e.stopPropagation()}>
        <Input
          value={locationValue}
          onChange={(e) => onLocationChange(e.target.value)}
          onKeyDown={handleKeyPress}
          onBlur={handleBlur}
          disabled={updating}
          
          className="w-full"
          placeholder="Enter location"
        />
      </div>
    );
  }

  return (
    <div 
      className="flex items-center hover:bg-gray-100 p-2 rounded cursor-pointer" 
      onClick={onClick}
    >
      <MapPin className="h-4 w-4 mr-1" />
      {location || <span className="text-muted-foreground">Not available</span>}
    </div>
  );
};