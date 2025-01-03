import { PaymentMethodType } from "@/components/finance/types/transaction.types";

export const REQUIRED_FIELDS = [
  'Transaction_ID',
  'Agreement_Number',
  'Customer_Name',
  'License_Plate',
  'Amount',
  'Payment_Method',
  'Description',
  'Payment_Date',
  'Type',
  'Status'
] as const;

export const normalizePaymentMethod = (method: string): PaymentMethodType => {
  const methodMap: Record<string, PaymentMethodType> = {
    'cash': 'Cash',
    'invoice': 'Invoice',
    'wire': 'WireTransfer',
    'wiretransfer': 'WireTransfer',
    'cheque': 'Cheque',
    'check': 'Cheque',
    'deposit': 'Deposit',
    'onhold': 'On_hold',
    'on_hold': 'On_hold',
    'on-hold': 'On_hold'
  };

  const normalized = method.toLowerCase().replace(/[^a-z]/g, '');
  return methodMap[normalized] || 'Cash';
};

export const validateHeaders = (headers: string[]): { isValid: boolean; missingFields: string[] } => {
  const normalizedHeaders = headers.map(h => h.trim());
  const missingFields = REQUIRED_FIELDS.filter(
    field => !normalizedHeaders.includes(field)
  );
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};