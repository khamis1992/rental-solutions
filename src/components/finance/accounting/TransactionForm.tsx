import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface TransactionFormData {
  type: 'income' | 'expense';
  amount: number;
  category_id: string;
  description: string;
  transaction_date: string;
  receipt?: File;
}

export function TransactionForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch } = useForm<TransactionFormData>();
  const transactionType = watch('type');

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["accounting-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accounting_categories")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (data: TransactionFormData) => {
    setIsSubmitting(true);
    try {
      let receiptUrl = null;

      if (data.receipt && data.receipt[0]) {
        const file = data.receipt[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('accounting_receipts')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('accounting_receipts')
          .getPublicUrl(fileName);

        receiptUrl = publicUrl;
      }

      const { error } = await supabase
        .from("accounting_transactions")
        .insert({
          type: data.type,
          amount: data.amount,
          category_id: data.category_id,
          description: data.description,
          transaction_date: data.transaction_date,
          receipt_url: receiptUrl,
        });

      if (error) throw error;

      toast.success("Transaction added successfully");
      reset();
      queryClient.invalidateQueries({ queryKey: ["accounting-transactions"] });
    } catch (error) {
      console.error("Error adding transaction:", error);
      toast.error("Failed to add transaction");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="type">Transaction Type</Label>
          <Select {...register("type")} required>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="Enter amount"
            {...register("amount", { required: true, min: 0 })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select {...register("category_id")} required>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories
                ?.filter(cat => cat.type === transactionType)
                .map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transaction_date">Date</Label>
          <Input
            id="transaction_date"
            type="date"
            {...register("transaction_date", { required: true })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter transaction description"
          {...register("description")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="receipt">Receipt (optional)</Label>
        <Input
          id="receipt"
          type="file"
          accept="image/*,.pdf"
          {...register("receipt")}
        />
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Adding Transaction...
          </>
        ) : (
          "Add Transaction"
        )}
      </Button>
    </form>
  );
}