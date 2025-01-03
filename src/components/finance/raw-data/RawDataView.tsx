import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Brain, PlayCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { RawPaymentImport } from "@/components/finance/types/transaction.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export const RawDataView = () => {
  const queryClient = useQueryClient();

  const { data: rawTransactions, isLoading } = useQuery({
    queryKey: ["raw-payment-imports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("raw_payment_imports")
        .select("*")
        .order("created_at", { ascending: false })
        .filter('is_valid', 'eq', false); // Only fetch unprocessed payments

      if (error) throw error;
      return data as RawPaymentImport[];
    },
  });

  // Calculate total and unassigned amounts
  const totalAmount = rawTransactions?.reduce((sum, transaction) => 
    sum + (Number(transaction.Amount) || 0), 0) || 0;

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

  const analyzeAllPaymentsMutation = useMutation({
    mutationFn: async () => {
      const unprocessedPayments = rawTransactions?.filter(payment => !payment.is_valid) || [];
      
      for (const payment of unprocessedPayments) {
        const { error } = await supabase.functions.invoke('analyze-payment-import', {
          body: { rawPaymentId: payment.id }
        });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raw-payment-imports"] });
      queryClient.invalidateQueries({ queryKey: ["payment-history"] });
      toast.success("All payments analyzed and processed successfully");
    },
    onError: (error) => {
      console.error('Bulk payment analysis error:', error);
      toast.error("Failed to analyze all payments");
    }
  });

  const cleanTableMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('raw_payment_imports')
        .delete()
        .filter('is_valid', 'eq', true);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raw-payment-imports"] });
      toast.success("Table cleaned successfully - removed all processed payments");
    },
    onError: (error) => {
      console.error('Clean table error:', error);
      toast.error("Failed to clean table");
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const hasUnprocessedPayments = rawTransactions?.some(payment => !payment.is_valid);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Raw Payment Import Data</h2>
        <div className="flex gap-2">
          {hasUnprocessedPayments && (
            <Button
              variant="default"
              onClick={() => analyzeAllPaymentsMutation.mutate()}
              disabled={analyzeAllPaymentsMutation.isPending}
              className="flex items-center gap-2"
            >
              {analyzeAllPaymentsMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              Analyze All
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => cleanTableMutation.mutate()}
            disabled={cleanTableMutation.isPending}
            className="flex items-center gap-2"
          >
            {cleanTableMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Clean Table
          </Button>
        </div>
      </div>

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Remaining Unassigned Amount</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
          <p className="text-sm text-muted-foreground mt-1">
            Total amount from unprocessed payments
          </p>
        </CardContent>
      </Card>

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
                <TableCell>{formatCurrency(Number(transaction.Amount))}</TableCell>
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