import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VehicleOverview } from "./profile/VehicleOverview";
import { MaintenanceHistory } from "./profile/MaintenanceHistory";
import { DamageHistory } from "./profile/DamageHistory";
import { AssociatedAgreements } from "./profile/AssociatedAgreements";
import { VehicleDocuments } from "./profile/VehicleDocuments";
import { VehicleInsurance } from "./profile/VehicleInsurance";
import { VehicleParts } from "./profile/VehicleParts";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { injectPrintStyles } from "@/lib/printStyles";

export const VehicleDetails = () => {
  const { id } = useParams();

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["vehicle", id],
    queryFn: async () => {
      console.log("Fetching vehicle with ID:", id); // Debug log
      
      if (!id) throw new Error("Vehicle ID is required");

      const { data, error } = await supabase
        .from("vehicles")
        .select()
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error("Supabase error:", error); // Debug log
        throw error;
      }

      if (!data) {
        throw new Error("Vehicle not found");
      }
      
      console.log("Vehicle data:", data); // Debug log
      return data;
    },
    enabled: Boolean(id), // Only run query if id exists
    retry: 3, // Retry failed requests 3 times
  });

  const handlePrint = () => {
    injectPrintStyles();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[200px] w-full" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[150px]" />
          <Skeleton className="h-[150px]" />
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return <div>Vehicle not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Vehicle Details</h1>
        <Button onClick={handlePrint} variant="outline" className="print:hidden">
          <Printer className="mr-2 h-4 w-4" />
          Print Details
        </Button>
      </div>

      {/* Vehicle Image */}
      <div className="relative h-[300px] w-full overflow-hidden rounded-lg bg-muted">
        {vehicle.image_url ? (
          <img
            src={vehicle.image_url}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No image available
          </div>
        )}
      </div>

      {/* Vehicle Information Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7 print:hidden">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="insurance">Insurance</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="damages">Damages</TabsTrigger>
          <TabsTrigger value="agreements">Agreements</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="parts">Parts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <VehicleOverview vehicle={vehicle} />
        </TabsContent>

        <TabsContent value="insurance" className="mt-6">
          <VehicleInsurance vehicleId={id!} />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6 print:hidden">
          <MaintenanceHistory vehicleId={id!} />
        </TabsContent>

        <TabsContent value="damages" className="mt-6 print:hidden">
          <DamageHistory vehicleId={id!} />
        </TabsContent>

        <TabsContent value="agreements" className="mt-6 print:hidden">
          <AssociatedAgreements vehicleId={id!} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6 print:hidden">
          <VehicleDocuments vehicleId={id!} />
        </TabsContent>

        <TabsContent value="parts" className="mt-6 print:hidden">
          <VehicleParts vehicleId={id!} />
        </TabsContent>
      </Tabs>

      {/* Print-only content */}
      <style type="text/css" media="print">{`
        @page {
          size: auto;
          margin: 20mm;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};
