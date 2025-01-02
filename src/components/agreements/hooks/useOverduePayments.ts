import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useOverduePayments = (agreementId?: string) => {
  const { data: overduePayment, isLoading } = useQuery({
    queryKey: ['overdue-payment', agreementId],
    queryFn: async () => {
      if (!agreementId) return null;

      const { data, error } = await supabase
        .from('overdue_payments_view')
        .select('*')
        .eq('agreement_id', agreementId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching overdue payment:', error);
        toast.error('Failed to fetch overdue payment details');
        throw error;
      }

      return data;
    },
    enabled: Boolean(agreementId),
  });

  const processOverduePayments = async () => {
    try {
      const { error } = await supabase.functions.invoke('process-overdue-payments', {
        body: { agreementId }
      });
      
      if (error) throw error;
      
      toast.success('Overdue payments processed successfully');
    } catch (error) {
      console.error('Error processing overdue payments:', error);
      toast.error('Failed to process overdue payments');
    }
  };

  return {
    overduePayment,
    isLoading,
    processOverduePayments
  };
};