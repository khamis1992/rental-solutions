
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, MapPin, Edit2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export interface VehicleLocationCellProps {
  vehicleId: string;
  isEditing: boolean;
  location: string;
  onEditStart: () => void;
  onEditEnd: () => void;
}

export const VehicleLocationCell = ({
  vehicleId,
  isEditing,
  location,
  onEditStart,
  onEditEnd
}: VehicleLocationCellProps) => {
  const [value, setValue] = useState(location);

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("vehicles")
        .update({ location: value })
        .eq("id", vehicleId);

      if (error) throw error;
      toast.success("Location updated successfully");
      onEditEnd();
    } catch (error) {
      console.error("Error updating location:", error);
      toast.error("Failed to update location");
    }
  };

  if (!isEditing) {
    return (
      <div className="flex items-center justify-between group">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{location || "Not set"}</span>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onEditStart}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit location</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 animate-fade-in">
      <div className="flex items-center gap-2 flex-1">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-8"
          placeholder="Enter location"
          autoFocus
        />
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSave}
              className="hover:text-green-500"
            >
              <Check className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save changes</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onEditEnd}
              className="hover:text-red-500"
            >
              <X className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Cancel</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
