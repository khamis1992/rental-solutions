import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Customer } from "../types/customer";

interface UseCustomersOptions {
  searchQuery: string;
  page: number;
  pageSize: number;
}

interface UseCustomersResult {
  customers: Customer[];
  totalCount: number;
  error: Error | null;
}

export const useCustomers = ({ searchQuery, page, pageSize }: UseCustomersOptions) => {
  return useQuery({
    queryKey: ['customers', searchQuery, page, pageSize],
    queryFn: async (): Promise<UseCustomersResult> => {
      try {
        console.log("Fetching customers with search:", searchQuery, "page:", page, "pageSize:", pageSize);
        
        // First get total count for pagination
        const countQuery = supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('role', 'customer');

        if (searchQuery) {
          countQuery.or(`full_name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%,driver_license.ilike.%${searchQuery}%`);
        }

        const { count, error: countError } = await countQuery;

        if (countError) {
          console.error("Error counting customers:", countError);
          throw countError;
        }

        console.log("Total customer count:", count);

        // Then fetch paginated data
        let query = supabase
          .from('profiles')
          .select('*')
          .eq('role', 'customer')
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order('created_at', { ascending: false });

        if (searchQuery) {
          query = query.or(`full_name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%,driver_license.ilike.%${searchQuery}%`);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching customers:", error);
          toast.error("Failed to fetch customers");
          throw error;
        }
        
        console.log("Fetched customers:", data?.length || 0, "records");
        console.log("Customer data:", data);

        return {
          customers: (data || []) as Customer[],
          totalCount: count || 0,
          error: null
        };
      } catch (err) {
        console.error("Error in customer query:", err);
        toast.error("Failed to fetch customers");
        return {
          customers: [],
          totalCount: 0,
          error: err as Error
        };
      }
    },
    staleTime: 0, // Disable cache temporarily for debugging
  });
};