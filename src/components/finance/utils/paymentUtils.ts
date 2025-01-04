import { PaymentMethodType } from "@/types/database/payment.types";

export const normalizePaymentMethod = (method: string): PaymentMethodType => {
  const methodMap: Record<string, PaymentMethodType> = {
    'cash': 'Cash',
    'invoice': 'Invoice',
    'wire': 'WireTransfer',
    'wiretransfer': 'WireTransfer',
    'wire_transfer': 'WireTransfer',
    'cheque': 'Cheque',
    'check': 'Cheque',
    'deposit': 'Deposit',
    'onhold': 'On_hold',
    'on_hold': 'On_hold',
    'on-hold': 'On_hold'
  };

  const normalized = method.toLowerCase().replace(/[^a-z_]/g, '');
  return methodMap[normalized] || 'Cash'; // Default to Cash if no match found
};