import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { CategoryDialog } from "../categories/CategoryDialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Transaction } from "../types/transaction.types";

export const TransactionCategorization = () => {
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  
  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["uncategorized-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounting_transactions")
        .select("*")
        .is("category_id", null)
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      return data.map(transaction => ({
        ...transaction,
        amount: Number(transaction.amount)
      })) as Transaction[];
    },
  });

  const { data: categories, isLoading: isLoadingCategories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounting_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const handleCategoryAssignment = async (transactionId: string, categoryId: string) => {
    try {
      const { error } = await supabase
        .from("accounting_transactions")
        .update({ category_id: categoryId })
        .eq("id", transactionId);

      if (error) throw error;
      toast.success("Transaction categorized successfully");
    } catch (error) {
      console.error("Error categorizing transaction:", error);
      toast.error("Failed to categorize transaction");
    }
  };

  if (isLoadingTransactions || isLoadingCategories) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transaction Categorization</h2>
        <Button onClick={() => setShowCategoryDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions?.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  {transaction.transaction_date && new Date(transaction.transaction_date).toLocaleDateString()}
                </TableCell>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>${Math.abs(transaction.amount).toFixed(2)}</TableCell>
                <TableCell>
                  {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                </TableCell>
                <TableCell>
                  <select
                    className="w-full p-2 border rounded"
                    onChange={(e) => handleCategoryAssignment(transaction.id, e.target.value)}
                    value={transaction.category_id || ""}
                  >
                    <option value="">Select category</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <CategoryDialog
        open={showCategoryDialog}
        onOpenChange={setShowCategoryDialog}
      />
    </div>
  );
};