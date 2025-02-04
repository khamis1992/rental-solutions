import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDateToDisplay } from "@/lib/dateUtils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LateFineActions } from "./LateFineActions";

interface PaymentHistoryProps {
  agreementId: string;
}

export const PaymentHistory = ({ agreementId }: PaymentHistoryProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payment-history', agreementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_history_view')
        .select(`
          id,
          amount,
          amount_paid,
          balance,
          actual_payment_date,
          original_due_date,
          late_fine_amount,
          days_overdue,
          status,
          payment_method,
          description,
          type
        `)
        .eq('lease_id', agreementId)
        .order('actual_payment_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const totals = payments?.reduce((acc, payment) => {
    const amountPaid = payment.amount_paid || 0;
    const lateFine = payment.late_fine_amount || 0;

    return {
      amountPaid: acc.amountPaid + amountPaid,
      lateFines: acc.lateFines + lateFine,
    };
  }, { amountPaid: 0, lateFines: 0 }) || { amountPaid: 0, lateFines: 0 };

  const handleDeleteClick = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPaymentId) return;

    try {
      const { error } = await supabase
        .from("unified_payments")
        .delete()
        .eq("id", selectedPaymentId);

      if (error) throw error;

      await supabase.from('audit_logs').insert({
        entity_type: 'payment',
        entity_id: selectedPaymentId,
        action: 'delete_payment',
        changes: {
          status: 'deleted'
        }
      });

      toast.success("Payment deleted successfully");
      await queryClient.invalidateQueries({ queryKey: ["payment-history", agreementId] });
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedPaymentId(null);
    }
  };

  const handleLateFineUpdate = async () => {
    // Invalidate queries to refresh data
    await queryClient.invalidateQueries({ queryKey: ["payment-history", agreementId] });
    
    // Update the remaining amount in the leases table
    const { data: leaseData } = await supabase
      .from('leases')
      .select('total_amount')
      .eq('id', agreementId)
      .single();

    if (leaseData) {
      const totalPaid = payments?.reduce((sum, payment) => sum + (payment.amount_paid || 0), 0) || 0;
      const newBalance = leaseData.total_amount - totalPaid;

      await supabase
        .from('leases')
        .update({ remaining_amount: newBalance })
        .eq('id', agreementId);
    }
  };

  if (isLoading) {
    return <div>Loading payment history...</div>;
  }

  // ... keep existing code (JSX for rendering the payment history)

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Payment History</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Payment Summary */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg mb-4">
            <div>
              <div className="text-sm text-muted-foreground">Amount Paid</div>
              <div className="text-lg font-semibold">{formatCurrency(totals.amountPaid)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Late Fines</div>
              <div className="text-lg font-semibold text-destructive">{formatCurrency(totals.lateFines)}</div>
            </div>
          </div>

          {/* Payment List */}
          {payments && payments.length > 0 ? (
            payments.map((payment) => {
              const remainingBalance = payment.balance || 0;
              const paymentStatus = remainingBalance === 0 ? 'completed' : 'pending';
              
              return (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">
                      {payment.actual_payment_date ? formatDateToDisplay(new Date(payment.actual_payment_date)) : 'No date'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {payment.payment_method} - {payment.description || 'Payment'}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div>Due Amount: {formatCurrency(payment.amount)}</div>
                    <div>Amount Paid: {formatCurrency(payment.amount_paid)}</div>
                    {payment.late_fine_amount > 0 && (
                      <div className="text-destructive flex items-center justify-end gap-1">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Late Fine: {formatCurrency(payment.late_fine_amount)}</span>
                        {payment.days_overdue > 0 && (
                          <span className="text-sm ml-1">
                            ({payment.days_overdue} days @ 120 QAR/day)
                          </span>
                        )}
                        <LateFineActions
                          paymentId={payment.id}
                          currentLateFine={payment.late_fine_amount}
                          onUpdate={handleLateFineUpdate}
                        />
                      </div>
                    )}
                    <div className={remainingBalance === 0 ? "text-green-600" : "text-destructive"}>
                      Balance: {formatCurrency(remainingBalance)}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={paymentStatus === 'completed' ? 
                          'bg-green-50 text-green-600 border-green-200' : 
                          'bg-yellow-50 text-yellow-600 border-yellow-200'
                        }
                      >
                        {paymentStatus === 'completed' ? (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        {paymentStatus === 'completed' ? 'Completed' : 'Pending'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(payment.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No payment history found
            </div>
          )}
        </div>
      </CardContent>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
