
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Customer } from "../types/customer";
import { handleQueryResult, extractCount } from "@/lib/queryUtils";

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
        const countResult = await supabase
          .from('profiles')
          .select('id', { count: 'exact' })
          .eq('role', 'customer'); // Only count customers

        if (searchQuery) {
          countResult.or(`full_name.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%,driver_license.ilike.%${searchQuery}%`);
        }

        const totalCount = extractCount(countResult, 0);

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
        
        // Transform database records to match our Customer type
        const customers = handleQueryResult<any[]>(result, []).map(record => ({
          id: record.id,
          full_name: record.full_name,
          phone_number: record.phone_number,
          email: record.email,
          address: record.address,
          driver_license: record.driver_license,
          id_document_url: record.id_document_url,
          license_document_url: record.license_document_url,
          contract_document_url: record.contract_document_url,
          created_at: record.created_at,
          role: record.role as 'customer' | 'staff' | 'admin',
          status: record.status as Customer['status'],
          document_verification_status: record.document_verification_status as Customer['document_verification_status'],
          profile_completion_score: record.profile_completion_score,
          merged_into: record.merged_into,
          nationality: record.nationality,
          id_document_expiry: record.id_document_expiry,
          license_document_expiry: record.license_document_expiry
        })) || [];
        
        console.log("Fetched customers:", customers.length, "records");
        return {
          customers,
          totalCount,
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
