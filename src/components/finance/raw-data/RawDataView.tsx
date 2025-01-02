import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Brain } from "lucide-react";
import { toast } from "sonner";

interface RawPaymentImport {
  id: string;
  Transaction_ID: string;
  Agreement_Number: string;
  Customer_Name: string;
  License_Plate: string;
  Amount: number;
  Payment_Method: string;
  Description: string;
  Payment_Date: string;
  Type: string;
  Status: string;
  is_valid: boolean;
  error_description?: string;
  created_at: string;
}

export const RawDataView = () => {
  const queryClient = useQueryClient();

  const { data: rawTransactions, isLoading } = useQuery({
    queryKey: ["raw-payment-imports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_payment_imports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as RawPaymentImport[];
    },
  });

  const analyzePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      const { data, error } = await supabase.functions.invoke('analyze-payment-import', {
        body: { rawPaymentId: paymentId }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raw-payment-imports"] });
      queryClient.invalidateQueries({ queryKey: ["payment-history"] });
      toast.success("Payment analyzed and processed successfully");
    },
    onError: (error) => {
      console.error('Payment analysis error:', error);
      toast.error("Failed to analyze payment");
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Raw Payment Import Data</h2>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Agreement Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount (QAR)</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rawTransactions?.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{transaction.Transaction_ID}</TableCell>
                <TableCell>{transaction.Agreement_Number}</TableCell>
                <TableCell>{transaction.Customer_Name}</TableCell>
                <TableCell>{transaction.Amount}</TableCell>
                <TableCell>{transaction.Payment_Method}</TableCell>
                <TableCell className="max-w-md truncate">{transaction.Description}</TableCell>
                <TableCell>{new Date(transaction.Payment_Date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    transaction.Type === 'INCOME' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.Type}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    transaction.Status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transaction.Status}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => analyzePaymentMutation.mutate(transaction.id)}
                    disabled={transaction.is_valid || analyzePaymentMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {analyzePaymentMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4" />
                    )}
                    Analyze
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};