import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";

export interface Agreement {
  id: string;
  agreement_number: string;
  license_no: string;
  customer: {
    id: string;
    full_name: string;
  };
  vehicle: {
    id: string;
    make: string;
    model: string;
    year: number;
    license_plate: string;
  };
  start_date: string;
  end_date: string;
  status: string;
  total_amount: number;
}

export const useAgreements = () => {
  const queryClient = useQueryClient();

  // Set up real-time subscription for both agreements and payments
  useEffect(() => {
    const agreementChannel = supabase
      .channel('agreement-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leases'
        },
        async (payload) => {
          console.log('Agreement update received:', payload);
          await queryClient.invalidateQueries({ queryKey: ['agreements'] });
          
          const eventType = payload.eventType;
          const message = eventType === 'INSERT' 
            ? 'New agreement created'
            : eventType === 'UPDATE'
            ? 'Agreement updated'
            : 'Agreement deleted';
          
          toast.info(message, {
            description: 'The agreements list has been updated.'
          });
        }
      )
      .subscribe();

    // Add payment status subscription
    const paymentChannel = supabase
      .channel('payment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments'
        },
        async (payload) => {
          console.log('Payment update received:', payload);
          // Invalidate both agreements and payments queries
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['agreements'] }),
            queryClient.invalidateQueries({ queryKey: ['payments'] })
          ]);
          
          toast.info('Payment status updated', {
            description: 'Payment information has been updated.'
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(agreementChannel);
      supabase.removeChannel(paymentChannel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['agreements'],
    queryFn: async () => {
      console.log("Starting to fetch agreements...");
      
      const { count, error: countError } = await supabase
        .from('leases')
        .select('*', { count: 'exact', head: true });
      
      console.log("Total agreements in database:", count);
      
      if (countError) {
        console.error("Error checking agreements count:", countError);
        throw countError;
      }

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
            year,
            license_plate
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
        agreement_number: lease.agreement_number,
        customer: {
          id: lease.profiles?.id || lease.customer_id,
          full_name: lease.profiles?.full_name || 'Unknown Customer',
        },
        vehicle: {
          id: lease.vehicles?.id || lease.vehicle_id,
          make: lease.vehicles?.make || '',
          model: lease.vehicles?.model || '',
          year: lease.vehicles?.year || '',
          license_plate: lease.vehicles?.license_plate || 'N/A',
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