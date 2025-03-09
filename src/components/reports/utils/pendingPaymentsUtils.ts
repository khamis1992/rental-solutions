
import { supabase } from "@/integrations/supabase/client";

export interface PendingPaymentReport {
  agreement_number: string;
  customer_name: string;
  id_number: string;
  phone_number: string;
  pending_rent_amount: number;
  late_fine_amount: number;
  traffic_fine_amount: number;
  total_amount: number;
  license_plate: string;
}

export const fetchPendingPaymentsReport = async (): Promise<PendingPaymentReport[]> => {
  try {
    // Call our custom SQL function
    const { data, error } = await supabase.rpc('get_pending_payments_report');

    if (error) {
      console.error("Error fetching pending payments report:", error);
      throw error;
    }

    return data as PendingPaymentReport[];
  } catch (err) {
    console.error("Failed to fetch pending payments report:", err);
    throw err;
  }
};

export const exportPendingPaymentsToCSV = (data: PendingPaymentReport[]) => {
  // Define headers
  const headers = [
    "Agreement Number",
    "Customer Name",
    "ID Number",
    "Phone Number",
    "Pending Rent Amount",
    "Late Fine Amount",
    "Traffic Fine Amount",
    "Total Amount",
    "License Plate"
  ];
  
  // Format data rows
  const rows = data.map(item => [
    item.agreement_number,
    item.customer_name,
    item.id_number,
    item.phone_number,
    item.pending_rent_amount.toString(),
    item.late_fine_amount.toString(),
    item.traffic_fine_amount.toString(),
    item.total_amount.toString(),
    item.license_plate
  ]);
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Create downloadable CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `pending_payments_report_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
