import { Json } from "@/integrations/supabase/types";

export interface Transaction {
  id: string;
  agreement_number: string;
  amount: number;
  category_id: string | null;
  created_at: string;
  customer_name: string;
  description: string;
  license_plate: string;
  payment_method: string;
  receipt_url: string;
  status: string;
  transaction_date: string;
  type: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
    type: string;
    budget_limit: number;
    budget_period: string;
  };
}

export interface RawPaymentImport {
  id: string;
  Agreemgent_Number: string;
  Transaction_ID: string;
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

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export type PaymentMethodType = 'Invoice' | 'Cash' | 'WireTransfer' | 'Cheque' | 'Deposit' | 'On_hold';

export type PaymentCategoryType = 
  | 'LATE PAYMENT FEE'
  | 'Administrative Fees'
  | 'Vehicle Damage Charge'
  | 'Traffic Fine'
  | 'RENTAL FEE'
  | 'Advance Payment'
  | 'other';