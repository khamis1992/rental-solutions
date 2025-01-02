import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { usePaymentReconciliation } from "./hooks/usePaymentReconciliation";
import { PaymentTrackingTabs } from "./payments/PaymentTrackingTabs";

interface PaymentTrackingDialogProps {
  agreementId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentTrackingDialog({
  agreementId,
  open,
  onOpenChange,
}: PaymentTrackingDialogProps) {
  const queryClient = useQueryClient();
  const { isReconciling, reconcilePayments } = usePaymentReconciliation();

  const { data: payments, isLoading, error } = useQuery({
    queryKey: ["payment-schedules", agreementId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("payment_schedules")
          .select("*")
          .eq("lease_id", agreementId)
          .order("due_date");

        if (error) throw error;
        return data;
      } catch (err) {
        console.error("Error fetching payment schedules:", err);
        throw err;
      }
    },
    enabled: open && Boolean(agreementId),
    retry: 2,
  });

  const { data: paymentHistory } = useQuery({
    queryKey: ["payment-history", agreementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_history")
        .select("*")
        .eq("lease_id", agreementId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: open && Boolean(agreementId),
  });

  useEffect(() => {
    if (!agreementId || !open) return;

    const channel = supabase
      .channel('payment-schedules-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_schedules',
          filter: `lease_id=eq.${agreementId}`
        },
        async (payload) => {
          console.log('Real-time update received for payment schedule:', payload);
          
          await queryClient.invalidateQueries({ 
            queryKey: ['payment-schedules', agreementId] 
          });
          
          const eventMessages = {
            INSERT: 'New payment schedule added',
            UPDATE: 'Payment schedule updated',
            DELETE: 'Payment schedule removed'
          };
          
          toast.info(
            eventMessages[payload.eventType as keyof typeof eventMessages] || 'Payment schedule changed',
            {
              description: 'The payment schedule has been updated.'
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agreementId, open, queryClient]);

  const handleReconcileAll = async () => {
    try {
      await reconcilePayments(agreementId);
      toast.success("All payments have been reconciled");
    } catch (error) {
      console.error("Error reconciling payments:", error);
      toast.error("Failed to reconcile payments");
    }
  };

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <div className="flex flex-col items-center justify-center p-4 text-red-500">
            <p>Error loading payment schedules</p>
            <p className="text-sm">{error.message}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Payment Management</DialogTitle>
          <DialogDescription>
            Track and manage payment schedules, history, and reconciliation
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <PaymentTrackingTabs
            agreementId={agreementId}
            payments={payments || []}
            paymentHistory={paymentHistory || []}
            isLoading={isLoading}
            onReconcileAll={handleReconcileAll}
            isReconciling={isReconciling}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}