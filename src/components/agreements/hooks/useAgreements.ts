import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AgreementWithRelations } from "@/types/database/agreement.types";

export const useAgreements = () => {
  return useQuery({
    queryKey: ["agreements"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("leases")
          .select(`
            id,
            agreement_number,
            customer:customer_id (
              id,
              full_name
            ),
            vehicle:vehicle_id (
              id,
              make,
              model,
              year,
              license_plate
            ),
            start_date,
            end_date,
            status,
            total_amount,
            license_no
          `)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching agreements:", error);
          toast.error("Failed to fetch agreements");
          throw error;
        }

        return data as AgreementWithRelations[];
      } catch (err) {
        console.error("Error in agreements query:", err);
        throw err;
      }
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};