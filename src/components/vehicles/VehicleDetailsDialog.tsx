import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MaintenanceHistory } from "./profile/MaintenanceHistory";
import { DamageHistory } from "./profile/DamageHistory";
import { AssociatedAgreements } from "./profile/AssociatedAgreements";
import { VehicleDocuments } from "./profile/VehicleDocuments";

interface VehicleDetailsDialogProps {
  vehicleId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VehicleDetailsDialog = ({
  vehicleId,
  open,
  onOpenChange,
}: VehicleDetailsDialogProps) => {
  const { data: vehicle, isLoading } = useQuery({
    queryKey: ['vehicle-details', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: Boolean(vehicleId) && open,
  });

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Vehicle Details</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div>Loading vehicle details...</div>
        ) : vehicle ? (
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Make</Label>
                    <p className="text-lg font-medium">{vehicle.make}</p>
                  </div>
                  <div>
                    <Label>Model</Label>
                    <p className="text-lg font-medium">{vehicle.model}</p>
                  </div>
                  <div>
                    <Label>Year</Label>
                    <p>{vehicle.year}</p>
                  </div>
                  <div>
                    <Label>License Plate</Label>
                    <p>{vehicle.license_plate}</p>
                  </div>
                  <div>
                    <Label>VIN</Label>
                    <p>{vehicle.vin}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <p className="capitalize">{vehicle.status}</p>
                  </div>
                  <div>
                    <Label>Mileage</Label>
                    <p>{vehicle.mileage} km</p>
                  </div>
                  {vehicle.color && (
                    <div>
                      <Label>Color</Label>
                      <p>{vehicle.color}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="maintenance" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                <TabsTrigger value="damages">Damages</TabsTrigger>
                <TabsTrigger value="agreements">Agreements</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
              </TabsList>
              <TabsContent value="maintenance">
                <MaintenanceHistory vehicleId={vehicleId} />
              </TabsContent>
              <TabsContent value="damages">
                <DamageHistory vehicleId={vehicleId} />
              </TabsContent>
              <TabsContent value="agreements">
                <AssociatedAgreements vehicleId={vehicleId} />
              </TabsContent>
              <TabsContent value="documents">
                <VehicleDocuments vehicleId={vehicleId} />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div>Vehicle not found</div>
        )}
      </DialogContent>
    </Dialog>
  );
};