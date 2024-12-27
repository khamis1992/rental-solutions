import { supabase } from "@/integrations/supabase/client";
import { TransactionFormData, TransactionType } from "../types/transaction.types";

export async function uploadReceipt(receipt: File): Promise<string | null> {
  const fileExt = receipt.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError, data } = await supabase.storage
    .from('accounting_receipts')
    .upload(fileName, receipt);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('accounting_receipts')
    .getPublicUrl(fileName);

  return publicUrl;
}

export async function saveTransaction(data: TransactionFormData, receiptUrl: string | null) {
  const transactionData = {
    type: data.type as TransactionType,
    amount: data.amount,
    category_id: data.category_id,
    description: data.description,
    transaction_date: data.transaction_date,
    receipt_url: receiptUrl,
    cost_type: data.cost_type,
    is_recurring: data.cost_type === 'fixed',
    recurrence_interval: data.cost_type === 'fixed' ? '1 month' : null,
  };

  const { error: transactionError } = await supabase
    .from("accounting_transactions")
    .insert(transactionData);

  if (transactionError) throw transactionError;

  if (data.cost_type === 'fixed') {
    const { error: fixedCostError } = await supabase
      .from("fixed_costs")
      .insert({
        name: data.description,
        amount: data.amount,
      });

    if (fixedCostError) throw fixedCostError;
  }

  if (data.cost_type === 'variable') {
    const { error: variableCostError } = await supabase
      .from("variable_costs")
      .insert({
        name: data.description,
        amount: data.amount,
      });

    if (variableCostError) throw variableCostError;
  }
}