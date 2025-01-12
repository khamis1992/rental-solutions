import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";

interface PaymentHistoryTableProps {
  paymentHistory: any[];
  isLoading: boolean;
}

export function PaymentHistoryTable({ paymentHistory, isLoading }: PaymentHistoryTableProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

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

      toast.success("Payment deleted successfully");
      await queryClient.invalidateQueries({ queryKey: ["payment-history"] });
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error("Failed to delete payment");
    } finally {
      setIsDeleteDialogOpen(false);
      setSelectedPaymentId(null);
    }
  };

  const handleViewInvoice = (invoiceId: string) => {
    window.open(`/invoices/${invoiceId}`, '_blank');
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Agreement #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Late Fine</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paymentHistory.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell>
                {payment.payment_date
                  ? format(new Date(payment.payment_date), "dd/MM/yyyy")
                  : format(new Date(payment.created_at), "dd/MM/yyyy")}
              </TableCell>
              <TableCell>{payment.leases?.agreement_number || "N/A"}</TableCell>
              <TableCell>{payment.leases?.profiles?.full_name || "Unknown"}</TableCell>
              <TableCell>{payment.leases?.profiles?.phone_number || "N/A"}</TableCell>
              <TableCell>{formatCurrency(payment.amount)}</TableCell>
              <TableCell>
                {payment.late_fine_amount > 0 ? (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    {formatCurrency(payment.late_fine_amount)}
                  </div>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {payment.payment_method || "Not specified"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    payment.status === "completed"
                      ? "success"
                      : payment.status === "failed"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {payment.status}
                </Badge>
              </TableCell>
              <TableCell>
                {payment.invoice_id ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewInvoice(payment.invoice_id)}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    View Invoice
                  </Button>
                ) : (
                  <span className="text-muted-foreground text-sm">No invoice</span>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(payment.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

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
    </>
  );
}