import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { VehicleDiagram } from "./VehicleDiagram";
import { SignatureCanvas } from "./SignatureCanvas";
import { ImageUpload } from "./ImageUpload";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Car, Calendar, User, Gauge, Fuel } from "lucide-react";

interface VehicleInspectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenanceId: string;
  onComplete: () => void;
}

const VehicleInspectionDialog = ({
  open,
  onOpenChange,
  maintenanceId,
  onComplete
}: VehicleInspectionDialogProps) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [damageMarkers, setDamageMarkers] = useState<any[]>([]);
  const [fuelLevel, setFuelLevel] = useState<number>(100);
  const [renterSignature, setRenterSignature] = useState<string>("");
  const [staffSignature, setStaffSignature] = useState<string>("");
  const [photos, setPhotos] = useState<File[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      
      // First, get the vehicle_id from the maintenance record
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('maintenance')
        .select('vehicle_id')
        .eq('id', maintenanceId)
        .single();

      if (maintenanceError) throw maintenanceError;
      if (!maintenanceData?.vehicle_id) throw new Error('Vehicle ID not found');

      const inspectionData = {
        vehicle_id: maintenanceData.vehicle_id,
        inspection_type: 'check_in',
        odometer_reading: parseInt(formData.get('odometer') as string),
        fuel_level: fuelLevel,
        damage_markers: damageMarkers,
        renter_signature: renterSignature,
        staff_signature: staffSignature,
        inspection_date: new Date().toISOString(),
        maintenance_id: maintenanceId
      };

      // Create the inspection record
      const { error: inspectionError } = await supabase
        .from('vehicle_inspections')
        .insert(inspectionData);

      if (inspectionError) throw inspectionError;

      // Update maintenance status to in_progress and make it visible in the list
      const { error: maintenanceUpdateError } = await supabase
        .from('maintenance')
        .update({ 
          status: 'in_progress',
          description: 'Inspection completed. Job card ready.',
          scheduled_date: new Date().toISOString() // Set to current date to make it appear in the list
        })
        .eq('id', maintenanceId);

      if (maintenanceUpdateError) throw maintenanceUpdateError;

      toast.success("Inspection completed successfully");
      onComplete();
      navigate(`/maintenance`);
    } catch (error: any) {
      console.error('Error saving inspection:', error);
      toast.error("Failed to save inspection. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Vehicle Inspection
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">
                <Calendar className="h-4 w-4 inline mr-2" />
                Inspection Date
              </Label>
              <Input
                id="date"
                name="date"
                type="datetime-local"
                defaultValue={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inspector">
                <User className="h-4 w-4 inline mr-2" />
                Inspector Name
              </Label>
              <Input
                id="inspector"
                name="inspector"
                type="text"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="odometer">
                <Gauge className="h-4 w-4 inline mr-2" />
                Odometer Reading
              </Label>
              <Input
                id="odometer"
                name="odometer"
                type="number"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>
                <Fuel className="h-4 w-4 inline mr-2" />
                Fuel Level
              </Label>
              <Slider
                value={[fuelLevel]}
                onValueChange={(value) => setFuelLevel(value[0])}
                max={100}
                step={1}
              />
              <span className="text-sm text-muted-foreground">{fuelLevel}%</span>
            </div>
          </div>

          <VehicleDiagram
            damageMarkers={damageMarkers}
            onMarkersChange={setDamageMarkers}
          />

          <ImageUpload
            onImagesSelected={setPhotos}
            maxFiles={5}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Renter Signature</Label>
              <SignatureCanvas
                onSignatureCapture={setRenterSignature}
              />
            </div>
            <div>
              <Label>Staff Signature</Label>
              <SignatureCanvas
                onSignatureCapture={setStaffSignature}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Complete Inspection & Open Job Card"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default VehicleInspectionDialog;