
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { formatDateToDisplay } from "@/lib/dateUtils";

interface RecurringPayment {
  id: string;
  description: string;
  amount: number;
  payment_date: string;
  status: string;
  lease_id: string;
  is_recurring: boolean;
  recurring_interval: string | null;
  next_payment_date: string | null;
}

export const RecurringPaymentsList = () => {
  const { data: payments, isLoading } = useQuery({
    queryKey: ["recurring-payments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unified_payments")
        .select("*")
        .eq("is_recurring", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as RecurringPayment[];
    },
  });

  if (isLoading) {
    return <div>Loading recurring payments...</div>;
  }

  if (!payments || payments.length === 0) {
    return <div>No recurring payments found.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Description</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Payment Date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>{payment.description}</TableCell>
            <TableCell>{formatCurrency(payment.amount)}</TableCell>
            <TableCell>{formatDateToDisplay(payment.payment_date)}</TableCell>
            <TableCell>{payment.status}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
