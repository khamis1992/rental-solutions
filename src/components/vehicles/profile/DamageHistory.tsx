import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PhotosDialog } from "./dialogs/PhotosDialog";
import { InspectionRecordsTable } from "./tables/InspectionRecordsTable";
import { DamageReportsTable } from "./tables/DamageReportsTable";

interface DamageHistoryProps {
  vehicleId: string;
}

export const DamageHistory = ({ vehicleId }: DamageHistoryProps) => {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [showImagesDialog, setShowImagesDialog] = useState(false);
  const queryClient = useQueryClient();

  // Set up real-time listeners
  useEffect(() => {
    const inspectionChannel = supabase
      .channel('inspection-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_inspections',
          filter: `vehicle_id=eq.${vehicleId}`
        },
        async (payload) => {
          console.log('Inspection update received:', payload);
          await queryClient.invalidateQueries({ queryKey: ['damages-and-inspections', vehicleId] });
          toast.info('Vehicle inspection records updated');
        }
      )
      .subscribe();

    const damageChannel = supabase
      .channel('damage-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'damages',
          filter: `vehicle_id=eq.${vehicleId}`
        },
        async (payload) => {
          console.log('Damage update received:', payload);
          await queryClient.invalidateQueries({ queryKey: ['damages-and-inspections', vehicleId] });
          toast.info('Damage records updated');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(inspectionChannel);
      supabase.removeChannel(damageChannel);
    };
  }, [vehicleId, queryClient]);

  const { data: records, isLoading } = useQuery({
    queryKey: ["damages-and-inspections", vehicleId],
    queryFn: async () => {
      // Get inspection records
      const { data: inspectionData, error: inspectionError } = await supabase
        .from("vehicle_inspections")
        .select("*")
        .eq("vehicle_id", vehicleId)
        .order("inspection_date", { ascending: false });

      if (inspectionError) throw inspectionError;

      // Get damage records
      const { data: damageData, error: damageError } = await supabase
        .from("damages")
        .select("*, leases(customer_id, profiles(full_name))")
        .eq("vehicle_id", vehicleId)
        .order("reported_date", { ascending: false });

      if (damageError) throw damageError;

      return {
        inspections: inspectionData || [],
        damages: damageData || [],
      };
    },
  });

  const handleViewImages = (images: string[]) => {
    setSelectedImages(images);
    setShowImagesDialog(true);
  };

  if (isLoading) {
    return <div>Loading damage history...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Damage & Service History
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Inspection Records */}
          <div>
            <h3 className="text-sm font-medium mb-3">Inspection Records</h3>
            <InspectionRecordsTable 
              records={records?.inspections || []} 
              onViewImages={handleViewImages}
            />
          </div>

          {/* Damage Records */}
          <div>
            <h3 className="text-sm font-medium mb-3">Damage Reports</h3>
            <DamageReportsTable 
              records={records?.damages || []} 
              onViewImages={handleViewImages}
            />
          </div>
        </div>
      </CardContent>

      {/* Photos Dialog */}
      <PhotosDialog 
        images={selectedImages}
        open={showImagesDialog}
        onOpenChange={setShowImagesDialog}
      />
    </Card>
  );
};