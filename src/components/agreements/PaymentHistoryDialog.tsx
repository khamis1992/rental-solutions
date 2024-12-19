import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PaymentImport } from "./PaymentImport";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PaymentHistoryTable } from "./payments/PaymentHistoryTable";
import { PaymentSummary } from "./payments/PaymentSummary";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PaymentHistoryDialogProps {
  agreementId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentHistoryDialog({
  agreementId,
  open,
  onOpenChange,
}: PaymentHistoryDialogProps) {
  const queryClient = useQueryClient();

  const { data: paymentHistory, isLoading } = useQuery({
    queryKey: ["payment-history", agreementId],
    queryFn: async () => {
      console.log("Starting payment history fetch...");
      console.log("Agreement ID:", agreementId);
      
      // First, let's check the payments table directly
      const { data: paymentsCheck, error: paymentsCheckError } = await supabase
        .from("payments")
        .select("*");
      
      console.log("Raw payments in database:", paymentsCheck);
      
      if (paymentsCheckError) {
        console.error("Error checking payments:", paymentsCheckError);
      }
      
      let query = supabase
        .from("payments")
        .select(`
          *,
          security_deposits (
            amount,
            status
          ),
          leases (
            agreement_number,
            customer_id,
            profiles (
              full_name
            )
          )
        `)
        .order("created_at", { ascending: false });

      // Only filter by agreement ID if one is provided
      if (agreementId) {
        console.log("Filtering by agreement ID:", agreementId);
        query = query.eq("lease_id", agreementId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching payments:", error);
        throw error;
      }

      console.log("Fetched payments data:", data);
      
      // Log each payment's details
      data?.forEach((payment, index) => {
        console.log(`Payment ${index + 1}:`, {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          lease_id: payment.lease_id,
          customer_name: payment.leases?.profiles?.full_name,
          agreement_number: payment.leases?.agreement_number
        });
      });

      return data;
    },
    enabled: open,
  });

  // Set up real-time subscription
  useEffect(() => {
    if (!open) return;

    console.log("Setting up real-time subscription for payments");
    const channel = supabase
      .channel('payment-history-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payments',
          ...(agreementId ? { filter: `lease_id=eq.${agreementId}` } : {})
        },
        async (payload) => {
          console.log('Real-time update received:', payload);
          
          // Invalidate and refetch the payment history query
          await queryClient.invalidateQueries({ queryKey: ['payment-history', agreementId] });
          
          // Show a toast notification
          const eventType = payload.eventType;
          toast.info(
            eventType === 'INSERT'
              ? 'New payment recorded'
              : eventType === 'UPDATE'
              ? 'Payment status updated'
              : 'Payment record changed',
            {
              description: 'The payment history has been updated.'
            }
          );
        }
      )
      .subscribe();

    // Cleanup subscription on unmount or when dialog closes
    return () => {
      console.log("Cleaning up payment subscription");
      supabase.removeChannel(channel);
    };
  }, [agreementId, open, queryClient]);

  const totalPaid = paymentHistory?.reduce((sum, payment) => {
    if (payment.status === "completed") {
      return sum + payment.amount;
    }
    return sum;
  }, 0) || 0;

  const totalRefunded = paymentHistory?.reduce((sum, payment) => {
    if (payment.status === "refunded") {
      return sum + payment.amount;
    }
    return sum;
  }, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Payment History</DialogTitle>
          <DialogDescription>
            View all payments and transactions
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="space-y-6 px-6">
              <PaymentImport />
              <PaymentSummary totalPaid={totalPaid} totalRefunded={totalRefunded} />
              <PaymentHistoryTable paymentHistory={paymentHistory || []} isLoading={isLoading} />
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}