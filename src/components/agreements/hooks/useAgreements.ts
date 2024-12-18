import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Agreement {
  id: string;
  customer: {
    id: string;
    full_name: string;
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
  };
  start_date: string;
  end_date: string;
  status: string;
  total_amount: number;
}

export const useAgreements = () => {
  return useQuery({
    queryKey: ['agreements'],
    queryFn: async () => {
      console.log("Starting to fetch agreements...");
      
      // First, let's get a raw count of agreements
      const { count, error: countError } = await supabase
        .from('leases')
        .select('*', { count: 'exact', head: true });
        
      console.log("Total number of agreements in database:", count);
      
      if (countError) {
        console.error("Error counting agreements:", countError);
        toast.error("Failed to count agreements");
        throw countError;
      }

      // Fetch all agreements with their relationships
      const { data, error } = await supabase
        .from('leases')
        .select(`
          id,
          agreement_number,
          status,
          total_amount,
          start_date,
          end_date,
          customer_id,
          vehicle_id,
          profiles:customer_id (
            id,
            full_name
          ),
          vehicles:vehicle_id (
            id,
            make,
            model,
            year
          )
        `);

      if (error) {
        console.error("Error fetching agreements:", error);
        toast.error("Failed to fetch agreements");
        throw error;
      }

      console.log("Raw agreements data:", data);
      
      const transformedData = data?.map((lease: any) => ({
        id: lease.id,
        customer: {
          id: lease.profiles?.id || lease.customer_id,
          full_name: lease.profiles?.full_name || 'Unknown Customer',
        },
        vehicle: {
          id: lease.vehicles?.id || lease.vehicle_id,
          make: lease.vehicles?.make || '',
          model: lease.vehicles?.model || '',
          year: lease.vehicles?.year || '',
        },
        start_date: lease.start_date || '',
        end_date: lease.end_date || '',
        status: lease.status || 'pending',
        total_amount: lease.total_amount || 0,
      })) || [];

      console.log("Transformed agreements data:", transformedData);
      return transformedData;
    },
  });
};