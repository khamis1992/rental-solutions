export type LegalCaseStatus = 'pending_reminder' | 'in_legal_process' | 'escalated' | 'resolved';

export interface LegalCase {
  id: string;
  customer_id: string;
  case_type: string;
  status: LegalCaseStatus;
  amount_owed: number;
  description: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  customer: {
    full_name: string;
  };
  assigned_to_user?: {
    full_name: string | null;
  };
}

export interface LegalCaseFormData {
  customer_id: string;
  case_type: string;
  amount_owed: string;
  description: string;
  priority: string;
}