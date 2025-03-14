import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CustomerSearchResult } from '../types/customerSelect.types';

const PAGE_SIZE = 10;

export const useCustomerSearch = (searchQuery: string) => {
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error
  } = useInfiniteQuery<CustomerSearchResult>({
    queryKey: ['customers', searchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      try {
        const trimmedQuery = searchQuery.trim();
        console.log("Fetching customers page", pageParam, "with query:", trimmedQuery);
        
        let query = supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .eq('role', 'customer');

        if (trimmedQuery) {
          query = query.or(
            `full_name.ilike.%${trimmedQuery}%,` +
            `email.ilike.%${trimmedQuery}%,` +
            `phone_number.ilike.%${trimmedQuery}%,` +
            `driver_license.ilike.%${trimmedQuery}%`
          );
        }

        // Add pagination
        query = query.range(
          Number(pageParam) * PAGE_SIZE, 
          (Number(pageParam) + 1) * PAGE_SIZE - 1
        ).order('created_at', { ascending: false });

        const { data: customers, count, error } = await query;

        if (error) {
          console.error("Error fetching customers:", error);
          toast.error("Failed to fetch customers");
          throw error;
        }

        return {
          customers: customers || [],
          nextPage: customers?.length === PAGE_SIZE ? Number(pageParam) + 1 : undefined,
          totalCount: count
        };
      } catch (err) {
        console.error("Error in customer search:", err);
        toast.error("Failed to search customers");
        throw err;
      }
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 30000, // Consider data fresh for 30 seconds
    retry: 1,
  });

  return {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    showCreateCustomer,
    setShowCreateCustomer,
  };
};