import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { VehicleList } from "@/components/vehicles/VehicleList";
import { VehicleStats } from "@/components/vehicles/VehicleStats";
import { VehicleFilters } from "@/components/vehicles/VehicleFilters";
import { CreateVehicleDialog } from "@/components/vehicles/CreateVehicleDialog";
import { supabase } from "@/integrations/supabase/client";

const Vehicles = () => {
  const [filters, setFilters] = useState({
    status: "all",
    searchQuery: "",
  });

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["vehicles", filters],
    queryFn: async () => {
      let query = supabase.from("vehicles").select("*");

      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters.searchQuery) {
        query = query.or(
          `make.ilike.%${filters.searchQuery}%,model.ilike.%${filters.searchQuery}%,license_plate.ilike.%${filters.searchQuery}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching vehicles:", error);
        throw error;
      }

      return data || [];
    },
  });

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Vehicles</h1>
        <CreateVehicleDialog />
      </div>
      <VehicleStats vehicles={vehicles} isLoading={isLoading} />
      <div className="mt-6 space-y-4">
        <VehicleFilters filters={filters} setFilters={setFilters} />
        <VehicleList vehicles={vehicles} isLoading={isLoading} />
      </div>
    </DashboardLayout>
  );
};

export default Vehicles;