
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Customer } from "../types/customer";
import { handleQueryResult } from "@/lib/queryUtils";

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
        console.log("Fetching customers with search:", searchQuery);
        
        // First get total count for pagination
        const countQuery = supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('role', 'customer'); // Only count customers

        if (searchQuery) {
          countQuery.or(`full_name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%,driver_license.ilike.%${searchQuery}%`);
        }

        const { count, error: countError } = await countQuery;

        if (countError) {
          console.error("Error counting customers:", countError);
          throw countError;
        }

        // Then fetch paginated data
        let query = supabase
          .from('profiles')
          .select('*')
          .eq('role', 'customer') // Only fetch customers
          .range(page * pageSize, (page + 1) * pageSize - 1)
          .order('created_at', { ascending: false });

        if (searchQuery) {
          query = query.or(`full_name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%,driver_license.ilike.%${searchQuery}%`);
        }

        const result = await query;
        const customers = handleQueryResult<Customer[]>(result, []) || [];
        
        console.log("Fetched customers:", customers.length, "records");
        return {
          customers,
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
    retry: 1,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};
