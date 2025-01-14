export type PaymentMethodType = 'Invoice' | 'Cash' | 'WireTransfer' | 'Cheque' | 'Deposit' | 'On_hold';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  lease_id: string;
  amount: number;
  amount_paid: number;
  balance: number;
  status: PaymentStatus | null;
  payment_date: string | null;
  transaction_id: string | null;
  payment_method: PaymentMethodType | null;
  security_deposit_id: string | null;
  created_at: string;
  updated_at: string;
  description: string | null;
  is_recurring: boolean;
  recurring_interval: string | null | unknown;
  next_payment_date: string | null;
  type: string;
  late_fine_amount: number;
  days_overdue: number;
}

export interface PaymentHistoryView extends Payment {
  actual_payment_date: string | null;
  original_due_date: string | null;
  agreement_number: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
}