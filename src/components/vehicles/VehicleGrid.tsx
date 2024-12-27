import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { MapPin } from "lucide-react";
import { Vehicle } from "@/types/database/vehicle.types";

interface VehicleGridProps {
  vehicles: Vehicle[];
  isLoading?: boolean;
  onVehicleClick?: (vehicleId: string) => void;
}

export const VehicleGrid = ({ vehicles, isLoading, onVehicleClick }: VehicleGridProps) => {
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to real-time location updates
    const channel = supabase
      .channel('vehicle-locations')
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
            toast({
              title: "Location Updated",
              description: `${updatedVehicle.make} ${updatedVehicle.model} location updated to ${updatedVehicle.location}`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-48 rounded-b-none" />
            <CardContent className="mt-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((vehicle) => (
        <Card
          key={vehicle.id}
          className="overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => onVehicleClick?.(vehicle.id)}
        >
          <div className="relative h-48 bg-muted">
            {vehicle.image_url ? (
              <img
                src={vehicle.image_url || `https://picsum.photos/seed/${vehicle.id}/800/400`}
                alt={`${vehicle.make} ${vehicle.model}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No image available
              </div>
            )}
            <Badge
              className="absolute top-2 right-2"
              variant={
                vehicle.status === "available"
                  ? "default"
                  : vehicle.status === "rented"
                  ? "secondary"
                  : "destructive"
              }
            >
              {vehicle.status}
            </Badge>
          </div>
          <CardContent className="mt-4">
            <h3 className="text-lg font-semibold">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h3>
            <p className="text-sm text-muted-foreground">
              License: {vehicle.license_plate}
            </p>
            {vehicle.location && (
              <p className="text-sm text-muted-foreground flex items-center mt-2">
                <MapPin className="h-4 w-4 mr-1" />
                {vehicle.location}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button variant="ghost" size="sm">
              View Details
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};