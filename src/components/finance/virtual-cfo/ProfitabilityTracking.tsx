import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export const ProfitabilityTracking = () => {
  const { data: profitabilityData, isLoading } = useQuery({
    queryKey: ["vehicle-profitability"],
    queryFn: async () => {
      // First get vehicles with their leases
      const { data: vehicles, error: vehiclesError } = await supabase
        .from("vehicles")
        .select(`
          id,
          make,
          model,
          license_plate,
          leases (
            total_amount,
            start_date,
            end_date
          )
        `);

      if (vehiclesError) throw vehiclesError;

      // Then get maintenance costs separately
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from("maintenance")
        .select("vehicle_id, cost");

      if (maintenanceError) throw maintenanceError;

      // Combine the data
      return vehicles.map(vehicle => {
        const revenue = vehicle.leases?.reduce((sum, lease) => sum + (lease.total_amount || 0), 0) || 0;
        const costs = maintenanceData
          .filter(m => m.vehicle_id === vehicle.id)
          .reduce((sum, m) => sum + (m.cost || 0), 0);
        
        return {
          vehicle: `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`,
          revenue,
          costs,
          profit: revenue - costs,
          profitMargin: revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0
        };
      });
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fleet Profitability Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={profitabilityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="vehicle" angle={-45} textAnchor="end" height={100} />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
              />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#4ade80" />
              <Line type="monotone" dataKey="costs" name="Costs" stroke="#f43f5e" />
              <Line type="monotone" dataKey="profit" name="Profit" stroke="#60a5fa" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};