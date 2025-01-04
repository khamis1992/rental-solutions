import { supabase } from "@/integrations/supabase/client";
import { RawPaymentImport } from "../../types/transaction.types";

export const createDefaultAgreement = async (payment: RawPaymentImport) => {
  const { data: agreementData, error: agreementError } = await supabase
    .rpc('create_default_agreement_if_not_exists', {
      p_agreement_number: payment.Agreement_Number,
      p_customer_name: payment.Customer_Name,
      p_amount: payment.Amount
    });

  if (agreementError) throw agreementError;
  return agreementData;
};

export const insertPayment = async (
  leaseId: string, 
  payment: RawPaymentImport
) => {
  const { error: paymentError } = await supabase
    .from('payments')
    .insert({
      lease_id: leaseId,
      amount: payment.Amount,
      payment_method: payment.Payment_Method,
      payment_date: payment.Payment_Date,
      status: 'completed',
      description: payment.Description,
      type: payment.Type
    });

  if (paymentError) throw paymentError;
};

export const updatePaymentStatus = async (
  paymentId: string, 
  isValid: boolean, 
  errorDescription?: string
) => {
  const { error: updateError } = await supabase
    .from('raw_payment_imports')
    .update({ 
      is_valid: isValid,
      error_description: errorDescription || null
    })
    .eq('id', paymentId);

  if (updateError) throw updateError;
};